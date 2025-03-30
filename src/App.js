import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './components/login/sidebar';
import Guidelines from './components/login/guidelines';
import Login from './components/login/signin';
import Alert from './components/login/alert';
import Settings from './components/login/settings';
import Admin from './components/login/admin';

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    role: ''
  });

  // Check authentication status on component mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAuthenticated');
    const role = sessionStorage.getItem('role');
    
    if (authStatus === 'true') {
      setAuthState({
        isAuthenticated: true,
        role: role || ''
      });
    }
  }, []);

  // Handle successful login
  const handleLoginSuccess = (role) => {
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('role', role);
    setAuthState({
      isAuthenticated: true,
      role: role
    });
  };

  // Enhanced ProtectedRoute component with role checking
  const ProtectedRoute = ({ element: Element, allowedRoles, ...rest }) => {
    if (!authState.isAuthenticated) {
      return <Navigate to="/signin" />;
    }
    
    // Check if route has role restrictions and if user has required role
    if (allowedRoles && !allowedRoles.includes(authState.role)) {
      // Redirect to appropriate dashboard based on role
      return <Navigate to={authState.role === 'admin' ? '/admin' : '/'} />;
    }
    
    return <Element {...rest} />;
  };

  return (
    <Router>
      <Routes>
        {/* Regular user routes - only accessible to non-admin users */}
        <Route element={<ProtectedRoute element={Sidebar} allowedRoles={['user']} />}>
          <Route path="/" element={<ProtectedRoute element={Alert} allowedRoles={['user']} />} />
          <Route path="/guidelines" element={<ProtectedRoute element={Guidelines} allowedRoles={['user']} />} />
          <Route path="/settings" element={<ProtectedRoute element={Settings} allowedRoles={['user']} />} />
        </Route>

        {/* Admin route - only accessible to admin users */}
        <Route path="/admin" element={<ProtectedRoute element={Admin} allowedRoles={['admin']} />} />

        {/* Sign-in route */}
        <Route path="/signin" element={ authState.isAuthenticated ? (authState.role === 'admin' ? (<Navigate to="/admin" /> ) : (<Navigate to="/" />)) 
        : (<Login setIsAuthenticated={handleLoginSuccess} />)}/>

        {/* Fallback route for unknown paths */}
        <Route 
          path="*" 
          element={
            <Navigate to={
              authState.isAuthenticated ? 
                (authState.role === 'admin' ? '/admin' : '/') 
                : '/signin'
            } />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;