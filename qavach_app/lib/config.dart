// lib/config.dart

// ── Existing GovSign / Mock-CA / Sidecar URLs ──
const String kGovSignUrl = String.fromEnvironment('GOVSIGN_URL', defaultValue: 'http://13.203.215.126:8000');
const String kMockCaUrl = String.fromEnvironment('MOCK_CA_URL', defaultValue: 'http://13.203.215.126:8001');
const String kSidecarUrl = String.fromEnvironment('SIDECAR_URL', defaultValue: 'http://13.203.215.126:8002');

// Demo citizen mappings (Aadhaar prefix -> citizen ID)
const Map<String, String> kDemoCitizenMap = {
  '111122223333': 'CITIZEN_001',  // Priya Sharma — income ₹2.1L
  '222233334444': 'CITIZEN_002',  // Rahul Mehta — income ₹4.8L
  '333344445555': 'CITIZEN_003',  // Ananya Patel — income ₹1.8L
};

// ── Supabase Configuration ──
// These connect the Flutter app to the same Supabase project used by the Issue Portal.
const String kSupabaseUrl = 'https://zlzjfjjrhedelcgbhfla.supabase.co';
const String kSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsempmampyaGVkZWxjZ2JoZmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDQ1MzQsImV4cCI6MjA5MjAyMDUzNH0.m7yOBt-OQXI7L78gJrRaQczoPWDMF4mCgp2LVjzvryU';

// Supabase Storage bucket for issued credentials (matches Issue Portal)
const String kCredentialsBucket = 'make-93e10323-credentials';

// Supabase Edge Function base URL (for credential issuance)
const String kEdgeFunctionBase = '$kSupabaseUrl/functions/v1/make-server-93e10323';
