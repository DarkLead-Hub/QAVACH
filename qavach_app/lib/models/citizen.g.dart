// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'citizen.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Citizen _$CitizenFromJson(Map<String, dynamic> json) => Citizen(
  id: json['id'] as String,
  name: json['name'] as String,
  aadhaarHash: json['aadhaar_hash'] as String,
  pan: json['pan'] as String?,
  address: json['address'] as String?,
);

Map<String, dynamic> _$CitizenToJson(Citizen instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'aadhaar_hash': instance.aadhaarHash,
  'pan': instance.pan,
  'address': instance.address,
};
