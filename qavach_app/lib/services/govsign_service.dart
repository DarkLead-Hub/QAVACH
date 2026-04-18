import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config.dart';
import '../models/credential.dart';
import 'crypto_service.dart';
import 'storage_service.dart';
import 'opa_service.dart';

class GovSignService {
  final Dio _dio = Dio(BaseOptions(baseUrl: kGovSignUrl));
  final CryptoService _cryptoService;
  final StorageService _storageService;
  final OpaService _opaService;

  GovSignService(this._cryptoService, this._storageService, this._opaService);

  Future<void> processQrPayload(String qrJson) async {
    final Map<String, dynamic> qr = jsonDecode(qrJson);
    final sessionId = qr['s'] as String;
    final nonce = qr['n'] as String;
    final claimType = qr['c'] as String;
    final callbackUrl = qr['cb'] as String;

    // 1. Find the matching credential for this claim type
    //    Check local mock-CA credentials first, then Supabase-issued ones
    final credentials = await _getAllCredentials();
    final credential = _findCredentialForClaim(credentials, claimType);
    if (credential == null) throw Exception('No credential for claim: $claimType');

    // 2. Run OPA policy
    final opaResult = await _opaService.evaluate(claimType, credential);
    if (!opaResult.allow) {
      throw Exception('Policy check failed: ${opaResult.reason}');
    }

    // 3. Ensure ML-DSA-44 keypair exists (auto-generate if user only did Supabase flow)
    await _ensureKeyPairExists();

    // 4. Build proof payload (keys MUST be sorted to match Python's json.dumps(sort_keys=True))
    final proofPayload = Map<String, dynamic>.fromEntries(
      {
        'nonce': nonce,
        'claim_type': claimType,
        'claim_value': true,
        'citizen_id_hash': credential.citizenIdHash,
        'issuer_dept_id': credential.issuerDeptId,
        'doc_sig_id': credential.sigId,
      }.entries.toList()..sort((a, b) => a.key.compareTo(b.key)),
    );

    final payloadJson = jsonEncode(proofPayload);
    final payloadB64 = base64Encode(utf8.encode(payloadJson));

    // 5. Sign proof with citizen's ML-DSA-44 key
    final privKey = await _storageService.read('citizen_priv_key');
    if (privKey == null) throw Exception('Private key not found');

    final signature = await _cryptoService.sign('ML-DSA-44', privKey, payloadB64);
    final pubKey = await _storageService.read('citizen_pub_key');

    // 6. POST to GovSign session callback (use fresh Dio for absolute URL)
    try {
      await Dio().post(callbackUrl, data: {
        'session_id': sessionId,
        'nonce': nonce,
        'claim_type': claimType,
        'claim_value': true,
        'citizen_id_hash': credential.citizenIdHash,
        'issuer_dept_id': credential.issuerDeptId,
        'doc_sig_id': credential.sigId,
        'proof_signature_b64': signature,
        'citizen_pub_key_b64': pubKey,
      });
    } on DioException catch (e) {
      if (e.response?.statusCode == 409) {
        throw Exception('This QR code has already been used. Please ask the portal to generate a new one.');
      } else if (e.response?.statusCode == 410) {
        throw Exception('This QR session has expired. Please ask the portal to generate a new one.');
      }
      rethrow;
    }
  }

  /// Ensure ML-DSA-44 keys exist — generate if missing (for Supabase-only users)
  Future<void> _ensureKeyPairExists() async {
    final existingPub = await _storageService.read('citizen_pub_key');
    if (existingPub != null) return; // Keys already exist

    // Generate new ML-DSA-44 keypair for proof signing
    final keys = await _cryptoService.generateKeyPair('ML-DSA-44');
    await _storageService.write('citizen_pub_key', keys['public_key']!);
    await _storageService.write('citizen_priv_key', keys['private_key']!);
  }

  /// Get all credentials: local mock-CA + Supabase-issued
  Future<List<SignedCredential>> _getAllCredentials() async {
    final List<SignedCredential> all = [];

    // 1. Local mock-CA credentials
    all.addAll(await _getLocalCredentials());

    // 2. Supabase-issued credentials (if user is signed in)
    if (all.isEmpty) {
      all.addAll(await _getSupabaseCredentials());
    }

    return all;
  }

