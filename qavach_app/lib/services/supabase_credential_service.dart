import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:path_provider/path_provider.dart';
import '../config.dart';

/// Issued credential metadata from the `issued_credentials` table.
class IssuedCredential {
  final String id;
  final String credentialType;
  final String storagePath;
  final String? publicUrl;
  final String publicKey;
  final String signature;
  final String issueDate;
  final String status;
  final Map<String, dynamic>? credentialData;

  IssuedCredential({
    required this.id,
    required this.credentialType,
    required this.storagePath,
    this.publicUrl,
    required this.publicKey,
    required this.signature,
    required this.issueDate,
    required this.status,
    this.credentialData,
  });

  factory IssuedCredential.fromJson(Map<String, dynamic> json) {
    return IssuedCredential(
      id: json['id'] as String,
      credentialType: json['credential_type'] as String,
      storagePath: json['storage_path'] as String,
      publicUrl: json['public_url'] as String?,
      publicKey: json['public_key'] as String,
      signature: json['signature'] as String,
      issueDate: json['issue_date'] as String? ?? json['created_at'] as String,
      status: json['status'] as String? ?? 'active',
      credentialData: json['credential_data'] as Map<String, dynamic>?,
    );
  }

  /// Human-readable credential type name
  String get displayName => switch (credentialType) {
        'PAN_CARD' => 'PAN Card',
        'INCOME_CERTIFICATE' => 'Income Certificate',
        'AADHAAR_CARD' => 'Aadhaar Card',
        _ => credentialType.replaceAll('_', ' '),
      };
}

/// Uploaded document metadata from the `uploaded_documents` table.
class UploadedDocument {
  final String id;
  final String originalFilename;
  final String storagePath;
  final String? publicUrl;
  final bool signatureVerified;
  final String? verificationAlgorithm;
  final String? publicKey;
  final String? signature;
  final String uploadedAt;

  UploadedDocument({
    required this.id,
    required this.originalFilename,
    required this.storagePath,
    this.publicUrl,
    required this.signatureVerified,
    this.verificationAlgorithm,
    this.publicKey,
    this.signature,
    required this.uploadedAt,
  });

  factory UploadedDocument.fromJson(Map<String, dynamic> json) {
    return UploadedDocument(
      id: json['id'] as String,
      originalFilename: json['original_filename'] as String,
      storagePath: json['storage_path'] as String,
      publicUrl: json['public_url'] as String?,
      signatureVerified: json['signature_verified'] as bool? ?? false,
      verificationAlgorithm: json['verification_algorithm'] as String?,
      publicKey: json['public_key'] as String?,
      signature: json['signature'] as String?,
      uploadedAt: json['uploaded_at'] as String,
    );
  }
}

/// Service for fetching, downloading, and uploading credentials
/// from/to the Supabase storage bucket and database.
class SupabaseCredentialService {
  final SupabaseClient _client = Supabase.instance.client;

  // ── Issued Credentials (from Issue Portal) ──

  /// Fetch all issued credentials for the current user
  Future<List<IssuedCredential>> getIssuedCredentials() async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('Not authenticated');

    final response = await _client
        .from('issued_credentials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', ascending: false);

    return (response as List)
        .map((json) => IssuedCredential.fromJson(json))
        .toList();
  }

  /// Download a credential PDF from Supabase storage to the device
  Future<File> downloadCredentialPdf(String storagePath) async {
    final bytes = await _client.storage
        .from(kCredentialsBucket)
        .download(storagePath);

    // Save to app's documents directory
    final dir = await getApplicationDocumentsDirectory();
    final fileName = storagePath.split('/').last;
    final file = File('${dir.path}/$fileName');
    await file.writeAsBytes(bytes);

    return file;
  }

  /// Get the public URL for a credential in storage
  String getPublicUrl(String storagePath) {
    return _client.storage
        .from(kCredentialsBucket)
        .getPublicUrl(storagePath);
  }

  // ── Uploaded Documents (user-uploaded SLH-DSA PDFs) ──

  /// Upload a verified PDF to the user's storage folder
  Future<UploadedDocument> uploadVerifiedPdf({
    required File file,
    required String originalFilename,
    required bool signatureVerified,
    String? verificationAlgorithm,
    String? publicKey,
    String? signature,
  }) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('Not authenticated');

    // Upload to storage under uploads/{user_id}/{filename}
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final storagePath = 'uploads/${user.id}/${timestamp}_$originalFilename';

    final bytes = await file.readAsBytes();
    await _client.storage
        .from(kCredentialsBucket)
        .uploadBinary(storagePath, bytes, fileOptions: const FileOptions(
          contentType: 'application/pdf',
          upsert: false,
        ));

    // Get public URL
    final publicUrl = _client.storage
        .from(kCredentialsBucket)
        .getPublicUrl(storagePath);

    // Save metadata to uploaded_documents table
    final response = await _client
        .from('uploaded_documents')
        .insert({
          'user_id': user.id,
          'original_filename': originalFilename,
          'storage_path': storagePath,
          'public_url': publicUrl,
          'signature_verified': signatureVerified,
          'verification_algorithm': verificationAlgorithm,
          'public_key': publicKey,
          'signature': signature,
        })
        .select()
        .single();

    return UploadedDocument.fromJson(response);
  }

  /// Fetch all uploaded documents for the current user
  Future<List<UploadedDocument>> getUploadedDocuments() async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('Not authenticated');

    final response = await _client
        .from('uploaded_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', ascending: false);

    return (response as List)
        .map((json) => UploadedDocument.fromJson(json))
        .toList();
  }
}
