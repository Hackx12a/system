// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import Firebase Auth

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkCzRztiB7jCrzarEJ83drIZCNMClvmes",
  authDomain: "helptrack-7dcc6.firebaseapp.com",
  projectId: "helptrack-7dcc6",
  storageBucket: "helptrack-7dcc6.firebasestorage.app",
  messagingSenderId: "281486804546",
  appId: "1:281486804546:web:cac1a3fe2ccd02e40e4fdb",
  measurementId: "G-7028B6RJ61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth
const auth = getAuth(app); // Initialize Firebase Authentication

// Export the db and auth instances
export { app, db, auth };
