
import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import '../App.css';
import config from '../config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FormDetails {
    id: number;
    name: string;
    goal: string;
    ai_model: string;
    ai_tone: string;
}

// A more robust and reliable typing effect hook
const useTypingEffect = (text: string, speed: number) => {
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        if (!text) {
            setDisplayText('');
            return;
        }

        setDisplayText('');
        let currentIndex = 0;

        const typeChar = () => {
            if (currentIndex < text.length) {
                setDisplayText(text.substring(0, currentIndex + 1));
                currentIndex++;
                setTimeout(typeChar, speed);
            }
        };

        // Start typing after a small delay to ensure proper rendering
        const startTimeout = setTimeout(typeChar, 50);

        return () => {
            clearTimeout(startTimeout);
        };
    }, [text, speed]);

    return displayText;
};

const PublicForm: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [formDetails, setFormDetails] = useState<FormDetails | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isQuestionFocused, setIsQuestionFocused] = useState(false);
  const [isConversationComplete, setIsConversationComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [hasStartedConversation, setHasStartedConversation] = useState(false);

  const displayedQuestion = useTypingEffect(currentQuestion, 30); // Speed set to 30ms

  const fetchNextQuestion = useCallback(async (history: Message[], currentFormDetails: FormDetails | null = null) => {
    console.log('PublicForm: Attempting to fetch next question. History length:', history.length);
    setIsLoading(true);
    setError(null);
    const detailsToUse = currentFormDetails || formDetails;
    if (!detailsToUse) {
        console.warn('PublicForm: fetchNextQuestion called but formDetails is null.');
        setIsLoading(false);
        return; // Ensure formDetails are loaded
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/generate_question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, form_id: detailsToUse.id }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('PublicForm: Failed to fetch next question. Response:', response.status, errData);
        throw new Error(errData.detail || 'Failed to fetch the next question.');
      }

      const data = await response.json();
      console.log('PublicForm: Successfully fetched next question:', data);
      if (data.next_question) {
        // Set the current question for typing effect
        setCurrentQuestion(data.next_question);
        
        if (data.next_question.includes('Thank you for your time')) {
            setIsConversationComplete(true);
        }
        
        // Always add to conversation
        setConversation(prev => [...prev, { role: 'assistant', content: data.next_question }]);
      }
    } catch (err) {
      console.error('PublicForm: Error fetching next question:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [formDetails]);

  const fetchFormDetails = useCallback(async () => {
    console.log('PublicForm: Attempting to fetch form details for formId:', formId);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/forms/${formId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PublicForm: Failed to fetch form details. Response:', response.status, errorText);
        throw new Error(`Form not found or failed to fetch details. Status: ${response.status}`);
      }
      const data: FormDetails = await response.json();
      console.log('PublicForm: Successfully fetched form details:', data);
      setFormDetails(data);
      setIsLoading(false);
      // Start the conversation only if it hasn't started yet
      if (!hasStartedConversation) {
        setHasStartedConversation(true);
        fetchNextQuestion([], data);
      }
    } catch (err) {
      console.error('PublicForm: Error fetching form details:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching form details.');
      setIsLoading(false);
    }
  }, [formId, fetchNextQuestion, hasStartedConversation]);

  useEffect(() => {
    console.log('PublicForm: useEffect triggered with formId:', formId);
    if (formId) {
      fetchFormDetails();
    }
  }, [formId, fetchFormDetails]);

  const handleAnswerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with answer:', currentAnswer);
    if (!currentAnswer.trim() || isConversationComplete || isSubmitting) return;

    setIsSubmitting(true);
    const newHistory: Message[] = [...conversation, { role: 'user', content: currentAnswer }];
    console.log('New history:', newHistory);
    setConversation(newHistory);
    setCurrentAnswer('');
    
    try {
      await fetchNextQuestion(newHistory);
    } catch (error) {
      console.error('Error in handleAnswerSubmit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !formDetails) {
    return (
      <div className="public-form-page">
        <div className="form-container text-center">
          <Spinner animation="border" role="status"><span className="visually-hidden">Loading Form...</span></Spinner>
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && !formDetails) {
    return (
      <div className="public-form-page">
        <div className="form-container text-center">
          <Alert variant="danger">Error: {error}</Alert>
        </div>
      </div>
    );
  }

  if (!formDetails) {
      return (
        <div className="public-form-page">
          <div className="form-container text-center">
            <Alert variant="warning">Form not found or invalid ID.</Alert>
          </div>
        </div>
      );
  }

  return (
    <div className="public-form-page">
      <div className="form-container">
        <h1 className={`question ${isQuestionFocused ? 'question-inactive' : ''}`}>
            {displayedQuestion}
        </h1>
        {!isConversationComplete ? (
            <Form onSubmit={handleAnswerSubmit}>
                <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Type your answer here..."
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onFocus={() => setIsQuestionFocused(true)}
                    onBlur={() => setIsQuestionFocused(currentAnswer.trim() !== '')}
                    disabled={isSubmitting}
                    required
                    className="form-control"
                />
                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                <Button className="btn-next" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : 'Next →'}
                </Button>
            </Form>
        ) : (
            <div className="text-center mt-5">
                <h2 className="text-success">Conversation Complete!</h2>
                <p>Thank you for your responses.</p>
                <Button variant="primary" onClick={() => window.location.reload()}>Start New Conversation</Button>
            </div>
        )}
      </div>
    </div>
  );
};

export default PublicForm;
