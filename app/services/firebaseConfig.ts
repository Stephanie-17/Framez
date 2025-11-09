// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDq8ysaN4b5679a96j61uhNfn-kipWw3zY",
  authDomain: "framez-9367b.firebaseapp.com",
  projectId: "framez-9367b",
  storageBucket: "framez-9367b.firebasestorage.app",
  messagingSenderId: "945103155095",
  appId: "1:945103155095:web:9c6b4646d2e9bd40785ed2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);