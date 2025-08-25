// File: src/firebase/config.ts

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth'; // Import GoogleAuthProvider
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCjZxcE4L6rb77lpCB21DPAD9Q3EHI-Qg4",
  authDomain: "syllabus-planner-96c41.firebaseapp.com",
  projectId: "syllabus-planner-96c41",
  storageBucket: "syllabus-planner-96c41.appspot.com",
  messagingSenderId: "201039166966",
  appId: "1:201039166966:web:e49dec47b3c50d62675bd7",
  measurementId: "G-161TWG279W"
};


// Initialize Firebase for SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Create and export the GoogleAuthProvider instance
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics only on the client side if supported
const analytics = typeof window !== 'undefined' ? 
    isSupported().then(yes => yes ? getAnalytics(app) : null) : 
    Promise.resolve(null);

export { app, auth, analytics, googleProvider }; // Add googleProvider to the exports
