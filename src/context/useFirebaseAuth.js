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
    return Firebase.auth().sendPasswordResetEmail(email)
      .catch(err => {
        if (err.code === 'auth/user-not-found') {
          throw new Error('Este usuario no se encuentra registrado')
        } else {
          throw new Error('Error al restablecer la contraseña')
        }
      });
  };

  // Actualizar password (para actualizar desde mi perfil)
  const updatePassword = async password => {
    return await Firebase.auth().updatePassword(password)
  }

  // ** Inicio de sesión
  const signInWithEmailAndPassword = (email, password) => {
    return Firebase.auth().signInWithEmailAndPassword(email, password)
      .catch(err => {
        switch (err.code) {
          case 'auth/wrong-password':
            throw new Error('Contraseña incorrecta, intente de nuevo');
          case 'auth/user-not-found':
            throw new Error('Este usuario no se encuentra registrado');
          default:
            throw new Error('Error al iniciar sesión');
        }
      });
  };

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
        throw createError; // Re-lanzar el error para que se pueda capturar en un nivel superior si es necesario
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
        throw updateError; // Re-lanzar el error para que se pueda capturar en un nivel superior si es necesario
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


  const createUserInDatabase = async (values) => {
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
      console.log(error);
      throw new Error('Error al crear el usuario en la base de datos: ' + error);
    }
  }

  // ** Permite que el admin entre de vuelta y escribe en db
  const signAdminBack = async (values, password) => {

    try {
      await Firebase.auth().signInWithEmailAndPassword(oldEmail, password)
      await createUserInDatabase(values);
      setNewUID('');

      // Realizar acciones adicionales si es necesario

      // Redirigir o realizar otras acciones, como volver a la página de inicio de sesión
      // router.push('/login/');
    } catch (error) {
      console.log(error);
      throw new Error(error)
    }
  }


  async function signAdminFailure() {
    const user = auth.currentUser;

    return new Promise(async (resolve, reject) => {
      try {
        await deleteUser(user);
        resolve('Excediste el número de intentos. No se creó ningún usuario.');
      } catch (error) {
        reject(new Error(error));
      }
    });
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
      const docRef = await addDoc(collection(db, 'solicitudes'), {
        title: values.title,
        user: user.email,
        start: values.start,
        area: values.area,
        objective: values.objective,
        receiver: values.receiver,
        description: values.description,
        date: Timestamp.fromDate(new Date()),
        uid: user.uid,
        plant: values.plant,
        petitioner: values.petitioner,
        opshift: values.opshift,
        type:values.type,
        sap: values.sap,
        deliverable: values.deliverable
      })
      console.log('Document written with ID: ', docRef.id)

      return docRef.uid
    }
  }

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

  // ** Modifica otros campos Usuarios
  const updateUserPhone = async (id, obj) => {
    const ref = doc(db, 'users', id)
    const querySnapshot = await getDoc(ref)

    await updateDoc(ref, { phone: obj })
  }

  // ** Modifica otros campos documentos
  const updateDocs = async (id, obj) => {
    const ref = doc(db, 'users', id)
    const querySnapshot = await getDoc(ref)

    // Save previous version of document
    const prevDoc = querySnapshot.data()
    const newEvent = { prevDoc, author: Firebase.auth().currentUser.email, date: Timestamp.fromDate(new Date()) }
    await updateDoc(ref, obj)
  }

  // ** Guarda datos contraturno u otros contactos no registrados
  const addNewContact = async (values) => {
    await setDoc(doc(db, 'contacts', 'test'), values);

  }

  /*
  // Sube documentos
  const uploadFileToStorage = file => {
    const storageRef = storage().ref()
    const fileRef = storageRef.child(file.name)

    return fileRef.put(file)
  }
  */

  // ** Escucha cambios en los documentos en tiempo real
  const useSnapshot = () => {
    const [data, setData] = useState([])

    useEffect(() => {
      if (authUser) {
        const q =
          authUser.role === 'admin'
            ? query(collection(db, 'solicitudes'))
            : query(collection(db, 'solicitudes'), where('uid', '==', authUser.uid))

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
    auth,
    addNewContact,
    loading,
    signOut,
    resetPassword,
    updatePassword,
    authUser,
    signInWithEmailAndPassword,
    createUser,
    updateUserProfile,
    signAdminBack,
    newDoc,
    reviewDocs,
    updateDocs,
    updateUserPhone,
    useSnapshot,
    signAdminFailure
  }

  return <FirebaseContext.Provider value={value}>{props.children}</FirebaseContext.Provider>
}

export default FirebaseContextProvider

// ** Custom hook para acceder a estas funciones
export const useFirebase = () => useContext(FirebaseContext)
