
import React from 'react';
import { Nav, Form, FormControl, Button } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <div className="sidebar bg-dark text-white p-3 d-flex flex-column">
      <div className="user-profile mb-4 d-flex align-items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-person-circle me-2" viewBox="0 0 16 16">
          <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
          <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
        </svg>
        <div>
          <h5 className="mb-0">Mehmet Gencay Işık</h5>
          <div className="d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="currentColor" className="bi bi-circle-fill text-success me-1" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="8"/>
            </svg>
            <small>Online</small>
          </div>
        </div>
      </div>

      <Form className="mb-4">
        <div className="input-group">
          <FormControl
            type="search"
            placeholder="Search forms or workspaces..."
            className="bg-secondary border-0 text-white"
            aria-label="Search"
          />
          <Button variant="secondary" className="border-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search text-white" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.085.12l3.957 3.957a.5.5 0 0 0 .708-.708l-3.957-3.957a.5.5 0 0 0-.12-.085zm-5.442 1.04A5.5 5.5 0 1 1 10.5 7.5a5.5 5.5 0 0 1-5.5 5.5"/>
            </svg>
          </Button>
        </div>
      </Form>

      <Nav className="flex-column flex-grow-1">
        <h6 className="text-muted text-uppercase mb-2">Workspaces</h6>
        <LinkContainer to="/admin">
          <Nav.Link className="text-white">My workspace</Nav.Link>
        </LinkContainer>
        <Nav.Link className="text-muted">Mehmet Gencay Işık's workspace</Nav.Link>
      </Nav>

      <div className="mt-auto pt-3 border-top border-secondary">
        <Link to="#" className="text-muted text-decoration-none small">
          Send Feedback
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
