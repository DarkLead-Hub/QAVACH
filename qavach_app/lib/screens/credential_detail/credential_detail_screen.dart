import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/credential.dart';

class CredentialDetailScreen extends StatelessWidget {
  final SignedCredential credential;

  const CredentialDetailScreen({super.key, required this.credential});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text(credential.displayName),
        backgroundColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Card
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: credential.quantumSafe
                        ? [const Color(0xFF6366F1), const Color(0xFF4338CA)]
                        : [const Color(0xFFF43F5E), const Color(0xFFBE123C)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: (credential.quantumSafe ? Colors.indigo : Colors.red).withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Icon(
                      credential.quantumSafe ? Icons.verified : Icons.warning_amber,
                      color: Colors.white,
                      size: 48,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      credential.displayName,
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      credential.issuerDeptId,
                      style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        credential.quantumSafe ? 'PQC SECURE' : 'CLASSICAL RISK',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Data Attributes
              const Text('ATTRIBUTES', style: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const SizedBox(height: 16),
              ...credential.attributes.entries.map((e) => _AttributeRow(
                    label: e.key.replaceAll('_', ' ').toUpperCase(),
                    value: e.value.toString(),
                  )),

              const SizedBox(height: 32),
              const Text('CRYPTOGRAPHIC PROVENANCE', style: TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1)),
              const SizedBox(height: 16),
              _AttributeRow(label: 'ALGORITHM', value: credential.algorithm),
              _AttributeRow(label: 'ISSUED AT', value: credential.issuedAt.substring(0, 10)),
              _AttributeRow(label: 'EXPIRES AT', value: credential.expiresAt.substring(0, 10)),
              _AttributeRow(label: 'SIGNATURE ID', value: credential.sigId.substring(0, 8) + '...'),

              const SizedBox(height: 48),
              if (!credential.quantumSafe)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber, color: Colors.amber, size: 24),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Classical Cryptography Warning', style: TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 13)),
                            const SizedBox(height: 4),
                            Text(
                              'This document uses ${credential.algorithm}, which is not resistant to quantum attacks. Consider requesting a re-issue with ML-DSA-44.',
                              style: TextStyle(color: Colors.amber.withOpacity(0.8), fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AttributeRow extends StatelessWidget {
  final String label;
  final String value;
  const _AttributeRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFF1E293B).withOpacity(0.5))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 14)),
        ],
      ),
    );
  }
}
