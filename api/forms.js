// Simple in-memory storage for demo (replace with real DB later)
let forms = [
  {
    id: 1,
    name: "Substack",
    goal: "Act like a Gencay I and ask 5 different questions to make sure your substack users is satisfied or collect feedbacks.",
    ai_model: "gpt-4o-mini",
    ai_tone: "professional and friendly",
    created_at: "2025-08-02 14:41:20"
  },
  {
    id: 2,
    name: "Medium",
    goal: "Act like a Gencay I., warmly welcome the user and ask questions to see whether reader like or not or what kind of content the user wants.",
    ai_model: "gpt-4o-mini", 
    ai_tone: "professional and friendly",
    created_at: "2025-08-02 15:12:24"
  }
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { query, method } = req;
  const formId = parseInt(query.formId);

  try {
    switch (method) {
      case 'GET':
        if (formId) {
          // Get specific form
          const form = forms.find(f => f.id === formId);
          if (form) {
            return res.status(200).json(form);
          } else {
            return res.status(404).json({ error: 'Form not found' });
          }
        } else {
          // Get all forms
          return res.status(200).json(forms);
        }

      case 'POST':
        // Create new form
        const { name, goal, ai_model = 'gpt-4o-mini', ai_tone = 'professional and friendly' } = req.body;
        
        if (!name || !goal) {
          return res.status(400).json({ error: 'Name and goal are required' });
        }

        const newForm = {
          id: forms.length + 1,
          name,
          goal,
          ai_model,
          ai_tone,
          created_at: new Date().toISOString()
        };

        forms.push(newForm);
        return res.status(201).json(newForm);

      case 'DELETE':
        if (formId) {
          const index = forms.findIndex(f => f.id === formId);
          if (index !== -1) {
            forms.splice(index, 1);
            return res.status(200).json({ message: 'Form deleted successfully' });
          } else {
            return res.status(404).json({ error: 'Form not found' });
          }
        } else {
          return res.status(400).json({ error: 'Form ID is required' });
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}