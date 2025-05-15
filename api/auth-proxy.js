// Simple authentication proxy to avoid CORS issues
// Place this file in Vercel serverless functions directory (usually /api)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Fetch the Supabase Auth API directly from server side
    const response = await fetch(
      `https://${process.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password, gotrue_meta_security: {} }),
      }
    );

    const data = await response.json();

    // Return the same response
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Auth proxy error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
} 