// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { initializeApp } from "firebase/app";
const FIREBASE_API = import.meta.env.VITE_BASE_FIREBASEAPI;
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: FIREBASE_API,
  authDomain: "trelloboard-clone.firebaseapp.com",
  projectId: "trelloboard-clone",
  storageBucket: "trelloboard-clone.appspot.com",
  messagingSenderId: "181380132785",
  appId: "1:181380132785:web:858ad92cbb1d057303d790",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export default app;
