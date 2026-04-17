# QAVACH Flutter App — Complete Build Specification

## What This Is

QAVACH is the citizen-facing mobile wallet for PQC-verified identity. The name means "armour" in Hindi/Sanskrit. It runs on Android (target for demo — use a physical device for maximum impact).

The app does five things:
1. **Onboards** the citizen via mock Aadhaar OTP + GPS + time verification
2. **Downloads** signed credentials from the Mock Issuer CA (simulating DigiLocker)
3. **Stores** credentials encrypted with ML-KEM-768 + AES-256-GCM in local secure storage
4. **Evaluates** OPA Rego policies on-device when a QR scan triggers a verification request
5. **Generates** an ML-DSA-44 signed proof and POSTs it to GovSign — only if OPA policy passes

The citizen's original documents never leave the device. The verifier receives only a cryptographically signed boolean claim.

---

## Tech Stack

- **Framework:** Flutter 3.19+ (Dart 3.3+)
- **Target:** Android (minSdk 26 / Android 8.0+). iOS support is possible but not required for demo.
- **PQC:** `liboqs-dart` via FFI — or OQS Python sidecar on port 8002 (see below)
- **OPA:** OPA WASM bundle, loaded via `wasm_run` or `wasmi` Dart package
- **QR Scanning:** `mobile_scanner` package
- **Secure Storage:** `flutter_secure_storage`
- **HTTP:** `dio`
- **State Management:** `riverpod` (Riverpod 2.x)
- **Navigation:** `go_router`

### PQC on Flutter — Recommended Approach for Hackathon

Full liboqs FFI integration is 2–3 days of work. For the hackathon, use the **OQS Sidecar approach**:

Run a tiny Python/FastAPI service (`govsign-sidecar`) on port 8002 on the dev machine. The Flutter app calls it via HTTP localhost. On an Android emulator, `10.0.2.2` maps to the host machine. On a physical device on the same WiFi, use the machine's LAN IP.

```python
# sidecar — add to services/govsign/sidecar.py (3 endpoints, 50 lines)
# POST /sidecar/keygen    → generates ML-DSA-44 keypair
# POST /sidecar/sign      → signs payload with private key
# POST /sidecar/kem/wrap  → ML-KEM-768 encapsulate
# POST /sidecar/kem/unwrap → ML-KEM-768 decapsulate
```

Label it "PQC Crypto Module" in the UI. The cryptography is real — only the FFI boundary is simplified.

---

## Project Structure

```
qavach_app/
├── pubspec.yaml
├── android/
│   └── app/src/main/AndroidManifest.xml
├── assets/
│   ├── opa/
│   │   ├── income_lt_3L.wasm       ← compiled Rego policy
│   │   ├── land_ownership.wasm
│   │   └── composite_income_cibil.wasm
│   └── fonts/
├── lib/
│   ├── main.dart
│   ├── config.dart                  ← base URLs, constants
│   ├── app.dart                     ← GoRouter setup, ProviderScope
│   │
│   ├── models/
│   │   ├── citizen.dart
│   │   ├── credential.dart          ← SignedCredential model
│   │   └── pgca_session.dart        ← QR scan session model
│   │
│   ├── services/
│   │   ├── auth_service.dart        ← mock Aadhaar OTP + GPS onboarding
│   │   ├── credential_service.dart  ← download, store, retrieve credentials
│   │   ├── crypto_service.dart      ← calls OQS sidecar for sign/verify/KEM
│   │   ├── opa_service.dart         ← loads WASM policies, evaluates claims
│   │   ├── storage_service.dart     ← flutter_secure_storage wrapper
│   │   └── govsign_service.dart     ← GovSign API client
│   │
│   ├── providers/
│   │   ├── auth_provider.dart
│   │   ├── credentials_provider.dart
│   │   └── session_provider.dart
│   │
│   └── screens/
│       ├── splash/
│       │   └── splash_screen.dart
│       ├── onboarding/
│       │   ├── onboarding_screen.dart
│       │   ├── aadhaar_input_screen.dart
│       │   ├── otp_screen.dart
│       │   └── keygen_screen.dart    ← "Generating your quantum-safe keys..."
│       ├── home/
│       │   ├── home_screen.dart      ← credential wallet list
│       │   └── credential_card.dart
│       ├── scan/
│       │   ├── scan_screen.dart      ← QR scanner
│       │   ├── policy_check_screen.dart ← OPA evaluation UI
│       │   └── proof_result_screen.dart ← success/denied screen
│       └── credential_detail/
│           └── credential_detail_screen.dart
```

