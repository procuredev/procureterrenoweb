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
  runTransaction
} from 'firebase/firestore'

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

const getDocumentAndUser = async id => {
  const ref = doc(db, 'solicitudes', id)
  const querySnapshot = await getDoc(ref)
  const docSnapshot = querySnapshot.data()
  const userRef = doc(db, 'users', docSnapshot.uid)
  const userQuerySnapshot = await getDoc(userRef)
  const previousRole = userQuerySnapshot.data().role - 1

  return { ref, docSnapshot, previousRole }
}

const getLatestEvent = async id => {
  const eventQuery = query(collection(db, `solicitudes/${id}/events`), orderBy('date', 'desc'), limit(1))
  const eventQuerySnapshot = await getDocs(eventQuery)
  const latestEvent = eventQuerySnapshot.docs.length > 0 ? eventQuerySnapshot.docs[0].data() : false

  return latestEvent
}

const setSupervisorShift = async week => {
  const supervisorShift = week % 2 === 0 ? 'A' : 'B'

  return supervisorShift
}

//** Falta esta
const processFieldChanges = (incomingFields, currentDoc) => {
  const changedFields = {};

  for (const key in incomingFields) {
    let value = incomingFields[key];
    let currentFieldValue = currentDoc[key];

    console.log(value)
    console.log(currentFieldValue)

    if (key === 'start' || key === 'end') {
      value = moment(value.toDate()).toDate().getTime()
      currentFieldValue = currentFieldValue && currentFieldValue.toDate().getTime()
    }

    if (!currentFieldValue || value !== currentFieldValue) {
      // Verifica si el valor ha cambiado o es nuevo y lo guarda
      if (key === 'start' || key === 'end') {
        value = value && Timestamp.fromDate(moment(value).toDate())
        currentFieldValue = currentFieldValue && Timestamp.fromDate(moment(currentFieldValue).toDate())
      }
      changedFields[key] = value
      incomingFields[key] = currentFieldValue || 'none';
    }
  }

  return { changedFields, incomingFields };
}

//** Revisar
const updateDocumentAndAddEvent = async (ref, changedFields, userParam, newEvent, requesterId, id) => {
  if (Object.keys(changedFields).length > 0) {
    await updateDoc(ref, changedFields)
    await addDoc(collection(db, 'solicitudes', id, 'events'), newEvent)
    await sendEmailWhenReviewDocs(userParam, newEvent.prevState, newEvent.newState, requesterId, id)
  } else {
    console.log('No se escribió ningún documento')
  }
}

//** Falta esta
function getNextState(role, approves, latestEvent) {
  const state = {
    returnedPetitioner: 0,
    contOwner: 4,
    planner: 5,
    contAdmin: 6,
    supervisor: 7,
    draftsman: 8,
    rejected: 10
  }

  const changeDate = latestEvent && 'prevDoc' in latestEvent && 'start' in latestEvent.prevDoc
  const approvedByPlanner = latestEvent.prevState === state.planner
  const returnedPetitioner = latestEvent.newState === state.returnedPetitioner

  const rules = new Map([
    [
      2,
      [
        // Si es devuelta al solicitante y éste acepta, pasa a supervisor (revisada por admin contrato)
        {
          condition: approves && approvedByPlanner && returnedPetitioner,
          newState: state.contAdmin,
          log: 'Devuelta al solicitante'
        },

        // Si se aprueba y no ha sido devuelta, pasa al planificador (revisada por contract owner)
        {
          condition: approves && latestEvent.newState !== state.returnedPetitioner,
          newState: state.contOwner,
          log: 'Aprobada'
        }
      ]
    ],
    [
      3,
      [
        // Si tiene eventos y aprueba y viene con estado 5 lo pasa a 6
        {
          condition: approves && latestEvent && approvedByPlanner,
          newState: state.contAdmin,
          log: 'Aprobada con estado 5'
        },

        // Si aprueba y viene con otro estado, pasa al planificador (revisada por contract owner)
        { condition: approves && !approvedByPlanner, newState: state.contOwner, log: 'Aprobada otro estado' }
      ]
    ],
    [
      6,
      [
        // Si tiene eventos y aprueba, y tiene cambio de fecha, lo pasa a planificador (revisada por contract owner)
        { condition: approves && changeDate, newState: state.contOwner, log: 'Aprobada con cambio de fecha' }
      ]
    ],
    [
      7,
      [
        // Si los recibe son horas (string) y estas horas se escriben en db y lo pasa a 8
        { condition: typeof approves === 'string', newState: state.draftsman, log: 'Recibido con horas' }
      ]
    ]
  ])

  const roleRules = rules.get(role)

  // Caso por defecto
  if (!roleRules) {
    return role
  }

  for (const rule of roleRules) {
    if (rule.condition) {
      return rule.newState
    }
  }
}

// ** Modifica documentos
const updateDocs = async (id, approves, userParam) => {
  const { ref, docSnapshot, previousRole } = await getDocumentAndUser(id)
  const latestEvent = await getLatestEvent(id)
  const rejected = 10
  let newState
  let prevDoc
  let processedFields

  // Flujo de aprobación
  if (approves) {
    // Si approves es objeto, se procesan los cambios en los campos
    processedFields = approves === true ? false : processFieldChanges(approves, docSnapshot)
    newState = getNextState(userParam.role, approves, latestEvent)
  } else {
    newState = rejected
  }

  // Asigna turno
  const addShift =
    (userParam.role === 2 && docSnapshot.state >= 6) ||
    (userParam.role === 3 && docSnapshot.state === 6) ||
    (userParam.role === 6 && newState === 6)

  prevDoc = addShift
    ? { ...processedFields.incomingFields}
    : {
        ...processedFields.incomingFields,
        supervisorShift: await setSupervisorShift(moment(docSnapshot.start.toDate()).isoWeek())
      }

  let newEvent = {
    prevDoc,
    prevState: docSnapshot.state,
    newState,
    user: userParam.email,
    userName: userParam.displayName,
    date: Timestamp.fromDate(new Date())
  }

  processedFields.changedFields.state = newState
  console.log(processedFields)

  // Escribir y mandar mail
  updateDocumentAndAddEvent(ref, processedFields.changedFields, userParam, newEvent, docSnapshot.uid, id)
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

export {
  newDoc,
  getDocumentAndUser,
  getLatestEvent,
  setSupervisorShift,
  processFieldChanges,
  updateDocumentAndAddEvent,
  getNextState,
  updateDocs,
  updateUserPhone,
  addNewContact,
  blockDayInDatabase,
  dateWithDocs
}
