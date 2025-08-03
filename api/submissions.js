// Simple in-memory storage
let submissions = [];

export default function handler(req, res) {
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

    // Get submissions for the form
    const formSubmissions = submissions.filter(sub => sub.form_id === formId);
    return res.status(200).json(formSubmissions);

  } catch (error) {
    console.error('Submissions API Error:', error);
    return res.status(500).json({ error: `Error fetching submissions: ${error.message}` });
  }
}