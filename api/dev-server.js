const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8001;

app.use(cors());
app.use(express.json());

// Simple forms data
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

// API Routes
app.get('/api/forms', (req, res) => {
  res.json(forms);
});

app.get('/api/forms/:id', (req, res) => {
  const formId = parseInt(req.params.id);
  const form = forms.find(f => f.id === formId);
  if (form) {
    res.json(form);
  } else {
    res.status(404).json({ error: 'Form not found' });
  }
});

app.post('/api/forms', (req, res) => {
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
  res.status(201).json(newForm);
});

app.post('/api/generate_question', async (req, res) => {
  const { history, form_id } = req.body;
  
  try {
    // Get form details
    const form = forms.find(f => f.id === form_id);
    if (!form) {
      return res.status(404).json({ detail: 'Form not found' });
    }

    // Generate next question using OpenAI
    const nextQuestion = await generateQuestionWithOpenAI(form, history);
    
    res.json({ next_question: nextQuestion });
  } catch (error) {
    console.error('Generate Question Error:', error);
    res.status(500).json({ detail: `Error generating question: ${error.message}` });
  }
});

async function generateQuestionWithOpenAI(form, history) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  // Build conversation context
  const messages = [
    {
      role: "system",
      content: `You are a helpful assistant conducting a form interview. 

Form Goal: ${form.goal}
Tone: ${form.ai_tone}

Rules:
1. Ask ONE question at a time
2. Keep questions conversational and engaging
3. After 3-5 meaningful questions, conclude with "Thank you for your time! Your responses have been recorded."
4. Don't repeat questions
5. Build upon previous answers`
    }
  ];

  // Add conversation history
  messages.push(...history);

  // Add a prompt for the next question
  messages.push({
    role: "user",
    content: "What's the next question? (If we have enough information, please conclude the interview)"
  });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: form.ai_model,
        messages,
        max_tokens: 150,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const result = await response.json();
      return result.choices[0].message.content.trim();
    } else {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("OpenAI API timeout");
    }
    throw new Error(`OpenAI API request failed: ${error.message}`);
  }
}

app.get('/api/submissions', (req, res) => {
  res.json([]);
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📋 Forms API: http://localhost:${PORT}/api/forms`);
  console.log(`🤖 Generate Question: http://localhost:${PORT}/api/generate_question`);
  console.log(`📊 Submissions: http://localhost:${PORT}/api/submissions`);
});