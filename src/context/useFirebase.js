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
} from 'src/context/firebaseFunctions'

import {
  newDoc,
  reviewDocs,
  updateDocs,
  updateUserPhone,
  addNewContact,
  useEvents,
  useSnapshot,
  getData,
  getRoleData,
  getUsers,
  getPetitioner,
  getReceiverUsers,
  getAllPlantUsers,
  getAllProcureUsers,
  blockDayInDatabase,
  consultBlockDayInDB,
  consultSAP,
  consultUserEmailInDB,
  consultAllDocsInDB,
  consultAllObjetivesInDB,
  consultObjetivesOfActualWeek,
  consultObjetivesLastSixMonths,
  consultAllDocsByPlants,
  consultAllObjetivesByPlants,
  consultAllDocsByState,
  consultAllObjetivesByState,
  getUsersWithSolicitudes,
  getUserProyectistas
} from 'src/context/firestoreFunctions'

import { uploadFilesToFirebaseStorage, updateUserProfile } from 'src/context/storageFunctions'

const FirebaseContextProvider = props => {
  // ** Hooks
  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ** Variables
  const auth = getAuth(app)

  // ** Observador cambios de estado de Firebase
  useEffect(() => {
    setAuthUser(null)
    const unsubscribe = Firebase.auth().onAuthStateChanged(authStateChanged)

    return () => unsubscribe()
  }, [])

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

  const value = {
    authUser,
    auth,
    addNewContact,
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
    getUsers,
    getPetitioner,
    getAllProcureUsers,
    getReceiverUsers,
    getAllPlantUsers,
    uploadFilesToFirebaseStorage,
    blockDayInDatabase,
    consultBlockDayInDB,
    consultSAP,
    consultUserEmailInDB,
    consultAllDocsInDB,
    consultAllObjetivesInDB,
    consultObjetivesOfActualWeek,
    consultObjetivesLastSixMonths,
    consultAllDocsByPlants,
    consultAllObjetivesByPlants,
    consultAllDocsByState,
    consultAllObjetivesByState,
    getUsersWithSolicitudes,
    getUserProyectistas
  }

  return <FirebaseContext.Provider value={value}>{props.children}</FirebaseContext.Provider>
}

export default FirebaseContextProvider

// ** Custom hook para acceder a estas funciones

export const useFirebase = () => useContext(FirebaseContext)
