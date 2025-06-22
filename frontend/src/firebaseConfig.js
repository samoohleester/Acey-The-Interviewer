// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAZqmHl2MBYMLlKf86lvddAVFBz0y5A6UU",
  authDomain: "acey-693ff.firebaseapp.com",
  projectId: "acey-693ff",
  storageBucket: "acey-693ff.appspot.com",
  messagingSenderId: "845870081436",
  appId: "1:845870081436:web:13d4860b89c1a5e6f31459",
  measurementId: "G-05ZW1H7RSE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); 