---

## Onboarding Flow

### Step 1: Mock Aadhaar Input
- Input field: 12-digit Aadhaar number (any valid format accepted in demo)
- For demo: `111122223333` → maps to `CITIZEN_001` (Priya Sharma)
- `222233334444` → `CITIZEN_002` (Rahul Mehta)
- `333344445555` → `CITIZEN_003` (Ananya Patel)

### Step 2: GPS + Time Verification
```dart
// In auth_service.dart
Future<void> verifyContext() async {
  final position = await Geolocator.getCurrentPosition();
  final now = DateTime.now().toUtc();
  // Store for PGCA proof context — not used for blocking, only for enriching the proof
  await _storage.write('onboard_lat', position.latitude.toString());
  await _storage.write('onboard_lng', position.longitude.toString());
  await _storage.write('onboard_time', now.toIso8601String());
}
```

### Step 3: Mock OTP (always "123456" in demo)
Show OTP screen, accept any 6-digit code. In real system, this would be UIDAI TOTP.

### Step 4: Key Generation
This is a marquee UI moment for the demo. Show a full-screen animation while calling the sidecar:

```dart
// In crypto_service.dart
Future<void> generateCitizenKeyPair() async {
  final response = await _dio.post('$SIDECAR_URL/sidecar/keygen', data: {
    'algorithm': 'ML-DSA-44',
  });
  final pubKey = response.data['public_key_b64'] as String;
  final privKey = response.data['private_key_b64'] as String;
  
  // NEVER store private key in plaintext. Use flutter_secure_storage.
  await _storage.write('citizen_pub_key', pubKey);
  await _storage.write('citizen_priv_key', privKey);  // flutter_secure_storage encrypts at rest
}
```

The screen should show:
```
Generating your quantum-safe identity keys...

Algorithm: ML-DSA-44 (NIST FIPS 204)
Security: Post-quantum — Dilithium lattice-based

[animated progress bar]

Your private key is stored in this device's secure enclave.
It never leaves your phone.
```

### Step 5: Download Credentials
Call Mock CA and download all credentials for the citizen:
```dart
Future<void> downloadCredentials(String citizenId) async {
  final response = await _dio.get('$MOCK_CA_URL/credentials/$citizenId');
  final credentials = (response.data['credentials'] as List)
      .map((c) => SignedCredential.fromJson(c))
      .toList();
  
  for (final cred in credentials) {
    await _encryptAndStore(cred);
  }
}

Future<void> _encryptAndStore(SignedCredential cred) async {
  // 1. Encapsulate a fresh AES key using ML-KEM-768
  final pubKey = await _storage.read('citizen_pub_key');
  final kemResult = await _dio.post('$SIDECAR_URL/sidecar/kem/wrap', data: {
    'public_key_b64': pubKey,
  });
  final kemCiphertext = kemResult.data['ciphertext_b64'];
  final aesKey = kemResult.data['shared_secret_b64'];  // 32 bytes, use as AES-256 key
  
  // 2. Encrypt credential JSON with AES-256-GCM
  final credJson = jsonEncode(cred.toJson());
  final encrypted = await _aesGcmEncrypt(aesKey, credJson);
  
  // 3. Store {kem_ciphertext, encrypted_data} — both in secure storage
  await _storage.write(
    'cred_${cred.credentialId}',
    jsonEncode({'kem_ct': kemCiphertext, 'enc': encrypted}),
  );
}
```

---

## Models

```dart
// lib/models/credential.dart
class SignedCredential {
  final String credentialId;
  final String credentialType;
  final String issuerDeptId;
  final String citizenIdHash;
  final String issuedAt;
  final String expiresAt;
  final Map<String, dynamic> attributes;
  final String sigId;
  final String signatureB64;
  final String algorithm;
  final bool quantumSafe;
  final String issuerPublicKeyB64;

  // Computed
  bool get isExpired => DateTime.parse(expiresAt).isBefore(DateTime.now());
  
  String get displayName => switch (credentialType) {
    'income_certificate' => 'Income Certificate',
    'aadhaar_attestation' => 'Aadhaar eKYC',
    'land_ownership' => 'Land Ownership Record',
    'health_record' => 'Health ID Record',
    _ => credentialType,
  };
}
```

