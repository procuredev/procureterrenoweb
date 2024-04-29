import { createContext, useContext, useEffect, useState } from 'react'

// ** Firebase Imports
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'
import { app } from 'src/configs/firebase'

// ** Crea contexto
export const FirebaseContext = createContext()

import {
  createUser,
  deleteCurrentUser,
  formatAuthUser,
  resetPassword,
  signAdminBack,
  signAdminFailure,
  signGoogle,
  signInWithEmailAndPassword,
  updatePassword
} from 'src/context/firebase-functions/firebaseFunctions'

import {
  addComment,
  addDescription,
  blockDayInDatabase,
  finishPetition,
  generateBlueprint,
  generateBlueprintCodeClient,
  generateTransmittalCounter,
  newDoc,
  updateBlueprint,
  updateDocs,
  updateSelectedDocuments,
  updateUserData,
  updateUserPhone,
  useBlueprints,
  fetchWeekHoursByType,
  createWeekHoursByType,
  updateWeekHoursByType
} from 'src/context/firebase-functions/firestoreFunctions'

import {
  consultBlockDayInDB,
  consultBluePrints,
  consultDocs,
  consultOT,
  consultObjetives,
  consultSAP,
  consultUserEmailInDB,
  fetchMelDeliverableType,
  fetchMelDisciplines,
  fetchPetitionById,
  fetchPlaneProperties,
  getData,
  getDomainData,
  getUserData,
  getUsersWithSolicitudes,
  subscribeToBlockDayChanges,
  subscribeToPetition,
  subscribeToUserProfileChanges,
  useEvents,
  useSnapshot
} from 'src/context/firebase-functions/firestoreQuerys'

import { updateUserProfile, uploadFilesToFirebaseStorage } from 'src/context/firebase-functions/storageFunctions'

const FirebaseContextProvider = props => {
  // ** Hooks
  const [authUser, setAuthUser] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const storedUser = localStorage.getItem('user')

      return storedUser ? JSON.parse(storedUser) : null
    } else {
      return null
    }
  })
  const [loading, setLoading] = useState(true)
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)
  const [domainDictionary, setDomainDictionary] = useState({})
  const [domainRoles, setDomainRoles] = useState({})

  // ** Variables
  const auth = getAuth(app)

  // Este useEffect manejará los datos del usuario conectado
  useEffect(() => {
    const auth = getAuth(app)

    const unsubscribe = onAuthStateChanged(auth, async authState => {
      if (!authState) {
        setAuthUser(null)
        setLoading(false)
      } else {
        setLoading(true)
        const databaseUserData = await formatAuthUser(authState)
        setAuthUser(databaseUserData)
        localStorage.setItem('user', JSON.stringify(databaseUserData))
        const dictionary = await getDomainData('dictionary')
        setDomainDictionary(dictionary)
        const roles = await getDomainData('roles')
        setDomainRoles(roles)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const value = {
    authUser,
    auth,
    loading,
    isCreatingProfile,
    domainDictionary,
    domainRoles,
    setIsCreatingProfile,
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
    getDomainData,
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
    deleteCurrentUser,
    addComment,
    updateUserData,
    finishPetition,
    subscribeToPetition,
    consultOT,
    subscribeToUserProfileChanges,
    subscribeToBlockDayChanges,
    fetchWeekHoursByType,
    createWeekHoursByType,
    updateWeekHoursByType
  }

  return <FirebaseContext.Provider value={value}>{props.children}</FirebaseContext.Provider>
}

export default FirebaseContextProvider

// ** Custom hook para acceder a estas funciones

export const useFirebase = () => useContext(FirebaseContext)
