import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration from user prompt
const firebaseConfig = {
  apiKey: "AIzaSyC80d_KbfPsrvKDzt4zDG1p1IhyzTSxUP8",
  authDomain: "crm-app-ad065.firebaseapp.com",
  projectId: "crm-app-ad065",
  storageBucket: "crm-app-ad065.firebasestorage.app",
  messagingSenderId: "685978842259",
  appId: "1:685978842259:web:f0edee6fce801ead318966"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services for use in the application
export const auth = getAuth(app);
export const db = getFirestore(app);
