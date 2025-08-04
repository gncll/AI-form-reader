import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ehcazveenuygfvkehzwj.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoY2F6dmVlbnV5Z2Z2a2VoendqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMzAwMDcsImV4cCI6MjA2OTgwNjAwN30.gl6UsgN6zYvvGUMCpg0NbM3tpG5rPmb3-C-4BcbWQXI'
const supabase = createClient(supabaseUrl, supabaseKey)

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

    // Get form details from Supabase
    const { data: form, error: getError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', form_id)
      .single();
      
    if (getError || !form) {
      console.error('Supabase GET form error:', getError);
      return res.status(404).json({ detail: 'Form not found' });
    }

    // Generate next question using OpenAI
    const nextQuestion = await generateQuestionWithOpenAI(form, history);

    // If conversation is complete, save submission to Supabase
    if (nextQuestion.includes("Thank you for your time")) {
      const userResponses = history.filter(msg => msg.role === 'user').map(msg => msg.content);
      const summary = userResponses.join(" | ");
      
      // Extract email from responses using regex
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
      const email = userResponses.join(" ").match(emailRegex)?.[0] || null;
      
      const { error: insertError } = await supabase
        .from('submissions')
        .insert([{ form_id, summary, email }]);
        
      if (insertError) {
        console.error('Supabase submission save error:', insertError);
      } else {
        console.log('Submission saved to Supabase:', { form_id, summary });
      }
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

  // Build conversation context with custom instructions + question count + tone
  const systemContent = `${form.prompt}

CONVERSATION SETTINGS:
- Tone: ${form.ai_tone}
- Total Questions: ${form.question_count || 5}
- ALWAYS ask for email address at some point during the conversation

IMPORTANT RULES:
1. Ask ONE question at a time
2. Keep questions conversational and engaging  
3. After exactly ${form.question_count || 5} meaningful questions (including email), conclude with "Thank you for your time! Your responses have been recorded."
4. Don't repeat questions
5. Build upon previous answers
6. Follow the custom instructions above exactly`;

  const messages = [
    {
      role: "system",
      content: systemContent
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