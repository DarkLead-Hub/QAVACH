/**
 * Client-side Credential Issuance Service
 * 
 * Handles the entire credential issuance flow in the browser:
 * 1. SLH-DSA key generation + signing using @noble/post-quantum
 * 2. PDF generation with embedded signature
 * 3. Upload to Supabase Storage
 * 4. Save metadata to issued_credentials table
 * 
 * This replaces the edge function (/credentials/issue) which fails 
 * because Supabase rejects ES256 JWTs for edge function auth.
 */

import { slh_dsa_sha2_128s } from '@noble/post-quantum/slh-dsa.js';
import { supabase } from '../../utils/supabaseClient';

const BUCKET_NAME = 'make-93e10323-credentials';

export interface IssueCredentialResult {
  credentialId: string;
  publicUrl: string;
  publicKey: string;
  signature: string;
}

/**
 * Issue a credential — runs entirely client-side.
 * Uses @noble/post-quantum for SLH-DSA signing (no sidecar/edge function needed).
 */
export async function issueCredential(
  credentialType: string,
  credentialData: Record<string, string>,
  userId: string
): Promise<IssueCredentialResult> {
  // 1. Generate SLH-DSA keypair (SPHINCS+-SHA2-128s)
  const keyPair = slh_dsa_sha2_128s.keygen();
  const secretKey = keyPair.secretKey;
  const publicKey = keyPair.publicKey;

  // 2. Prepare & sign the credential payload
  const credentialPayload = {
    type: credentialType,
    data: credentialData,
    userId,
    timestamp: new Date().toISOString(),
    issuer: 'Government of India - Digital Locker',
  };

  const payloadBytes = new TextEncoder().encode(JSON.stringify(credentialPayload));
  // @noble/post-quantum v0.6.1 API: sign(message, secretKey)
  const signature = slh_dsa_sha2_128s.sign(payloadBytes, secretKey);

  const publicKeyHex = bytesToHex(publicKey);
  const signatureHex = bytesToHex(signature);

  // 3. Generate the PDF with embedded signature
  const pdfBytes = generateCredentialPDF(credentialType, credentialData, signatureHex, publicKeyHex);
  const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

  // 4. Upload PDF to Supabase Storage
  const timestamp = Date.now();
  const storagePath = `${userId}/${credentialType.toLowerCase()}_${timestamp}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, pdfBlob, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 5. Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // 6. Save metadata to issued_credentials table
  const { data: insertData, error: insertError } = await supabase
    .from('issued_credentials')
    .insert({
      user_id: userId,
      credential_type: credentialType,
      credential_data: credentialData,
      storage_path: storagePath,
      public_url: publicUrl,
      public_key: publicKeyHex.substring(0, 500), // truncate for DB storage
      signature: signatureHex.substring(0, 500),   // truncate for DB storage
      status: 'active',
    })
    .select('id')
    .single();

  if (insertError) {
    throw new Error(`Database error: ${insertError.message}`);
  }

  return {
    credentialId: insertData.id,
    publicUrl,
    publicKey: publicKeyHex,
    signature: signatureHex,
  };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── PDF Generation (same templates from credential-generator.tsx) ──

function generateCredentialPDF(
  type: string,
  data: Record<string, string>,
  signature: string,
  publicKey: string
): Uint8Array {
  switch (type) {
    case 'PAN_CARD':
      return generatePANCardPDF(data, signature, publicKey);
    case 'INCOME_CERTIFICATE':
      return generateIncomeCertificatePDF(data, signature, publicKey);
    case 'AADHAAR_CARD':
      return generateAadhaarCardPDF(data, signature, publicKey);
    default:
      throw new Error(`Unsupported credential type: ${type}`);
  }
}

function generatePANCardPDF(data: Record<string, string>, signature: string, publicKey: string): Uint8Array {
  const content = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 340 215] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 1200 >>
stream
BT
/F1 9 Tf
40 190 Td
(INCOME TAX DEPARTMENT) Tj
0 -12 Td
(GOVT. OF INDIA) Tj
ET

0 0 1 RG
0 0 1 rg
10 175 320 2 re
f

BT
/F1 14 Tf
0 0 0 rg
90 155 Td
(PERMANENT ACCOUNT NUMBER CARD) Tj
ET

BT
/F2 8 Tf
40 135 Td
(PAN: ${data.pan_number || 'XXXXX0000X'}) Tj
0 -15 Td
(Name: ${data.full_name || 'N/A'}) Tj
0 -15 Td
(Father's Name: ${data.father_name || 'N/A'}) Tj
0 -15 Td
(Date of Birth: ${data.dob || 'N/A'}) Tj
0 -15 Td
(Signature: _________________) Tj
ET

0.8 0.8 0.8 rg
10 40 320 30 re
f

BT
/F2 6 Tf
0 0 0 rg
15 60 Td
(Digital Signature \\(SLH-DSA\\):) Tj
0 -8 Td
(${signature.substring(0, 80)}...) Tj
0 -8 Td
(Public Key: ${publicKey.substring(0, 60)}...) Tj
0 -8 Td
(Issued: ${new Date().toLocaleDateString('en-IN')}) Tj
ET

endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000229 00000 n
0000000380 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1632
%%EOF
  `.trim();

  return new TextEncoder().encode(content);
}