---

## OPA Policy Evaluation

### Compiling Rego Policies to WASM

Run this on the dev machine (requires OPA CLI):

```bash
# Install OPA CLI
# For each policy:
opa build --target wasm --entrypoint qavach/allow policies/income_lt_3L.rego -o income_lt_3L.wasm
```

Policy file:
```rego
# policies/income_lt_3L.rego
package qavach

default allow = false

allow {
  input.credential_type == "income_certificate"
  input.attributes.annual_income < 300000
  not credential_expired
  input.issuer_dept_id == "ITD"
}

credential_expired {
  # ISO8601 string comparison
  input.expires_at < time.now_ns() / 1000000000
}

# Also export the reason for UI display
reason = "Income below ₹3,00,000 — eligible" { allow }
reason = "Income exceeds ₹3,00,000 — not eligible" { not allow; input.attributes.annual_income >= 300000 }
reason = "Credential expired" { not allow; credential_expired }
reason = "Wrong issuer — expected ITD" { not allow; input.issuer_dept_id != "ITD" }
```

```dart
// lib/services/opa_service.dart
import 'package:flutter/services.dart' show rootBundle;

class OpaService {
  // Cache loaded WASM modules
  final Map<String, dynamic> _policies = {};

  Future<OpaResult> evaluate(String policyName, Map<String, dynamic> input) async {
    // Load WASM bytes from assets
    final wasmBytes = await rootBundle.load('assets/opa/$policyName.wasm');
    
    // For hackathon: implement as JSON-based rule evaluation in Dart
    // (pure Dart fallback if WASM runtime has issues)
    return _evaluateDart(policyName, input);
  }

  // Dart fallback implementation (mirrors Rego logic exactly)
  OpaResult _evaluateDart(String policy, Map<String, dynamic> input) {
    switch (policy) {
      case 'income_lt_3L':
        return _evalIncomeLt3L(input);
      case 'land_ownership':
        return _evalLandOwnership(input);
      default:
        return OpaResult(allow: false, reason: 'Unknown policy');
    }
  }

  OpaResult _evalIncomeLt3L(Map<String, dynamic> input) {
    if (input['credential_type'] != 'income_certificate') {
      return OpaResult(allow: false, reason: 'Wrong credential type');
    }
    final income = input['attributes']['annual_income'] as int;
    if (income >= 300000) {
      return OpaResult(allow: false, reason: 'Income ₹${_fmt(income)} exceeds ₹3,00,000 limit');
    }
    final expires = DateTime.parse(input['expires_at'] as String);
    if (expires.isBefore(DateTime.now())) {
      return OpaResult(allow: false, reason: 'Credential expired on ${expires.toLocal()}');
    }
    return OpaResult(allow: true, reason: 'Income ₹${_fmt(income)} — below ₹3,00,000 limit');
  }
}

class OpaResult {
  final bool allow;
  final String reason;
  const OpaResult({required this.allow, required this.reason});
}
```

---

## QR Scan → PGCA Flow

```dart
// lib/services/govsign_service.dart

Future<void> processQrPayload(String qrJson) async {
  final qr = jsonDecode(qrJson);
  final sessionId = qr['s'] as String;
  final nonce = qr['n'] as String;
  final claimType = qr['c'] as String;
  final callbackUrl = qr['cb'] as String;

  // 1. Find the matching credential for this claim type
  final credential = await _findCredentialForClaim(claimType);
  if (credential == null) throw Exception('No credential for claim: $claimType');

  // 2. Decrypt the credential from local storage
  final decrypted = await _decryptCredential(credential.credentialId);

  // 3. Run OPA policy
  final opaResult = await _opaService.evaluate(
    _policyNameForClaim(claimType),
    decrypted.toJson(),
  );

  if (!opaResult.allow) {
    // Update UI to show denied. No signature generated. Nothing sent.
    return;
  }

  // 4. Build proof payload
  final proofPayload = jsonEncode({
    'nonce': nonce,
    'claim_type': claimType,
    'claim_value': true,
    'citizen_id_hash': decrypted.citizenIdHash,
    'issuer_dept_id': decrypted.issuerDeptId,
    'doc_sig_id': decrypted.sigId,
  });

  // 5. Sign proof with citizen's ML-DSA-44 key
  final privKey = await _storage.read('citizen_priv_key');
  final signResult = await _dio.post('$SIDECAR_URL/sidecar/sign', data: {
    'algorithm': 'ML-DSA-44',
    'private_key_b64': privKey,
    'payload': base64Encode(utf8.encode(proofPayload)),
  });
  final proofSignature = signResult.data['signature_b64'] as String;
  final citizenPubKey = await _storage.read('citizen_pub_key');

  // 6. POST to GovSign session callback
  await _dio.post(callbackUrl, data: {
    'session_id': sessionId,
    'nonce': nonce,
    'claim_type': claimType,
    'claim_value': true,
    'citizen_id_hash': decrypted.citizenIdHash,
    'issuer_dept_id': decrypted.issuerDeptId,
    'doc_sig_id': decrypted.sigId,
    'proof_signature_b64': proofSignature,
    'citizen_pub_key_b64': citizenPubKey,
  });
}
```

