
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
  where,
  orderBy,
  limit,
  runTransaction} from 'firebase/firestore'

// ** Trae funcion que valida los campos del registro
import { solicitudValidator } from '../form-validation/helperSolicitudValidator'

// ** Importación de función que envía email cuando se genera una nueva solicitud
import { sendEmailNewPetition } from './mailing/sendEmailNewPetition'

// ** Importación de función que envía email cuando se actualiza una nueva solicitud
import { sendEmailWhenReviewDocs } from './mailing/sendEmailWhenReviewDocs'

// ** Librería para manejar fechas
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
        userRole: userParam.role,
        date: Timestamp.fromDate(new Date()),
        n_request: requestNumber,
        engineering: userParam.engineering
      })

      // Establecemos los campos adicionales de la solicitud
      await updateDoc(docRef, {
        ...newDoc,
        state: userParam.role || 'no definido'
      })

      // Se envia email a quienes corresponda
      await sendEmailNewPetition(userParam, values, docRef.id, requestNumber)

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
  if (userParam.role === 2) {
    newState = approves ? (eventDocs[0].data().prevState === 5 && eventDocs[0].data().newState === 0 ? 6 : 4) : 10

    if (newState === 6) {
      let week = moment(docSnapshot.start.toDate()).isoWeek()
      supervisorShift = week % 2 === 0 ? 'A' : 'B'
      await updateDoc(ref, { supervisorShift })
    }
  } else if (userParam.role === 3) {
    if (eventDocs.length > 0) {
      newState = approves ? (eventDocs[0].data().prevState === 5 ? 6 : userParam.role + 1) : 10
    } else {
      newState = approves ? userParam.role + 1 : 10
    }

    if (newState === 6) {
      let week = moment(docSnapshot.start.toDate()).isoWeek()
      week % 2 == 0 ? (supervisorShift = 'A') : (supervisorShift = 'B')
      await updateDoc(ref, { supervisorShift })
    }
  } else if (userParam.role === 6) {
    console.log(eventDocs)
    if (eventDocs.length > 0) {
      const lastEvent = eventDocs[0].data()
      console.log(lastEvent)
      newState = approves
        ? eventDocs[0].data().prevDoc && eventDocs[0].data().prevDoc.start
          ? previousRole
          : userParam.role
        : 10
    } else {
      console.log('No se encontraron eventos')
      newState = approves ? userParam.role : 10
    }

    if (newState === 6) {
      let week = moment(docSnapshot.start.toDate()).isoWeek()
      supervisorShift = week % 2 === 0 ? 'A' : 'B'
      await updateDoc(ref, { supervisorShift })
    }
  } else if (userParam.role === 7) {
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
    newState = approves ? userParam.role : 10
  }

  console.log('reviewdocs')

  // Guarda estado anterior, autor y fecha modificación
  const newEvent = {
    prevState,
    newState,
    user: userParam.email,
    userName: userParam.displayName,
    date: Timestamp.fromDate(new Date())
  }

  await updateDoc(ref, {
    state: newState
  })
  await addDoc(collection(db, `solicitudes/${id}/events`), newEvent)

  // Se envía e-mail al prevState y al newState
  await sendEmailWhenReviewDocs(userParam, newEvent.prevState, newEvent.newState, docSnapshot.uid, id)
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
  const isSolicitante = userParam.role === 2
  const isContop = userParam.role === 3
  const isPlanner = userParam.role === 5
  const isAdmCon = userParam.role === 6
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
    const isMyRequest = docSnapshot.uid === userParam.uid
    newState = isMyRequest ? userParam.role + 1 : previousRole - 1
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

      newState = userParam.role // Avanza
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
      newState = userParam.role // Avanza
    } else if (prevDocExists) {
      // Caso: prevDoc existe pero su propiedad 'start' es diferente a obj.start
      newState = devolutionState - 1 // Devuelto a 2 menos el rol del autor (solicitante 0 y contop 1)
    } else if (obj.start.toDate().getTime() !== docSnapshot.start.toDate().getTime()) {
      // Caso: no han habido cambios, pero 'start' del form es diferente al start actual
      newState = devolutionState - 1 // Devuelto a 2 menos el rol del autor (solicitante 0 y contop 1)
    } else {
      // Caso: no han habido cambios, y 'start' del form es igual al start actual
      newState = userParam.role // Avanza
    }

    changedFields.state = newState
  } else {
    // ** Default
    newState = userParam.role
    changedFields.state = newState
  }

  newEvent = {
    prevDoc,
    prevState,
    newState,
    user: userParam.email,
    userName: userParam.displayName,
    date: Timestamp.fromDate(new Date())
  }

  if (Object.keys(prevDoc).length === 0 || Object.keys(changedFields).length <= 0) {
    console.log('No se escribió ningún documento')
  } else {
    await updateDoc(ref, changedFields)
    await addDoc(collection(db, 'solicitudes', id, 'events'), newEvent)

    // Se envía e-mail al prevState y al newState
    await sendEmailWhenReviewDocs(userParam, newEvent.prevState, newEvent.newState, docSnapshot.uid, id)
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

// ** Bloquear o desbloquear un día en la base de datos
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

// ** Consultar si existen solicitudes para una fecha específica
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

export { newDoc, reviewDocs, updateDocs, updateUserPhone, addNewContact, blockDayInDatabase, dateWithDocs }
