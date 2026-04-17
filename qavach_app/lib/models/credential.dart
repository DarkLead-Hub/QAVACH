import 'package:json_annotation/json_annotation.dart';

part 'credential.g.dart';

@JsonSerializable(fieldRename: FieldRename.snake)
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

  SignedCredential({
    required this.credentialId,
    required this.credentialType,
    required this.issuerDeptId,
    required this.citizenIdHash,
    required this.issuedAt,
    required this.expiresAt,
    required this.attributes,
    required this.sigId,
    required this.signatureB64,
    required this.algorithm,
    required this.quantumSafe,
    required this.issuerPublicKeyB64,
  });

  factory SignedCredential.fromJson(Map<String, dynamic> json) =>
      _$SignedCredentialFromJson(json);

  Map<String, dynamic> toJson() => _$SignedCredentialToJson(this);

  bool get isExpired => DateTime.parse(expiresAt).isBefore(DateTime.now());

  String get displayName => switch (credentialType) {
        'income_certificate' => 'Income Certificate',
        'aadhaar_attestation' => 'Aadhaar eKYC',
        'land_ownership' => 'Land Ownership Record',
        'health_record' => 'Health ID Record',
        _ => credentialType,
      };
}
