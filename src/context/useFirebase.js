import React, { createContext, useState, useEffect, useContext } from 'react'

// ** Firebase Imports
import { Firebase, app } from 'src/configs/firebase'
import { getAuth, signOut } from 'firebase/auth'

// ** Crea contexto
export const FirebaseContext = createContext()

import {
  formatAuthUser,
  resetUser,
  resetPassword,
  updatePassword,
  signInWithEmailAndPassword,
  createUser,
  signAdminBack,
  signAdminFailure
} from 'src/context/firebase-functions/firebaseFunctions'

import {
  newDoc,
  reviewDocs,
  updateDocs,
  updateUserPhone,
  blockDayInDatabase
} from 'src/context/firebase-functions/firestoreFunctions'

import {
  useEvents,
  useSnapshot,
  getData,
  getRoleData,
  getPetitioner,
  getUserData,
  getReceiverUsers,
  consultBlockDayInDB,
  consultSAP,
  consultUserEmailInDB,
  consultDocs,
  consultObjetives,
  getUsersWithSolicitudes,
  getUserProyectistas
} from 'src/context/firebase-functions/firestoreQuerys'

import { uploadFilesToFirebaseStorage, updateUserProfile } from 'src/context/firebase-functions/storageFunctions'

const FirebaseContextProvider = props => {
  // ** Hooks
  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ** Variables
  const auth = getAuth(app)

  // ** Observador para cambios de estado - Define el estado authUser
  const authStateChanged = async authState => {
    if (!authState) {
      setAuthUser(null)
      setLoading(false)
    } else {
      setLoading(true)
      const formattedUser = await formatAuthUser(authState)
      setAuthUser(formattedUser)
      setLoading(false)
    }
  }

  // ** Observador cambios de estado de Firebase
  useEffect(() => {
    setAuthUser(null)
    const unsubscribe = Firebase.auth().onAuthStateChanged(authStateChanged)

    return () => unsubscribe()
  }, [])

  const value = {
    authUser,
    auth,
    loading,
    signOut,
    resetPassword,
    updatePassword,
    signInWithEmailAndPassword,
    createUser,
    updateUserProfile,
    signAdminBack,
    newDoc,
    useEvents,
    reviewDocs,
    updateDocs,
    updateUserPhone,
    useSnapshot,
    signAdminFailure,
    getRoleData,
    getData,
    getUserData,
    getPetitioner,
    getReceiverUsers,
    uploadFilesToFirebaseStorage,
    blockDayInDatabase,
    consultBlockDayInDB,
    consultSAP,
    consultUserEmailInDB,
    consultDocs,
    consultObjetives,
    getUsersWithSolicitudes,
    getUserProyectistas
  }

  return <FirebaseContext.Provider value={value}>{props.children}</FirebaseContext.Provider>
}

export default FirebaseContextProvider

// ** Custom hook para acceder a estas funciones

export const useFirebase = () => useContext(FirebaseContext)
