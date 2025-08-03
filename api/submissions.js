import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ehcazveenuygfvkehzwj.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoY2F6dmVlbnV5Z2Z2a2VoendqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMzAwMDcsImV4cCI6MjA2OTgwNjAwN30.gl6UsgN6zYvvGUMCpg0NbM3tpG5rPmb3-C-4BcbWQXI'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { form_id } = req.query;

    if (!form_id) {
      return res.status(400).json({ error: 'form_id parameter is required' });
    }

    const formId = parseInt(form_id);
    if (isNaN(formId)) {
      return res.status(400).json({ error: 'Invalid form_id parameter' });
    }

    // Get submissions for the form from Supabase
    const { data: formSubmissions, error: getError } = await supabase
      .from('submissions')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });
      
    if (getError) {
      console.error('Supabase submissions error:', getError);
      return res.status(500).json({ error: 'Failed to fetch submissions' });
    }
    
    return res.status(200).json(formSubmissions);

  } catch (error) {
    console.error('Submissions API Error:', error);
    return res.status(500).json({ error: `Error fetching submissions: ${error.message}` });
  }
}