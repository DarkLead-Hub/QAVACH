import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { issueCredential } from '../services/clientCredentialService';

interface DashboardProps {
  accessToken: string;
  userId: string;
  onLogout: () => void;
}

interface Credential {
  id: string;
  credential_type: string;
  public_url: string;
  issue_date: string;
  status: string;
}

const CREDENTIAL_CATALOG = [
  {
    type: 'PAN_CARD',
    title: 'PAN Card',
    description: 'Permanent Account Number - Income Tax Department',
    available: true,
    iconClass: 'fa-solid fa-building-columns',
    iconBg: 'bg-indigo-50 text-indigo-600'
  },
  {
    type: 'INCOME_CERTIFICATE',
    title: 'Income Certificate',
    description: 'Annual Income Verification Certificate',
    available: true,
    iconClass: 'fa-solid fa-file-invoice-dollar',
    iconBg: 'bg-emerald-50 text-emerald-600'
  },
  {
    type: 'AADHAAR_CARD',
    title: 'Aadhaar Card',
    description: 'Unique Identification Authority of India',
    available: true,
    iconClass: 'fa-solid fa-id-card',
    iconBg: 'bg-sky-50 text-sky-600'
  },
  {
    type: 'DRIVING_LICENSE',
    title: 'Driving License',
    description: 'Ministry of Road Transport & Highways',
    available: false,
    iconClass: 'fa-solid fa-car',
    iconBg: 'bg-amber-50 text-amber-600'
  },
  {
    type: 'PASSPORT',
    title: 'Passport',
    description: 'Ministry of External Affairs',
    available: false,
    iconClass: 'fa-solid fa-passport',
    iconBg: 'bg-violet-50 text-violet-600'
  },
  {
    type: 'VOTER_ID',
    title: 'Voter ID Card',
    description: 'Election Commission of India',
    available: false,
    iconClass: 'fa-solid fa-check-to-slot',
    iconBg: 'bg-rose-50 text-rose-600'
  },
  {
    type: 'BIRTH_CERTIFICATE',
    title: 'Birth Certificate',
    description: 'Municipal Corporation',
    available: false,
    iconClass: 'fa-solid fa-baby',
    iconBg: 'bg-pink-50 text-pink-600'
  },
  {
    type: 'DOMICILE_CERTIFICATE',
    title: 'Domicile Certificate',
    description: 'State Government Certificate',
    available: false,
    iconClass: 'fa-solid fa-landmark',
    iconBg: 'bg-teal-50 text-teal-600'
  }
];

