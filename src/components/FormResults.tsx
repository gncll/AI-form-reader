
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Table, Button, Spinner, Alert, Card } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import config from '../config';

interface Submission {
  id: number;
  form_id: number;
  summary: string;
  email: string | null;
  created_at: string;
}

interface FormDetails {
  id: number;
  name: string;
  goal: string;
}

const FormResults: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [formDetails, setFormDetails] = useState<FormDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFormDetails = useCallback(async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/forms/${formId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch form details.');
      }
      const data: FormDetails = await response.json();
      setFormDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching form details.');
    }
  }, [formId]);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/submissions?form_id=${formId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch submissions.');
      }
      const data: Submission[] = await response.json();
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching submissions.');
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    if (formId) {
      fetchFormDetails();
      fetchSubmissions();
    }
  }, [formId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-white mb-0">Results for Form: {formDetails?.name || 'Loading...'}</h1>
        <Button variant="secondary" onClick={() => navigate('/admin')}>
          ← Back to Dashboard
        </Button>
      </div>

      <div className="card bg-dark text-white p-4 shadow-lg rounded-3">
        {formDetails && <p className="text-muted">Goal: {formDetails.goal}</p>}

        {isLoading && <Spinner animation="border" role="status" className="text-primary"><span className="visually-hidden">Loading...</span></Spinner>}
        {error && <Alert variant="danger">{error}</Alert>}

        {!isLoading && !error && submissions.length === 0 && (
          <Alert variant="info">No submissions yet for this form.</Alert>
        )}

        {!isLoading && !error && submissions.length > 0 && (
          <Table striped bordered hover variant="dark" responsive className="mt-3">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Summary</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.id}</td>
                  <td>{submission.email || 'Not provided'}</td>
                  <td>
                    <Card bg="secondary" text="white" className="mb-2">
                      <Card.Body style={{ whiteSpace: 'pre-wrap' }}>{submission.summary}</Card.Body>
                    </Card>
                  </td>
                  <td>{new Date(submission.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </Container>
  );
};

export default FormResults;
