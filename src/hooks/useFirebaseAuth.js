

import { useState, useEffect } from 'react'
import Firebase from 'src/configs/firebase'

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

  const signInWithEmailAndPassword = (email, password) =>{
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

  //evita que el user logueado esté en login
  useEffect(() => {
    if (authUser !== null && (router.pathname.includes('login') || router.asPath===('/'))) {
      router.replace('/home')
    }

  },[authUser, router])

//evitar que el no logueado esté en home
useEffect(() => {
  if (authUser === null && router.asPath!==('/login/') ) {
    router.replace('/login/')
  }

},[authUser, router])

  return {
    loading,
    signOut,
    authUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
  }
}

export default useFirebaseAuth
