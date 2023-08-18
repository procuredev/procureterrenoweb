import { useState, useEffect } from 'react'

import { getUnixTime } from 'date-fns'

// ** Firebase Imports
import { Firebase, db } from 'src/configs/firebase'
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
  onSnapshot,
  where,
  orderBy,
  limit,
  runTransaction,
  getCountFromServer
} from 'firebase/firestore'

// ** Trae funcion que valida los campos del registro
import { solicitudValidator } from './helperSolicitudValidator'

// ** Importación de función que envía email cuando se genera una nueva solicitud
import { sendEmailNewPetition } from './sendEmailNewPetition'

// ** Importación de función que envía email cuando se actualiza una nueva solicitud
import { sendEmailWhenReviewDocs } from './sendEmailWhenReviewDocs'

// Librería
import { capitalize } from 'lodash'

const moment = require('moment')

// ** Escribe documentos en Firestore Database
const newDoc = async (values, userParam) => {
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
        start: values.start,
        plant: values.plant,
        area: values.area,
        contop: values.contop,
        fnlocation: values.fnlocation,
        petitioner: values.petitioner,
        opshift: values.opshift,
        type: values.type,
        detention: values.detention,
        sap: values.sap,
        objective: values.objective,
        deliverable: values.deliverable,
        receiver: values.receiver,
        description: values.description,
        uid: user.uid,
        user: user.displayName,
        userEmail: user.email,
        userRole:  userParam.role,
        date: Timestamp.fromDate(new Date()),
        n_request: requestNumber,
        engineering:  userParam.engineering
      })

      // Establecemos los campos adicionales de la solicitud
      await updateDoc(docRef, {
        ...newDoc,
        state:  userParam.role || 'no definido'
      })

      // Se envia email a quienes corresponda
      await sendEmailNewPetition( userParam, values, docRef.id, requestNumber)

      console.log('Nueva solicitud creada con éxito.')

      return docRef
    } catch (error) {
      console.error('Error al crear la nueva solicitud:', error)
      throw error
    }
  }
}

// ** Modifica estado documentos
const reviewDocs = async (id, approves, userParam) => {
  const ref = doc(db, 'solicitudes', id)
  const querySnapshot = await getDoc(ref)
  const docSnapshot = querySnapshot.data()
  const userRef = doc(db, 'users', docSnapshot.uid)
  const userQuerySnapshot = await getDoc(userRef)
  const previousRole = userQuerySnapshot.data().role - 2

  /*  if (userQuerySnapshot.exists()) {
    const previousRole = userQuerySnapshot.data().role - 1;

    // Resto del código que usa previousRole
  } else {
    console.log('El documento del usuario no existe o no contiene datos válidos.');

    // Manejo del caso en que el documento no existe o está vacío
  } */

  const eventQuery = query(collection(db, `solicitudes/${id}/events`), orderBy('date', 'desc'), limit(1))
  const eventQuerySnapshot = await getDocs(eventQuery)
  const eventDocs = eventQuerySnapshot.docs

  const prevState = querySnapshot.data().state // 'estado anterior'
  let newState
  let supervisorShift
  if ( userParam.role === 2) {
    newState = approves ? (eventDocs[0].data().prevState === 5 && eventDocs[0].data().newState === 0 ? 6 : 4) : 10

    if (newState === 6) {
      let week = moment(docSnapshot.start.toDate()).isoWeek()
      supervisorShift = week % 2 === 0 ? 'A' : 'B'
      await updateDoc(ref, { supervisorShift })
    }
  } else if ( userParam.role === 3) {
    if (eventDocs.length > 0) {
      newState = approves ? (eventDocs[0].data().prevState === 5 ? 6 :  userParam.role + 1) : 10
    } else {
      newState = approves ?  userParam.role + 1 : 10
    }

    if (newState === 6) {
      let week = moment(docSnapshot.start.toDate()).isoWeek()
      week % 2 == 0 ? (supervisorShift = 'A') : (supervisorShift = 'B')
      await updateDoc(ref, { supervisorShift })
    }
  } else if ( userParam.role === 6) {
    console.log(eventDocs)
    if (eventDocs.length > 0) {
      const lastEvent = eventDocs[0].data()
      console.log(lastEvent)
      newState = approves
        ? eventDocs[0].data().prevDoc && eventDocs[0].data().prevDoc.start
          ? previousRole
          :  userParam.role
        : 10
    } else {
      console.log('No se encontraron eventos')
      newState = approves ?  userParam.role : 10
    }

    if (newState === 6) {
      let week = moment(docSnapshot.start.toDate()).isoWeek()
      supervisorShift = week % 2 === 0 ? 'A' : 'B'
      await updateDoc(ref, { supervisorShift })
    }
  } else if ( userParam.role === 7) {
    if (Array.isArray(approves)) {
      newState = 7
      const draftmen = approves

      await updateDoc(ref, { draftmen })
    } else {
      newState = 8
      const horasLevantamiento = approves
      await updateDoc(ref, { horasLevantamiento })
    }
  } else {
    newState = approves ?  userParam.role : 10
  }

  console.log('reviewdocs')

  // Guarda estado anterior, autor y fecha modificación
  const newEvent = {
    prevState,
    newState,
    user:  userParam.email,
    userName:  userParam.displayName,
    date: Timestamp.fromDate(new Date())
  }

  await updateDoc(ref, {
    state: newState
  })
  await addDoc(collection(db, `solicitudes/${id}/events`), newEvent)

  // Se envía e-mail al prevState y al newState
  await sendEmailWhenReviewDocs( userParam, newEvent.prevState, newEvent.newState, docSnapshot.uid, id)
}

