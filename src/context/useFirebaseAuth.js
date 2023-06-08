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
  where,
  orderBy
} from 'firebase/firestore'

import { getAuth, signOut, deleteUser } from 'firebase/auth'
import { getStorage, ref, uploadString } from 'firebase/storage'

// ** Next Imports
import { useRouter } from 'next/router'

// ** Crea contexto
export const FirebaseContext = createContext()

// ** Genera contraseña unica y aleatoria
const generatorPassword = require('generate-password')

// ** Trae funcion que valida los campos del registro
import { registerValidator } from './helperRegisterValidator'
import { unixToDate } from 'src/@core/components/unixToDate'

const FirebaseContextProvider = props => {
  // ** Hooks
  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [oldEmail, setOldEmail] = useState('')
  const [newUID, setNewUID] = useState('')

  const router = useRouter()

  // ** Variables
  const auth = getAuth(app)
  const storage = getStorage()

  // ** Consultar rol del usuario

  const getData = async id => {
    const docRef = doc(db, 'users', id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data()
    } else {
      return undefined
    }
  }

  const formatAuthUser = async user => {
    const data = await getData(user.uid)

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      pfp: user.photoURL,
      phone: data ? data.phone || 'No definido' : 'No disponible',
      role: data ? data.role || 'No definido' : 'No disponible',
      plant: data ? data.plant || 'No definido' : 'No disponible',
      shift: data ? data.shift || 'No definido' : 'No disponible',
      company: data ? data.company || 'No definido' : 'No disponible',
      contop: data ? data.contop || 'No definido' : 'No disponible',
      opshift: data ? data.opshift || 'No definido' : 'No disponible'
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

  // Recuperar password (envia cooreo)
  const resetPassword = email => {
    return Firebase.auth()
      .sendPasswordResetEmail(email)
      .catch(err => {
        if (err.code === 'auth/user-not-found') {
          throw new Error('Este usuario no se encuentra registrado')
        } else {
          throw new Error('Error al restablecer la contraseña')
        }
      })
  }

  // Actualizar password (para actualizar desde mi perfil)
  const updatePassword = async password => {
    return await Firebase.auth().updatePassword(password)
  }

  // ** Inicio de sesión
  const signInWithEmailAndPassword = (email, password) => {
    return Firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .catch(err => {
        switch (err.code) {
          case 'auth/wrong-password':
            throw new Error('Contraseña incorrecta, intente de nuevo')
          case 'auth/user-not-found':
            throw new Error('Este usuario no se encuentra registrado')
          default:
            throw new Error('Error al iniciar sesión')
        }
      })
  }

  // ** Actualiza Perfil de usuario
  const updateUserProfile = async inputValue => {
    const user = authUser.uid

    const newPhoto = inputValue

    if (newPhoto !== null && newPhoto != '') {
      console.log(newPhoto, 'PARAMETROS')
      console.log(`fotoPerfil/${user}/${newPhoto.data}`)

      //const ref = Firebase.storage().ref(`fotoPerfil/${user}/${newPhoto.name}`)
      const storageRef = ref(storage, `fotoPerfil/${user}/nuevaFoto`)

      uploadString(storageRef, newPhoto, 'data_url')
        .then(snapshot => {
          console.log('Uploaded a data_url string!')
        })
        .catch(error => alert(error, 'errordesubida'))
    }
  }

  // ** Registro de usuarios
  const createUser = async values => {
    const { name, email } = values
    try {
      registerValidator(values)

      // Guarda correo del admin
      setOldEmail(authUser.email)

      // Crea contraseña alfanumerica de 10 digitos
      // Se comenta esta funcion para posterior uso en producción
      /* const newPassword = generatorPassword.generate({
        length: 10,
        numbers: true
      }) */

      // Crea usuario
      try {
        await Firebase.auth().createUserWithEmailAndPassword(email, 'password') // Reemplazar 'password' por newPassword
      } catch (createError) {
        console.log('Error al crear el usuario:', createError)
        throw createError // Re-lanzar el error para que se pueda capturar en un nivel superior si es necesario
      }

      // Envía correo para cambiar la contraseña
      // resetPassword(email)

      // Guardar uid en un estado
      setNewUID(Firebase.auth().currentUser.uid)

      // Actualiza usuario
      try {
        await updateProfile(Firebase.auth().currentUser, {
          // Hardcoded pero pueden -deben- pasársele argumentos cuando la usemos
          displayName: name,
          photoURL: ''
        })
        console.log(Firebase.auth().currentUser)
      } catch (updateError) {
        console.log('Error al actualizar el perfil:', updateError)
        throw updateError // Re-lanzar el error para que se pueda capturar en un nivel superior si es necesario
      }
    } catch (error) {
      if (error.message === 'Firebase: Error (auth/email-already-in-use).') {
        throw new Error('El usuario ya se encuentra registrado.')
      } else {
        console.log('Error en datos ingresados:', error)
        throw new Error('Error al crear usuario: ' + error.message)
      }
    }
  }

  const createUserInDatabase = async values => {
    const { name, rut, phone, email, plant, shift, company, role, contop, opshift } = values
    try {
      await setDoc(doc(db, 'users', newUID), {
        name: name,
        email: email,
        rut: rut,
        phone: phone,
        company: company,
        role: role,
        ...(plant && { plant }),
        ...(contop && { contop }),
        ...(shift && { shift }),
        ...(opshift && { opshift })
      })
    } catch (error) {
      console.log(error)
      throw new Error('Error al crear el usuario en la base de datos: ' + error)
    }
  }

  // ** Permite que el admin entre de vuelta y escribe en db
  const signAdminBack = async (values, password) => {
    try {
      await Firebase.auth().signInWithEmailAndPassword(oldEmail, password)
      await createUserInDatabase(values)
      setNewUID('')

      // Realizar acciones adicionales si es necesario

      // Redirigir o realizar otras acciones, como volver a la página de inicio de sesión
      // router.push('/login/');
    } catch (error) {
      console.log(error)
      throw new Error(error)
    }
  }

  async function signAdminFailure() {
    const user = auth.currentUser

    return new Promise(async (resolve, reject) => {
      try {
        await deleteUser(user)
        resolve('Excediste el número de intentos. No se creó ningún usuario.')
      } catch (error) {
        reject(new Error(error))
      }
    })
  }

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
      try {
        const docRef = await addDoc(collection(db, 'solicitudes'), {
          title: values.title,
          user: user.displayName || user.email,
          start: values.start,
          plant: values.plant,
          area: values.area,
          objective: values.objective,
          receiver: values.receiver,
          description: values.description,
          date: Timestamp.fromDate(new Date()),
          uid: user.uid
        })

        /* const newEvent = {
          prevState: 0,
          newState: authUser.role || 'no definido',
          user: Firebase.auth().currentUser.email,
          date: Timestamp.fromDate(new Date())
        }

        // Obtenemos el ID del nuevo documento de solicitud
        const nuevaSolicitudId = docRef.id

        // Creamos un nuevo documento en la subcolección "eventos" con los datos del evento
        const newDocEvent = await addDoc(collection(db, `solicitudes/${nuevaSolicitudId}/events`), newEvent)
        */ // comentado para evitar que se generen 2 eventos iniciales

        // Establecemos los campos adicionales de la solicitud
        await updateDoc(docRef, {
          ...newDoc,
          state: authUser.role || 'no definido'

          //eventoId: newDocEvent.id // Agregamos el ID del evento como campo en la solicitud (opcional)
        })

        console.log('Nueva solicitud creada con éxito.')

        return docRef.id
      } catch (error) {
        console.error('Error al crear la nueva solicitud:', error)
        throw error
      }
    }
  }

  // ** Modifica estado documentos
  const reviewDocs = async (id, approves) => {
    const ref = doc(db, 'solicitudes', id)
    const querySnapshot = await getDoc(ref)

    const prevState = querySnapshot.data().state // 'estado anterior'
    const newState = approves ? authUser.role : 10

    console.log('reviewdocs')

    // Guarda estado anterior, autor y fecha modificación
    const newEvent = {
      prevState,
      newState,
      user: Firebase.auth().currentUser.email,
      userName: Firebase.auth().currentUser.displayName,
      date: Timestamp.fromDate(new Date())
    }

    await updateDoc(ref, {
      state: newState
    })
    await addDoc(collection(db, `solicitudes/${id}/events`), newEvent)
  }

  // ** Modifica otros campos documentos
  const updateDocs = async (id, obj) => {
    const ref = doc(db, 'solicitudes', id)
    const querySnapshot = await getDoc(ref)
    const docSnapshot = querySnapshot.data()
    const prevState = docSnapshot.state // 'estado anterior'
    const userRef = doc(db, 'users', docSnapshot.uid)
    const userQuerySnapshot = await getDoc(userRef)
    const devolutionState = userQuerySnapshot.data().role - 1
    let changedFields = {}
    let prevDoc = {}
    let newState

    for (const key in obj) {
      if (key !== 'start' && key !== 'end' && obj[key] !== docSnapshot[key]) {
        changedFields[key] = obj[key]
        prevDoc[key] = docSnapshot[key]
      }

      if ((key === 'start' || key === 'end') && docSnapshot[key] && obj[key].seconds !== docSnapshot[key].seconds) {
        changedFields[key] = new Date(obj[key]*1000)
        console.log(obj[key])
        prevDoc[key] = docSnapshot[key]
      }


      if (!docSnapshot[key]) {
        changedFields[key] = ( key === 'start' || key === 'end' ) ? new Date(obj[key]*1000) : obj[key]
        prevDoc[key] = 'none'
      }
    }

    if (Object.keys(prevDoc).length > 0) {
      newState = changedFields.start ? devolutionState : authUser.role
      changedFields.state = newState

      const newEvent = {
        prevDoc,
        prevState,
        newState,
        user: Firebase.auth().currentUser.email,
        userName: Firebase.auth().currentUser.displayName,
        date: Timestamp.fromDate(new Date())
      }

      await updateDoc(ref, changedFields)
      await addDoc(collection(db, 'solicitudes', id, 'events'), newEvent)
    }
    if (Object.keys(prevDoc).length === 0) {
      console.log('No se escribió ningún documento')
    }
  }

  // ** Modifica otros campos Usuarios
  const updateUserPhone = async (id, obj) => {
    const ref = doc(db, 'users', id)
    const querySnapshot = await getDoc(ref)

    await updateDoc(ref, { phone: obj })
  }

  // ** Guarda datos contraturno u otros contactos no registrados
  const addNewContact = async values => {
    await setDoc(doc(db, 'contacts', 'test'), values)
  }

  /*
  // Sube documentos
  const uploadFileToStorage = file => {
    const storageRef = storage().ref()
    const fileRef = storageRef.child(file.name)

    return fileRef.put(file)
  }
  */

  // ** Trae colección de eventos
  const useEvents = id => {
    const [data, setData] = useState([])

    useEffect(() => {
      if (authUser && id) {
        const q = query(collection(db, 'solicitudes', id, 'events'), orderBy('date'))

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
    }, [authUser, id])

    return data
  }

  // ** Escucha cambios en los documentos en tiempo real
  const useSnapshot = () => {
    const [data, setData] = useState([])

    useEffect(() => {
      if (authUser) {
        console.log(authUser.role, 'USER PLANT')

        let q

        const getAllDocs = [1, 4, 5, 6, 7, 9]

        if (authUser.role === 2) {
          q = query(collection(db, 'solicitudes'), where('uid', '==', authUser.uid))
        } else if (authUser.role === 3) {
          q = query(collection(db, 'solicitudes'), where('plant', '==', authUser.plant))
        } else {
          q = getAllDocs.includes(authUser.role)
            ? ![1, 9].includes(authUser.role)
              ? query(collection(db, 'solicitudes'), where('state', '>=', authUser.role - 1))
              : query(collection(db, 'solicitudes'))
            : undefined
        }

        const unsubscribe = onSnapshot(q, async querySnapshot => {
          try {
            const allDocs = []

            const promises = querySnapshot.docs.map(async d => {
              const docData = d.data()
              const userSnapshot = await getDoc(doc(db, 'users', docData.uid))
              const name = userSnapshot.data().name
              const newDoc = { ...docData, id: d.id, name }
              allDocs.push(newDoc)
            })

            await Promise.all(promises)

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
    console.log(data)

    return data
  }

  const getRoleData = async role => {
    const docRef = doc(db, 'roles', role)
    const docSnap = await getDoc(docRef)
    let data = docSnap.data()
    data.id = docSnap.id

    return data
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
    getRoleData
  }

  return <FirebaseContext.Provider value={value}>{props.children}</FirebaseContext.Provider>
}

export default FirebaseContextProvider

// ** Custom hook para acceder a estas funciones
export const useFirebase = () => useContext(FirebaseContext)
