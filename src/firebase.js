// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZPnmo5k72Zckz66yKPTDHBaBlTTIpcZY",
  authDomain: "e-commerce-notifications-7a8cd.firebaseapp.com",
  projectId: "e-commerce-notifications-7a8cd",
  storageBucket: "e-commerce-notifications-7a8cd.firebasestorage.app",
  messagingSenderId: "773749110302",
  appId: "1:773749110302:web:65fc2bd41c6379d193600f",
  measurementId: "G-KMD5EF4PPY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Export the firestore instance to be used elsewhere
export { db };