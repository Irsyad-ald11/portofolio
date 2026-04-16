import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHvNdm4XyteiXFkulmFnsT5KRPM0BUb1U",
  authDomain: "chatroom-e838c.firebaseapp.com",
  projectId: "chatroom-e838c",
  storageBucket: "chatroom-e838c.firebasestorage.app",
  messagingSenderId: "1088770359270",
  appId: "1:1088770359270:web:3ab780daf2c95414482027",
  measurementId: "G-NW4TWDLGVR"
};


const app = initializeApp(firebaseConfig);

// AUTH
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// FIRESTORE
export const db = getFirestore(app);

// LOGIN
export const loginWithGoogle = () =>
  signInWithPopup(auth, provider);

// LOGOUT
export const logout = () =>
  signOut(auth);
