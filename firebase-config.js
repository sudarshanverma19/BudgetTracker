// src/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrDlkIw39Zil7gZQILwpIa7f7ITXeLdS0",
  authDomain: "budgertracker.firebaseapp.com",
  projectId: "budgertracker",
  storageBucket: "budgertracker.appspot.com",
  messagingSenderId: "387176020743",
  appId: "1:387176020743:web:2ce32ef9f6efcdcbde23a2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };