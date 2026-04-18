import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:open_filex/open_filex.dart';
import '../../providers/providers.dart';
import '../../services/supabase_credential_service.dart';

/// Main dashboard for QAVACH — shows issued credentials and uploaded documents.
class SupabaseHomeScreen extends ConsumerStatefulWidget {
  const SupabaseHomeScreen({super.key});

  @override
  ConsumerState<SupabaseHomeScreen> createState() => _SupabaseHomeScreenState();
}

class _SupabaseHomeScreenState extends ConsumerState<SupabaseHomeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<IssuedCredential> _issuedCredentials = [];
  List<UploadedDocument> _uploadedDocuments = [];
  bool _loading = true;
  String? _error;
  String? _downloadingId;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    setState(() { _loading = true; _error = null; });
    try {
      final credService = ref.read(supabaseCredentialServiceProvider);
      final issued = await credService.getIssuedCredentials();
      final uploaded = await credService.getUploadedDocuments();
      setState(() {
        _issuedCredentials = issued;
        _uploadedDocuments = uploaded;
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _downloadAndOpenPdf(IssuedCredential cred) async {
    setState(() { _downloadingId = cred.id; });
    try {
      final credService = ref.read(supabaseCredentialServiceProvider);
      final file = await credService.downloadCredentialPdf(cred.storagePath);
      await OpenFilex.open(file.path);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Download failed: $e'), backgroundColor: const Color(0xFFDC2626)),
        );
      }
    } finally {
      if (mounted) setState(() { _downloadingId = null; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = ref.read(supabaseAuthServiceProvider);
    final user = authService.getCurrentUser();
    final displayName = user?.userMetadata?['full_name'] as String? ?? user?.email ?? 'User';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)]),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.shield, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    displayName,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Text(
                    'QAVACH Credential Vault',
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8), letterSpacing: 0.3),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // Scan QR
          IconButton(
            icon: const Icon(Icons.qr_code_scanner, size: 20, color: Color(0xFF4F46E5)),
            tooltip: 'Scan QR',
            onPressed: () => context.push('/scan'),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, size: 20, color: Color(0xFF94A3B8)),
            onPressed: _fetchData,
          ),
          IconButton(
            icon: const Icon(Icons.logout, size: 20, color: Color(0xFF94A3B8)),
            onPressed: () async {
              await authService.signOut();
              if (context.mounted) context.go('/onboarding');
            },
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(46),
          child: Container(
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1)),
            ),
            child: TabBar(
              controller: _tabController,
              labelColor: const Color(0xFF4F46E5),
              unselectedLabelColor: const Color(0xFF94A3B8),
              indicatorColor: const Color(0xFF4F46E5),
              indicatorWeight: 2.5,
              labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              unselectedLabelStyle: const TextStyle(fontSize: 13),
              tabs: [
                Tab(text: 'Credentials (${_issuedCredentials.length})'),
                Tab(text: 'Uploaded (${_uploadedDocuments.length})'),
              ],
            ),
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
          : _error != null
              ? _buildError()
              : TabBarView(
                  controller: _tabController,
                  children: [_buildIssuedTab(), _buildUploadedTab()],
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/pdf-verify-upload'),
        backgroundColor: const Color(0xFF4F46E5),
        elevation: 2,
        label: const Text('Verify & Upload', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 13)),
        icon: const Icon(Icons.upload_file, color: Colors.white, size: 18),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Color(0xFFE2E8F0)),
            const SizedBox(height: 16),
            Text('Something went wrong', style: const TextStyle(color: Color(0xFF64748B), fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: _fetchData, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }

  Widget _buildIssuedTab() {
    if (_issuedCredentials.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(Icons.folder_open, size: 32, color: Color(0xFFCBD5E1)),
            ),
            const SizedBox(height: 16),
            const Text('No credentials yet', style: TextStyle(color: Color(0xFF64748B), fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            const Text(
              'Issue credentials from the QAVACH Portal',
              style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 13),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: const Color(0xFF4F46E5),
      onRefresh: _fetchData,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
        itemCount: _issuedCredentials.length,
        itemBuilder: (context, index) {
          final cred = _issuedCredentials[index];
          return _IssuedCredentialCard(
            credential: cred,
            isDownloading: _downloadingId == cred.id,
            onDownload: () => _downloadAndOpenPdf(cred),
          );
        },
      ),
    );
  }

  Widget _buildUploadedTab() {
    if (_uploadedDocuments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(Icons.cloud_upload, size: 32, color: Color(0xFFCBD5E1)),
            ),
            const SizedBox(height: 16),
            const Text('No uploads yet', style: TextStyle(color: Color(0xFF64748B), fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            const Text(
              'Tap "Verify & Upload" to add a document',
              style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 13),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: const Color(0xFF4F46E5),
      onRefresh: _fetchData,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
        itemCount: _uploadedDocuments.length,
        itemBuilder: (context, index) {
          final doc = _uploadedDocuments[index];
          return _UploadedDocumentCard(document: doc);
        },
      ),
    );
  }
}

class _IssuedCredentialCard extends StatelessWidget {
  final IssuedCredential credential;
  final bool isDownloading;
  final VoidCallback onDownload;

  const _IssuedCredentialCard({
    required this.credential,
    required this.isDownloading,
    required this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F0FF),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(_iconForType(credential.credentialType), size: 20, color: const Color(0xFF4F46E5)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      credential.displayName,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Issued: ${_formatDate(credential.issueDate)}',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  credential.status.toUpperCase(),
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF16A34A)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.verified, size: 14, color: Color(0xFF4F46E5)),
                const SizedBox(width: 6),
                const Text('SLH-DSA Signed', style: TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
                const Spacer(),
                Text(
                  'Sig: ${credential.signature.length > 12 ? credential.signature.substring(0, 12) : credential.signature}…',
                  style: const TextStyle(fontSize: 9, color: Color(0xFFCBD5E1), fontFamily: 'monospace'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: isDownloading ? null : onDownload,
              icon: isDownloading
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.download, size: 16),
              label: Text(isDownloading ? 'Downloading…' : 'Download PDF', style: const TextStyle(fontSize: 13)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF0F0FF),
                foregroundColor: const Color(0xFF4F46E5),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconForType(String type) => switch (type) {
        'PAN_CARD' => Icons.credit_card,
        'INCOME_CERTIFICATE' => Icons.receipt_long,
        'AADHAAR_CARD' => Icons.fingerprint,
        _ => Icons.description,
      };

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}

class _UploadedDocumentCard extends StatelessWidget {
  final UploadedDocument document;
  const _UploadedDocumentCard({required this.document});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: document.signatureVerified ? const Color(0xFFF0FDF4) : const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(11),
            ),
            child: Icon(
              document.signatureVerified ? Icons.verified : Icons.warning_amber,
              size: 20,
              color: document.signatureVerified ? const Color(0xFF16A34A) : const Color(0xFFF59E0B),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  document.originalFilename,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  '${document.verificationAlgorithm ?? "Unknown"} · ${_formatDate(document.uploadedAt)}',
                  style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: document.signatureVerified ? const Color(0xFFF0FDF4) : const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              document.signatureVerified ? 'VERIFIED' : 'PENDING',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: document.signatureVerified ? const Color(0xFF16A34A) : const Color(0xFFF59E0B),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day}/${date.month}/${date.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
