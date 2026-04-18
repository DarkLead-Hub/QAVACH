import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config.dart';
import 'models/credential.dart';
import 'screens/splash/splash_screen.dart';
import 'screens/onboarding/onboarding_landing_screen.dart';
import 'screens/onboarding/aadhaar_input_screen.dart';
import 'screens/onboarding/otp_screen.dart';
import 'screens/onboarding/keygen_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/scan/scan_screen.dart';
import 'screens/scan/policy_check_screen.dart';
import 'screens/scan/proof_result_screen.dart';
import 'screens/credential_detail/credential_detail_screen.dart';
// QAVACH Supabase auth screens
import 'screens/supabase_auth/supabase_login_screen.dart';
import 'screens/supabase_auth/supabase_signup_screen.dart';
import 'screens/supabase_auth/supabase_home_screen.dart';
import 'screens/supabase_auth/pdf_verify_upload_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase — same project as the Issue Portal
  await Supabase.initialize(
    url: kSupabaseUrl,
    anonKey: kSupabaseAnonKey,
  );

  runApp(const ProviderScope(child: QavachApp()));
}

final _router = GoRouter(
  initialLocation: '/',
  routes: [
    // ── Existing routes (Mock-CA / PQC demo flow) ──
    GoRoute(
      path: '/',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingLandingScreen(),
      routes: [
        GoRoute(
          path: 'aadhaar',
          builder: (context, state) => const AadhaarInputScreen(),
        ),
        GoRoute(
          path: 'otp',
          builder: (context, state) {
            final aadhaar = state.extra as String;
            return OtpScreen(aadhaar: aadhaar);
          },
        ),
        GoRoute(
          path: 'keygen',
          builder: (context, state) {
            final aadhaar = state.extra as String;
            return KeygenScreen(aadhaar: aadhaar);
          },
        ),
      ],
    ),
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomeScreen(),
      routes: [
        GoRoute(
          path: 'credential',
          builder: (context, state) {
            final credential = state.extra as SignedCredential;
            return CredentialDetailScreen(credential: credential);
          },
        ),
      ],
    ),
    GoRoute(
      path: '/scan',
      builder: (context, state) => const ScanScreen(),
      routes: [
        GoRoute(
          path: 'verify',
          builder: (context, state) {
            final extras = state.extra as Map<String, dynamic>;
            return PolicyCheckScreen(
              qrJson: extras['qrJson'] as String,
              claimType: extras['claimType'] as String,
            );
          },
        ),
        GoRoute(
          path: 'result',
          builder: (context, state) {
            final extras = state.extra as Map<String, dynamic>;
            return ProofResultScreen(
              success: extras['success'] as bool,
              claimType: extras['claimType'] as String,
              error: extras['error'] as String?,
            );
          },
        ),
      ],
    ),

    // ── QAVACH Supabase auth routes ──
    GoRoute(
      path: '/supabase-login',
      builder: (context, state) => const SupabaseLoginScreen(),
    ),
    GoRoute(
      path: '/supabase-signup',
      builder: (context, state) => const SupabaseSignupScreen(),
    ),
    GoRoute(
      path: '/supabase-home',
      builder: (context, state) => const SupabaseHomeScreen(),
    ),
    GoRoute(
      path: '/pdf-verify-upload',
      builder: (context, state) => const PdfVerifyUploadScreen(),
    ),
  ],
);

class QavachApp extends StatelessWidget {
  const QavachApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'QAVACH',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4338CA),
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: Colors.white,
        useMaterial3: true,
      ),
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}
