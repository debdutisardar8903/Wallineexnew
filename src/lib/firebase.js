// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3-SJYETVljzbeT67q2p14e5pj3FLRT4k",
  authDomain: "pixelmart-ce8ff.firebaseapp.com",
  databaseURL: "https://pixelmart-ce8ff-default-rtdb.firebaseio.com",
  projectId: "pixelmart-ce8ff",
  storageBucket: "pixelmart-ce8ff.firebasestorage.app",
  messagingSenderId: "682768301943",
  appId: "1:682768301943:web:048e946b316abaa3ee6b72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
