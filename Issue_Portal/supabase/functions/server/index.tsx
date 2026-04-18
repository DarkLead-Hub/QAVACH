import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase Storage bucket on startup
const initStorageBucket = async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const bucketName = 'make-93e10323-credentials';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true, // Allow public read access for credential verification
        fileSizeLimit: 10485760, // 10MB limit
      });

      if (error) {
        console.log(`Storage bucket creation error: ${error.message}`);
      } else {
        console.log(`Storage bucket '${bucketName}' created successfully`);
      }
    } else {
      console.log(`Storage bucket '${bucketName}' already exists`);
    }
  } catch (err) {
    console.log(`Error initializing storage bucket: ${err.message}`);
  }
};

// Initialize bucket on server start
initStorageBucket();

// Health check endpoint
app.get("/make-server-93e10323/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================================================
// AUTH ROUTES
// ============================================================================

// User signup with email/password
app.post("/make-server-93e10323/auth/signup", async (c) => {
  try {
    const { email, password, full_name, phone, address } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server isn't configured
      user_metadata: { full_name, phone, address }
    });

    if (error) {
      console.log(`Signup error during user creation: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Create profile entry
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email,
        full_name,
        phone,
        address
      });

    if (profileError) {
      console.log(`Signup error during profile creation: ${profileError.message}`);
      return c.json({ error: profileError.message }, 400);
    }

    return c.json({
      success: true,
      user: { id: data.user.id, email }
    });

  } catch (err) {
    console.log(`Signup error: ${err.message}`);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// ============================================================================
// CREDENTIAL ISSUANCE ROUTES
// ============================================================================

// Issue credential endpoint (handles all credential types)
app.post("/make-server-93e10323/credentials/issue", async (c) => {
  try {
    // Get access token from Authorization header
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized - invalid or missing access token' }, 401);
    }

    const { credential_type, credential_data } = await c.req.json();

    // Validate credential type
    const validTypes = ['PAN_CARD', 'INCOME_CERTIFICATE', 'AADHAAR_CARD'];
    if (!validTypes.includes(credential_type)) {
      return c.json({ error: 'Invalid credential type' }, 400);
    }

    // Import credential generation utilities
    const { generateCredentialPDF } = await import('./credential-generator.tsx');

    // Generate PDF with SLH-DSA signature
    const result = await generateCredentialPDF(credential_type, credential_data, user.id);

    // Upload PDF to Supabase Storage
    const fileName = `${credential_type}_${Date.now()}.pdf`;
    const storagePath = `credentials/${user.id}/${credential_type}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('make-93e10323-credentials')
      .upload(storagePath, result.pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.log(`Credential upload error for user ${user.id}: ${uploadError.message}`);
      return c.json({ error: 'Failed to upload credential document' }, 500);
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('make-93e10323-credentials')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Save credential metadata to database
    const { data: credentialData, error: dbError } = await supabase
      .from('issued_credentials')
      .insert({
        user_id: user.id,
        credential_type,
        credential_data,
        storage_path: storagePath,
        public_url: publicUrl,
        public_key: result.publicKey,
        signature: result.signature,
        status: 'active'
      })
      .select()
      .single();

    if (dbError) {
      console.log(`Database error while saving credential metadata for user ${user.id}: ${dbError.message}`);
      return c.json({ error: 'Failed to save credential metadata' }, 500);
    }

    return c.json({
      success: true,
      credential: {
        id: credentialData.id,
        type: credential_type,
        public_url: publicUrl,
        issue_date: credentialData.issue_date,
        public_key: result.publicKey,
        signature: result.signature
      }
    });

  } catch (err) {
    console.log(`Credential issuance error: ${err.message}`);
    return c.json({ error: 'Internal server error during credential issuance' }, 500);
  }
});

// Get user's issued credentials
app.get("/make-server-93e10323/credentials", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user?.id) {
      return c.json({ error: 'Unauthorized - invalid or missing access token' }, 401);
    }

    const { data, error } = await supabase
      .from('issued_credentials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.log(`Error fetching credentials for user ${user.id}: ${error.message}`);
      return c.json({ error: 'Failed to fetch credentials' }, 500);
    }

    return c.json({ credentials: data });

  } catch (err) {
    console.log(`Error in credentials fetch: ${err.message}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Public credential verification endpoint (no auth required)
app.get("/make-server-93e10323/credentials/:id/verify", async (c) => {
  try {
    const credentialId = c.req.param('id');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error } = await supabase
      .from('issued_credentials')
      .select('id, credential_type, public_url, public_key, signature, issue_date, status')
      .eq('id', credentialId)
      .single();

    if (error) {
      return c.json({ error: 'Credential not found' }, 404);
    }

    return c.json({ credential: data });

  } catch (err) {
    console.log(`Credential verification error: ${err.message}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);