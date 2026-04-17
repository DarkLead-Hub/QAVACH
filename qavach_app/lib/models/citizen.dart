import 'package:json_annotation/json_annotation.dart';

part 'citizen.g.dart';

@JsonSerializable(fieldRename: FieldRename.snake)
class Citizen {
  final String id;
  final String name;
  final String aadhaarHash;
  final String? pan;
  final String? address;

  Citizen({
    required this.id,
    required this.name,
    required this.aadhaarHash,
    this.pan,
    this.address,
  });

  factory Citizen.fromJson(Map<String, dynamic> json) => _$CitizenFromJson(json);
  Map<String, dynamic> toJson() => _$CitizenToJson(this);
}
