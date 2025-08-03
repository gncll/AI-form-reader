
import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import config from '../config';

interface FormInput {
  name: string;
  goal: string;
  ai_model: string;
  ai_tone: string;
}

const FormEditor: React.FC = () => {
  const { formId } = useParams<{ formId?: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormInput>({
    name: '',
    goal: '',
    ai_model: 'gpt-4o-mini',
    ai_tone: 'professional and friendly',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (formId) {
      // Fetch existing form data for editing
      const fetchForm = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`${config.API_BASE_URL}/api/forms/${formId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch form data.');
          }
          const data = await response.json();
          setFormData(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchForm();
    }
  }, [formId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const method = formId ? 'PUT' : 'POST';
    const url = formId ? `${config.API_BASE_URL}/api/forms/${formId}` : `${config.API_BASE_URL}/api/forms`;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to save form.');
      }

      setSuccess(`Form ${formId ? 'updated' : 'created'} successfully!`);
      if (!formId) {
        // If creating a new form, navigate to its edit page or dashboard
        const newForm = await response.json();
        navigate(`/admin/form/edit/${newForm.id}`);
      } else {
        // If editing, just show success and stay on page
        const updatedForm = await response.json();
        setFormData(updatedForm); // Update form data with potentially new created_at etc.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-white mb-0">{formId ? 'Edit Form' : 'Create New Form'}</h1>
        <Button variant="secondary" onClick={() => navigate('/admin')} disabled={isLoading}>
          ← Back to Dashboard
        </Button>
      </div>

      <div className="card bg-dark text-white p-4 shadow-lg rounded-3">
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Form Name</Form.Label>
          <Form.Control
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="bg-dark text-white border-secondary"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Form Goal (for AI)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="goal"
            value={formData.goal}
            onChange={handleChange}
            required
            className="bg-dark text-white border-secondary"
          />
          <Form.Text className="text-muted">
            e.g., "Gather feedback on a new product feature" or "Collect user preferences for a custom software solution."
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>AI Model</Form.Label>
          <Form.Select
            name="ai_model"
            value={formData.ai_model}
            onChange={handleChange}
            className="bg-dark text-white border-secondary"
          >
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            {/* Add other models as needed */}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>AI Tone</Form.Label>
          <Form.Control
            type="text"
            name="ai_tone"
            value={formData.ai_tone}
            onChange={handleChange}
            className="bg-dark text-white border-secondary"
          />
          <Form.Text className="text-muted">
            e.g., "professional and friendly", "casual and humorous", "formal and direct".
          </Form.Text>
        </Form.Group>

        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? <Spinner as="span" animation="border" size="sm" /> : (formId ? 'Update Form' : 'Create Form')}
        </Button>
      </Form>
      </div> {/* Close the card div */}
    </Container>
  );
};

export default FormEditor;
