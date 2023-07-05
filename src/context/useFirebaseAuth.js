import React, { createContext, useState, useEffect, useContext } from 'react'

import { getUnixTime } from 'date-fns'

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
  getDocs,
  updateDoc,
  arrayUnion,
  onSnapshot,
  where,
  orderBy,
  limit,
  runTransaction
} from 'firebase/firestore'

import { getAuth, signOut, deleteUser } from 'firebase/auth'
import { getStorage, ref, uploadString, getDownloadURL, uploadBytes } from 'firebase/storage'

// ** Next Imports
import { useRouter } from 'next/router'

// ** Crea contexto
export const FirebaseContext = createContext()

// ** Genera contraseña unica y aleatoria
const generatorPassword = require('generate-password')

// ** Trae funcion que valida los campos del registro
import { registerValidator } from './helperRegisterValidator'
import { solicitudValidator } from './helperSolicitudValidator'
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
      pfp: data ? data.urlFoto || 'No definido' : 'No disponible',
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
    try {
      const user = authUser.uid
      const newPhoto = inputValue

      if (newPhoto !== null && newPhoto !== '') {
        const storageRef = ref(storage, `fotoPerfil/${user}/nuevaFoto`)

        try {
          await uploadString(storageRef, newPhoto, 'data_url')
          console.log('Uploaded a data_url string!')

          const downloadURL = await getDownloadURL(storageRef)

          // Actualizar el documento del usuario con la nueva URL de la foto
          await updateDoc(doc(db, 'users', user), { urlFoto: downloadURL })
          console.log('URL de la foto actualizada exitosamente')
        } catch (error) {
          console.error('Error al subir la imagen:', error)
        }
      }
    } catch (error) {
      console.error('Error al actualizar el perfil de usuario:', error)
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

  const createUserInDatabase = values => {
    const { name, rut, phone, email, plant, shift, company, role, opshift, urlFoto } = values

    const photoURL = Firebase.auth().currentUser.photoURL

    return new Promise(async (resolve, reject) => {
      try {
        await setDoc(doc(db, 'users', newUID), {
          name: name,
          email: email,
          rut: rut,
          phone: phone,
          company: company,
          role: role,
          ...(plant && { plant }),
          ...(shift && { shift }),
          ...(opshift && { opshift }),
          photoURL: photoURL
        })

        resolve('Usuario creado exitosamente en la base de datos')
      } catch (error) {
        console.log(error)
        reject(new Error('Error al crear el usuario en la base de datos: ' + error))
      }
    })
  }

  // ** Permite que el admin entre de vuelta y escribe en db
  const signAdminBack = async (values, password) => {
    try {
      await Firebase.auth().signInWithEmailAndPassword(oldEmail, password)
      const successMessage = await createUserInDatabase(values)

      setNewUID('')

      // Realizar acciones adicionales si es necesario

      return successMessage // Retornar el mensaje de éxito
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
    solicitudValidator(values)
    const user = Firebase.auth().currentUser
    if (user !== null) {
      try {
        // Aquí 'counters' es una colección y 'requestCounter' es un documento específico en esa colección
        const counterRef = doc(db, 'counters', 'requestCounter')

        // requestNumber hará una 'Transaccion' para asegurarse de que no existe otro 'n_request' igual. Para ello existirá un contador en 'counters/requestCounter'
        const requestNumber = await runTransaction(db, async transaction => {
          // Se hace la transacción con el documento 'requestCounter'
          const counterSnapshot = await transaction.get(counterRef)

          // Se inicializa la variable newCounter, que será tipo number, que será el contador de solicitudes almacenado en 'counters/requestCounter'
          let newCounter

          // Si el documento 'requestCounter' no existe, se inicializa en 1, de lo contrario se incrementa en 1
          if (!counterSnapshot.exists) {
            newCounter = 1
          } else {
            newCounter = counterSnapshot.data().counter + 1
          }

          // Se almacena en 'counters/requestCounter' el número actual del contador
          transaction.set(counterRef, { counter: newCounter })

          return newCounter
        })

        const docRef = await addDoc(collection(db, 'solicitudes'), {
          title: values.title,
          user: user.displayName,
          userEmail: user.email,
          start: values.start,
          plant: values.plant,

          //contOp: values.contOp,
          area: values.area,
          objective: values.objective,
          receiver: values.receiver,
          description: values.description,
          date: Timestamp.fromDate(new Date()),
          uid: user.uid,
          type: values.type,
          deliverable: values.deliverable,
          petitioner: values.petitioner,
          opshift: values.opshift,
          sap: values.sap,
          n_request: requestNumber
        })

        // Establecemos los campos adicionales de la solicitud
        await updateDoc(docRef, {
          ...newDoc,
          state: authUser.role || 'no definido'

        })

        // Se envia email a quienes corresponda
        //sendEmailNewPetition(user, values, docRef.id, requestNumber)

        console.log('Nueva solicitud creada con éxito.')

        return docRef
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
    const docSnapshot = querySnapshot.data()
    const userRef = doc(db, 'users', docSnapshot.uid)
    const userQuerySnapshot = await getDoc(userRef)
    const devolutionState = userQuerySnapshot.data().role - 1

    const eventQuery = query(collection(db, `solicitudes/${id}/events`), orderBy('date', 'desc'), limit(1))
    const eventQuerySnapshot = await getDocs(eventQuery)
    const eventDocs = eventQuerySnapshot.docs

    const prevState = querySnapshot.data().state // 'estado anterior'
    let newState
    if (authUser.role === 2) {
      newState = approves ? (eventDocs[0].data().prevDoc && eventDocs[0].data().prevState === 2 ? 4 : 6) : 10
    } else if (authUser.role === 3) {
      if (eventDocs.lenght > 0) {
        newState = approves
          ? eventDocs[0].data().prevDoc && eventDocs[0].data().prevState === 5
            ? 6
            : authUser.role + 1
          : 10
      } else {
        newState = approves ? authUser.role + 1 : 10
      }
    } else if (authUser.role === 6) {
      console.log(eventDocs)
      if (eventDocs.length > 0) {
        const lastEvent = eventDocs[0].data()
        console.log(lastEvent)
        newState = approves
          ? eventDocs[0].data().prevDoc && eventDocs[0].data().prevDoc.start
            ? devolutionState
            : authUser.role
          : 10
      } else {
        console.log('No se encontraron eventos')
        newState = approves ? authUser.role : 10
      }
    } else {
      newState = approves ? authUser.role : 10
    }

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

    // Se envía e-mail al prevState y al newState
    //sendEmailWhenReviewDocs(newEvent.prevState, newEvent.newState, docSnapshot.uid, id)
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
    let newEvent = {}

    const eventQuery = query(collection(db, `solicitudes/${id}/events`), orderBy('date', 'desc'), limit(1))
    const eventQuerySnapshot = await getDocs(eventQuery)
    const eventDocs = eventQuerySnapshot.docs

    for (const key in obj) {
      if (key !== 'start' && key !== 'end' && obj[key] !== docSnapshot[key]) {
        changedFields[key] = obj[key]
        prevDoc[key] = docSnapshot[key]
      }

      if ((key === 'start' || key === 'end') && docSnapshot[key] && obj[key].seconds !== docSnapshot[key].seconds) {
        changedFields[key] = new Date(obj[key] * 1000)
        console.log(obj[key])
        prevDoc[key] = docSnapshot[key]
      }

      if (!docSnapshot[key]) {
        changedFields[key] = key === 'start' || key === 'end' ? new Date(obj[key] * 1000) : obj[key]
        prevDoc[key] = 'none'
      }
    }

    if (authUser.role === 3 && obj.start !== docSnapshot.start.seconds) {
      newState = devolutionState
      changedFields.state = newState
    } else if (authUser.role === 5 && Object.keys(prevDoc).length > 0) {
      // si planificador cambia de fecha, solictud cambia state a 5
      newState = authUser.role
      changedFields.state = newState
    } else if (authUser.role === 6 && eventDocs.length > 0) {
      newState =
        eventDocs[0].data().prevDoc && eventDocs[0].data().prevDoc.start
          ? eventDocs[0].data().prevDoc.start.seconds === obj.start
            ? authUser.role
            : devolutionState
          : obj.start !== docSnapshot.start.seconds
          ? devolutionState
          : authUser.role

      changedFields.state = newState
    } else {
      newState = authUser.role
      changedFields.state = newState
    }
    newEvent = {
      prevDoc,
      prevState,
      newState,
      user: Firebase.auth().currentUser.email,
      userName: Firebase.auth().currentUser.displayName,
      date: Timestamp.fromDate(new Date())
    }

    if (Object.keys(prevDoc).length === 0) {
      console.log('No se escribió ningún documento')
    }
    if (Object.keys(changedFields).length > 0) {
      await updateDoc(ref, changedFields)
    }
    await addDoc(collection(db, 'solicitudes', id, 'events'), newEvent)

    // Se envía e-mail al prevState y al newState
    //sendEmailWhenReviewDocs(newEvent.prevState, newEvent.newState, docSnapshot.uid, id)
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
  const useSnapshot = (datagrid = false) => {
    const [data, setData] = useState([])

    useEffect(() => {
      if (authUser) {
        console.log(authUser.role, 'USER PLANT')

        let q = query(collection(db, 'solicitudes'))

        const getAllDocs = [1, 4, 5, 6, 7, 9]

        if (datagrid) {
          switch (authUser.role) {
            case 2:
              q = query(collection(db, 'solicitudes'), where('uid', '==', authUser.uid))
              break
            case 3:
              q = query(collection(db, 'solicitudes'), where('plant', '==', authUser.plant))
              break
            case 5:
              q = query(collection(db, 'solicitudes'), where('state', '>=', authUser.role - 2))
              break
            default:
              if (getAllDocs.includes(authUser.role) && ![1, 9].includes(authUser.role)) {
                q = query(collection(db, 'solicitudes'), where('state', '>=', authUser.role - 1))
              }
              break
          }
        }

        const unsubscribe = onSnapshot(q, async querySnapshot => {
          try {
            const allDocs = []

            const promises = querySnapshot.docs.map(async d => {
              const docData = d.data()
              const userSnapshot = await getDoc(doc(db, 'users', docData.uid))
              const name = userSnapshot.data() ? userSnapshot.data().name : 'No definido'
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

  // trae los usuarios con el rol 3 que pertenecen a una planta
  // trae los usuarios con el rol 2 que pertenece a una planta con turno opuesto al pasado por parametro
  const getUsers = async (plant, shift = '') => {
    const q = shift
      ? query(collection(db, 'users'), where('plant', '==', plant), where('shift', '!=', shift), where('role', '==', 2))
      : query(collection(db, 'users'), where('plant', '==', plant), where('role', '==', 3))

    const querySnapshot = await getDocs(q)
    const allDocs = []

    querySnapshot.forEach(doc => {
      // doc.data() is never undefined for query doc snapshots
      allDocs.push({ ...doc.data(), id: doc.id })
    })

    return allDocs
  }

  // trae los usuarios con el rol 2 que pertenece a una planta
  const getPetitioner = async plant => {
    let allDocs = []
    if (authUser.plant === 'allPlants') {
      const q = query(collection(db, 'users'), where('plant', '==', plant), where('role', '==', 2))

      const querySnapshot = await getDocs(q)

      querySnapshot.forEach(doc => {
        // doc.data() is never undefined for query doc snapshots
        allDocs.push({ ...doc.data(), id: doc.id })
        console.log(allDocs)
      })
    } else if (authUser.role === 3) {
      const q = query(collection(db, 'users'), where('plant', '==', plant))

      const querySnapshot = await getDocs(q)

      querySnapshot.forEach(doc => {
        // doc.data() is never undefined for query doc snapshots
        allDocs.push({ ...doc.data(), id: doc.id })
        console.log(allDocs)
      })
    } else {
      const q = onSnapshot(doc(db, 'users', authUser.uid), doc => {
        //console.log('Current data: ', doc.data())
        allDocs.push(doc.data())
      })
    }

    return allDocs
  }

  /// PRUEBA FETCH A TODOS LOS USUARIOS
  const getAllMELUsers = async () => {
    const q = query(collection(db, 'users'), where('company', '==', 'MEL'))
    const querySnapshot = await getDocs(q)
    const allDocs = []

    querySnapshot.forEach(doc => {
      allDocs.push({ ...doc.data(), id: doc.id })
    })

    return allDocs
  }

  const getAllPlantUsers = async plant => {
    const q = query(collection(db, 'users'), where('plant', '==', plant))
    const querySnapshot = await getDocs(q)
    const allDocs = []

    querySnapshot.forEach(doc => {
      allDocs.push({ ...doc.data(), id: doc.id })
    })

    return allDocs
  }

  //si recibe planta (contract operator), trae todos los usuarios con ese valor de planta y rol de cont op

  //si recibe planta y turno, trae todos los usuarios con ese valor de planta y rol de solicitante y turno opuesto

  const uploadFilesToFirebaseStorage = async (files, idSolicitud) => {
    if (files && files.length > 0) {
      try {
        const arrayURL = []

        for (const file of files) {
          const storageRef = ref(storage, `fotosSolicitud/${idSolicitud}/fotos/${file.name}`)

          if (file) {
            // El formato de la cadena de datos es válido, puedes llamar a uploadString
            const snapshot = await uploadBytes(storageRef, file)
            console.log(snapshot, 'Uploaded a data_url string!')

            const downloadURL = await getDownloadURL(storageRef)

            arrayURL.push(downloadURL)
          } else {
            // El formato de la cadena de datos no es válido, muestra un mensaje de error o maneja la situación según sea necesario
            console.log('El objeto no tiene un formato de URL de datos válido.')
          }
        }

        const solicitudRef = doc(db, 'solicitudes', idSolicitud)
        const solicitudDoc = await getDoc(solicitudRef)

        if (solicitudDoc.exists()) {
          const fotos = arrayURL || []

          await updateDoc(solicitudRef, { fotos })
          console.log('URL de la foto actualizada exitosamente')
        } else {
          console.error('El documento de la solicitud no existe')
        }
      } catch (error) {
        console.error('Error al subir la imagen:', error)
      }
    }
  }

    // **INICIO - FUNCIONES CREADAS POR JORGE**

  // Función que busca dentro de la colección indicada y según el campo/field que se indique y que el valor/value sea igual al indicado. Esto retornará el UID de la solicitud.
  const searchbyColletionAndField = async (col, field, value) => {
    // Realiza la consulta según el campo proporcionado
    const q = query(collection(db, col), where(field, '==', value))

    try {
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        console.log(`No se encontró ningún valor en ${col} en el campo ${field}`)

        return null
      } else {
        // Accede al UID de la solicitud encontrada
        const uid = querySnapshot.docs[0].id

        return uid
      }
    } catch (error) {
      console.log('Error al buscar la solicitud: ', error)

      return null
    }
  }

  // Función para enviar emails de forma automática
  const sendEmailNewPetition = async (user, values, reqId, reqNumber) => {
    const collectionRef = collection(db, 'mail') // Se llama a la colección mail de Firestore

    if (user !== null) {
      // Primer caso: enviar email cuando se genera una nueva solicitud.

      if (authUser.role == 2) {
        // Si el usuario tiene rol de Solicitante

        const userContOp = authUser.contop // Se usa el nombre del C.Operator del usuario actual
        const contOpUid = await searchbyColletionAndField('users', 'name', userContOp) // Se usa la función searchbyColletion() para buscar dentro de Firestore el usuario que se llame igual al Contract Operator del usuario
        const dataContOp = await getData(contOpUid) // Para este C.Operator se obtiene su datos de Firestore
        const cOperatorEmail = dataContOp.email // Se selecciona el email del C.Operator

        // 1ro: Email para el solicitante
        try {
          const newDoc = {} // Se genera un elemento vacío
          const addedDoc = await addDoc(collectionRef, newDoc) // Se agrega este elemento vacío a la colección mail
          const mailId = addedDoc.id // Se obtiene el id del elemento recién agregado

          const docRef = doc(collectionRef, mailId) // Se busca la referencia del elemento recién creado con su id

          const fechaCompleta = new Date() // Constante que almacena la fecha en que se genera la solcitud

          // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
          updateDoc(docRef, {
            to: user.email,
            cc: cOperatorEmail,
            date: fechaCompleta,
            req: reqId,
            emailType: 'NewRequest',
            message: {
              subject: `Solicitud de levantamiento: N°${reqNumber} - ${values.title}`,
              html: `
                <h2>Estimad@ ${user.displayName}:</h2>
                <p>Usted ha generado una solicitud de trabajo el día ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}. A continuación puede encontrar el detalle de la solicitud:</p>
                <table style="width:100%;">
                  <tr>
                    <td style="text-align:left; padding-left:15px; width:20%;"><strong>N° Solicitud:</strong></td>
                    <td style="text-align:left; width:80%;">${reqNumber}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Título:</strong></td>
                    <td>${values.title}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Fecha de inicio de levantamiento:</strong></td>
                    <td>${values.start.toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Planta:</strong></td>
                    <td>${values.plant}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Área:</strong></td>
                    <td>${values.area}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>N° SAP:</strong></td>
                    <td>${values.sap}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Tipo de trabajo:</strong></td>
                    <td>${values.type}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Tipo de levantamiento:</strong></td>
                    <td>${values.objective}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Entregables esperados:</strong></td>
                    <td>${values.deliverable.join(', ')}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Destinatarios:</strong></td>
                    <td>${values.receiver.map(receiver => receiver.email).join(', ')}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Descripción del requerimiento:</strong></td>
                    <td>${values.description}</td>
                  </tr>
                </table
                <p>Ahora deberá esperar la aprobación de ${userContOp}.</p>
                <p>Para mayor información revise la solicitud en nuestra página web</p>
                <p>Saludos,<br>Procure Terreno Web</p>
                `
            }
          })
          console.log('E-mail a Solicitante de nueva solicitud enviado con éxito.')
        } catch (error) {
          console.error('Error al enviar email:', error)
          throw error
        }
      } else if (authUser.role == 3) {
        // Si el usuario tiene rol de Contract Operator

        const cOwnerUid = await searchbyColletionAndField('users', 'role', 4) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del C.Owner
        const dataContOwner = await getData(cOwnerUid) // Para el C.Owner se obtiene su datos de Firestore
        const cOwnerEmail = dataContOwner.email // Se selecciona el email del C.Owner

        const petitionerName = values.petitioner // Se rescata el nombre del campo "Solicitiante" en Nueva Solicitud
        const petitionerUid = await searchbyColletionAndField('users', 'name', petitionerName) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del solicitante indicado en el campo "Solicitante"
        const dataPetitioner = await getData(petitionerUid) // Para el solicitante indicado en el campo "Solicitante" se obtiene su datos de Firestore
        const petitionerEmail = dataPetitioner.email // Se selecciona el email del solicitante indicado en el campo "Solicitante"

        const plannerUid = await searchbyColletionAndField('users', 'role', 5) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del C.Owner
        const dataPlanner = await getData(plannerUid) // Para el C.Owner se obtiene su datos de Firestore
        const plannerEmail = dataPlanner.email // Se selecciona el email del C.Owner

        // 1ro: Email para el usuario que generó la solicitud (en este caso es el C.Operator)
        try {
          const newDoc = {} // Se genera un elemento vacío
          const addedDoc = await addDoc(collectionRef, newDoc) // Se agrega este elemento vacío a la colección mail
          const mailId = addedDoc.id // Se obtiene el id del elemento recién agregado

          const docRef = doc(collectionRef, mailId) // Se busca la referencia del elemento recién creado con su id

          const fechaCompleta = new Date() // Constante que almacena la fecha en que se genera la solcitud

          // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
          updateDoc(docRef, {
            to: user.email,
            cc: [petitionerEmail, cOwnerEmail, plannerEmail],
            date: fechaCompleta,
            req: reqId,
            emailType: 'NewRequest',
            message: {
              subject: `Solicitud de levantamiento: N°${reqNumber} - ${values.title}`,
              html: `
                <h2>Estimad@ ${user.displayName}:</h2>
                <p>Usted ha generado una solicitud de trabajo el día ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}. A continuación puede encontrar el detalle de la solicitud:</p>
                <table style="width:100%;">
                  <tr>
                    <td style="text-align:left; padding-left:15px; width:20%;"><strong>N° Solicitud:</strong></td>
                    <td style="text-align:left; width:80%;">${reqNumber}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Título:</strong></td>
                    <td>${values.title}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Fecha de inicio de levantamiento:</strong></td>
                    <td>${values.start.toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Planta:</strong></td>
                    <td>${values.plant}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Área:</strong></td>
                    <td>${values.area}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Solicitante:</strong></td>
                    <td>${values.petitioner}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>N° SAP:</strong></td>
                    <td>${values.sap}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Tipo de trabajo:</strong></td>
                    <td>${values.type}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Tipo de levantamiento:</strong></td>
                    <td>${values.objective}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Entregables esperados:</strong></td>
                    <td>${values.deliverable.join(', ')}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Destinatarios:</strong></td>
                    <td>${values.receiver.map(receiver => receiver.email).join(', ')}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Descripción del requerimiento:</strong></td>
                    <td>${values.description}</td>
                  </tr>
                </table
                <p>Ahora deberá esperar la aprobación de Procure.</p>
                <p>Para mayor información revise la solicitud en nuestra página web</p>
                <p>Saludos,<br>Procure Terreno Web</p>
                `
            }
          })
          console.log('E-mail a C.Operator de nueva solicitud enviado con éxito.')
        } catch (error) {
          console.error('Error al enviar email:', error)
          throw error
        }
      } else {
        // Si el usuario tiene rol de admin
      }
    }
  }

  // Función que retorna los usuarios que deben ir en copia y el mensaje respectivo
  const getUsersOnCopyAndMessage = (
    requesterRole,
    prevState,
    newState,
    cOperatorEmail,
    cOwnerEmail,
    plannerEmail,
    admContEmail,
    petitionerFieldEmail
  ) => {
    const user = Firebase.auth().currentUser // Se llama al currentUser
    var arrayCC = [] // Se inicializa un array vacío
    var message = '' // Se inicializa un string vacío

    // Si el rol de quien hizo la solicitud es "Solicitante"
    if (requesterRole == 2) {
      // && prevState es 2 && newState es 4 -> Solicitud aceptada por C.Operator
      if (prevState == 2 && newState == 4) {
        arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner y Planificador
        message = `la solicitud ha sido aceptada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 4 && newState es 5 -> Solicitud aceptada por Planificador
      else if (prevState == 4 && newState == 5) {
        arrayCC = [plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, Planificador Y Adm.Contrato
        message = `la solicitud ha sido actualizada por nuestro Planificador ${user.displayName}. Ahora también es posible encontrar la fecha de término del levantamiento y el número de OT` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 5 && newState es 6 -> Solicitud aceptada por Adm.Contrato
      else if (prevState == 5 && newState == 6) {
        arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
        message = `la solicitud ha sido aceptada por Procure` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 2 && newState es 1 -> Solicitud modificada por C.Operator
      else if (prevState == 2 && newState == 1) {
        arrayCC = [cOperatorEmail] // Siginifca que hay que mandarle e-mail al Solicitante y C.Operator
        message = `la solicitud ha sido modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 1 && newState es 4 -> Modificación hecha por C.Operator fue aceptada por Solicitante
      else if (prevState == 1 && newState == 4) {
        arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, Planificador y Adm.Contrato
        message = `la solicitud ha sido modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 1 && newState es 2 -> Modificación hecha por C.Operator o Procure, fue modificada nuevamente por Solicitante
      else if (prevState == 1 && newState == 2) {
        arrayCC = [cOperatorEmail] // Siginifca que hay que mandarle e-mail al Solicitante y C.Operator
        message = `la solicitud ha sido modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 5 && newState es 1 -> Modificación hecha por Procure
      else if (prevState == 5 && newState == 1) {
        arrayCC = [plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, Planificador y Adm.Contrato
        message = `la solicitud ha sido modificada por Procure` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 1 && newState es 6 -> Modificación hecha por Procure fue aceptada por Solicitante
      else if (prevState == 1 && newState == 6) {
        arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
        message = `la solicitud ha sido aceptada por ${user.displayName} y por Procure` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 2 && newState es 10 -> Solicitud rechazada por C.Operator
      else if (prevState == 2 && newState == 10) {
        arrayCC = [cOperatorEmail] // Siginifca que hay que mandarle e-mail al Solicitante y C.Operator
        message = `la solicitud ha sido rechazada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 5 && newState es 10 -> Solicitud rechazada por Adm.Contrato
      else if (prevState == 5 && newState == 10) {
        arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador y Adm.Contrato
        message = `la solicitud ha sido rechazada por nuestro Administrador de Contrato ${user.displayName}` // Se agrega mensaje que irá en el e-mail
      }
    }

    // Si el rol de quien hizo la solicitud es "Contract Operator"
    else if (requesterRole == 3) {
      // && prevState es 3 && newState es 4
      if (prevState == 2 && newState == 4) {
        arrayCC = [cOwnerEmail, plannerEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator y Planificador
        message = `la solicitud ha sido aceptada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 4 && newState es 5 -> Soliciutud aceptada por Planificador
      else if (prevState == 4 && newState == 5) {
        arrayCC = [plannerEmail, admContEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator, Planificador y Adm.Contrato
        message = `la solicitud ha sido actualizada por nuestro Planificador ${user.displayName}. Ahora también es posible encontrar la fecha de término del levantamiento y el número de OT` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 5 && newState es 6 -> Solicitud aceptada por Adm.Contrato
      else if (prevState == 5 && newState == 6) {
        arrayCC = [cOwnerEmail, plannerEmail, admContEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
        message = `la solicitud ha sido aceptada por Procure` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 5 && newState es 2 -> Modificación hecha por Procure
      else if (prevState == 5 && newState == 2) {
        arrayCC = [plannerEmail, admContEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator, Planificador y Adm.Contrato
        message = `la solicitud ha sido modificada por Procure` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 2 && newState es 6 -> Modificación hecha por Procure fue aceptada por C.Operator
      else if (prevState == 2 && newState == 6) {
        arrayCC = [cOwnerEmail, plannerEmail, admContEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
        message = `la solicitud ha sido aceptada por ${user.displayName} y por Procure` // Se agrega mensaje que irá en el e-mail
      }

      // && prevState es 5 && newState es 10 -> Solicitud rechazada por Procure
      else if (prevState == 5 && newState == 10) {
        arrayCC = [cOwnerEmail, plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al C.Operator, Planificador y Adm.Contrato
        message = `la solicitud ha sido rechazada por nuestro Administrador de Contrato ${user.displayName}` // Se agrega mensaje que irá en el e-mail
      }
    }

    // Cualquier otro caso
    else {
    }

    return { arrayCC: arrayCC, message: message }
  }

  const sendEmailWhenReviewDocs = async (prevState, newState, requesterId, requirementId) => {
    const user = Firebase.auth().currentUser // Se llama al currentUser
    const collectionRef = collection(db, 'mail') // Se llama a la colección mail de Firestore

    // Se rescatan los datos globales de la solicitud:
    const requirementRef = doc(db, 'solicitudes', requirementId)
    const requirementSnapshot = await getDoc(requirementRef)
    const requirementData = requirementSnapshot.data()

    // Se rescatan los datos de quien hizo la solicitud que puede tener rol 2 o 3
    const requesterData = await getData(requesterId)
    const requesterRole = requesterData.role
    const requesterEmail = requesterData.email

    // Se rescatan los datos del "Contract Owner"
    const cOwnerUid = await searchbyColletionAndField('users', 'role', 4) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del C.Owner
    const cOwnerData = await getData(cOwnerUid)
    const cOwnerEmail = cOwnerData.email

    // Se rescatan los datos del "Planificador"
    const plannerUid = await searchbyColletionAndField('users', 'role', 5) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del Planificador
    const plannerData = await getData(plannerUid)
    const plannerEmail = plannerData.email

    // Se rescatan los datos del "Administrador de Contrato"
    const admContUid = await searchbyColletionAndField('users', 'role', 6) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del Administrador de Contrato
    const admContData = await getData(admContUid)
    const admContEmail = admContData.email

    // Se rescatan los datos de quien se indicó como "solicitante" en ese campo al generar la solicitud
    const petitionerName = requirementData.petitioner // Se rescata el nombre del campo "Solicitiante" en Nueva Solicitud
    const petitionerUid = await searchbyColletionAndField('users', 'name', petitionerName) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del solicitante indicado en el campo "Solicitante"
    const dataPetitioner = await getData(petitionerUid) // Para el solicitante indicado en el campo "Solicitante" se obtiene su datos de Firestore
    const petitionerEmail = dataPetitioner.email // Se selecciona el email del solicitante indicado en el campo "Solicitante"

    if (requesterRole == 2) {
      // Si el rol de quien hizo la solicitud es 2

      //Se rescatan los datos del C.Operator
      const cOperatorName = requesterData.contop // Se usa el nombre del C.Operator del usuario que hizo la solicitud
      const cOperatorUid = await searchbyColletionAndField('users', 'name', cOperatorName) // Se usa la función searchbyColletion() para buscar dentro de Firestore el usuario que se llame igual al Contract Operator del usuario
      const cOperatorData = await getData(cOperatorUid) // Para este C.Operator se obtiene su datos de Firestore
      const cOperatorEmail = cOperatorData.email // Se selecciona el email del C.Operator

      const usersOnCopyAndMessage = getUsersOnCopyAndMessage(
        requesterRole,
        prevState,
        newState,
        cOperatorEmail,
        cOwnerEmail,
        plannerEmail,
        admContEmail,
        petitionerEmail
      )

      const onCC = usersOnCopyAndMessage.arrayCC
      const message = usersOnCopyAndMessage.message

      // Email dirigido a quien hizo la solicitud, con copia a quien corresponda
      try {
        const newDoc = {} // Se genera un elemento vacío
        const addedDoc = await addDoc(collectionRef, newDoc) // Se agrega este elemento vacío a la colección mail
        const mailId = addedDoc.id // Se obtiene el id del elemento recién agregado

        const docRef = doc(collectionRef, mailId) // Se busca la referencia del elemento recién creado con su id

        const fechaCompleta = new Date() // Constante que almacena la fecha en que se genera la solcitud

        const startDate = requirementData.start.toDate().toLocaleDateString() // Constante que almacena la fecha de inicio del levantamiento

        // Variable que almacena la fecha de término del levantamiento
        var endDate = null // Se inicializa como null
        // Si el campo existe dentro del documento
        if (requirementData.end) {
          endDate = requirementData.end.toDate().toLocaleDateString() // Se actualiza endDate con el dato existente
        } else {
          // Si el campo no existe dentro del documento
          endDate = 'Por definir' // La variable endDate queda 'Por definir'
        }

        // Variable que almacena el número de OT del levantamiento
        var otNumber = null // Se inicializa como null
        // Si el campo existe dentro del documento
        if (requirementData.ot) {
          otNumber = requirementData.ot // Se actualiza otNumber con el dato existente
        } else {
          // Si el campo no existe dentro del documento
          otNumber = 'Por definir' // La variable otNumber queda 'Por definir'
        }

        // Variable que almacena el Supervisor que estará a cargo del levantamiento
        var supervisorName = null // Se inicializa como null
        // Si el campo existe dentro del documento
        if (requirementData.supervisor) {
          supervisorName = requirementData.supervisor // Se actualiza supervisorName con el dato existente
        } else {
          // Si el campo no existe dentro del documento
          supervisorName = 'Por definir' // La variable supervisorName queda 'Por definir'
        }

        // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
        updateDoc(docRef, {
          to: requesterEmail,
          cc: onCC,
          date: fechaCompleta,
          req: requirementId,
          emailType: 'reviewDocs',
          message: {
            subject: `Solicitud de levantamiento: N°${requirementData.n_request} - ${requirementData.title}`,
            html: `
              <h2>Estimad@ ${requesterData.name}:</h2>
              <p>Con fecha ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}, ${message}. A continuación puede encontrar el detalle de la solicitud:</p>
              <table style="width:100%;">
                  <tr>
                    <td style="text-align:left; padding-left:15px; width:20%;"><strong>N° Solicitud:</strong></td>
                    <td style="text-align:left; width:80%;">${requirementData.n_request}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Título:</strong></td>
                    <td>${requirementData.title}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>N° OT Procure:</strong></td>
                    <td>${otNumber}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Supervisor a cargo del levantamiento:</strong></td>
                    <td>${supervisorName}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Fecha de inicio de levantamiento:</strong></td>
                    <td>${startDate}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Fecha de término de levantamiento:</strong></td>
                    <td>${endDate}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Planta:</strong></td>
                    <td>${requirementData.plant}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Área:</strong></td>
                    <td>${requirementData.area}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Solicitante:</strong></td>
                    <td>${requirementData.petitioner}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>N° SAP:</strong></td>
                    <td>${requirementData.sap}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Tipo de trabajo:</strong></td>
                    <td>${requirementData.type}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Tipo de levantamiento:</strong></td>
                    <td>${requirementData.objective}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Entregables esperados:</strong></td>
                    <td>${requirementData.deliverable.join(', ')}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Destinatarios:</strong></td>
                    <td>${requirementData.receiver.map(receiver => receiver.email).join(', ')}</td>
                  </tr>
                  <tr>
                    <td style="text-align:left; padding-left:15px;"><strong>Descripción del requerimiento:</strong></td>
                    <td>${requirementData.description}</td>
                  </tr>
                </table
              <p>Para mayor información revise la solicitud en nuestra página web</p>
              <p>Saludos,<br>Procure Terreno Web</p>
              `
          }
        })
        console.log('E-mail de actualizacion enviado con éxito.')
      } catch (error) {
        console.error('Error al enviar email:', error)
        throw error
      }
    } else if (requesterRole == 3) {
      // Si el rol de quien hizo la solicitud es 3
    } else {
      // Si el rol de quien hizo la solicitud es cualquier otro
    }
  }

  // **FIN - FUNCIONES CREADAS POR JORGE**

  const blockDay = async (date, cause = '') => {
    const dateUnix = getUnixTime(date) // Convierte la fecha a segundos Unix
    const docRef = doc(collection(db, 'diasBloqueados'), dateUnix.toString())

    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      if (data.blocked === true) {
        // Si el día ya está bloqueado, lo desbloquea en el documento
        await setDoc(docRef, { blocked: false })
        console.log('Día desbloqueado')
      } else if (cause.length > 0) {
        // Si existe pero no está bloqueado, actualiza el campo blocked a true
        await setDoc(docRef, { blocked: true, cause })
        console.log('Día bloqueado')
      } else {
        alert('para bloquear la fecha debe proporcionar un motivo')
      }
    } else if (cause.length > 0) {
      // Si no existe el día, crea el documento con blocked = true
      await setDoc(docRef, { blocked: true, cause })
      console.log('Día bloqueado')
    } else {
      alert('para bloquear la fecha debe proporcionar un motivo')
    }
  }

  const blockDayInDatabase = async (values) => {
    const { date, cause } = values;
    const dateUnix = getUnixTime(date);
    const docRef = doc(collection(db, 'diasBloqueados'), dateUnix.toString());

    return new Promise(async (resolve, reject) => {
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.blocked === true) {
            // Si el día ya está bloqueado, lo desbloquea en el documento
            await setDoc(docRef, { blocked: false });
            resolve('Día desbloqueado');
          } else if (cause && cause.length > 0) {
            // Si existe pero no está bloqueado, actualiza el campo blocked a true
            await setDoc(docRef, { blocked: true, cause });
            resolve('Día bloqueado');
          } else {
            reject(new Error('Para bloquear la fecha debe proporcionar un motivo'));
          }
        } else if (cause && cause.length > 0) {
          // Si no existe el día, crea el documento con blocked = true
          await setDoc(docRef, { blocked: true, cause });
          resolve('Día bloqueado');
        } else {
          reject(new Error('Para bloquear la fecha debe proporcionar un motivo'));
        }
      } catch (error) {
        console.log(error);
        reject(new Error('Error al bloquear el día: ' + error));
      }
    });
  };

  const dateWithDocs = async date => {
    if (!date || !date.seconds) {
      return
    }

    const allDocs = []

    //const dateUnix = getUnixTime(date) // Convierte la fecha a segundos Unix
    const q = query(collection(db, 'solicitudes'), where('start', '==', date))
    const querySnapshot = await getDocs(q)

    querySnapshot.forEach(doc => {
      // doc.data() is never undefined for query doc snapshots
      allDocs.push({ ...doc.data(), id: doc.id })
    })

    if (allDocs.length > 0) {
      return `La fecha que está tratando de agendar tiene ${allDocs.length} Solicitudes. Le recomendamos seleccionar otro día`
    } else {
      return 'Fecha Disponible'
    }
  }

  const consultDay = async date => {
    const dateUnix = getUnixTime(date) // Convierte la fecha a segundos Unix
    const fechaTimestamp = Timestamp.fromMillis(dateUnix * 1000) // Convierte a objeto Timestamp de Firebase
    const docRef = doc(collection(db, 'diasBloqueados'), dateUnix.toString())

    console.log(date)

    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      if (data.blocked === true) {
        // Si el día ya está bloqueado, lo desbloquea en el documento
        return { msj: `El día que ha seleccionado se encuentra inhabilitado, motivo: ${data.cause} `, blocked: true }
      } else {
        let msj = await dateWithDocs(fechaTimestamp)

        return { msj, blocked: false }
      }
    } else {
      let msj = await dateWithDocs(fechaTimestamp)

      return { msj, blocked: false }
    }
  }

  const consultSAP = async sap => {
    const sapQuery = query(collection(db, `solicitudes`), where('sap', '==', sap), orderBy('date', 'desc'))
    const sapQuerySnapshot = await getDocs(sapQuery)
    const sapDocs = sapQuerySnapshot.docs


    if (sapDocs.length > 0) {
      let sapWithOt = []
      let sap = []
      sapDocs.forEach(async docItem => {
        const userRef = doc(db, 'users', docItem.data().uid)
        const userQuerySnapshot = await getDoc(userRef)
        const author = userQuerySnapshot.data().name
        if(docItem.data().ot){
          sapWithOt.push({ot: docItem.data().ot, author, objective: docItem.data().objective, title: docItem.data().title} )
        }else{
          sap.push({ author, objective: docItem.data().objective, title: docItem.data().title} )
        }
      })
      if(sapWithOt.length > 0){
        return {exist: true, sap, sapWithOt, msj: `Existen ${sap.length + sapWithOt.length} solicitudes con este número SAP, de las cual ${sapWithOt.length} tienen OT asignadas y ${sap.length} estan en revisión`}
      } else{
        return {exist: true, sap, msj: `Existen ${sap.length} solicitudes con este número SAP que se encuentran en revisión para ser aprobadas` }
      }


    } else {
      return {exist: false, msj: 'nuevo número SAP registrado'}
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
    getUsers,
    getPetitioner,
    getAllMELUsers,
    getAllPlantUsers,
    uploadFilesToFirebaseStorage,
    blockDay,
    blockDayInDatabase,
    consultDay,
    consultSAP
  }

  return <FirebaseContext.Provider value={value}>{props.children}</FirebaseContext.Provider>
}

export default FirebaseContextProvider

// ** Custom hook para acceder a estas funciones
export const useFirebase = () => useContext(FirebaseContext)
