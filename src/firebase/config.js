// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v9-compat and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDA2kDrHxsxbnl80-7e8i6Zx704t4l77K4",
  authDomain: "mandoubi-a78a5.firebaseapp.com",
  projectId: "mandoubi-a78a5",
  storageBucket: "mandoubi-a78a5.firebasestorage.app",
  messagingSenderId: "615513821122",
  appId: "1:615513821122:web:a4f14087efe4700a2b105b",
  measurementId: "G-9PLFEHSHK1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
