// Import the functions you need from the SDKs you need
import Firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import { getFirestore } from 'firebase/firestore'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC1XlvMbqs2CN_BWXFtk4BPwYWwD29cVww",
  authDomain: "procureterrenoweb.firebaseapp.com",
  databaseURL: "https://procureterrenoweb-default-rtdb.firebaseio.com",
  projectId: "procureterrenoweb",
  storageBucket: "procureterrenoweb.appspot.com",
  messagingSenderId: "733629631100",
  appId: "1:733629631100:web:1ce7448784dc1dea9897f9",
  measurementId: "G-TVJHPX0SLM"
};

// Initialize Firebase

const app = Firebase.initializeApp(firebaseConfig)



const db = getFirestore(app);

export { Firebase, db, }
