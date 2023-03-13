

import { useState, useEffect } from 'react'
import { Firebase, db } from 'src/configs/firebase'
import { collection, addDoc, Timestamp, query, getDoc, getDocs, querySnapShot } from "firebase/firestore";

// ** Next Imports
import Head from 'next/head'
import { useRouter } from 'next/router'

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

  // listen for Firebase state change
  useEffect(() => {
    const unsubscribe = Firebase.auth().onAuthStateChanged(authStateChanged)

    return () => unsubscribe()
  }, [])


  // write doc
  const newDoc = async (title, date, area, objective, supervisor, description) => {
    const user = Firebase.auth().currentUser
    if (user !== null) {
      const docRef = await addDoc(collection(db, 'solicitudes'), {
        //name: user.displayName,
        title,
        user: user.email,
        requestedDate: date,
        area,
        objective,
        supervisor,
        description,
        date: Timestamp.fromDate(new Date()),
        uid: user.uid,

      });
      console.log('Document written with ID: ', docRef.id);


      return docRef.uid;
    }
  }

  //evita que el user logueado esté en login
  useEffect(() => {
    if (authUser !== null && (router.pathname.includes('login') || router.asPath === ('/'))) {
      router.replace('/home')
    }

  }, [authUser, router])

  //evitar que el no logueado esté en home
  useEffect(() => {
    if (authUser === null && router.asPath !== ('/login/')) {
      router.replace('/login/')
    }

  }, [authUser, router])

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

  return {
    loading,
    signOut,
    authUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    newDoc,
    getDocuments
  }
}

export default useFirebaseAuth
