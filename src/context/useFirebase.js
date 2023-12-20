import React, { createContext, useState, useEffect, useContext } from 'react'

// ** Firebase Imports
import { app } from 'src/configs/firebase'
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth'

// ** Crea contexto
export const FirebaseContext = createContext()

import {
  formatAuthUser,
  resetPassword,
  updatePassword,
  signInWithEmailAndPassword,
  createUser,
  signAdminBack,
  signAdminFailure,
  signGoogle,
  deleteCurrentUser
} from 'src/context/firebase-functions/firebaseFunctions'

import {
  newDoc,
  updateDocs,
  updateUserPhone,
  blockDayInDatabase,
  generateBlueprint,
  useBlueprints,
  updateBlueprint,
  addDescription,
  generateBlueprintCodeClient,
  generateTransmittalCounter,
  updateSelectedDocuments
} from 'src/context/firebase-functions/firestoreFunctions'

import {
  useEvents,
  useSnapshot,
  getData,
  getRoleData,
  getUserData,
  consultBlockDayInDB,
  consultSAP,
  consultUserEmailInDB,
  consultDocs,
  consultObjetives,
  getUsersWithSolicitudes,
  fetchPetitionById,
  fetchPlaneProperties,
  fetchMelDisciplines,
  fetchMelDeliverableType,
  consultBluePrints,
} from 'src/context/firebase-functions/firestoreQuerys'

import { uploadFilesToFirebaseStorage, updateUserProfile } from 'src/context/firebase-functions/storageFunctions'

const FirebaseContextProvider = props => {
  // ** Hooks
  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // ** Variables
  const auth = getAuth(app)

  useEffect(() => {
    const auth = getAuth(app)

    const unsubscribe = onAuthStateChanged(auth, async authState => {
      if (!authState) {
        setAuthUser(null)
        setLoading(false)
      } else {
        setLoading(true)
        const formattedUser = await formatAuthUser(authState)
        setAuthUser(formattedUser)
        setLoading(false)
      }
    })

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
    updateDocs,
    updateUserPhone,
    useSnapshot,
    signAdminFailure,
    getRoleData,
    getData,
    getUserData,
    uploadFilesToFirebaseStorage,
    blockDayInDatabase,
    consultBlockDayInDB,
    consultSAP,
    consultUserEmailInDB,
    consultDocs,
    consultObjetives,
    getUsersWithSolicitudes,
    signGoogle,
    generateBlueprint,
    useBlueprints,
    fetchPetitionById,
    fetchPlaneProperties,
    updateBlueprint,
    addDescription,
    fetchMelDisciplines,
    fetchMelDeliverableType,
    generateBlueprintCodeClient,
    generateTransmittalCounter,
    updateSelectedDocuments,
    consultBluePrints,
    deleteCurrentUser
  }

  return <FirebaseContext.Provider value={value}>{props.children}</FirebaseContext.Provider>
}

export default FirebaseContextProvider

// ** Custom hook para acceder a estas funciones

export const useFirebase = () => useContext(FirebaseContext)
