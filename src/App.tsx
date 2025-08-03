
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import './App.css';

import AdminDashboard from './components/AdminDashboard';
import FormEditor from './components/FormEditor';
import FormResults from './components/FormResults';
import PublicForm from './components/PublicForm';
import Sidebar from './components/Sidebar';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public form route without sidebar */}
        <Route path="/form/:formId" element={<PublicForm />} />
        
        {/* Admin routes with sidebar */}
        <Route path="/*" element={
          <div className="d-flex">
            <Sidebar />
            <div className="flex-grow-1 p-3">
              <Routes>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/form/new" element={<FormEditor />} />
                <Route path="/admin/form/edit/:formId" element={<FormEditor />} />
                <Route path="/admin/results/:formId" element={<FormResults />} />
                <Route path="/" element={<AdminDashboard />} /> {/* Default route for now */}
              </Routes>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
