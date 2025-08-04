import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ehcazveenuygfvkehzwj.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoY2F6dmVlbnV5Z2Z2a2VoendqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMzAwMDcsImV4cCI6MjA2OTgwNjAwN30.gl6UsgN6zYvvGUMCpg0NbM3tpG5rPmb3-C-4BcbWQXI'
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { query, method } = req;
  const formId = parseInt(query.id);

  console.log('API Forms/[id] called:', method, formId);

  try {
    switch (method) {
      case 'GET':
        // Get specific form
        const { data: form, error: getError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single();
          
        if (getError) {
          console.error('Supabase GET form error:', getError);
          return res.status(404).json({ error: 'Form not found' });
        }
        
        return res.status(200).json(form);

      case 'PUT':
        // Update existing form
        const updateData = req.body;

        const { data: updatedForm, error: updateError } = await supabase
          .from('forms')
          .update(updateData)
          .eq('id', formId)
          .select()
          .single();

        if (updateError) {
          console.error('Supabase UPDATE error:', updateError);
          return res.status(500).json({ error: 'Failed to update form' });
        }

        return res.status(200).json(updatedForm);

      case 'DELETE':
        // Delete form
        const { error: deleteError } = await supabase
          .from('forms')
          .delete()
          .eq('id', formId);
          
        if (deleteError) {
          console.error('Supabase DELETE error:', deleteError);
          return res.status(500).json({ error: 'Failed to delete form' });
        }
        
        return res.status(200).json({ message: 'Form deleted successfully' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}