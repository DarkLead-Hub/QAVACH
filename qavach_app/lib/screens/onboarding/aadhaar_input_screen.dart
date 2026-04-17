import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class AadhaarInputScreen extends ConsumerStatefulWidget {
  const AadhaarInputScreen({super.key});

  @override
  ConsumerState<AadhaarInputScreen> createState() => _AadhaarInputScreenState();
}

class _AadhaarInputScreenState extends ConsumerState<AadhaarInputScreen> {
  final _aadhaarController = TextEditingController();

  void _handleContinue() {
    final aadhaar = _aadhaarController.text.trim();
    if (aadhaar.length != 12) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 12-digit Aadhaar number')),
      );
      return;
    }
    
    // In a real app, this would trigger an OTP send.
    // For demo, we just pass the Aadhaar to the OTP screen.
    context.push('/onboarding/otp', extra: aadhaar);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Onboarding')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.badge_outlined, size: 64, color: Color(0xFF6366F1)),
              const SizedBox(height: 24),
              const Text(
                'Enter Aadhaar Number',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'We will send a 6-digit OTP to your registered mobile number',
                style: TextStyle(color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              TextField(
                controller: _aadhaarController,
                keyboardType: TextInputType.number,
                maxLength: 12,
                autofocus: true,
                style: const TextStyle(fontSize: 20, letterSpacing: 4),
                decoration: const InputDecoration(
                  labelText: 'Aadhaar Number',
                  hintText: '0000 0000 0000',
                  prefixIcon: Icon(Icons.person_outline),
                  border: OutlineInputBorder(),
                  counterText: '',
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _handleContinue,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Get OTP'),
              ),
              const Spacer(),
              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.lock_outline, size: 12, color: Colors.grey),
                  SizedBox(width: 4),
                  Text(
                    'Your Aadhaar number is only used for one-time verification.',
                    style: TextStyle(fontSize: 10, color: Colors.grey),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
