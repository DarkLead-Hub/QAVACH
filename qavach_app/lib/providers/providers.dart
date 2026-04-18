import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/auth_service.dart';
import '../services/crypto_service.dart';
import '../services/storage_service.dart';
import '../services/credential_service.dart';
import '../services/opa_service.dart';
import '../services/govsign_service.dart';
import '../services/supabase_auth_service.dart';
import '../services/supabase_credential_service.dart';

// ── Existing providers (Mock-CA / PQC Sidecar flow) ──

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

// ── Supabase providers (DigiLocker / Issue Portal flow) ──

final supabaseAuthServiceProvider = Provider((ref) => SupabaseAuthService());
final supabaseCredentialServiceProvider = Provider((ref) => SupabaseCredentialService());

/// Issued credentials from the Supabase database (Issue Portal)
final supabaseIssuedCredentialsProvider = FutureProvider<List<IssuedCredential>>((ref) {
  return ref.watch(supabaseCredentialServiceProvider).getIssuedCredentials();
});

/// Uploaded documents from the Supabase database
final supabaseUploadedDocumentsProvider = FutureProvider<List<UploadedDocument>>((ref) {
  return ref.watch(supabaseCredentialServiceProvider).getUploadedDocuments();
});