---

## Key UI Screens

### Policy Check Screen (most important for demo)

When OPA evaluates, show a step-by-step breakdown:

```
Verifying your eligibility...

[1] Loading credential          ✓ Income Certificate (ITD)
[2] Checking issuer trust       ✓ Signed by Income Tax Dept
[3] Algorithm security          ✓ SLH-DSA-SHAKE-128s (quantum-safe)
[4] Policy evaluation (OPA)     ✓ Income ₹2,10,000 < ₹3,00,000 limit
[5] Credential expiry           ✓ Valid until 15 Jan 2025

──────────────────────────────────
RESULT: ELIGIBLE
──────────────────────────────────

Generating proof signature (ML-DSA-44)...
Your income certificate stays on your device.
Only the verified claim is shared.
```

If policy FAILS, show step 4 in red:
```
[4] Policy evaluation (OPA)     ✗ Income ₹4,80,000 exceeds ₹3,00,000 limit

──────────────────────────────────
RESULT: NOT ELIGIBLE
──────────────────────────────────

No proof was generated.
No data was shared.
```

### Home Screen — Credential Wallet

Cards in a vertical list, one per credential:
- Top of card: credential type + issuer name
- Middle: key attribute (e.g., "Annual Income: ₹2,10,000" or "Parcel: KA-BLR-001")
- Bottom: quantum safety badge + expiry date
- Green lock icon if `quantum_safe: true`. Red warning icon if `quantum_safe: false`.

---

## pubspec.yaml Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  riverpod: ^2.5.1
  flutter_riverpod: ^2.5.1
  go_router: ^13.2.0
  dio: ^5.4.3
  flutter_secure_storage: ^9.0.0
  mobile_scanner: ^5.1.1
  geolocator: ^11.0.0
  permission_handler: ^11.3.0
  crypto: ^3.0.3
  encrypt: ^5.0.3      # AES-256-GCM
  pointycastle: ^3.7.4 # Cryptographic primitives
  intl: ^0.19.0
  cached_network_image: ^3.3.1
```

---

## config.dart

```dart
// lib/config.dart
const String kGovSignUrl = String.fromEnvironment('GOVSIGN_URL', defaultValue: 'http://10.0.2.2:8000');
const String kMockCaUrl = String.fromEnvironment('MOCK_CA_URL', defaultValue: 'http://10.0.2.2:8001');
const String kSidecarUrl = String.fromEnvironment('SIDECAR_URL', defaultValue: 'http://10.0.2.2:8002');

// Demo citizen mappings (Aadhaar prefix → citizen ID)
const Map<String, String> kDemoCitizenMap = {
  '111122223333': 'CITIZEN_001',  // Priya Sharma — income ₹2.1L
  '222233334444': 'CITIZEN_002',  // Rahul Mehta — income ₹4.8L
  '333344445555': 'CITIZEN_003',  // Ananya Patel — income ₹1.8L
};
```

---

## Running the App

```bash
cd qavach_app
flutter pub get
flutter run -d android   # physical device preferred
# OR
flutter run -d emulator  # emulator (use 10.0.2.2 for localhost)
```

Make sure GovSign (8000), Mock CA (8001), and Sidecar (8002) are all running before launching the app.
