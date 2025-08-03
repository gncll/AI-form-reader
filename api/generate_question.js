// Simple in-memory storage
let forms = [
  {
    id: 1,
    name: "Substack",
    goal: "Act like a Gencay I and ask 5 different questions to make sure your substack users is satisfied or collect feedbacks.",
    ai_model: "gpt-4o-mini",
    ai_tone: "professional and friendly"
  },
  {
    id: 2,
    name: "Medium", 
    goal: "Act like a Gencay I., warmly welcome the user and ask questions to see whether reader like or not or what kind of content the user wants.",
    ai_model: "gpt-4o-mini",
    ai_tone: "professional and friendly"
  }
];

let submissions = [];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  try {
    const { form_id, history } = req.body;

    if (!form_id || !history) {
      return res.status(400).json({ detail: 'form_id and history are required' });
    }

    // Get form details
    const form = forms.find(f => f.id === form_id);
    if (!form) {
      return res.status(404).json({ detail: 'Form not found' });
    }

    // Generate next question using OpenAI
    const nextQuestion = await generateQuestionWithOpenAI(form, history);

    // If conversation is complete, save submission
    if (nextQuestion.includes("Thank you for your time")) {
      const userResponses = history.filter(msg => msg.role === 'user').map(msg => msg.content);
      const summary = userResponses.join(" | ");
      
      submissions.push({
        id: submissions.length + 1,
        form_id,
        summary,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({ next_question: nextQuestion });

  } catch (error) {
    console.error('Generate Question Error:', error);
    return res.status(500).json({ detail: `Error generating question: ${error.message}` });
  }
}

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