// ** Modifica otros campos documentos
const updateDocs = async (id, obj, userParam) => {
  const ref = doc(db, 'solicitudes', id)
  const querySnapshot = await getDoc(ref)
  const docSnapshot = querySnapshot.data()
  const prevState = docSnapshot.state
  const userRef = doc(db, 'users', docSnapshot.uid)
  const userQuerySnapshot = await getDoc(userRef)
  const previousRole = userQuerySnapshot.data().role - 1
  const isSolicitante =  userParam.role === 2
  const isContop =  userParam.role === 3
  const isPlanner =  userParam.role === 5
  const isAdmCon =  userParam.role === 6
  const isUnchanged = Object.keys(obj).length === 0
  let changedFields = {}
  let prevDoc = {}
  let newState
  let newEvent = {}
  const devolutionState = userQuerySnapshot.data().role - 1
  const eventQuery = query(collection(db, `solicitudes/${id}/events`), orderBy('date', 'desc'), limit(1))
  const eventQuerySnapshot = await getDocs(eventQuery)
  const eventDocs = eventQuerySnapshot.docs

  for (const key in obj) {
    let value = obj[key]
    if (key === 'start') {
      // Asegura que value sea un objeto de fecha válido de Moment.js
      value = moment(value.toDate()).toDate()
    } else if (key === 'end') {
      value = moment(value.toDate()).toDate()
    }

    // Verifica si el valor ha cambiado y lo guarda, si es fecha lo formatea
    if (key === 'start') {
      if (value && value.getTime() !== docSnapshot[key].toDate().getTime()) {
        changedFields[key] = value
        prevDoc[key] = docSnapshot[key].toDate()
      }
    } else {
      if (value && value !== docSnapshot[key]) {
        changedFields[key] = value
        prevDoc[key] = docSnapshot[key]
      }
    }

    // Registra si no existía start o end, si es fecha formatea el nuevo
    if (!docSnapshot[key]) {
      changedFields[key] = value
      prevDoc[key] = 'none'
    }
  }

  // ** Flujo estados
  // ** Contract operator
  if (isContop && obj.start.toDate().getTime() !== docSnapshot.start.toDate().getTime()) {
    const isMyRequest = docSnapshot.uid ===  userParam.uid
    newState = isMyRequest ?  userParam.role + 1 : previousRole - 1
    changedFields.state = newState
  } else if (isPlanner && !isUnchanged) {
    // ** Planificador
    // Si planificador cambia de fecha luego de ser aprobada la solicitud, reasigna al supervisor
    if (docSnapshot.state >= 6) {
      if (obj.start.toDate().getTime() !== docSnapshot.start.toDate().getTime()) {
        let week = moment(docSnapshot.start.toDate()).isoWeek()
        supervisorShift = week % 2 === 0 ? 'A' : 'B'
        await updateDoc(ref, { supervisorShift })
      }
      newState = docSnapshot.state
    } else if (!docSnapshot.ot) {
      const counterRef = doc(db, 'counters', 'otCounter')

      const newOTValue = await runTransaction(db, async transaction => {
        const counterSnapshot = await transaction.get(counterRef)

        let newCounter

        if (!counterSnapshot.exists) {
          newCounter = 1
        } else {
          newCounter = counterSnapshot.data().counter + 1
        }

        transaction.set(counterRef, { counter: newCounter })

        return newCounter
      })

      // Ahora, actualiza el documento actual con el nuevo valor de 'ot'
      await updateDoc(ref, { ot: newOTValue })

      newState =  userParam.role // Avanza
      changedFields.state = newState
    } /* else {
      // Si planificador cambia de fecha, solictud cambia state a 5
      newState =  userParam.role // Avanza
      changedFields.state = newState
    } */
  } else if (isAdmCon && eventDocs.length > 0) {
    // Desestructurar el evento más reciente y extraer la propiedad 'data'

    const prevDocExists = eventDocs[0].data().prevDoc && eventDocs[0].data().prevDoc.start

    // Verificar si prevDoc existe y si su propiedad 'start' es igual a la que estaba antes
    const changeDateBack =
      prevDocExists && eventDocs[0].data().prevDoc.start.toDate().getTime() === obj.start.toDate().getTime()

    if (changeDateBack) {
      // Caso: prevDoc existe y su propiedad 'start' es igual a 'start' del form
      newState =  userParam.role // Avanza
    } else if (prevDocExists) {
      // Caso: prevDoc existe pero su propiedad 'start' es diferente a obj.start
      newState = devolutionState - 1 // Devuelto a 2 menos el rol del autor (solicitante 0 y contop 1)
    } else if (obj.start.toDate().getTime() !== docSnapshot.start.toDate().getTime()) {
      // Caso: no han habido cambios, pero 'start' del form es diferente al start actual
      newState = devolutionState - 1 // Devuelto a 2 menos el rol del autor (solicitante 0 y contop 1)
    } else {
      // Caso: no han habido cambios, y 'start' del form es igual al start actual
      newState =  userParam.role // Avanza
    }

    changedFields.state = newState
  } else {
    // ** Default
    newState =  userParam.role
    changedFields.state = newState
  }

  newEvent = {
    prevDoc,
    prevState,
    newState,
    user:  userParam.email,
    userName:  userParam.displayName,
    date: Timestamp.fromDate(new Date())
  }

  if (Object.keys(prevDoc).length === 0 || Object.keys(changedFields).length <= 0) {
    console.log('No se escribió ningún documento')
  } else {
    await updateDoc(ref, changedFields)
    await addDoc(collection(db, 'solicitudes', id, 'events'), newEvent)

    // Se envía e-mail al prevState y al newState
    await sendEmailWhenReviewDocs( userParam, newEvent.prevState, newEvent.newState, docSnapshot.uid, id)
  }
}

