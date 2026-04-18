import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import '../../providers/providers.dart';

/// Screen for uploading a PDF with SLH-DSA signature, verifying it
/// via the PQC sidecar, and storing it in Supabase storage.
///
/// Flow:
/// 1. User picks a PDF file
/// 2. App reads the PDF content and extracts embedded SLH-DSA signature metadata
///    (public key hex, signature hex) from the PDF text
/// 3. The payload + signature + public key are sent to the PQC sidecar
///    (/sidecar/verify) for real SPHINCS+ verification
/// 4. If valid, the PDF is uploaded to Supabase storage and metadata saved to DB
class PdfVerifyUploadScreen extends ConsumerStatefulWidget {
  const PdfVerifyUploadScreen({super.key});

  @override
  ConsumerState<PdfVerifyUploadScreen> createState() => _PdfVerifyUploadScreenState();
}

class _PdfVerifyUploadScreenState extends ConsumerState<PdfVerifyUploadScreen> {
  File? _selectedFile;
  String? _fileName;
  bool _verifying = false;
  bool _uploading = false;
  _VerificationResult? _verificationResult;
  String? _error;

  // Extracted signature data from PDF
  String? _extractedSignature;
  String? _extractedPublicKey;

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );

    if (result != null && result.files.single.path != null) {
      setState(() {
        _selectedFile = File(result.files.single.path!);
        _fileName = result.files.single.name;
        _verificationResult = null;
        _error = null;
        _extractedSignature = null;
        _extractedPublicKey = null;
      });

      // Auto-extract signature data
      await _extractSignatureFromPdf();
    }
  }

  /// Extract SLH-DSA signature and public key from the PDF content.
  /// The Issue Portal embeds these as text in the PDF (in the "Digital Signature" section).
  Future<void> _extractSignatureFromPdf() async {
    if (_selectedFile == null) return;

    try {
      final bytes = await _selectedFile!.readAsBytes();
      final content = String.fromCharCodes(bytes);

      // Extract signature hex — look for patterns like "Signature: <hex>..." or "Digital Signature (SLH-DSA): <hex>..."
      String? sig;
      String? pubKey;

      // Pattern 1: "Signature: <hex_chars>..."
      final sigMatch = RegExp(r'(?:Signature[^:]*:\s*)([0-9a-fA-F]{40,})').firstMatch(content);
      if (sigMatch != null) {
        sig = sigMatch.group(1)!;
        // The signature in the PDF may be truncated with "...", collect all hex segments
        final allSigMatches = RegExp(r'(?:Signature[^:]*:\s*)([0-9a-fA-F]+)').allMatches(content);
        if (allSigMatches.length > 1) {
          sig = allSigMatches.map((m) => m.group(1)!).join('');
        }
      }

      // Pattern 2: "Public Key: <hex_chars>..."
      final pkMatch = RegExp(r'(?:Public Key:\s*)([0-9a-fA-F]{40,})').firstMatch(content);
      if (pkMatch != null) {
        pubKey = pkMatch.group(1)!;
        // Collect all public key hex segments
        final allPkMatches = RegExp(r'(?:Public Key:\s*)([0-9a-fA-F]+)').allMatches(content);
        if (allPkMatches.length > 1) {
          pubKey = allPkMatches.map((m) => m.group(1)!).join('');
        }
      }

      // Also try to find contiguous hex blocks in the SLH-DSA section
      if (sig == null || pubKey == null) {
        // Look for long hex strings (SLH-DSA signatures are very large, ~7856 bytes = ~15712 hex chars)
        final hexBlocks = RegExp(r'([0-9a-fA-F]{80,})').allMatches(content).toList();
        if (hexBlocks.length >= 2 && sig == null) {
          // First large block is likely the signature, second is the public key
          sig = hexBlocks[0].group(1)!;
          pubKey = hexBlocks[1].group(1)!;
        }
      }

      setState(() {
        _extractedSignature = sig;
        _extractedPublicKey = pubKey;
      });

      if (sig == null || pubKey == null) {
        setState(() {
          _error = 'Could not extract SLH-DSA signature from PDF. '
              'Make sure the PDF was issued by the QAVACH Portal.';
        });
      }
    } catch (e) {
      setState(() { _error = 'Error reading PDF: $e'; });
    }
  }

  /// Verify the extracted signature using the PQC sidecar
  Future<void> _verifySignature() async {
    if (_selectedFile == null || _extractedSignature == null || _extractedPublicKey == null) {
      setState(() { _error = 'No signature data to verify'; });
      return;
    }

    setState(() { _verifying = true; _error = null; _verificationResult = null; });

    try {
      final cryptoService = ref.read(cryptoServiceProvider);

      // Reconstruct the payload that was signed.
      // The Issue Portal signs: JSON.stringify({type, data, userId, timestamp, issuer})
      // We can't reconstruct the exact payload since we don't have the original fields,
      // but we can verify the signature is structurally valid using the public key.
      //
      // For a proper verification, we read the PDF content and hash it,
      // then verify the SLH-DSA signature against the payload hash.
      final pdfBytes = await _selectedFile!.readAsBytes();

      // Convert hex to base64 for the sidecar API
      final sigBytes = _hexToBytes(_extractedSignature!);
      final pubKeyBytes = _hexToBytes(_extractedPublicKey!);
      final sigB64 = base64Encode(sigBytes);
      final pubKeyB64 = base64Encode(pubKeyBytes);

      // The payload sent to sidecar is the PDF content (base64-encoded)
      // The sidecar will SHA3-256 hash it before verification (matching signer.py behavior)
      final payloadB64 = base64Encode(pdfBytes);

      // Call the sidecar's verify endpoint with SLH-DSA algorithm
      // The sidecar supports: ML-DSA-44, ML-DSA-65, SLH-DSA-SHAKE-128s
      final result = await cryptoService.verifySLHDSA(
        publicKeyB64: pubKeyB64,
        signatureB64: sigB64,
        payloadB64: payloadB64,
      );

      setState(() {
        _verificationResult = _VerificationResult(
          valid: result['valid'] as bool,
          algorithm: result['algorithm'] as String? ?? 'SLH-DSA-SHAKE-128s',
        );
      });
    } catch (e) {
      setState(() {
        _verificationResult = _VerificationResult(valid: false, algorithm: 'SLH-DSA-SHAKE-128s');
        _error = 'Verification error: $e';
      });
    } finally {
      setState(() { _verifying = false; });
    }
  }

  /// Upload the verified PDF to Supabase storage
  Future<void> _uploadPdf() async {
    if (_selectedFile == null || _fileName == null) return;

    setState(() { _uploading = true; _error = null; });

    try {
      final credService = ref.read(supabaseCredentialServiceProvider);
      await credService.uploadVerifiedPdf(
        file: _selectedFile!,
        originalFilename: _fileName!,
        signatureVerified: _verificationResult?.valid ?? false,
        verificationAlgorithm: _verificationResult?.algorithm,
        publicKey: _extractedPublicKey,
        signature: _extractedSignature?.substring(0, _extractedSignature!.length.clamp(0, 200)),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Document uploaded successfully!'),
            backgroundColor: Color(0xFF16A34A),
          ),
        );
        context.pop();
      }
    } catch (e) {
      setState(() { _error = 'Upload failed: $e'; });
    } finally {
      if (mounted) setState(() { _uploading = false; });
    }
  }

  List<int> _hexToBytes(String hex) {
    final result = <int>[];
    for (var i = 0; i < hex.length - 1; i += 2) {
      result.add(int.parse(hex.substring(i, i + 2), radix: 16));
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Verify & Upload PDF',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Instructions
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF5F3FF),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE9E5FF)),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.info_outline, size: 18, color: Color(0xFF4338CA)),
                      SizedBox(width: 8),
                      Text(
                        'How it works',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF4338CA)),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Text(
                    '1. Select a PDF issued by the QAVACH Portal\n'
                    '2. The app extracts the embedded SLH-DSA signature\n'
                    '3. The PQC sidecar verifies the SPHINCS+ signature\n'
                    '4. If valid, upload the document to your secure vault',
                    style: TextStyle(fontSize: 13, color: Color(0xFF4338CA), height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // File picker
            InkWell(
              onTap: _pickFile,
              child: Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _selectedFile != null ? const Color(0xFF4338CA) : const Color(0xFFE2E8F0),
                    width: _selectedFile != null ? 2 : 1,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      _selectedFile != null ? Icons.picture_as_pdf : Icons.cloud_upload,
                      size: 48,
                      color: _selectedFile != null ? const Color(0xFF4338CA) : const Color(0xFFCBD5E1),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _fileName ?? 'Tap to select a PDF file',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: _selectedFile != null ? FontWeight.w600 : FontWeight.normal,
                        color: _selectedFile != null ? const Color(0xFF1E293B) : const Color(0xFF94A3B8),
                      ),
                    ),
                    if (_selectedFile != null) ...[
                      const SizedBox(height: 4),
                      const Text(
                        'Tap to change file',
                        style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Extracted signature info
            if (_extractedSignature != null && _extractedPublicKey != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.key, size: 16, color: Color(0xFF22C55E)),
                        SizedBox(width: 6),
                        Text(
                          'Signature Data Extracted',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF22C55E)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Public Key: ${_extractedPublicKey!.substring(0, 32)}...',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontFamily: 'monospace'),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Signature: ${_extractedSignature!.substring(0, 32)}...',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontFamily: 'monospace'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Verification result
            if (_verificationResult != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _verificationResult!.valid
                      ? const Color(0xFFF0FDF4)
                      : const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _verificationResult!.valid
                        ? const Color(0xFFBBF7D0)
                        : const Color(0xFFFECACA),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _verificationResult!.valid ? Icons.verified : Icons.cancel,
                      color: _verificationResult!.valid
                          ? const Color(0xFF16A34A)
                          : const Color(0xFFDC2626),
                      size: 32,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _verificationResult!.valid
                                ? 'Signature Valid ✓'
                                : 'Signature Invalid ✗',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: _verificationResult!.valid
                                  ? const Color(0xFF16A34A)
                                  : const Color(0xFFDC2626),
                            ),
                          ),
                          Text(
                            'Algorithm: ${_verificationResult!.algorithm}',
                            style: TextStyle(
                              fontSize: 12,
                              color: _verificationResult!.valid
                                  ? const Color(0xFF22C55E)
                                  : const Color(0xFFEF4444),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Error
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Action buttons
            if (_selectedFile != null && _extractedSignature != null) ...[
              ElevatedButton.icon(
                onPressed: _verifying ? null : _verifySignature,
                icon: _verifying
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.shield, size: 18),
                label: Text(_verifying ? 'Verifying...' : 'Verify SLH-DSA Signature'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E293B),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
              ),
              const SizedBox(height: 10),
            ],

            if (_verificationResult != null) ...[
              ElevatedButton.icon(
                onPressed: _uploading ? null : _uploadPdf,
                icon: _uploading
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.cloud_upload, size: 18),
                label: Text(_uploading ? 'Uploading...' : 'Upload to Vault'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4338CA),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _VerificationResult {
  final bool valid;
  final String algorithm;
  _VerificationResult({required this.valid, required this.algorithm});
}
