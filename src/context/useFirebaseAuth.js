import React, { createContext, useState, useEffect, useContext } from 'react'

// ** Firebase Imports
import { updateProfile } from 'firebase/auth'
import { Firebase, db, app } from 'src/configs/firebase'
import {
  collection,
  doc,
  addDoc,
  setDoc,
  Timestamp,
  query,
  getDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  where
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// ** Next Imports
import { useRouter } from 'next/router'

// ** Crea contexto
export const FirebaseContext = createContext()

const FirebaseContextProvider = props => {
  // ** Hooks
  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [oldEmail, setOldEmail] = useState('')
  const [newUID, setNewUID] = useState('')
  const [dialog, setDialog] = useState(false)

  const router = useRouter()

  // ** Variables
  const auth = getAuth(app)

  // ** Consultar rol del usuario

  const getRole = async id => {
    const docRef = doc(db, 'users', id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data().role
    } else {
      return undefined
    }
  }

  const formatAuthUser = async user => {
    const role = await getRole(user.uid)

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      pfp: user.photoURL,
      role: role
    }
  }

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

  //**  Resetea user
  const resetUser = () => {
    setAuthUser(null)
    setLoading(true)
  }

  // ** Inicio de sesión
  const signInWithEmailAndPassword = (email, password) => {
    Firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .then(user => console.log(user))
      .catch(err => console.log(err))
  }

  // ** Registro de usuarios
  const createUser = async values => {
    const { name, email } = values
    try {
      // Guarda correo del admin
      setOldEmail(authUser.email)

      // Crea usuario
      await Firebase.auth().createUserWithEmailAndPassword(email, 'password')
      setDialog(true)

      // Guardar uid en un estado
      setNewUID(Firebase.auth().currentUser.uid)

      // Actualiza usuario
      updateProfile(Firebase.auth().currentUser, {
        // Hardcoded pero pueden -deben- pasársele argumentos cuando la usemos
        displayName: name,
        photoURL: ''
      })
        .then(() => {
          console.log(Firebase.auth().currentUser)

          // Profile updated!
          // ...
        })
        .catch(error => {
          // An error occurred
          // ...
        })
    } catch (error) {
      console.log(error)
      window.alert(error)
    }
  }

  // ** Permite que el admin entre de vuelta
  const signAdminBack = async (values, password) => {
    const { name, rut, phone, email, plant, shift, company, role, contop, opshift } = values

    try {
      await Firebase.auth().signInWithEmailAndPassword(oldEmail, password)
      setDialog(false)

      // Guardar info en bd
      await setDoc(doc(db, 'users', newUID), {
        name: name,
        email: email,
        rut: rut,
        phone: phone,
        plant: plant,
        shift: shift,
        company: company,
        role: role,
        contop: contop,
        opshift: opshift
      })

      setNewUID('')
    } catch (error) {
      console.log(error)
      window.alert(error)
      setDialog(false)

      // Firebase.auth().signOut().then(resetUser).then(router.push('/login/'))
    }
  }

  //     .then((userCredential) => {

  //       //Admin de vuelta

  //       //Cierra dialog
  //     })
  //     .catch((err) => {
  //     });
  // }

  // Recuperar password
  const resetPassword = email => {
    return Firebase.auth().sendPasswordResetEmail(email)
  }

  // Actualizar password
  const updatePassword = password => {
    return Firebase.auth().updatePassword(password)
  }

  // ** Log out
  const signOut = () => Firebase.auth().signOut().then(resetUser).then(router.push('/login/'))

  // ** Observador cambios de estado de Firebase
  useEffect(() => {
    setAuthUser(null)
    const unsubscribe = Firebase.auth().onAuthStateChanged(authStateChanged)

    return () => unsubscribe()
  }, [])

  // ** Escribe documentos en Firestore Database
  const newDoc = async values => {
    const user = Firebase.auth().currentUser
    if (user !== null) {
      const docRef = await addDoc(collection(db, 'solicitudes'), {
        title: values.title,
        user: user.email,
        start: values.start,
        area: values.area,
        objective: values.objective,
        receiver: values.receiver,
        description: values.description,
        date: Timestamp.fromDate(new Date()),
        uid: user.uid
      })
      console.log('Document written with ID: ', docRef.id)

      return docRef.uid
    }
  }

  // ** Evita que el no logueado esté en home
  /* Pendiente revisión.
  Este era el hook que daba problemas cuando uno recargaba la página.
   useEffect(() => {
     if (authUser === null && router.asPath !== ('/login/')) {
       router.replace('/login/')
     }

   }, [authUser, router])
  */

  // ** Modifica estado documentos
  const reviewDocs = async (id, approves) => {
    // If approves is true, state+1, if false back to 0
    const ref = doc(db, 'solicitudes', id)
    const querySnapshot = await getDoc(ref)
    const prevState = querySnapshot.data().state
    const newState = approves ? prevState + 1 : 9

    // const newState = prevState+1

    // Guarda estado anterior, autor y fecha modificación
    const newEvent = {
      prevState,
      newState,
      author: Firebase.auth().currentUser.email,
      date: Timestamp.fromDate(new Date())
    }

    await updateDoc(ref, {
      events: arrayUnion(newEvent),
      state: newState
    })
  }

  // ** Modifica otros campos documentos
  const updateDocs = async (id, obj) => {
    const ref = doc(db, 'solicitudes', id)
    const querySnapshot = await getDoc(ref)

    // Save previous version of document
    const prevDoc = querySnapshot.data()
    const newEvent = { prevDoc, author: Firebase.auth().currentUser.email, date: Timestamp.fromDate(new Date()) }
    await updateDoc(ref, obj)
  }

  // ** Escucha cambios en los documentos en tiempo real
  const useSnapshot = () => {
    const [data, setData] = useState([])

    useEffect(() => {
      if (authUser) {
        const q = authUser.role === 'admin' ? query(collection(db, 'solicitudes')) : query(collection(db, 'solicitudes'), where("uid", "==", authUser.uid))

        const unsubscribe = onSnapshot(q, querySnapshot => {
          try {
            const allDocs = []

            // Una llamada inicial con la devolución de llamada que proporcionas crea una instantánea del documento de inmediato con los contenidos actuales de ese documento.
            // Después, cada vez que cambian los contenidos, otra llamada actualiza la instantánea del documento.

            querySnapshot.forEach(doc => {
              allDocs.push({ ...doc.data(), id: doc.id })
            })
            setData(allDocs)
          } catch (error) {
            console.error('Error al obtener los documentos de Firestore: ', error)

            // Aquí puedes mostrar un mensaje de error
          }
        })

        // Devuelve una función de limpieza que se ejecuta al desmontar el componente
        return () => unsubscribe()
      }
    }, [authUser])

    return data
  }

  const value = {
    authUser,
    dialog,
    auth,
    loading,
    signOut,
    resetPassword,
    updatePassword,
    authUser,
    signInWithEmailAndPassword,
    createUser,
    signAdminBack,
    newDoc,
    reviewDocs,
    updateDocs,
    useSnapshot
  }

  return <FirebaseContext.Provider value={value}>{props.children}</FirebaseContext.Provider>
}

export default FirebaseContextProvider

// ** Custom hook para acceder a estas funciones
export const useFirebase = () => useContext(FirebaseContext)