// ** Modifica otros campos Usuarios
const updateUserPhone = async (id, obj) => {
  const ref = doc(db, 'users', id)
  const querySnapshot = await getDoc(ref)

  await updateDoc(ref, { phone: obj.replace(/\s/g, '') })
}

// ** Guarda datos contraturno u otros contactos no registrados
const addNewContact = async values => {
  await setDoc(doc(db, 'contacts', 'test'), values)
}

// ** Trae colección de eventos
const useEvents = (id, userParam) => {
  const [data, setData] = useState([])

  useEffect(() => {
    if ( userParam && id) {
      const q = query(collection(db, 'solicitudes', id, 'events'), orderBy('date', 'desc'))

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
  }, [ userParam, id])

  return data
}

// ** Escucha cambios en los documentos en tiempo real
const useSnapshot = (datagrid = false, userParam) => {
  const [data, setData] = useState([])

  useEffect(() => {
    if ( userParam) {
      console.log( userParam.role, 'USER PLANT')

      let q = query(collection(db, 'solicitudes'))

      const getAllDocs = [1, 4, 5, 6, 7, 9]

      if (datagrid) {
        switch ( userParam.role) {
          case 2:
            q = query(collection(db, 'solicitudes'), where('uid', '==',  userParam.uid))
            break
          case 3:
            q = query(collection(db, 'solicitudes'), where('plant', 'in',  userParam.plant))
            break
          case 5:
            q = query(collection(db, 'solicitudes'), where('state', '>=',  userParam.role - 2))
            break
          case 7:
            q = query(collection(db, 'solicitudes'), where('state', '>=', 6))
            break
          default:
            if (getAllDocs.includes( userParam.role) && ![1, 9].includes( userParam.role)) {
              q = query(collection(db, 'solicitudes'), where('state', '>=',  userParam.role - 1))
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

          // Ordena manualmente las solicitudes por 'date' en orden descendente
          const sortedDocs = allDocs.sort((a, b) => b.date.seconds - a.date.seconds)

          setData(sortedDocs)
        } catch (error) {
          console.error('Error al obtener los documentos de Firestore: ', error)

          // Aquí puedes mostrar un mensaje de error
        }
      })

      // Devuelve una función de limpieza que se ejecuta al desmontar el componente
      return () => unsubscribe()
    }
  }, [ userParam])

  return data
}

const getData = async id => {
  const docRef = doc(db, 'users', id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return docSnap.data()
  } else {
    return undefined
  }
}

// Obtener los datos de un rol
const getRoleData = async role => {
  console.log(role)
  const docRef = doc(db, 'roles', role)
  const docSnap = await getDoc(docRef)
  let data = docSnap.data()
  data.id = docSnap.id

  return data
}

// trae los usuarios con el rol 3 que pertenecen a una planta
// trae los usuarios con el rol 2 que pertenece a una planta con turno opuesto al pasado por parametro

// Obtener los usuarios con un rol y planta específicos (utilizado para contOp y solicitante)
const getUsers = async (plant, shift = '') => {
  // Consultar la colección 'users' con los filtros de planta, turno y rol
  const q =
    shift !== ''
      ? query(
          collection(db, 'users'),
          where('plant', 'array-contains-any', plant),
          where('shift', '!=', shift),
          where('role', '==', 2)
        )
      : query(collection(db, 'users'), where('plant', 'array-contains', plant), where('role', '==', 3))

  const querySnapshot = await getDocs(q)
  let allDocs = []
  console.log(allDocs, 'allDocs')
  querySnapshot.forEach(doc => {
    // Obtener los datos de cada usuario y agregarlos al array 'allDocs'
    allDocs.push({ ...doc.data(), id: doc.id })
  })

  return allDocs
}

// trae los usuarios con el rol 2 que pertenece a una planta
// Obtener los solicitantes de una planta específica
const getPetitioner = async (plant, userParam) => {
  let allDocs = []
  if ( userParam.plant === 'allPlants') {
    // Consultar la colección 'users' con los filtros de planta y rol
    const q = query(collection(db, 'users'), where('plant', 'array-contains', plant), where('role', '==', 2))

    const querySnapshot = await getDocs(q)

    querySnapshot.forEach(doc => {
      // Obtener los datos de cada solicitante y agregarlos al array 'allDocs'
      allDocs.push({ ...doc.data(), id: doc.id })
      console.log(allDocs)
    })
  } else if ( userParam.role === 3) {
    // Consultar la colección 'users' con el filtro de planta
    const q = query(collection(db, 'users'), where('plant', 'array-contains', plant))

    const querySnapshot = await getDocs(q)

    querySnapshot.forEach(doc => {
      // Obtener los datos de cada solicitante y agregarlos al array 'allDocs'
      allDocs.push({ ...doc.data(), id: doc.id })
      console.log(allDocs)
    })
  } else {
    // Consultar el documento del usuario autenticado y obtener sus datos
    const q = onSnapshot(doc(db, 'users',  userParam.uid), doc => {
      allDocs.push(doc.data())
    })
  }

  return allDocs
}

// Obtener los usuarios receptores de una planta específica
const getReceiverUsers = async plant => {
  // Consultar la colección 'users' con los filtros de planta y rol
  const q1 = query(collection(db, 'users'), where('plant', 'array-contains', plant), where('role', '==', 2))
  const q2 = query(collection(db, 'users'), where('role', '==', 3))
  const q3 = query(collection(db, 'users'), where('role', '==', 4))
  const querySnapshot1 = await getDocs(q1)
  const querySnapshot2 = await getDocs(q2)
  const querySnapshot3 = await getDocs(q3)
  const allDocs = []

  querySnapshot1.forEach(doc => {
    // Obtener los datos de cada usuario receptor y agregarlos al array 'allDocs'
    allDocs.push({ name: doc.data().name, email: doc.data().email, phone: doc.data().phone, id: doc.id })
  })
  querySnapshot2.forEach(doc => {
    // Obtener los datos de cada usuario receptor y agregarlos al array 'allDocs'
    allDocs.push({ name: doc.data().name, email: doc.data().email, phone: doc.data().phone, id: doc.id })
  })
  querySnapshot3.forEach(doc => {
    // Obtener los datos de cada usuario receptor y agregarlos al array 'allDocs'
    allDocs.push({ name: doc.data().name, email: doc.data().email, phone: doc.data().phone, id: doc.id })
  })

  return allDocs
}

// Obtener todos los usuarios de una planta específica
const getAllPlantUsers = async plant => {
  const allDocs = []
  if (plant) {
    // Consultar la colección 'users' con el filtro de planta
    const q = query(collection(db, 'users'), where('plant', '==', plant))
    const querySnapshot = await getDocs(q)

    querySnapshot.forEach(doc => {
      // Obtener los datos de cada usuario y agregarlos al array 'allDocs'
      allDocs.push({ ...doc.data(), id: doc.id })
    })
  }

  return allDocs
}

const getAllProcureUsers = async () => {
  const q = query(collection(db, 'users'), where('company', '==', 'Procure'))
  const querySnapshot = await getDocs(q)
  const allDocs = []

  querySnapshot.forEach(doc => {
    allDocs.push({ ...doc.data(), id: doc.id })
  })

  return allDocs
}

// **FIN - FUNCIONES CREADAS POR JORGE**

// Bloquear o desbloquear un día en la base de datos
const blockDayInDatabase = async (date, cause = '') => {
  const convertDate = moment(date).startOf().toDate()
  const dateUnix = getUnixTime(convertDate) // Convierte la fecha a segundos Unix
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

// Consultar si existen solicitudes para una fecha específica
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

// Consultar si un día está bloqueado en la base de datos
const consultBlockDayInDB = async date => {
  const fechaTimestamp = Timestamp.fromMillis(date) // Convierte a objeto Timestamp de Firebase
  const docRef = doc(collection(db, 'diasBloqueados'), date.toString())

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

// Consultar si existe un número SAP en la base de datos de solicitudes
const consultSAP = async sap => {
  // Definir la consulta con una condición de igualdad en el campo 'sap' y ordenar por fecha descendente
  const sapQuery = query(collection(db, `solicitudes`), where('sap', '==', sap), orderBy('date', 'desc'))

  // Obtener los documentos que coinciden con la consulta
  const sapQuerySnapshot = await getDocs(sapQuery)

  // Obtener la lista de documentos
  const sapDocs = sapQuerySnapshot.docs

  // Verificar si existen documentos en 'sapDocs'
  if (sapDocs.length > 0) {
    // Arreglos para almacenar las solicitudes con y sin OT asignadas
    let sapWithOt = []
    let sap = []
    let messages

    // Recorrer cada documento y obtener información adicional del usuario asociado
    await Promise.all(
      sapDocs.map(async docItem => {
        // Obtener la referencia del usuario asociado al documento
        const userRef = doc(db, 'users', docItem.data().uid)
        const userQuerySnapshot = await getDoc(userRef)
        const author = userQuerySnapshot.data().name

        if (docItem.data().ot) {
          // Si el documento tiene una OT asignada, agregarlo al arreglo 'sapWithOt'
          sapWithOt.push({
            ot: docItem.data().ot,
            author,
            objective: docItem.data().objective,
            title: docItem.data().title
          })
        } else {
          // Si el documento no tiene una OT asignada, agregarlo al arreglo 'sap'
          sap.push({ author, objective: docItem.data().objective, title: docItem.data().title })
        }
      })
    )

    if (sap.length > 0) {
      // Si hay solicitudes con OT asignadas, retornar un objeto con información detallada
      messages = sap
        .map(
          item => `Título: ${item.title}\n Solicitante: ${item.author}\n Tipo de Levantamiento: ${item.objective}\n`

          // Si todas las solicitudes están en revisión sin OT asignada, retornar un objeto con información detallada
        )
        .join('\n')
    }

    if (sapWithOt.length > 0) {
      const otMessages = sapWithOt
        .map(
          item =>
            `Título: ${item.title}\n OT: ${item.ot}\n Solicitante: ${item.author}\n Tipo de Levantamiento: ${item.objective}\n`
        )
        .join('\n')

      return {
        exist: true,
        sap,
        sapWithOt,
        msj:
          `Existen ${sap.length + sapWithOt.length} solicitudes con este número SAP, de las cuales ${
            sapWithOt.length
          } tienen OT asignadas y ${sap.length} están en revisión:\n\n` +
          otMessages +
          `\n` +
          messages
      }
    } else {
      // Si no hay documentos con el número SAP, retornar un objeto indicando que es un nuevo número SAP
      return {
        exist: true,
        sap,
        msj:
          `Existen ${sap.length} solicitudes con este número SAP que se encuentran en revisión para ser aprobadas:\n\n` +
          messages
      }
    }
  } else {
    return { exist: false, msj: 'Nuevo número SAP registrado' }
  }
}

// Consulta si un correo electrónico existe en la base de datos
const consultUserEmailInDB = async email => {
  // Definir la consulta con una condición de igualdad en el campo 'email'
  const q = query(collection(db, 'users'), where('email', '==', email))

  // Obtener los documentos que coinciden con la consulta
  const emailQuerySnapshot = await getDocs(q)

  // Obtener la lista de documentos
  const emailDocs = emailQuerySnapshot.docs

  // Crear un arreglo para almacenar todos los documentos
  let allDocs = []

  // Recorrer cada documento y agregarlo al arreglo 'allDocs'
  emailDocs.forEach(doc => {
    allDocs.push({ ...doc.data(), id: doc.id })
  })

  // Verificar si existen documentos en 'allDocs'
  if (allDocs.length > 0) {
    // Si hay al menos un documento, lanzar un error indicando que el correo está registrado
    throw new Error(`El correo ${email} se encuentra registrado.`)
  } else {
    // Si no hay documentos, retornar verdadero indicando que el correo no está registrado
    return true
  }
}

const consultAllDocsInDB = async () => {
  const coll = collection(db, 'solicitudes')
  const snapshot = await getCountFromServer(coll)

  return snapshot.data().count
}

const consultAllObjetivesInDB = async () => {
  const coll = collection(db, 'solicitudes')
  const q = query(coll, where('state', '>=', 6))
  const snapshot = await getCountFromServer(q)

  return snapshot.data().count
}

const consultObjetivesOfActualWeek = async () => {
  const startDate = moment().startOf('isoWeek').toDate()
  const endDate = moment().endOf('isoWeek').toDate()
  const documentsByDay = Array(7).fill(0)
  const coll = collection(db, 'solicitudes')
  const q = query(coll, where('state', '>=', 6))
  const snapshot = await getDocs(q)

  snapshot.forEach(doc => {
    const start = doc.data().start.toDate() // Convierte el campo 'start' a una fecha
    const dayOfWeek = moment(start).isoWeekday() // Obtiene el día de la semana (1: lunes, 2: martes, etc.)
    if (moment(start).isSameOrAfter(startDate) && moment(start).isSameOrBefore(endDate)) {
      documentsByDay[dayOfWeek - 1]++ // Incrementa el contador correspondiente en el array
    }
  })

  return documentsByDay
}

const consultObjetivesLastSixMonths = async () => {
  const currentDate = moment()
  const monthsData = []

  const coll = collection(db, 'solicitudes')
  const queries = []

  for (let i = 0; i < 6; i++) {
    const monthStartDate = currentDate.clone().subtract(i, 'months').startOf('month').toDate()
    const monthEndDate = currentDate.clone().subtract(i, 'months').endOf('month').toDate()

    const q = query(coll, where('start', '>=', monthStartDate), where('start', '<=', monthEndDate))
    queries.push(getDocs(q))
  }

  const snapshots = await Promise.all(queries)

  snapshots.forEach((snapshot, index) => {
    const filteredDocs = snapshot.docs.filter(doc => doc.data().state >= 6)
    const cant = filteredDocs.length

    const monthStartDate = currentDate.clone().subtract(index, 'months').startOf('month')
    const month = capitalize(monthStartDate.locale('es').format('MMM'))

    monthsData.unshift({ month, cant })
  })

  return monthsData
}

const consultAllDocsByPlants = async () => {
  const coll = collection(db, 'solicitudes')
  const q1 = query(coll, where('plant', '==', 'Planta Concentradora Los Colorados'))
  const q2 = query(coll, where('plant', '==', 'Planta Concentradora Laguna Seca | Línea 1'))
  const q3 = query(coll, where('plant', '==', 'Planta Concentradora Laguna Seca | Línea 2'))
  const q4 = query(coll, where('plant', '==', 'Chancado y Correas'))
  const q5 = query(coll, where('plant', '==', 'Puerto Coloso'))
  const q6 = query(coll, where('plant', '==', 'Instalaciones Cátodo'))

  const queryAllPlants = [q1, q2, q3, q4, q5, q6]

  const promises = queryAllPlants.map(query => getCountFromServer(query))
  const snapshots = await Promise.all(promises)

  const documentsByPlants = snapshots.map(snapshot => snapshot.data().count)

  return documentsByPlants
}

const consultAllObjetivesByPlants = async () => {
  const coll = collection(db, 'solicitudes')

  const queries = [
    { plant: 'Planta Concentradora Los Colorados' },
    { plant: 'Planta Concentradora Laguna Seca | Línea 1' },
    { plant: 'Planta Concentradora Laguna Seca | Línea 2' },
    { plant: 'Chancado y Correas' },
    { plant: 'Puerto Coloso' },
    { plant: 'Instalaciones Cátodo' }
  ]

  const promises = queries.map(async item => {
    const q = query(coll, where('plant', '==', item.plant), where('state', '>=', 6))
    const snapshot = await getDocs(q)

    return snapshot.size
  })

  const results = await Promise.all(promises)

  return results
}

const consultAllDocsByState = async () => {
  const coll = collection(db, 'solicitudes')
  const q1 = query(coll, where('state', '>=', 1), where('state', '<', 6))
  const q2 = query(coll, where('state', '>=', 6), where('state', '<', 10))
  const q3 = query(coll, where('state', '==', 10))

  const queryAllStates = [q1, q2, q3]

  const promises = queryAllStates.map(query => getCountFromServer(query))
  const snapshots = await Promise.all(promises)

  const documentsByState = snapshots.map(snapshot => snapshot.data().count)

  return documentsByState
}

const consultAllObjetivesByState = async () => {
  const coll = collection(db, 'solicitudes')
  const q1 = query(coll, where('state', '==', 6))
  const q2 = query(coll, where('state', '==', 7))
  const q3 = query(coll, where('state', '>=', 8), where('state', '<', 10))

  const queryAllStates = [q1, q2, q3]

  const promises = queryAllStates.map(query => getCountFromServer(query))
  const snapshots = await Promise.all(promises)

  const documentsByState = snapshots.map(snapshot => snapshot.data().count)

  return documentsByState
}

const getUsersWithSolicitudes = async () => {
  const collSolicitudes = collection(db, 'solicitudes')
  const qSolicitudes = query(collSolicitudes)
  const solicitudesSnapshot = await getDocs(qSolicitudes)

  const solicitudesByUser = {}

  solicitudesSnapshot.forEach(doc => {
    const { uid } = doc.data()
    if (uid) {
      if (solicitudesByUser[uid]) {
        solicitudesByUser[uid].docs++
      } else {
        solicitudesByUser[uid] = {
          id: uid,
          docs: 1
        }
      }
    }
  })

  const sortedUsers = Object.values(solicitudesByUser).sort((a, b) => b.docs - a.docs)
  const limitedUsers = sortedUsers.slice(0, 10)

  // Consulta adicional a la colección 'users'
  const collUsers = collection(db, 'users')
  const usersSnapshot = await getDocs(collUsers)

  const usersWithProperties = limitedUsers.map(user => {
    const userSnapshot = usersSnapshot.docs.find(doc => doc.id === user.id)
    if (userSnapshot) {
      const userData = userSnapshot.data()

      if (userData.urlFoto) {
        return {
          ...user,
          name: userData.name,
          plant: userData.plant,
          avatarSrc: userData.urlFoto
        }
      } else {
        return {
          ...user,
          name: userData.name,
          plant: userData.plant
        }
      }
    } else {
      return user
    }
  })

  return usersWithProperties
}

// Obtener usuarios con rol 8 según su turno
const getUserProyectistas = async shift => {
  // Definir la consulta con una condición de igualdad en el campo 'shift'
  const q = query(collection(db, 'users'), where('role', '==', 8), where('shift', '==', shift))

  // Obtener los documentos que coinciden con la consulta
  const proyectistasQuerySnapshot = await getDocs(q)

  // Obtener la lista de documentos
  const proyectistasDocs = proyectistasQuerySnapshot.docs

  // Crear un arreglo para almacenar todos los documentos
  let allDocs = []

  // Recorrer cada documento y agregarlo al arreglo 'allDocs'
  proyectistasDocs.forEach(doc => {
    if (doc.data().urlFoto) {
      allDocs.push({ userId: doc.id, name: doc.data().name, avatar: doc.data().urlFoto })
    } else {
      allDocs.push({ userId: doc.id, name: doc.data().name }) //, unit: doc.data().unit
    }
  })

  return allDocs
}

export {
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
}
