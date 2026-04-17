import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ProofResultScreen extends StatelessWidget {
  final bool success;
  final String claimType;
  final String? error;

  const ProofResultScreen({
    super.key,
    required this.success,
    required this.claimType,
    this.error,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Icon(
                success ? Icons.check_circle_outline : Icons.error_outline,
                size: 100,
                color: success ? Colors.green : Colors.red,
              ),
              const SizedBox(height: 32),
              Text(
                success ? 'Verification Successful' : 'Verification Failed',
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                success
                    ? 'Your eligibility for ${claimType.replaceAll('_', ' ')} has been proven and submitted.'
                    : (error ?? 'We could not verify your eligibility for this claim.'),
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 16),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              if (success)
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.green.withOpacity(0.2)),
                  ),
                  child: const Column(
                    children: [
                      _ResultRow(label: 'Algorithm', value: 'ML-DSA-44'),
                      SizedBox(height: 12),
                      _ResultRow(label: 'Security', value: 'Quantum-safe'),
                      SizedBox(height: 12),
                      _ResultRow(label: 'Disclosure', value: 'Selective Proof'),
                      SizedBox(height: 12),
                      _ResultRow(label: 'Data Shared', value: '0 bytes of docs'),
                    ],
                  ),
                ),
              const Spacer(),
              ElevatedButton(
                onPressed: () => context.go('/home'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: success ? const Color(0xFF6366F1) : Color(0xFF1E293B),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Return to Home', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ResultRow extends StatelessWidget {
  final String label;
  final String value;
  const _ResultRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13)),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }
}
