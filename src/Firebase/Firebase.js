// Firebase/Firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEMz8KmV343l0eGkt1AEu4j_rvZNbKl70",
  authDomain: "wordly-f0c7d.firebaseapp.com",
  projectId: "wordly-f0c7d",
  storageBucket: "wordly-f0c7d.appspot.com",
  messagingSenderId: "356569440543",
  appId: "1:356569440543:web:65c5de131c1c9c4ee5502a",
  measurementId: "G-TQ0PYDZFNJ",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);           // Auth must be exported after initialization
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
