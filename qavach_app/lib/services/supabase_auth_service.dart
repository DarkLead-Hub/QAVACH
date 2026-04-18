import 'package:supabase_flutter/supabase_flutter.dart';

/// Service for Supabase authentication — mirrors the Issue Portal's auth flow.
/// Uses the same Supabase project so users created in the Issue Portal
/// can log in here and access their issued credentials.
class SupabaseAuthService {
  final SupabaseClient _client = Supabase.instance.client;

  /// Sign in with email/password (same credentials as Issue Portal)
  Future<AuthResponse> signIn(String email, String password) async {
    return await _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  /// Register a new account (auto-creates profile via handle_new_user trigger)
  Future<AuthResponse> signUp({
    required String email,
    required String password,
    required String fullName,
    String? phone,
    String? address,
  }) async {
    return await _client.auth.signUp(
      email: email,
      password: password,
      data: {
        'full_name': fullName,
        'phone': phone ?? '',
        'address': address ?? '',
      },
    );
  }

  /// Sign out
  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  /// Get the current authenticated user (null if not logged in)
  User? getCurrentUser() {
    return _client.auth.currentUser;
  }

  /// Get the current session
  Session? getCurrentSession() {
    return _client.auth.currentSession;
  }

  /// Check if user is authenticated
  bool get isAuthenticated => _client.auth.currentSession != null;

  /// Get user's profile from the profiles table
  Future<Map<String, dynamic>?> getProfile() async {
    final user = getCurrentUser();
    if (user == null) return null;

    final response = await _client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    return response;
  }

  /// Listen to auth state changes
  Stream<AuthState> get onAuthStateChange => _client.auth.onAuthStateChange;
}
