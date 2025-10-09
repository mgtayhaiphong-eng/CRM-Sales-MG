// Import the functions you need from the SDKs you need
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// Your web app's Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyAAoSjIXyUJBZ4SPHE1UmQDeplVVTECKMU",
  authDomain: "auto-crm-a6e44.firebaseapp.com",
  projectId: "auto-crm-a6e44",
  storageBucket: "auto-crm-a6e44.appspot.com",
  messagingSenderId: "464855583441",
  appId: "1:464855583441:web:3c23c7ee7eaca174f493f0"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
export const auth = firebase.auth();
export const db = firebase.firestore();
