// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// COLLE TA CONFIGURATION ICI (Celle que tu viens de copier)
const firebaseConfig = {
  apiKey: "AIzaSyDHGh_4GC2TOw-a5rlBWRkx93rBLrdnjJY",
  authDomain: "bni-connect-40840.firebaseapp.com",
  projectId: "bni-connect-40840",
  storageBucket: "bni-connect-40840.firebasestorage.app",
  messagingSenderId: "1023058885069",
  appId: "1:1023058885069:web:d637f9e54c4cc4482cac84",
  measurementId: "G-LD3XJ9M249"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);