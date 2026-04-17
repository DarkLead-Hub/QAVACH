import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../config.dart';
import '../models/citizen.dart';
import 'crypto_service.dart';
import 'storage_service.dart';
import 'credential_service.dart';

class AuthService {
  final CryptoService _cryptoService;
  final StorageService _storageService;
  final CredentialService _credentialService;
  final Dio _dio = Dio(BaseOptions(baseUrl: kMockCaUrl));

  AuthService(this._cryptoService, this._storageService, this._credentialService);

  Future<Citizen?> onboard(String aadhaarNumber) async {
    final citizenId = kDemoCitizenMap[aadhaarNumber];
    if (citizenId == null) return null;

    // GPS Context (best-effort, non-blocking)
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
      );
      await _storageService.write('onboard_lat', position.latitude.toString());
      await _storageService.write('onboard_lng', position.longitude.toString());
    } catch (e) {
      // Ignore GPS errors for demo
    }

    // 1. Keygen
    final keys = await _cryptoService.generateKeyPair('ML-DSA-44');
    await _storageService.write('citizen_pub_key', keys['public_key']!);
    await _storageService.write('citizen_priv_key', keys['private_key']!);

    // 2. Fetch citizen info
    final response = await _dio.get('/credentials/$citizenId');
    final credentials = response.data['credentials'] as List?;
    
    final citizen = Citizen(
      id: citizenId,
      name: response.data['citizen_name'],
      aadhaarHash: (credentials != null && credentials.isNotEmpty) 
          ? credentials[0]['citizen_id_hash'] 
          : 'sha256:fallback_hash_${citizenId}',
    );

    await _storageService.write('current_citizen', jsonEncode(citizen.toJson()));

    // 3. Download and encrypt all credentials
    await _credentialService.downloadCredentials(citizenId);

    return citizen;
  }

  Future<Citizen?> getCurrentCitizen() async {
    final data = await _storageService.read('current_citizen');
    if (data == null) return null;
    return Citizen.fromJson(jsonDecode(data));
  }

  Future<void> logout() async {
    await _storageService.clear();
  }
}
