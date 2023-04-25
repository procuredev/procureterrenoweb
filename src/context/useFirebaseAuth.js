import  React, { createContext, useState, useEffect, useContext } from 'react'
import { updateProfile } from "firebase/auth";
import { Firebase, db, app } from 'src/configs/firebase'
import { collection, doc, addDoc, Timestamp, query, getDoc, getDocs, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ** Next Imports
import Head from 'next/head'
import { useRouter } from 'next/router'
import { DataSaverOn } from '@mui/icons-material';



export const FirebaseContext = createContext();

const FirebaseContextProvider = (props) => {

  const auth = getAuth(app)
  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState([])

  const router = useRouter()
  

  const formatAuthUser = user => {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      pfp: user.photoURL
    }
  }

  const authStateChanged = async authState => {
    if (!authState) {
      setAuthUser(null)
      setLoading(false)
    } else {
      setLoading(true)
      const formattedUser = formatAuthUser(authState)
      setAuthUser(formattedUser)
      setLoading(false)
    }
  }

  const resetUser = () => {
    setAuthUser(null)
    setLoading(true)
  }

  // Inicio de sesión

  const signInWithEmailAndPassword = (email, password) => {
    Firebase.auth().signInWithEmailAndPassword(email, password)
      .then(user => console.log(user))
      .catch(err => console.log(err))

  }

  const createUserWithEmailAndPassword = (email, password) =>

    Firebase.auth().createUserWithEmailAndPassword(email, password)

  const signOut = () => Firebase.auth().signOut()
    .then(resetUser)
    .then(router.push('/login/'))

  // Listen for Firebase state change - Observador cambios de estado de Firebase
  useEffect(() => {
    const unsubscribe = Firebase.auth().onAuthStateChanged(authStateChanged)

    return () => unsubscribe()
  }, [])


  // Escribe documentos en Firestore Database
  const newDoc = async (values) => {
    const user = Firebase.auth().currentUser
    if (user !== null) {
      const docRef = await addDoc(collection(db, 'solicitudes'), {
        //name: user.displayName,
        title:values.title,
        user: user.email,
        start: values.start,
        area:values.area,
        objective:values.objective,
        receiver:values.receiver,
        description:values.description,
        date: Timestamp.fromDate(new Date()),
        uid: user.uid,

      });
      console.log('Document written with ID: ', docRef.id);


      return docRef.uid;
    }
  }

  // Evita que el user logueado esté en login
  useEffect(() => {
    if (authUser !== null && (router.pathname.includes('login'))) {
      router.replace('/home')
    }

  }, [authUser, router])

  // Evita que el no logueado esté en home
 /*  useEffect(() => {
    if (authUser === null && router.asPath !== ('/login/')) {
      router.replace('/login/')
    }

  }, [authUser, router])
 */
  // Get docs - Consulta documentos db
  const getDocuments =  () => {

    const q = query(collection(db, "solicitudes"));
    onSnapshot(q, (querySnapshot) => {
      const allDocs = [];
      querySnapshot.forEach((doc) => {
        allDocs.push({...doc.data(), id:doc.id});
    });

  return allDocs
  })};

  // Modifica estado documentos

  const reviewDocs = async (id, approves) => {
    //if approves is true, +1, if false back to 0
    const ref = doc(db, 'solicitudes', id)
    const querySnapshot = await getDoc(ref);
    const prevState = querySnapshot.data().state;
    const newState = approves ? prevState + 1 : 9;

    //const newState = prevState+1

    //Guarda estado anterior, autor y fecha modificación
    const newEvent = { prevState, newState, author: Firebase.auth().currentUser.email, date: Timestamp.fromDate(new Date()) }

    await updateDoc(ref, {
      events: arrayUnion(newEvent),
      state: newState
    });
  }

  // Modifica otros campos documentos
  const updateDocs = async (id, obj) => {
    const ref = doc(db, 'solicitudes', id)
    const querySnapshot = await getDoc(ref);

    //save previous version?
    const prevDoc = querySnapshot.data();
    const newEvent = { prevDoc, author: Firebase.auth().currentUser.email, date: Timestamp.fromDate(new Date()) }
    await updateDoc(ref, obj);
  }

  // Actualiza datos usuario

  const updateUser = () =>{
  updateProfile(Firebase.auth().currentUser, {
  //hardcoded pero pueden -deben- pasársele argumentos
    displayName: "Pamela Carrizo", photoURL: "https://raw.githubusercontent.com/carlapazjm/firmaprocure/main/PC.png"
  }).then(() => {
    console.log(Firebase.auth().currentUser)

    // Profile updated!
    // ...
  }).catch((error) => {
    // An error occurred
    // ...
  });
  }

  const value = {
    auth,
    loading,
    signOut,
    authUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    newDoc,
    getDocuments,
    reviewDocs,
    updateDocs,
    updateUser
  };

  return (
    <FirebaseContext.Provider value={value}>
      {props.children}
    </FirebaseContext.Provider>
  );
};

export default FirebaseContextProvider;


// custom hook to use the authUserContext and access authUser and loading
export const useFirebase = () => useContext(FirebaseContext)
