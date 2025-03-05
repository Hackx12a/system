import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './components/login/sidebar'; // Import Sidebar component
import Guidelines from './components/login/guidelines'; // Import History component

import Login from './components/login/signin'; // Import Login component
import Alert from './components/login/alert'; // Import Alert component

import Settings from './components/login/settings'; // Import settings component

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on component mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAuthenticated');
    setIsAuthenticated(authStatus === 'true');
  }, []);

  // Handle successful login
  const handleLoginSuccess = () => {
    sessionStorage.setItem('isAuthenticated', 'true'); // Store auth status in sessionStorage
    setIsAuthenticated(true); // Update state to reflect the authenticated status
  };

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated'); // Clear auth status from sessionStorage
    setIsAuthenticated(false); // Update state to reflect the unauthenticated status
  };

  // ProtectedRoute component to simplify route protection
  const ProtectedRoute = ({ element: Element, ...rest }) => {
    return isAuthenticated ? <Element {...rest} /> : <Navigate to="/signin" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProtectedRoute element={Sidebar} />}>
          <Route path="/guidelines" element={<ProtectedRoute element={Guidelines} />} />
          <Route path="/" element={<ProtectedRoute element={Alert} />} />
          <Route path="/settings" element={<ProtectedRoute element={Settings} />} />
        </Route>

        {/* Sign-in route */}
        <Route
          path="/signin"
          element={
            isAuthenticated ? (
              <Navigate to="/" /> // Redirect to home if already authenticated
            ) : (
              <Login setIsAuthenticated={handleLoginSuccess} />
            )
          }
        />

        <Route
          path="/logout"
          element={
            <Navigate to="/signin" replace onClick={handleLogout} />
          }
        />

        {/* Fallback route for unknown paths */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/signin"} />} />
      </Routes>
    </Router>
  );
}

export default App;
