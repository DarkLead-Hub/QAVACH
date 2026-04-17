import '../models/credential.dart';

class OpaResult {
  final bool allow;
  final String reason;
  const OpaResult({required this.allow, required this.reason});
}

class OpaService {
  Future<OpaResult> evaluate(String policyName, SignedCredential credential) async {
    // Dart fallback implementation (mirrors Rego logic exactly)
    switch (policyName) {
      case 'income_lt_3L':
        return _evalIncomeLt3L(credential);
      case 'land_ownership':
        return _evalLandOwnership(credential);
      case 'composite_income_cibil':
        return _evalCompositeIncomeCibil(credential);
      default:
        return const OpaResult(allow: false, reason: 'Unknown policy');
    }
  }

  OpaResult _evalIncomeLt3L(SignedCredential cred) {
    if (cred.credentialType != 'income_certificate') {
      return const OpaResult(allow: false, reason: 'Wrong credential type');
    }
    final income = cred.attributes['annual_income'] as int;
    if (income >= 300000) {
      return OpaResult(
        allow: false, 
        reason: 'Income ₹${income.toLocaleString()} exceeds ₹3,00,000 limit'
      );
    }
    if (cred.isExpired) {
      return const OpaResult(allow: false, reason: 'Credential expired');
    }
    if (cred.issuerDeptId != 'ITD') {
      return const OpaResult(allow: false, reason: 'Wrong issuer — expected ITD');
    }
    return OpaResult(
      allow: true, 
      reason: 'Income ₹${income.toLocaleString()} — below ₹3,00,000 limit'
    );
  }

  OpaResult _evalLandOwnership(SignedCredential cred) {
    if (cred.credentialType != 'land_ownership') {
      return const OpaResult(allow: false, reason: 'Wrong credential type');
    }
    if (cred.attributes['ownership_type'] != 'freehold') {
      return const OpaResult(allow: false, reason: 'Not a freehold property');
    }
    if (cred.isExpired) {
      return const OpaResult(allow: false, reason: 'Credential expired');
    }
    if (cred.issuerDeptId != 'REVENUE') {
      return const OpaResult(allow: false, reason: 'Wrong issuer — expected REVENUE');
    }
    return const OpaResult(allow: true, reason: 'Freehold land ownership verified');
  }

  OpaResult _evalCompositeIncomeCibil(SignedCredential cred) {
    if (cred.credentialType != 'income_certificate') {
      return const OpaResult(allow: false, reason: 'Wrong credential type');
    }
    final income = cred.attributes['annual_income'] as int;
    final cibil = cred.attributes['cibil_signal'] as String?;

    if (income < 500000) {
      return OpaResult(
        allow: false, 
        reason: 'Income ₹${income.toLocaleString()} below ₹5,00,000 threshold'
      );
    }
    if (cibil != 'positive') {
      return const OpaResult(allow: false, reason: 'Credit profile insufficient');
    }
    return const OpaResult(allow: true, reason: 'Income and credit profile eligible');
  }
}

extension IntFormatting on int {
  String toLocaleString() {
    return toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }
}
