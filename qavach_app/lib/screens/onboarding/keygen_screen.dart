import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/providers.dart';

class KeygenScreen extends ConsumerStatefulWidget {
  final String aadhaar;
  const KeygenScreen({super.key, required this.aadhaar});

  @override
  ConsumerState<KeygenScreen> createState() => _KeygenScreenState();
}

class _KeygenScreenState extends ConsumerState<KeygenScreen> {
  String _status = 'Initializing quantum-safe enclave...';
  double _progress = 0.1;
  bool _isComplete = false;

  @override
  void initState() {
    super.initState();
    _startKeygen();
  }

  Future<void> _startKeygen() async {
    try {
      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        _status = 'Generating ML-DSA-44 keypair...';
        _progress = 0.4;
      });

      final citizen = await ref.read(authServiceProvider).onboard(widget.aadhaar);
      
      if (citizen == null) {
        throw Exception('Citizen not found');
      }

      setState(() {
        _status = 'Downloading and encrypting credentials (ML-KEM-768)...';
        _progress = 0.8;
      });
      
      await Future.delayed(const Duration(seconds: 2));

      setState(() {
        _status = 'Wallet setup complete.';
        _progress = 1.0;
        _isComplete = true;
      });

      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        ref.invalidate(currentCitizenProvider);
        ref.invalidate(credentialsProvider);
        context.go('/home');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Setup failed: $e')),
        );
        context.pop();
      }
    }
  }

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
              const Icon(Icons.auto_awesome, size: 80, color: Color(0xFF6366F1)),
              const SizedBox(height: 48),
              const Text(
                'Securing Your Identity',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              const Text(
                'We are generating your unique post-quantum cryptographic keys. Your private key will be stored securely on this device and will never be shared.',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 64),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: _progress,
                  minHeight: 8,
                  backgroundColor: Color(0xFF1E293B),
                  color: const Color(0xFF6366F1),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                _status,
                style: const TextStyle(
                  color: Color(0xFF6366F1), 
                  fontSize: 14, 
                  fontWeight: FontWeight.w500,
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 64),
              const Text(
                'ALGORITHM: ML-DSA-44\nSECURITY: NIST FIPS 204 (Lattice-based)',
                style: TextStyle(
                  color: Color(0xFF64748B), 
                  fontSize: 10, 
                  fontFamily: 'monospace',
                  letterSpacing: 1.2,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
