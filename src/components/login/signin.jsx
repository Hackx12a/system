import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { auth, db } from './firebase'; // Make sure to export db from your firebase config
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore'; // Add Firestore imports
import './signin.css';
import logo from './assets/helptrack.png';
import backgroundImage from './assets/qwe.jpg';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAuthenticated');
    const role = sessionStorage.getItem('role');
    
    if (authStatus === 'true') {
      // Redirect based on role if already authenticated
      role === 'admin' ? navigate('/admin') : navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Query Firestore for user document with matching email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('No user found with this email');
      }
      
      // 3. Get user data
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Validate that role exists in user data
      if (!userData.role) {
        throw new Error('User role not defined');
      }
      
      // 4. Store authentication state and role
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('email', email);
      sessionStorage.setItem('role', userData.role);
      sessionStorage.setItem('uid', userCredential.user.uid);
      
      // Call setIsAuthenticated with the role information
      setIsAuthenticated(userData.role);
      
      // 5. Redirect based on role
      if (userData.role === 'admin') {
        navigate('/admin', { replace: true }); // replace: true prevents going back to login
      } else {
        navigate('/', { replace: true });
      }
      
    } catch (error) {
      // Clear password field on error
      setPassword('');
      
      // Set appropriate error message
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (error.message === 'No user found with this email') {
        setError('Account not found. Please check your email.');
      } else if (error.message === 'User role not defined') {
        setError('Account configuration error. Please contact support.');
      } else {
        setError('Login failed. Please try again later.');
      }
      
      console.error("Login error:", error);
    }
  };

  return (
    <div className="login-background" style={{ backgroundImage: `url(${backgroundImage})` }}>
      {/* Background image for the login screen */}
      
      <motion.div
        className="login-container" // Main container for login form
        initial={{ opacity: 0, y: -50 }} // Initial animation state
        animate={{ opacity: 1, y: 0 }} // Animation state when mounted
        transition={{ duration: 0.5 }} // Transition duration for animation
      >
        <motion.img
          src={logo} // Logo image
          alt="Logo" // Alt text for accessibility
          className="logo" // CSS class for logo styling
          initial={{ opacity: 0, scale: 0.8 }} // Initial animation state for logo
          animate={{ opacity: 1, scale: 1 }} // Animation state when mounted
          transition={{ duration: 0.5, delay: 0.2 }} // Transition for logo animation
        />

        <h1>Login</h1> {/* Login title */}

        {error && (
          <motion.p 
            className="error-message" // CSS class for error message styling
            initial={{ opacity: 0, y: -20 }} // Initial animation state for error message
            animate={{ opacity: 1, y: 0 }} // Animation state when error occurs
            transition={{ duration: 0.3, delay: 0.2 }} // Transition for error message animation
          >
            {error} {/* Display error message */}
          </motion.p>
        )}
        <motion.form
          onSubmit={handleSubmit} // Handle form submission
          initial={{ opacity: 0, y: 50 }} // Initial animation state for form
          animate={{ opacity: 1, y: 0 }} // Animation state when form is mounted
          transition={{ duration: 0.5, delay: 0.3 }} // Transition for form animation
        >
          <motion.div className="form-group"> {/* Container for email input */}
            <label htmlFor="email">Email:</label> {/* Email label */}
            <input
              type="email" // Input type for email
              id="email" // Input ID for accessibility
              value={email} // Controlled input value
              onChange={(e) => setEmail(e.target.value)} // Update email state on change
              required // Mark input as required
            />
          </motion.div>
          <motion.div className="form-group"> {/* Container for password input */}
            <label htmlFor="password">Password:</label> {/* Password label */}
            <div className="password-input-container"> {/* Container for password input and toggle button */}
              <input
                type={showPassword ? 'text' : 'password'} // Toggle between text and password input
                id="password" // Input ID for accessibility
                value={password} // Controlled input value
                onChange={(e) => setPassword(e.target.value)} // Update password state on change
                required // Mark input as required
              />
              <button
                type="button" // Button type for toggling password visibility
                onClick={() => setShowPassword(!showPassword)} // Toggle showPassword state on click
                className="toggle-password" // CSS class for styling the toggle button
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />} {/* Show/hide icon based on state */}
              </button>
            </div>
          </motion.div>
          <motion.button
            type="submit" // Submit button for the form
            className="buttonsignin" // CSS class for button styling
            whileHover={{ scale: 1.05 }} // Scale effect on hover
            whileTap={{ scale: 0.95 }} // Scale effect on tap
            initial={{ opacity: 0, y: 20 }} // Initial animation state for button
            animate={{ opacity: 1, y: 0 }} // Animation state when button is mounted
            transition={{ duration: 0.5, delay: 0.6 }} // Transition for button animation
          >
            Login {/* Button text */}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login; // Export the Login component for use in other parts of the application
