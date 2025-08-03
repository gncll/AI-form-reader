
import React, { useEffect, useState } from 'react';
import { Container, Button, Spinner, Alert, Modal, Form as BootstrapForm, Card, Row, Col } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';

interface Form {
  id: number;
  name: string;
  goal: string;
  ai_model: string;
  ai_tone: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/forms');
      if (!response.ok) {
        throw new Error('Failed to fetch forms.');
      }
      const data: Form[] = await response.json();
      setForms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (formId: number) => {
    if (!window.confirm('Are you sure you want to delete this form?')) {
      return;
    }
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete form.');
      }
      fetchForms(); // Refresh the list after deletion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    }
  };

  const handleShowShareLink = (formId: number) => {
    const link = `${window.location.origin}/form/${formId}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => setShowShareModal(false);

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-white mb-0">My workspace</h1>
        <LinkContainer to="/admin/form/new">
          <Button variant="primary">+ New formless</Button>
        </LinkContainer>
      </div>

      <div className="card bg-dark text-white p-4 shadow-lg rounded-3">

      {isLoading && <Spinner animation="border" role="status" className="text-primary"><span className="visually-hidden">Loading...</span></Spinner>}
      {error && <Alert variant="danger">{error}</Alert>}

      {!isLoading && !error && forms.length === 0 && (
        <Alert variant="info">No forms created yet. Click "+ New formless" to get started!</Alert>
      )}

      {!isLoading && !error && forms.length > 0 && (
        <Row xs={1} md={2} lg={3} className="g-4">
          {forms.map((form) => (
            <Col key={form.id}>
              <Card bg="secondary" text="white" className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>{form.name}</Card.Title>
                  <Card.Text className="text-muted small mb-2">
                    ID: {form.id} | Created: {new Date(form.created_at).toLocaleDateString()}
                  </Card.Text>
                  <Card.Text>
                    <strong>Goal:</strong> {form.goal}
                  </Card.Text>
                  <Card.Text>
                    <strong>AI Model:</strong> {form.ai_model}
                  </Card.Text>
                  <Card.Text>
                    <strong>AI Tone:</strong> {form.ai_tone}
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="d-flex justify-content-between align-items-center bg-dark border-top border-secondary">
                  <LinkContainer to={`/admin/form/edit/${form.id}`}>
                    <Button variant="info" size="sm">Edit</Button>
                  </LinkContainer>
                  <LinkContainer to={`/admin/results/${form.id}`}>
                    <Button variant="success" size="sm">Results</Button>
                  </LinkContainer>
                  <Button variant="secondary" size="sm" onClick={() => handleShowShareLink(form.id)}>Share</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(form.id)}>Delete</Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      </div> {/* Close the card div */}

      <Modal show={showShareModal} onHide={handleCloseShareModal} centered>
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>Share Form Link</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <p>Copy this link to share your form:</p>
          <BootstrapForm.Control
            type="text"
            value={shareLink}
            readOnly
            onClick={(e: any) => e.target.select()}
            className="bg-secondary text-white border-secondary"
          />
          <CopyToClipboard text={shareLink} onCopy={handleCloseShareModal}>
            <Button variant="primary" className="mt-3">Copy to Clipboard</Button>
          </CopyToClipboard>
        </Modal.Body>
        <Modal.Footer className="bg-dark text-white">
          <Button variant="secondary" onClick={handleCloseShareModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;

