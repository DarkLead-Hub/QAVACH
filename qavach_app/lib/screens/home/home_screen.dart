import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/providers.dart';
import '../../models/credential.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final citizenAsync = ref.watch(currentCitizenProvider);
    final credentialsAsync = ref.watch(credentialsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0.5,
        title: citizenAsync.when(
          data: (citizen) => Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                citizen?.name ?? 'Citizen',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
              ),
              const Text(
                'QAVACH Credential Wallet',
                style: TextStyle(fontSize: 11, color: Color(0xFF64748B), letterSpacing: 0.5),
              ),
            ],
          ),
          loading: () => const Text('Loading...'),
          error: (_, __) => const Text('Error'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20, color: Color(0xFF64748B)),
            onPressed: () => ref.invalidate(credentialsProvider),
          ),
          IconButton(
            icon: const Icon(Icons.logout, size: 20, color: Color(0xFF64748B)),
            onPressed: () async {
              await ref.read(authServiceProvider).logout();
              if (context.mounted) context.go('/onboarding');
            },
          ),
        ],
      ),
      body: credentialsAsync.when(
        data: (creds) {
          if (creds.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.folder_open, size: 48, color: Color(0xFFCBD5E1)),
                  const SizedBox(height: 16),
                  const Text('No credentials found', style: TextStyle(color: Color(0xFF94A3B8))),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => ref.invalidate(credentialsProvider),
                    child: const Text('Tap to reload'),
                  ),
                ],
              ),
            );
          }

          final pqcCreds = creds.where((c) => c.quantumSafe).toList();
          final classicCreds = creds.where((c) => !c.quantumSafe).toList();

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(credentialsProvider),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Summary bar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      _StatChip(label: 'Total', value: '${creds.length}', color: const Color(0xFF3B82F6)),
                      const SizedBox(width: 12),
                      _StatChip(label: 'PQC', value: '${pqcCreds.length}', color: const Color(0xFF22C55E)),
                      const SizedBox(width: 12),
                      _StatChip(label: 'Classical', value: '${classicCreds.length}', color: const Color(0xFFEF4444)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                if (pqcCreds.isNotEmpty) ...[
                  const _SectionHeader(title: 'Quantum-Safe Credentials'),
                  const SizedBox(height: 8),
                  ...pqcCreds.map((c) => _CredentialTile(credential: c)),
                  const SizedBox(height: 16),
                ],

                if (classicCreds.isNotEmpty) ...[
                  const _SectionHeader(title: 'Classical Credentials'),
                  const SizedBox(height: 8),
                  ...classicCreds.map((c) => _CredentialTile(credential: c)),
                ],
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Error: $e', style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => ref.invalidate(credentialsProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/scan'),
        backgroundColor: const Color(0xFF4338CA),
        label: const Text('Scan QR', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
        icon: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 20),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title.toUpperCase(),
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: Color(0xFF94A3B8),
        letterSpacing: 1,
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatChip({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text('$value $label', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
      ],
    );
  }
}

class _CredentialTile extends StatelessWidget {
  final SignedCredential credential;
  const _CredentialTile({required this.credential});

  @override
  Widget build(BuildContext context) {
    final isPqc = credential.quantumSafe;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: isPqc ? const Color(0xFFBBF7D0) : const Color(0xFFFECACA)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isPqc ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            _iconForType(credential.credentialType),
            size: 20,
            color: isPqc ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
          ),
        ),
        title: Text(
          credential.displayName,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
        ),
        subtitle: Text(
          '${credential.issuerDeptId} · ${credential.algorithm}',
          style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: isPqc ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            isPqc ? 'PQC' : 'RSA',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: isPqc ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
            ),
          ),
        ),
        onTap: () => context.push('/home/credential', extra: credential),
      ),
    );
  }

  IconData _iconForType(String type) {
    return switch (type) {
      'income_certificate' => Icons.receipt_long,
      'aadhaar_attestation' => Icons.fingerprint,
      'land_ownership' => Icons.landscape,
      'health_record' => Icons.medical_services,
      _ => Icons.description,
    };
  }
}
