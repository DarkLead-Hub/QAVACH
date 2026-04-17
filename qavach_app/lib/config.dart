// lib/config.dart
const String kGovSignUrl = String.fromEnvironment('GOVSIGN_URL', defaultValue: 'http://13.203.215.126:8000');
const String kMockCaUrl = String.fromEnvironment('MOCK_CA_URL', defaultValue: 'http://13.203.215.126:8001');
const String kSidecarUrl = String.fromEnvironment('SIDECAR_URL', defaultValue: 'http://13.203.215.126:8002');

// Demo citizen mappings (Aadhaar prefix -> citizen ID)
const Map<String, String> kDemoCitizenMap = {
  '111122223333': 'CITIZEN_001',  // Priya Sharma — income ₹2.1L
  '222233334444': 'CITIZEN_002',  // Rahul Mehta — income ₹4.8L
  '333344445555': 'CITIZEN_003',  // Ananya Patel — income ₹1.8L
};
