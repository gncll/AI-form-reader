import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ehcazveenuygfvkehzwj.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoY2F6dmVlbnV5Z2Z2a2VoendqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMzAwMDcsImV4cCI6MjA2OTgwNjAwN30.gl6UsgN6zYvvGUMCpg0NbM3tpG5rPmb3-C-4BcbWQXI'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('API Forms called:', req.method, req.body);

  try {
    switch (req.method) {
      case 'GET':
        // Get all forms
        const { data: forms, error: getError } = await supabase
          .from('forms')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (getError) {
          console.error('Supabase GET error:', getError);
          return res.status(500).json({ error: 'Failed to fetch forms' });
        }
        
        return res.status(200).json(forms);

      case 'POST':
        // Create new form
        const { name, goal, ai_model = 'gpt-4o-mini', ai_tone = 'professional and friendly' } = req.body;
        
        if (!name || !goal) {
          return res.status(400).json({ error: 'Name and goal are required' });
        }

        const { data: newForm, error: createError } = await supabase
          .from('forms')
          .insert([{ name, goal, ai_model, ai_tone }])
          .select()
          .single();

        if (createError) {
          console.error('Supabase CREATE error:', createError);
          return res.status(500).json({ error: 'Failed to create form' });
        }

        return res.status(201).json(newForm);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}