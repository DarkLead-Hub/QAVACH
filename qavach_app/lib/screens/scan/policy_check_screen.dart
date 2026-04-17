import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/providers.dart';

class PolicyCheckScreen extends ConsumerStatefulWidget {
  final String qrJson;
  final String claimType;

  const PolicyCheckScreen({super.key, required this.qrJson, required this.claimType});

  @override
  ConsumerState<PolicyCheckScreen> createState() => _PolicyCheckScreenState();
}

class _PolicyCheckScreenState extends ConsumerState<PolicyCheckScreen> {
  bool _isProcessing = false;
  String? _error;
  bool _isSuccess = false;
  
  final List<String> _steps = [
    'Loading credential',
    'Checking issuer trust',
    'Algorithm security',
    'Policy evaluation (OPA)',
    'Credential expiry',
  ];
  
  int _currentStep = -1;

  @override
  void initState() {
    super.initState();
    _startVerification();
  }

  Future<void> _startVerification() async {
    setState(() {
      _isProcessing = true;
      _error = null;
    });

    try {
      // Simulate step-by-step progress for demo impact
      for (int i = 0; i < _steps.length; i++) {
        setState(() => _currentStep = i);
        await Future.delayed(const Duration(milliseconds: 800));
      }

      await ref.read(govSignServiceProvider).processQrPayload(widget.qrJson);
      
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _isSuccess = true;
        });
        
        // Navigation to result screen
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) {
          context.go('/scan/result', extra: {
            'success': true,
            'claimType': widget.claimType,
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _error = e.toString().replaceAll('Exception: ', '');
        });
        
        // Navigation to result screen even on failure
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) {
          context.go('/scan/result', extra: {
            'success': false,
            'claimType': widget.claimType,
            'error': _error,
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('Verifying Eligibility'),
        backgroundColor: Colors.transparent,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              Text(
                'Verification requested for:',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                widget.claimType.replaceAll('_', ' ').toUpperCase(),
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              ...List.generate(_steps.length, (index) {
                final isCompleted = index < _currentStep;
                final isCurrent = index == _currentStep;
                
                return Padding(
                  padding: const EdgeInsets.only(bottom: 24.0),
                  child: Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isCompleted ? Colors.green : (isCurrent ? const Color(0xFF6366F1) : Color(0xFF1E293B)),
                        ),
                        child: Center(
                          child: isCompleted 
                            ? const Icon(Icons.check, size: 16, color: Colors.white)
                            : (isCurrent ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : null),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        _steps[index],
                        style: TextStyle(
                          color: isCompleted || isCurrent ? Colors.white : Color(0xFF64748B),
                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                      const Spacer(),
                      if (isCompleted) 
                        const Icon(Icons.verified, size: 16, color: Color(0xFF6366F1)),
                    ],
                  ),
                );
              }),
              const Spacer(),
              const Divider(color: Color(0xFF1E293B)),
              const SizedBox(height: 16),
              const Text(
                'Generating proof signature (ML-DSA-44)...',
                style: TextStyle(color: Color(0xFF6366F1), fontStyle: FontStyle.italic, fontSize: 12),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Your original document stays on your device. Only the verified claim is shared.',
                style: TextStyle(color: Color(0xFF64748B), fontSize: 10),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
