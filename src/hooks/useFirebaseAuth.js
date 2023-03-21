import "firebase/compat/firestore";
import { useState, useEffect } from 'react'
import { Firebase, db } from 'src/configs/firebase'
import { collection, doc, addDoc, Timestamp, query, getDoc, getDocs, querySnapShot, updateDoc, where, FieldValue,dataObject, arrayUnion} from "firebase/firestore";

// ** Next Imports
import Head from 'next/head'
import { useRouter } from 'next/router'
import { DataSaverOn } from '@mui/icons-material';

const formatAuthUser = user => {
  return {
    uid: user.uid,
    email: user.email
  }
}

const useFirebaseAuth = () => {

  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState([])

  const router = useRouter()

// Observador estado logueado

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
  const newDoc = async (title, date, area, objective, receiver, description) => {
    const user = Firebase.auth().currentUser
    if (user !== null) {
      const docRef = await addDoc(collection(db, 'solicitudes'), {
        //name: user.displayName,
        title,
        user: user.email,
        start: date,
        area,
        objective,
        receiver,
        description,
        date: Timestamp.fromDate(new Date()),
        uid: user.uid,

      });
      console.log('Document written with ID: ', docRef.id);


      return docRef.uid;
    }
  }

  // Evita que el user logueado esté en login
  useEffect(() => {
    if (authUser !== null && (router.pathname.includes('login') || router.asPath === ('/'))) {
      router.replace('/home')
    }

  }, [authUser, router])

  // Evita que el no logueado esté en home
  useEffect(() => {
    if (authUser === null && router.asPath !== ('/login/')) {
      router.replace('/login/')
    }

  }, [authUser, router])

  // Get docs - Consulta documentos db
  const getDocuments = async () => {
    const querySnapshot = await getDocs(collection(db, "solicitudes"));
    const allDocs = [];
    querySnapshot.forEach((doc) => {

      // doc.data() is never undefined for query doc snapshots
      //console.log(doc.id, " => ", doc.data());
      allDocs.push({ ...doc.data(), id: doc.id });
    });

    return allDocs;
  };

  // Modifica estado documentos

  const reviewDocs = async (id, approves) => {
    //if approves is true, +1, if false back to 0
    const ref = doc(db, 'solicitudes', id)
    const querySnapshot = await getDoc(ref);
    const prevState = querySnapshot.data().state;
    const newState = approves ? prevState+1 : 0;

    //const newState = prevState+1

    //Guarda estado anterior, autor y fecha modificación
    const newEvent = {prevState, newState, author: Firebase.auth().currentUser.email, date:Timestamp.fromDate(new Date())}

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
    const newEvent = {prevDoc, author: Firebase.auth().currentUser.email, date:Timestamp.fromDate(new Date())}
    await updateDoc(ref, obj);
  }


  return {
    loading,
    signOut,
    authUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    newDoc,
    getDocuments,
    reviewDocs,
    updateDocs
  }
}

export default useFirebaseAuth
