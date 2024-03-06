import { createContext, useContext, useEffect, useState } from 'react'

// ** Firebase Imports
import { getAuth } from 'firebase/auth'
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
  signOut,
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
  useBlueprints
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
  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)
  const [domainDictionary, setDomainDictionary] = useState({})
  const [domainRoles, setDomainRoles] = useState({})
  const [userInDatabase, setUserInDatabase] = useState(null)

  // ** Variables
  const auth = getAuth(app)

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const userData = localStorage.getItem('user')
  //       const userDataObject = JSON.parse(userData)
  //       console.log(userDataObject)

  //       if (userDataObject) {
  //         let userDataBaseInfo
  //         let promiseResolved = false // Variable para controlar si la promesa se ha completado

  //         // Realiza la llamada asíncrona y espera a que se resuelva la promesa
  //         await formatAuthUser(userDataObject).then(data => {
  //           userDataBaseInfo = data // Asigna el resultado de la promesa a userDataBaseInfo
  //           promiseResolved = true // Marca que la promesa se ha completado
  //         })

  //         // Evalúa el if solo si la promesa se ha completado
  //         if (promiseResolved && userDataBaseInfo !== userDataObject) {
  //           console.log('Hola')
  //           localStorage.setItem('user', JSON.stringify(userDataBaseInfo))
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error al obtener la información del usuario desde la base de datos:', error)
  //     }
  //   }

  //   fetchUserData() // Llama a la función fetchUserData dentro de useEffect
  // }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener los datos del usuario del localStorage
        const userData = localStorage.getItem('user')
        const userDataObject = JSON.parse(userData)

        // Obtener los datos del usuario de la base de datos
        const databaseUserData = await formatAuthUser(userDataObject)

        // Si los datos del usuario en el localStorage y en la base de datos son diferentes, sobrescribe los datos locales con los datos de la base de datos
        if (JSON.stringify(userDataObject) !== JSON.stringify(databaseUserData)) {
          console.log('Hubo una actualización de datos en Firestore')
          localStorage.setItem('user', JSON.stringify(databaseUserData))
          // Actualiza el estado con los datos del usuario
          setAuthUser(databaseUserData)
        } else {
          // Actualiza el estado con los datos del usuario
          setAuthUser(JSON.parse(localStorage.getItem('user')))
        }

        // Obtener y establecer los datos del dominio (dictionary y roles)
        const [dictionaryData, rolesData] = await Promise.all([getDomainData('dictionary'), getDomainData('roles')])
        setDomainDictionary(dictionaryData)
        setDomainRoles(rolesData)

        setLoading(false) // Establece isLoading en false cuando todas las operaciones estén completas
      } catch (error) {
        console.error('Error al obtener los datos:', error)
        setLoading(false) // Asegúrate de establecer isLoading en false incluso en caso de error
      }
    }

    fetchData() // Llama a la función fetchData dentro de useEffect
  }, [])

  const value = {
    authUser,
    auth,
    loading,
    isCreatingProfile,
    domainDictionary,
    domainRoles,
    setIsCreatingProfile,
    resetPassword,
    updatePassword,
    signInWithEmailAndPassword,
    signOut,
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
    subscribeToBlockDayChanges
  }

  return <FirebaseContext.Provider value={value}>{props.children}</FirebaseContext.Provider>
}

export default FirebaseContextProvider

// ** Custom hook para acceder a estas funciones

export const useFirebase = () => useContext(FirebaseContext)
