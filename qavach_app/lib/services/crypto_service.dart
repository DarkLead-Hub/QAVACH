import 'package:dio/dio.dart';
import '../config.dart';

class CryptoService {
  final Dio _dio = Dio(BaseOptions(baseUrl: kSidecarUrl));

  Future<Map<String, String>> generateKeyPair(String algorithm) async {
    final response = await _dio.post('/sidecar/keygen', data: {
      'algorithm': algorithm,
    });
    return {
      'public_key': response.data['public_key_b64'] as String,
      'private_key': response.data['private_key_b64'] as String,
    };
  }

  Future<String> sign(String algorithm, String privateKeyB64, String payloadB64) async {
    final response = await _dio.post('/sidecar/sign', data: {
      'algorithm': algorithm,
      'private_key_b64': privateKeyB64,
      'payload': payloadB64,
    });
    return response.data['signature_b64'] as String;
  }

  Future<Map<String, String>> kemWrap(String algorithm, String publicKeyB64) async {
    final response = await _dio.post('/sidecar/kem/wrap', data: {
      'algorithm': algorithm,
      'public_key_b64': publicKeyB64,
    });
    return {
      'ciphertext': response.data['ciphertext_b64'] as String,
      'shared_secret': response.data['shared_secret_b64'] as String,
    };
  }

  Future<String> kemUnwrap(String algorithm, String privateKeyB64, String ciphertextB64) async {
    final response = await _dio.post('/sidecar/kem/unwrap', data: {
      'algorithm': algorithm,
      'private_key_b64': privateKeyB64,
      'ciphertext_b64': ciphertextB64,
    });
    return response.data['shared_secret_b64'] as String;
  }

  /// Verify an SLH-DSA (SPHINCS+) signature using the PQC sidecar.
  /// This performs REAL post-quantum signature verification via liboqs.
  ///
  /// The sidecar's /sidecar/verify endpoint accepts any algorithm supported by liboqs,
  /// including SLH-DSA-SHAKE-128s (FIPS 205). It SHA3-256 hashes the payload before
  /// verification to match the signing behavior in signer.py.
  Future<Map<String, dynamic>> verifySLHDSA({
    required String publicKeyB64,
    required String signatureB64,
    required String payloadB64,
  }) async {
    final response = await _dio.post('/sidecar/verify', data: {
      'algorithm': 'SLH-DSA-SHAKE-128s',
      'public_key_b64': publicKeyB64,
      'payload': payloadB64,
      'signature_b64': signatureB64,
    });
    return {
      'valid': response.data['valid'] as bool,
      'algorithm': response.data['algorithm'] as String? ?? 'SLH-DSA-SHAKE-128s',
    };
  }
}
