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
    icon: '🏦'
  },
  {
    type: 'INCOME_CERTIFICATE',
    title: 'Income Certificate',
    description: 'Annual Income Verification Certificate',
    available: true,
    icon: '📄'
  },
  {
    type: 'AADHAAR_CARD',
    title: 'Aadhaar Card',
    description: 'Unique Identification Authority of India',
    available: true,
    icon: '🆔'
  },
  {
    type: 'DRIVING_LICENSE',
    title: 'Driving License',
    description: 'Ministry of Road Transport & Highways',
    available: false,
    icon: '🚗'
  },
  {
    type: 'PASSPORT',
    title: 'Passport',
    description: 'Ministry of External Affairs',
    available: false,
    icon: '✈️'
  },
  {
    type: 'VOTER_ID',
    title: 'Voter ID Card',
    description: 'Election Commission of India',
    available: false,
    icon: '🗳️'
  },
  {
    type: 'BIRTH_CERTIFICATE',
    title: 'Birth Certificate',
    description: 'Municipal Corporation',
    available: false,
    icon: '👶'
  },
  {
    type: 'DOMICILE_CERTIFICATE',
    title: 'Domicile Certificate',
    description: 'State Government Certificate',
    available: false,
    icon: '🏛️'
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-900 text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">DigiLocker Portal</h1>
            <p className="text-xs text-gray-400">Government of India • Digital Credentials</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-1 border border-white text-sm hover:bg-white hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <div className="border-b border-gray-300 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6 text-sm">
            <button
              onClick={() => setShowIssued(false)}
              className={`py-3 border-b-2 ${!showIssued ? 'border-gray-900 font-medium' : 'border-transparent text-gray-600'}`}
            >
              Issue Credentials
            </button>
            <button
              onClick={() => setShowIssued(true)}
              className={`py-3 border-b-2 ${showIssued ? 'border-gray-900 font-medium' : 'border-transparent text-gray-600'}`}
            >
              My Credentials
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!showIssued ? (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">Available Credentials</h2>
              <p className="text-sm text-gray-600 mt-1">Select a credential type to issue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {CREDENTIAL_CATALOG.map((cred) => (
                <button
                  key={cred.type}
                  onClick={() => cred.available && setSelectedCredential(cred.type)}
                  disabled={!cred.available}
                  className={`
                    border p-4 text-left transition-all
                    ${cred.available
                      ? 'border-gray-300 hover:border-gray-900 hover:shadow-sm cursor-pointer bg-white'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    }
                  `}
                >
                  <div className="text-2xl mb-2">{cred.icon}</div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1">{cred.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">{cred.description}</p>
                  {!cred.available && (
                    <span className="inline-block text-xs px-2 py-1 bg-gray-200 text-gray-700">
                      Coming Soon
                    </span>
                  )}
                  {cred.available && (
                    <span className="inline-block text-xs px-2 py-1 bg-green-100 text-green-800 border border-green-300">
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
      <div className="text-center py-12 border border-gray-300">
        <p className="text-gray-600">No credentials issued yet</p>
        <p className="text-sm text-gray-500 mt-2">Go to "Issue Credentials" to get started</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Issued Credentials</h2>
        <p className="text-sm text-gray-600 mt-1">Your digitally signed documents</p>
      </div>

      <div className="border border-gray-300">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-300">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Issue Date</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {credentials.map((cred, idx) => (
              <tr key={cred.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3">
                  {cred.credential_type.replace(/_/g, ' ')}
                </td>
                <td className="px-4 py-3">
                  {new Date(cred.issue_date).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 border border-green-300 text-xs">
                    {cred.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={cred.public_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 underline hover:text-gray-700 text-xs"
                  >
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-gray-300 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-300 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Issue {credentialType.replace(/_/g, ' ')}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {renderFormFields()}

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-3 py-2 text-sm">
              {error}
            </div>
          )}

          {loading && status && (
            <div className="bg-blue-50 border border-blue-300 text-blue-800 px-3 py-2 text-sm flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {status}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-900 text-white border border-gray-900 hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? (status || 'Issuing...') : 'Issue Credential'}
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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      {textarea ? (
        <textarea
          name={name}
          value={value || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
          required={required}
          rows={3}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
          required={required}
        />
      )}
    </div>
  );
}
