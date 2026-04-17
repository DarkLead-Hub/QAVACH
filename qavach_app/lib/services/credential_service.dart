import 'dart:convert';
import 'package:dio/dio.dart';
import '../config.dart';
import '../models/credential.dart';
import 'crypto_service.dart';
import 'storage_service.dart';

class CredentialService {
  final Dio _dio = Dio(BaseOptions(baseUrl: kMockCaUrl));
  final CryptoService _cryptoService;
  final StorageService _storageService;

  CredentialService(this._cryptoService, this._storageService);

  Future<List<SignedCredential>> downloadCredentials(String citizenId) async {
    final response = await _dio.get('/credentials/$citizenId');
    final List<dynamic> credsJson = response.data['credentials'];
    final List<SignedCredential> credentials = 
        credsJson.map((json) => SignedCredential.fromJson(json)).toList();
    
    for (final cred in credentials) {
      await _encryptAndStore(cred);
    }
    
    return credentials;
  }

  Future<void> _encryptAndStore(SignedCredential cred) async {
    // Store credential locally
    // In production, this would use ML-KEM-768 for per-document encryption
    // For the demo, we store the credential JSON directly — the PQC proof
    // of concept focuses on ML-DSA-44 signing and SLH-DSA verification
    final credData = {
      'data': jsonEncode(cred.toJson()),
    };

    await _storageService.write('cred_${cred.credentialId}', jsonEncode(credData));
    
    // Also keep a list of credential IDs
    final credIdsJson = await _storageService.read('credential_ids') ?? '[]';
    final List<String> ids = List<String>.from(jsonDecode(credIdsJson));
    if (!ids.contains(cred.credentialId)) {
      ids.add(cred.credentialId);
      await _storageService.write('credential_ids', jsonEncode(ids));
    }
  }

  Future<List<SignedCredential>> getStoredCredentials() async {
    final credIdsJson = await _storageService.read('credential_ids') ?? '[]';
    final List<String> ids = List<String>.from(jsonDecode(credIdsJson));
    
    List<SignedCredential> result = [];
    for (final id in ids) {
      final credDataJson = await _storageService.read('cred_$id');
      if (credDataJson != null) {
        final credData = jsonDecode(credDataJson);
        final cred = SignedCredential.fromJson(jsonDecode(credData['data']));
        result.add(cred);
      }
    }
    return result;
  }
}