export function Dashboard({ accessToken, userId, onLogout }: DashboardProps) {
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
  const [issuedCredentials, setIssuedCredentials] = useState<Credential[]>([]);
  const [showIssued, setShowIssued] = useState(false);

  useEffect(() => {
    if (showIssued) {
      fetchIssuedCredentials();
    }
  }, [showIssued]);

  /**
   * Fetch issued credentials directly from Supabase using the JS client.
   * This avoids the edge function dependency for read operations.
   */
  const fetchIssuedCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('issued_credentials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching credentials:', error.message);
        return;
      }

      setIssuedCredentials(data || []);
    } catch (err) {
      console.error('Error fetching credentials:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="min-h-screen relative">
      {/* Animated grid background */}
      <div className="grid-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="glass-header sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#4338ca] flex items-center justify-center shadow-sm shadow-[rgba(79,70,229,0.2)]">
                <i className="fa-solid fa-shield-halved text-white text-sm"></i>
              </div>
              <div>
                <h1 className="text-base font-bold text-[#1a1a2e] tracking-tight">Citizen Portal</h1>
                <p className="text-[0.7rem] text-[#6b7280]">Government of India · Digital Credentials</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-ghost px-4 py-1.5 text-sm"
            >
              <i className="fa-solid fa-right-from-bracket mr-1.5 text-xs"></i>
              Logout
            </button>
          </div>
        </header>

        {/* Navigation */}
        <div className="border-b border-[rgba(0,0,0,0.06)] bg-[rgba(255,255,255,0.35)] backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-1">
              <button
                onClick={() => setShowIssued(false)}
                className={`py-3 px-4 text-sm font-medium transition-all border-b-2 ${
                  !showIssued
                    ? 'border-[#4f46e5] text-[#4f46e5]'
                    : 'border-transparent text-[#6b7280] hover:text-[#374151]'
                }`}
              >
                <i className="fa-solid fa-plus-circle mr-1.5 text-xs"></i>
                Issue Credentials
              </button>
              <button
                onClick={() => setShowIssued(true)}
                className={`py-3 px-4 text-sm font-medium transition-all border-b-2 ${
                  showIssued
                    ? 'border-[#4f46e5] text-[#4f46e5]'
                    : 'border-transparent text-[#6b7280] hover:text-[#374151]'
                }`}
              >
                <i className="fa-solid fa-folder-open mr-1.5 text-xs"></i>
                My Credentials
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {!showIssued ? (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[#1a1a2e] tracking-tight">Available Credentials</h2>
                <p className="text-sm text-[#6b7280] mt-0.5">Select a credential type to issue a digitally signed document</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {CREDENTIAL_CATALOG.map((cred) => (
                  <button
                    key={cred.type}
                    onClick={() => cred.available && setSelectedCredential(cred.type)}
                    disabled={!cred.available}
                    className={`credential-card glass-subtle p-4 text-left group ${
                      cred.available
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className={`cred-icon ${cred.iconBg} mb-3`}>
                      <i className={cred.iconClass}></i>
                    </div>
                    <h3 className="font-semibold text-[#1a1a2e] text-sm mb-0.5">{cred.title}</h3>
                    <p className="text-xs text-[#6b7280] mb-3 leading-relaxed">{cred.description}</p>
                    {!cred.available && (
                      <span className="badge-coming">
                        <i className="fa-solid fa-clock text-[0.6rem]"></i>
                        Coming Soon
                      </span>
                    )}
                    {cred.available && (
                      <span className="badge-available">
                        <i className="fa-solid fa-circle-check text-[0.6rem]"></i>
                        Available
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <IssuedCredentialsList credentials={issuedCredentials} />
          )}
        </main>
      </div>

      {/* Credential Form Modal */}
      {selectedCredential && (
        <CredentialFormModal
          credentialType={selectedCredential}
          accessToken={accessToken}
          onClose={() => setSelectedCredential(null)}
          onSuccess={() => {
            setSelectedCredential(null);
            setShowIssued(true);
          }}
        />
      )}
    </div>
  );
}

function IssuedCredentialsList({ credentials }: { credentials: Credential[] }) {
  if (credentials.length === 0) {
    return (
      <div className="glass text-center py-14 px-6">
        <i className="fa-solid fa-folder-open text-3xl text-[#d1d5db] mb-3"></i>
        <p className="text-[#374151] font-medium">No credentials issued yet</p>
        <p className="text-sm text-[#6b7280] mt-1">Go to "Issue Credentials" to get started</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[#1a1a2e] tracking-tight">Issued Credentials</h2>
        <p className="text-sm text-[#6b7280] mt-0.5">Your digitally signed documents</p>
      </div>

      <div className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.06)]">
              <th className="text-left px-5 py-3 font-medium text-[#6b7280] text-xs uppercase tracking-wider">Type</th>
              <th className="text-left px-5 py-3 font-medium text-[#6b7280] text-xs uppercase tracking-wider">Issue Date</th>
              <th className="text-left px-5 py-3 font-medium text-[#6b7280] text-xs uppercase tracking-wider">Status</th>
              <th className="text-left px-5 py-3 font-medium text-[#6b7280] text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {credentials.map((cred, idx) => (
              <tr
                key={cred.id}
                className={`border-b border-[rgba(0,0,0,0.04)] transition-colors hover:bg-[rgba(79,70,229,0.02)] ${
                  idx % 2 === 0 ? '' : 'bg-[rgba(0,0,0,0.01)]'
                }`}
              >
                <td className="px-5 py-3 text-[#1a1a2e] font-medium">
                  {cred.credential_type.replace(/_/g, ' ')}
                </td>
                <td className="px-5 py-3 text-[#4b5563]">
                  {new Date(cred.issue_date).toLocaleDateString('en-IN')}
                </td>
                <td className="px-5 py-3">
                  <span className="badge-status">
                    <i className="fa-solid fa-circle-check text-[0.6rem]"></i>
                    {cred.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <a
                    href={cred.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4f46e5] hover:text-[#4338ca] text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-download text-[0.65rem]"></i>
                    Download PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Credential issuance runs entirely client-side:
 * - SLH-DSA signing via @noble/post-quantum (in browser)
 * - PDF generation (in browser)
 * - Upload to Supabase Storage + metadata insert via JS client
 */
function CredentialFormModal({
  credentialType,
  accessToken,
  onClose,
  onSuccess
}: {
  credentialType: string;
  accessToken: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      setStatus('Generating SLH-DSA keypair...');
      // Small delay to let the UI update before heavy crypto
      await new Promise(r => setTimeout(r, 50));

      setStatus('Signing credential with SPHINCS+...');
      await new Promise(r => setTimeout(r, 50));

      // Issue credential (keygen + sign + PDF + upload + DB insert)
      const result = await issueCredential(credentialType, formData, user.id);

      setStatus('Done! Credential issued.');
      console.log('Credential issued:', result);
      onSuccess();
    } catch (err: any) {
      console.error('Credential issuance error:', err);
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (credentialType) {
      case 'PAN_CARD':
        return (
          <>
            <FormField label="Full Name" name="full_name" value={formData.full_name} onChange={setFormData} formData={formData} required />
            <FormField label="Father's Name" name="father_name" value={formData.father_name} onChange={setFormData} formData={formData} required />
            <FormField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={setFormData} formData={formData} required />
            <FormField label="PAN Number" name="pan_number" value={formData.pan_number} onChange={setFormData} formData={formData} placeholder="XXXXX0000X" required />
          </>
        );
      case 'INCOME_CERTIFICATE':
        return (
          <>
            <FormField label="Full Name" name="full_name" value={formData.full_name} onChange={setFormData} formData={formData} required />
            <FormField label="Parent/Guardian Name" name="parent_name" value={formData.parent_name} onChange={setFormData} formData={formData} required />
            <FormField label="Address" name="address" value={formData.address} onChange={setFormData} formData={formData} textarea required />
            <FormField label="Annual Income (₹)" name="annual_income" type="number" value={formData.annual_income} onChange={setFormData} formData={formData} required />
            <FormField label="Category" name="category" value={formData.category} onChange={setFormData} formData={formData} placeholder="General/OBC/SC/ST" required />
            <FormField label="Purpose" name="purpose" value={formData.purpose} onChange={setFormData} formData={formData} placeholder="Educational/Employment" required />
            <FormField label="Place" name="place" value={formData.place} onChange={setFormData} formData={formData} required />
          </>
        );
      case 'AADHAAR_CARD':
        return (
          <>
            <FormField label="Full Name" name="full_name" value={formData.full_name} onChange={setFormData} formData={formData} required />
            <FormField label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={setFormData} formData={formData} required />
            <FormField label="Gender" name="gender" value={formData.gender} onChange={setFormData} formData={formData} placeholder="Male/Female/Other" required />
            <FormField label="Aadhaar Number" name="aadhaar_number" value={formData.aadhaar_number} onChange={setFormData} formData={formData} placeholder="XXXX XXXX XXXX" required />
            <FormField label="Address" name="address" value={formData.address} onChange={setFormData} formData={formData} textarea required />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.2)] backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="glass max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-10">
        <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#1a1a2e] tracking-tight">
            <i className="fa-solid fa-file-signature mr-2 text-[#4f46e5] text-sm"></i>
            Issue {credentialType.replace(/_/g, ' ')}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.08)] flex items-center justify-center text-[#6b7280] hover:text-[#1a1a2e] transition-all"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {renderFormFields()}

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 text-sm flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation text-xs"></i>
              {error}
            </div>
          )}

          {loading && status && (
            <div className="rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 px-3.5 py-2.5 text-sm flex items-center gap-2">
              <i className="fa-solid fa-spinner fa-spin text-xs"></i>
              {status}
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 py-2.5 px-4 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-2.5 px-4 text-sm font-semibold"
            >
              {loading ? (status || 'Issuing...') : (
                <>
                  <i className="fa-solid fa-pen-nib mr-1.5 text-xs"></i>
                  Issue Credential
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  formData,
  required = false,
  placeholder = '',
  textarea = false
}: any) {
  const handleChange = (e: any) => {
    onChange({
      ...formData,
      [name]: e.target.value
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[#374151] mb-1.5">
        {label} {required && <span className="text-[#4f46e5]">*</span>}
      </label>
      {textarea ? (
        <textarea
          name={name}
          value={value || ''}
          onChange={handleChange}
          className="glass-input w-full px-3.5 py-2.5 resize-none"
          required={required}
          rows={3}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          className="glass-input w-full px-3.5 py-2.5"
          required={required}
        />
      )}
    </div>
  );
}
