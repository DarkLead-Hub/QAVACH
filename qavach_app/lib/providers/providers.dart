import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';
import '../services/crypto_service.dart';
import '../services/storage_service.dart';
import '../services/credential_service.dart';
import '../services/opa_service.dart';
import '../services/govsign_service.dart';

final cryptoServiceProvider = Provider((ref) => CryptoService());
final storageServiceProvider = Provider((ref) => StorageService());
final opaServiceProvider = Provider((ref) => OpaService());

final credentialServiceProvider = Provider((ref) {
  final crypto = ref.watch(cryptoServiceProvider);
  final storage = ref.watch(storageServiceProvider);
  return CredentialService(crypto, storage);
});

final authServiceProvider = Provider((ref) {
  final crypto = ref.watch(cryptoServiceProvider);
  final storage = ref.watch(storageServiceProvider);
  final credential = ref.watch(credentialServiceProvider);
  return AuthService(crypto, storage, credential);
});

final govSignServiceProvider = Provider((ref) {
  final crypto = ref.watch(cryptoServiceProvider);
  final storage = ref.watch(storageServiceProvider);
  final opa = ref.watch(opaServiceProvider);
  return GovSignService(crypto, storage, opa);
});

final currentCitizenProvider = FutureProvider((ref) {
  return ref.watch(authServiceProvider).getCurrentCitizen();
});

final credentialsProvider = FutureProvider((ref) {
  return ref.watch(credentialServiceProvider).getStoredCredentials();
});