  Future<List<SignedCredential>> _getLocalCredentials() async {
    final credIdsJson = await _storageService.read('credential_ids') ?? '[]';
    final List<String> ids = List<String>.from(jsonDecode(credIdsJson));
    
    List<SignedCredential> result = [];
    for (final id in ids) {
      final credDataJson = await _storageService.read('cred_$id');
      if (credDataJson != null) {
        final credData = jsonDecode(credDataJson);
        result.add(SignedCredential.fromJson(jsonDecode(credData['data'])));
      }
    }
    return result;
  }

  /// Fetch credentials from Supabase and convert to SignedCredential format
  Future<List<SignedCredential>> _getSupabaseCredentials() async {
    try {
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;
      if (user == null) return [];

      final response = await supabase
          .from('issued_credentials')
          .select()
          .eq('user_id', user.id)
          .eq('status', 'active');

      final List<dynamic> rows = response as List<dynamic>;
      return rows.map((row) => _supabaseRowToCredential(row, user.id)).toList();
    } catch (e) {
      // Silently fail — Supabase might not be reachable
      return [];
    }
  }

  /// Convert a Supabase issued_credentials row to a SignedCredential
  /// that OPA can evaluate
  SignedCredential _supabaseRowToCredential(Map<String, dynamic> row, String userId) {
    final credData = row['credential_data'] as Map<String, dynamic>? ?? {};
    final credType = row['credential_type'] as String? ?? '';

    // Map Issue Portal credential types to mock-CA types
    final mappedType = switch (credType) {
      'INCOME_CERTIFICATE' => 'income_certificate',
      'PAN_CARD' => 'pan_card',
      'AADHAAR_CARD' => 'aadhaar_attestation',
      _ => credType.toLowerCase(),
    };

    // Build attributes map matching what OPA expects
    final Map<String, dynamic> attributes = {};

    if (mappedType == 'income_certificate') {
      // Parse annual_income — the Issue Portal form stores it as a string
      final rawIncome = credData['annual_income'];
      int income = 0;
      if (rawIncome is int) {
        income = rawIncome;
      } else if (rawIncome is String) {
        income = int.tryParse(rawIncome.replaceAll(',', '')) ?? 0;
      }
      attributes['annual_income'] = income;
      attributes['category'] = credData['category'] ?? 'General';
      attributes['cibil_signal'] = credData['cibil_signal'] ?? 'positive';
    }

    // Use creation timestamp for issuedAt, add 1 year for expiry
    final issuedAt = row['created_at'] as String? ?? DateTime.now().toIso8601String();
    final expiryDate = DateTime.parse(issuedAt).add(const Duration(days: 365));

    return SignedCredential(
      credentialId: row['id'] as String? ?? 'supabase_${DateTime.now().millisecondsSinceEpoch}',
      credentialType: mappedType,
      issuerDeptId: mappedType == 'income_certificate' ? 'ITD' : 'GOI',
      citizenIdHash: 'sha256:supabase_$userId',
      issuedAt: issuedAt,
      expiresAt: expiryDate.toIso8601String(),
      attributes: attributes,
      sigId: 'slh-dsa-${row['id'] ?? 'unknown'}',
      signatureB64: row['signature'] as String? ?? '',
      algorithm: 'SLH-DSA-SHA2-128s',
      quantumSafe: true,
      issuerPublicKeyB64: row['public_key'] as String? ?? '',
    );
  }

  SignedCredential? _findCredentialForClaim(List<SignedCredential> creds, String claimType) {
    if (claimType == 'income_lt_3L' || claimType == 'composite_income_cibil') {
      return creds.where((c) => c.credentialType == 'income_certificate').firstOrNull;
    } else if (claimType == 'land_ownership') {
      return creds.where((c) => c.credentialType == 'land_ownership').firstOrNull;
    }
    return null;
  }
}

extension FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
