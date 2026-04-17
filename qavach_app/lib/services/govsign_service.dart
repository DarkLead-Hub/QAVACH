import 'dart:convert';
import 'package:dio/dio.dart';
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
    final credentials = await _getStoredCredentials();
    final credential = _findCredentialForClaim(credentials, claimType);
    if (credential == null) throw Exception('No credential for claim: $claimType');

    // 2. Run OPA policy
    final opaResult = await _opaService.evaluate(claimType, credential);
    if (!opaResult.allow) {
      throw Exception('Policy check failed: ${opaResult.reason}');
    }

    // 3. Build proof payload (keys MUST be sorted to match Python's json.dumps(sort_keys=True))
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

    // 4. Sign proof with citizen's ML-DSA-44 key
    final privKey = await _storageService.read('citizen_priv_key');
    if (privKey == null) throw Exception('Private key not found');

    final signature = await _cryptoService.sign('ML-DSA-44', privKey, payloadB64);
    final pubKey = await _storageService.read('citizen_pub_key');

    // 5. POST to GovSign session callback (use fresh Dio for absolute URL)
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

  Future<List<SignedCredential>> _getStoredCredentials() async {
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
