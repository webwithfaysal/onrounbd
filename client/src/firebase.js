// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB1uBuFvNtXjTr8K6vnitRYZBt_-63k5KI",
  authDomain: "onroun-uw.firebaseapp.com",
  projectId: "onroun-uw",
  storageBucket: "onroun-uw.firebasestorage.app",
  messagingSenderId: "74749796643",
  appId: "1:74749796643:web:66b351fc87e0bd1a546c96",
  measurementId: "G-3V08P9ERJW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Analytics safely
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { app, db, analytics };
export default app;

