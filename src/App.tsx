
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import AdminDashboard from './components/AdminDashboard';
import FormEditor from './components/FormEditor';
import FormResults from './components/FormResults';
import PublicForm from './components/PublicForm';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public form route - completely separate from auth */}
        <Route path="/form/:formId" element={<PublicForm />} />
        
        {/* Protected admin routes with auth */}
        <Route path="/*" element={
          <AuthProvider>
            <ProtectedRoute>
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
            </ProtectedRoute>
          </AuthProvider>
        } />
      </Routes>
    </Router>
  );
}

export default App;
