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
  getDocs,
  updateDoc,
  arrayUnion,
  onSnapshot,
  where,
  orderBy,
  limit
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
    const { name, rut, phone, email, plant, shift, company, role, contop, opshift, urlFoto } = values

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
          ...(contop && { contop }),
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
          uid: user.uid,
          type: values.type,
          deliverable: values.deliverable,
          petitioner: values.petitioner,
          opshift: values.opshift,
          sap: values.sap
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

        // Se envia email a quienes corresponda
        sendEmailNewPetition('nueva_solicitud', user, values, docRef.id)

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
    if (authUser.role === 3) {
      newState = approves ? authUser.role + 1 : 10
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

      //&& Object.keys(prevDoc).length > 0
      //newState = approves ? (Object.keys(prevDoc).start ? devolutionState : authUser.role) : 10
      console.log(newState, 'newState')

      console.log(docSnapshot, 'docSnapshot')

      /* if (Object.keys(prevDoc).start) {
        newState = devolutionState
      } else {
        newState = approves ? authUser.role : 10
      } */
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

    // si planificador cambia de fecha, solictud cambia state a 5
    if (authUser.role === 5 && Object.keys(prevDoc).length > 0) {
      newState = authUser.role
      changedFields.state = newState
    }

    if (authUser.role === 6 && Object.keys(prevDoc).length > 0) {
      console.log(Object.keys(prevDoc).start, 'Object.keys(prevDoc).start')
      console.log(obj.start, 'obj.start')
      newState = Object.keys(prevDoc) && Object.keys(prevDoc).start !== obj.start ? devolutionState : authUser.role // REVISANDO PORQUE LA COMPARACION DE 2 OBJETOS LO TOMA DIFERENTE
      changedFields.state = newState

      /* if (Object.keys(prevDoc).start === obj.start) {
        newState = authUser.role
        changedFields.state = newState
      } else if (changedFields.start) {
        newState = devolutionState
        changedFields.state = newState
      } else {
        newState = authUser.role
        changedFields.state = newState
      } */
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
    await updateDoc(ref, changedFields)
    await addDoc(collection(db, 'solicitudes', id, 'events'), newEvent)
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
  const sendEmailNewPetition = async (type, user, values, reqId) => {
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
            type: type,
            message: {
              subject: `Nueva solicitud de levantamiento: ${values.title}`,
              html: `
                <h2>Estimad@ ${user.displayName}:</h2>
                <p>Usted ha generado una solicitud de trabajo el día ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}. A continuación puede encontrar el detalle de la solicitud:</p>
                <ul>
                  <li>Título: ${values.title}</li>
                  <li>Fecha de inicio de levantamiento: ${values.start.toLocaleDateString()}</li>
                  <li>Planta: ${values.plant}</li>
                  <li>Área: ${values.area}</li>
                  <li>N°SAP: ${values.sap}</li>
                  <li>Tipo de trabajo: ${values.type}</li>
                  <li>Tipo de levantamiento: ${values.objective}</li>
                  <li>Enrtegables esperados: ${values.deliverable.join(', ')}</li>
                  <li>Destinatarios: ${values.receiver.map(receiver => receiver.email).join(', ')}</li>
                  <li>Descripción del requerimiento: ${values.description}</li>
                </ul>
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
            type: type,
            message: {
              subject: `Nueva solicitud de levantamiento: ${values.title}`,
              html: `
                <h2>Estimad@ ${user.displayName}:</h2>
                <p>Usted ha generado una solicitud de trabajo el día ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}. A continuación puede encontrar el detalle de la solicitud:</p>
                <ul>
                  <li>Título: ${values.title}</li>
                  <li>Fecha de inicio de levantamiento: ${values.start.toLocaleDateString()}</li>
                  <li>Planta: ${values.plant}</li>
                  <li>Área: ${values.area}</li>
                  <li>Solicitante: ${values.petitioner}</li>
                  <li>N°SAP: ${values.sap}</li>
                  <li>Tipo de trabajo: ${values.type}</li>
                  <li>Tipo de levantamiento: ${values.objective}</li>
                  <li>Enrtegables esperados: ${values.deliverable.join(', ')}</li>
                  <li>Destinatarios: ${values.receiver.map(receiver => receiver.email).join(', ')}</li>
                  <li>Descripción del requerimiento: ${values.description}</li>
                </ul>
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

  // **FIN - FUNCIONES CREADAS POR JORGE**

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
    uploadFilesToFirebaseStorage
  }

  return <FirebaseContext.Provider value={value}>{props.children}</FirebaseContext.Provider>
}

export default FirebaseContextProvider

// ** Custom hook para acceder a estas funciones
export const useFirebase = () => useContext(FirebaseContext)
