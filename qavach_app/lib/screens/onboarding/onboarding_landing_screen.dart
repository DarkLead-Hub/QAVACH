import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Onboarding landing — the first screen after splash.
/// Two paths: Sign in to QAVACH (Supabase) or Initialize Wallet (mock-CA demo).
class OnboardingLandingScreen extends StatelessWidget {
  const OnboardingLandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(flex: 2),

              // Logo & branding
              Center(
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF4F46E5).withValues(alpha: 0.25),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.shield, color: Colors.white, size: 36),
                ),
              ),
              const SizedBox(height: 28),
              const Text(
                'Welcome to QAVACH',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E293B),
                  height: 1.2,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              const Text(
                'Next-generation identity protection.\nPost-quantum secure, privacy-first.',
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 15,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),

              const Spacer(flex: 1),

              // Feature chips
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Column(
                  children: [
                    _FeatureRow(
                      icon: Icons.verified_user,
                      text: 'NIST-standardized PQC (ML-DSA, SLH-DSA)',
                      color: Color(0xFF4F46E5),
                    ),
                    SizedBox(height: 14),
                    _FeatureRow(
                      icon: Icons.lock_person,
                      text: 'Your data never leaves your device',
                      color: Color(0xFF0891B2),
                    ),
                    SizedBox(height: 14),
                    _FeatureRow(
                      icon: Icons.description,
                      text: 'Issue & verify government credentials',
                      color: Color(0xFF059669),
                    ),
                  ],
                ),
              ),

              const Spacer(flex: 2),

              // Primary action — Sign in to QAVACH
              ElevatedButton(
                onPressed: () => context.push('/supabase-login'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: const Text(
                  'Sign in to QAVACH',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                ),
              ),
              const SizedBox(height: 12),

              // Secondary action — demo wallet
              OutlinedButton(
                onPressed: () => context.push('/onboarding/aadhaar'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF4F46E5),
                  side: const BorderSide(color: Color(0xFFE2E8F0)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text(
                  'Demo Wallet (Mock CA)',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(height: 16),

              const Center(
                child: Text(
                  'Powered by Post-Quantum Cryptography',
                  style: TextStyle(fontSize: 11, color: Color(0xFFCBD5E1), letterSpacing: 0.5),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;
  const _FeatureRow({required this.icon, required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 13,
              color: Color(0xFF475569),
            ),
          ),
        ),
      ],
    );
  }
}
