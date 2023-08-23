// Import the functions you need from the SDKs you need
import Firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import { getFirestore } from 'firebase/firestore'
import 'dotenv/config'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfigProduction = {
  apiKey: process.env.NEXT_PUBLIC_PROD_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_PROD_AUTHDOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_PROD_DATABASEURL,
  projectId: process.env.NEXT_PUBLIC_PROD_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_PROD_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_PROD_MESSAGINGSENDERID,
  appId: process.env.NEXT_PUBLIC_PROD_APPID,
  measurementId: process.env.NEXT_PUBLIC_PROD_MEASUREMENTID
};

const firebaseConfigDevelopment = {
  apiKey: process.env.NEXT_PUBLIC_DEV_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_DEV_AUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_DEV_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_DEV_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_DEV_MESSAGINGSENDERID,
  appId: process.env.NEXT_PUBLIC_DEV_APPID
};

// Initialize Firebase

let firebaseConfig

if (typeof window !== 'undefined') {
  if (window.location.hostname === 'localhost') {
    firebaseConfig = firebaseConfigDevelopment;
  } else {
    firebaseConfig = firebaseConfigProduction;
  }
} else {
  // Aquí puedes definir un valor predeterminado o manejarlo como prefieras
  firebaseConfig = firebaseConfigProduction; // o firebaseConfigDev
}

const app = Firebase.initializeApp(firebaseConfig)

const db = getFirestore(app);

export { Firebase, db, app}

