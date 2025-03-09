import React, { useEffect, useState } from 'react'; // Import necessary React hooks
import { useNavigate } from 'react-router-dom'; // Import navigation hook from react-router
import { motion } from 'framer-motion'; // Import motion for animations
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons for password visibility toggle
import { auth } from './firebase'; // Import Firebase authentication instance
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import sign-in function from Firebase
import './signin.css'; // Import CSS for styling
import logo from './assets/helptrack.png'; // Import logo image
import backgroundImage from './assets/qwe.jpg'; // Import background image

const Login = ({ setIsAuthenticated }) => {
  // State variables to manage email, password, error messages, and password visibility
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate(); // Initialize the navigate function

  // Effect to check authentication status on component mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAuthenticated'); // Retrieve authentication status from sessionStorage
    
    // If user is already authenticated, redirect to home page
    if (authStatus === 'true') {
      navigate('/');
    }
  }, [navigate]);

  // Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    try {
      // Attempt to sign in with provided email and password
      await signInWithEmailAndPassword(auth, email, password);
      sessionStorage.setItem('isAuthenticated', 'true'); // Set authentication status in sessionStorage
      sessionStorage.setItem('email', email); // Store the email in sessionStorage
      setIsAuthenticated(true); // Update parent component's authentication state
      navigate('/', { state: { email } }); // Navigate to home page and pass email as state
    } catch (error) {
      // If an error occurs, set error message and log error
      setError('Invalid email or password. Please try again.');
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