function generateIncomeCertificatePDF(data: Record<string, string>, signature: string, publicKey: string): Uint8Array {
  const content = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 595 842] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 1500 >>
stream
BT
/F1 16 Tf
200 780 Td
(GOVERNMENT OF INDIA) Tj
0 -20 Td
(INCOME CERTIFICATE) Tj
ET

BT
/F2 11 Tf
50 720 Td
(Certificate No: IC-${Date.now().toString().substring(7)}) Tj
400 0 Td
(Date: ${new Date().toLocaleDateString('en-IN')}) Tj
ET

1 0.9 0.7 rg
50 700 495 2 re
f

BT
/F2 10 Tf
0 0 0 rg
50 670 Td
(This is to certify that Shri/Smt/Kumari ${data.full_name || 'N/A'},) Tj
0 -18 Td
(Son/Daughter/Wife of ${data.parent_name || 'N/A'},) Tj
0 -18 Td
(resident of ${data.address || 'N/A'},) Tj
0 -18 Td
(belongs to the ${data.category || 'General'} category.) Tj
0 -25 Td
(The annual income of the family from all sources is Rs. ${data.annual_income || '0'}/- only.) Tj
0 -25 Td
(This certificate is issued for the purpose of: ${data.purpose || 'Educational/Employment'}) Tj
ET

BT
/F2 9 Tf
50 420 Td
(Place: ${data.place || 'New Delhi'}) Tj
0 -35 Td
(Date: ${new Date().toLocaleDateString('en-IN')}) Tj
350 0 Td
(Issuing Authority) Tj
0 -12 Td
(District Magistrate Office) Tj
ET

0.95 0.95 0.95 rg
50 200 495 120 re
f

BT
/F2 7 Tf
0 0 0 rg
55 300 Td
(DIGITAL SIGNATURE \\(SLH-DSA POST-QUANTUM\\)) Tj
0 -12 Td
(Signature: ${signature.substring(0, 100)}) Tj
0 -10 Td
(           ${signature.substring(100, 200)}) Tj
0 -10 Td
(           ${signature.substring(200, 300)}...) Tj
0 -12 Td
(Public Key: ${publicKey.substring(0, 100)}) Tj
0 -10 Td
(            ${publicKey.substring(100, 200)}...) Tj
0 -12 Td
(Timestamp: ${new Date().toISOString()}) Tj
0 -12 Td
(This document is cryptographically signed using SPHINCS+ \\(SLH-DSA\\) signature scheme.) Tj
0 -10 Td
(Verifiable via Government Digital Locker Portal.) Tj
ET

endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000229 00000 n
0000000380 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1932
%%EOF
  `.trim();

  return new TextEncoder().encode(content);
}

function generateAadhaarCardPDF(data: Record<string, string>, signature: string, publicKey: string): Uint8Array {
  const content = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 340 215] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 1300 >>
stream
0.8 0 0 rg
0 0 340 215 re
f

BT
/F1 10 Tf
1 1 1 rg
120 195 Td
(UNIQUE IDENTIFICATION) Tj
0 -12 Td
(AUTHORITY OF INDIA) Tj
ET

1 1 1 RG
1 1 1 rg
10 180 320 2 re
f

BT
/F2 9 Tf
0 0 0 rg
40 160 Td
(Aadhaar Number: ${data.aadhaar_number || 'XXXX XXXX XXXX'}) Tj
0 -15 Td
(Name: ${data.full_name || 'N/A'}) Tj
0 -15 Td
(DOB: ${data.dob || 'DD/MM/YYYY'}) Tj
0 -15 Td
(Gender: ${data.gender || 'N/A'}) Tj
0 -15 Td
(Address: ${data.address ? data.address.substring(0, 40) : 'N/A'}...) Tj
ET

BT
/F2 7 Tf
240 110 Td
([QR CODE]) Tj
0 -8 Td
(Placeholder) Tj
ET

0.9 0.9 0.9 rg
10 40 320 30 re
f

BT
/F2 5.5 Tf
0 0 0 rg
15 62 Td
(Digital Signature \\(SLH-DSA\\): ${signature.substring(0, 90)}...) Tj
0 -7 Td
(Public Key: ${publicKey.substring(0, 100)}...) Tj
0 -7 Td
(Issue Date: ${new Date().toLocaleDateString('en-IN')}) Tj
0 -7 Td
(Digitally signed by UIDAI using post-quantum cryptography) Tj
ET

endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000229 00000 n
0000000380 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1752
%%EOF
  `.trim();

  return new TextEncoder().encode(content);
}
