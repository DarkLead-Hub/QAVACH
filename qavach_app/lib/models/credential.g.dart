// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'credential.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SignedCredential _$SignedCredentialFromJson(Map<String, dynamic> json) =>
    SignedCredential(
      credentialId: json['credential_id'] as String,
      credentialType: json['credential_type'] as String,
      issuerDeptId: json['issuer_dept_id'] as String,
      citizenIdHash: json['citizen_id_hash'] as String,
      issuedAt: json['issued_at'] as String,
      expiresAt: json['expires_at'] as String,
      attributes: json['attributes'] as Map<String, dynamic>,
      sigId: json['sig_id'] as String,
      signatureB64: json['signature_b64'] as String,
      algorithm: json['algorithm'] as String,
      quantumSafe: json['quantum_safe'] as bool,
      issuerPublicKeyB64: json['issuer_public_key_b64'] as String,
    );

Map<String, dynamic> _$SignedCredentialToJson(SignedCredential instance) =>
    <String, dynamic>{
      'credential_id': instance.credentialId,
      'credential_type': instance.credentialType,
      'issuer_dept_id': instance.issuerDeptId,
      'citizen_id_hash': instance.citizenIdHash,
      'issued_at': instance.issuedAt,
      'expires_at': instance.expiresAt,
      'attributes': instance.attributes,
      'sig_id': instance.sigId,
      'signature_b64': instance.signatureB64,
      'algorithm': instance.algorithm,
      'quantum_safe': instance.quantumSafe,
      'issuer_public_key_b64': instance.issuerPublicKeyB64,
    };
