import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { supabase } from '../lib/supabase';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('geencay@gmail.com');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      setMessage('Admin user created successfully! You can now delete this page.');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card bg-dark text-white p-4">
            <h2>Create Admin User (One-time setup)</h2>
            {message && <Alert variant={message.includes('Error') ? 'danger' : 'success'}>{message}</Alert>}
            
            <Form onSubmit={handleSignup}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </Form.Group>
              
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Admin User'}
              </Button>
            </Form>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Signup;