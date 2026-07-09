import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase web configuration keys (Standard public Firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyAdXD0a7u6ga3E6q9M6VlmbucE-Gqjgy7o",
  authDomain: "angular-union-46rpq.firebaseapp.com",
  projectId: "angular-union-46rpq",
  storageBucket: "angular-union-46rpq.firebasestorage.app",
  messagingSenderId: "645379637293",
  appId: "1:645379637293:web:736fbea8dc99c15085f8a4"
};

const databaseId = "ai-studio-linksnap-92317763-1581-46e4-85b9-69cd0fb762e0";

// Initialize Firebase App (Ensuring single instance across server reloads & HMR)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the custom databaseId
const db = getFirestore(app, databaseId);

export { app, db };
