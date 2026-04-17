import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class OnboardingLandingScreen extends StatelessWidget {
  const OnboardingLandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              const Icon(Icons.shield, size: 80, color: Color(0xFF6366F1)),
              const SizedBox(height: 32),
              const Text(
                'Welcome to QAVACH',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              const Text(
                'The next generation of identity protection. Post-quantum secure, privacy-first, and completely decentralized.',
                style: TextStyle(color: Colors.grey, fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const Spacer(),
              const Column(
                children: [
                  _FeatureRow(icon: Icons.lock_person, text: 'Your data never leaves your device'),
                  SizedBox(height: 16),
                  _FeatureRow(icon: Icons.verified_user, text: 'Selective disclosure proofs'),
                  SizedBox(height: 16),
                  _FeatureRow(icon: Icons.auto_awesome, text: 'NIST-standardized PQC (ML-DSA)'),
                ],
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: () => context.push('/onboarding/aadhaar'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 8,
                  shadowColor: Colors.indigoAccent.withOpacity(0.5),
                ),
                child: const Text('Initialize Wallet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {},
                child: const Text('Learn more about PQC', style: TextStyle(color: Color(0xFF6366F1))),
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
  const _FeatureRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFF6366F1).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: const Color(0xFF6366F1), size: 20),
        ),
        const SizedBox(width: 16),
        Text(text, style: const TextStyle(fontWeight: FontWeight.w500)),
      ],
    );
  }
}
