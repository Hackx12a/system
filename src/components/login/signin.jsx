import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
    
    if (authStatus === 'true') {
      navigate('/');
    }
  }, [navigate]);


 const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, email, password);
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('email', email); // Store the email in sessionStorage
    setIsAuthenticated(true);
    navigate('/', { state: { email } }); // Pass the email as state when navigating to the '/' route
  } catch (error) {
    setError('Invalid email or password. Please try again.');
    console.error("Login error:", error);
  }
};



  return (
    <div className="login-background" style={{ backgroundImage: `url(${backgroundImage})` }}>
      
      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.img
          src={logo}
          alt="Logo"
          className="logo"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        <h1>Login</h1>


        {error && (
          <motion.p 
            className="error-message"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {error}
          </motion.p>
        )}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </motion.div>
          <motion.div className="form-group">
            <label htmlFor="password">Password:</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </motion.div>
          <motion.button
            type="submit"
            className="buttonsignin"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Login
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login;
