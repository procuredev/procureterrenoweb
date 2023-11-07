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

// ** Imports Propios
import { solicitudValidator } from '../form-validation/helperSolicitudValidator'
import { sendEmailNewPetition } from './mailing/sendEmailNewPetition'
import { sendEmailWhenReviewDocs } from './mailing/sendEmailWhenReviewDocs'
import { getUnixTime } from 'date-fns'

// ** Librería para manejar fechas
const moment = require('moment')

const requestCounter = async () => {
  const counterRef = doc(db, 'counters', 'requestCounter')

  try {
    const requestNumber = await runTransaction(db, async transaction => {
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

    return requestNumber
  } catch (error) {
    console.error('Error al obtener el número de solicitud:', error)
    throw new Error('Error al obtener el número de solicitud')
  }
}

const newDoc = async (values, userParam) => {
  const {
    title,
    start,
    plant,
    area,
    contop,
    fnlocation,
    petitioner,
    opshift,
    type,
    detention,
    sap,
    objective,
    deliverable,
    receiver,
    description,
    ot,
    end,
    urgency,
    mcDescription
  } = values

  const { uid, displayName: user, email: userEmail, role: userRole, engineering } = userParam

  try {
    solicitudValidator(values)
    const requestNumber = await requestCounter()

    const docRef = await addDoc(collection(db, 'solicitudes'), {
      title,
      start,
      plant,
      area,
      contop,
      fnlocation,
      petitioner,
      opshift,
      type,
      detention,
      sap,
      objective,
      deliverable,
      receiver,
      description,
      uid,
      user,
      userEmail,
      userRole,
      date: Timestamp.fromDate(new Date()),
      n_request: requestNumber,
      engineering,
      ...(urgency && { urgency }),
      ...(ot && { ot }),
      ...(end && { end }),
      ...(mcDescription && {mcDescription})
    })

    const adjustedDate = moment(values.start).subtract(1, 'day')
    const week = moment(adjustedDate.toDate()).isoWeek()

    // Establecemos los campos adicionales de la solicitud
    await updateDoc(docRef, {
      ...newDoc,
      // Si el usuario que está haciendo la solicitud es Supervisor se genera con estado inicial 6
      state: userParam.role === 7 ? 6 : userParam.role || 'No definido',
      supervisorShift: userParam.role === 7 ? (week % 2 === 0 ? 'A' : 'B') : null
    })

    // Se envía email a quienes corresponda
    await sendEmailNewPetition(userParam, values, docRef.id, requestNumber)

    console.log('Nueva solicitud creada con éxito.')

    return docRef
  } catch (error) {
    console.error('Error al crear la nueva solicitud:', error)
    throw new Error('Error al crear la nueva solicitud')
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

const setSupervisorShift = async date => {
  const adjustedDate = moment(date.toDate()).subtract(1, 'day') // Restar un día para iniciar la semana en martes
  const week = moment(adjustedDate.toDate()).isoWeek()
  const supervisorShift = week % 2 === 0 ? 'A' : 'B'

  return supervisorShift
}

async function increaseAndGetNewOTValue() {
  const counterRef = doc(db, 'counters', 'otCounter')

  try {
    const newOTValue = await runTransaction(db, async transaction => {
      const counterSnapshot = await transaction.get(counterRef)

      const newCounter = counterSnapshot.exists ? counterSnapshot.data().counter + 1 : 1

      transaction.set(counterRef, { counter: newCounter })

      return newCounter
    })

    return newOTValue
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

const processFieldChanges = (incomingFields, currentDoc) => {
  const changedFields = {}

  for (const key in incomingFields) {
    let value = incomingFields[key]
    let currentFieldValue = currentDoc[key]

    //console.log(value)
    //console.log(currentFieldValue)

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
      incomingFields[key] = currentFieldValue || 'none'
    }
  }

  return { changedFields, incomingFields }
}

const updateDocumentAndAddEvent = async (ref, changedFields, userParam, prevDoc, requesterId, id, prevState) => {
  if (Object.keys(changedFields).length > 0) {
    const { email, displayName } = userParam

    let newEvent = {
      prevState,
      newState: changedFields.state,
      user: email,
      userName: displayName,
      date: Timestamp.fromDate(new Date()),
      ...(prevDoc && Object.keys(prevDoc).length !== 0 ? { prevDoc } : {})
    }

    await updateDoc(ref, changedFields)
    await addDoc(collection(db, 'solicitudes', id, 'events'), newEvent)
    await sendEmailWhenReviewDocs(userParam, newEvent.prevState, newEvent.newState, requesterId, id)
  } else {
    console.log('No se escribió ningún documento')
  }
}

function getNextState(role, approves, latestEvent, userRole) {
  const state = {
    returned: 1,
    contOperator: 3,
    contOwner: 4,
    planner: 5,
    contAdmin: 6,
    supervisor: 7,
    draftsman: 8,
    rejected: 0
  }

  // Cambiar la función para que reciba el docSnapshot y compare la fecha original de start con la que estoy modificándolo ahora
  // Si quiero cambiarla por la fecha original, no se devolverá al autor, sino que se va por el caso x default.
  const dateHasChanged = latestEvent && 'prevDoc' in latestEvent && 'start' in latestEvent.prevDoc
  const approveWithChanges = typeof approves === 'object' || typeof approves === 'string'
  const approvedByPlanner = latestEvent.prevState === state.planner
  const emergencyBySupervisor = latestEvent.newState === state.draftsman && userRole === 7
  const returned = latestEvent.newState === state.returned
  const changingStartDate = typeof approves === 'object' && 'start' in approves
  const modifiedBySameRole = userRole === role

  const rules = new Map([
    [
      2,
      [
        // Si es devuelta x Procure al solicitante y éste acepta, pasa a supervisor (revisada por admin contrato 5 --> 1 --> 6)
        // No se usó dateHasChanged porque el cambio podría haber pasado en el penúltimo evento
        {
          condition: approves && approvedByPlanner && returned && !approveWithChanges,
          newState: state.contAdmin,
          log: 'Devuelto por Adm Contrato Procure'
        },

        // Si es devuelta al Solicitante por Contract Operator y Solicitante acepta (2/3 --> 1 --> 3)
        {
          condition: approves && dateHasChanged && returned && !approveWithChanges,
          newState: state.contOperator,
          log: 'Devuelto por Cont Operator/Cont Owner MEL'
        }
      ]
    ],
    [
      3,
      [
        //
        {
          condition: approves && emergencyBySupervisor,
          newState: state.draftsman,
          emergencyApprovedByContop: true,
          log: 'Emergencia aprobada por Contract Operator'
        },
        // Si modifica la solicitud hecha por el Solicitante, se devuelve al solicitante (2 --> 1)
        {
          condition: approves && approveWithChanges && !returned && !modifiedBySameRole,
          newState: state.returned,
          log: 'Devuelto por Contract Operator hacia Solcitante'
        },

        // Si aprueba y viene con estado 5 lo pasa a 6 (5 --> 1 --> 6)
        {
          condition: approves && approvedByPlanner && returned && !approveWithChanges,
          newState: state.contAdmin,
          log: 'Devuelto por Adm Contrato Procure'
        },

        // Si vuelve a modificar una devolución, pasa al planificador (revisada por contract owner) (3 --> 1 --> 3)
        {
          condition: approves && !approvedByPlanner && returned,
          newState: state.contOperator,
          log: 'Devuelto por Cont Owner MEL'
        }
      ]
    ],
    [
      4,
      [
        // Si modifica, se le devuelve al autor (3 --> 1)
        {
          condition: approveWithChanges,
          newState: state.returned,
          log: 'Aprobado por Planificador'
        }
      ]
    ],
    [
      5,
      [
        // Planificador modifica sin cambios de fecha (any --> any)
        {
          condition: approves && !changingStartDate && !dateHasChanged,
          newState: state.planner,
          log: 'Modificado sin cambio de fecha por Planificador'
        }
      ]
    ],
    [
      6,
      [
        // Planificador modifica, Adm Contrato no modifica
        {
          condition: approves && !approveWithChanges && dateHasChanged,
          newState: state.returned,
          log: 'Aprobada con cambio de fecha'
        },

        // Planificador no modifica, Adm Contrato sí
        {
          condition: approves && approveWithChanges && !dateHasChanged,
          newState: state.returned,
          log: 'Modificado por adm contrato'
        },

        // Planificador modifica, Adm Contrato sí modifica
        {
          condition: approves && approveWithChanges && dateHasChanged,
          newState: state.returned,
          log: 'Modificado por adm contrato y planificador'
        }
      ]
    ],
    [
      7,
      [
        // Supervisor agrega horas pasando estado de la solicitud a 8
        // Si horas cambia a objeto, en vez de checkear por string se deberá checkear que el objeto tenga {start, end y hours}
        {
          condition: approves && approves.hasOwnProperty('hours'),
          newState: state.draftsman,
          log: 'Horas agregadas por Supervisor'
        }

        // Caso para cuando supervisor cambia fecha al momento de asignar proyectistas o antes (6 --> 1)
      ]
    ]
  ])

  const roleRules = rules.get(role)

  if (!roleRules) {
    console.log('No se encontraron reglas para el rol')

    return role
  }

  for (const rule of roleRules) {
    if (rule.condition) {
      console.log(rule.log)

      return rule.newState
    }
  }

  return role
}

const updateDocs = async (id, approves, userParam) => {
  const hasFieldModifications = typeof approves === 'object' && !Array.isArray(approves)
  const { ref, docSnapshot } = await getDocumentAndUser(id)
  const { start: docStartDate, ot: hasOT, state: prevState, userRole } = docSnapshot
  const latestEvent = await getLatestEvent(id)
  const rejected = 0
  const role = userParam.role
  let newState = approves ? getNextState(role, approves, latestEvent, userRole) : rejected
  let processedFields = { incomingFields: {}, changedFields: {} }

  // const addOT = role === 5 && approves && !hasOT
  // const ot = addOT ? await increaseAndGetNewOTValue() : null

  const addShift = newState === 6
  const supervisorShift = addShift ? await setSupervisorShift(docStartDate) : null

  if (hasFieldModifications) {
    processedFields = processFieldChanges(approves, docSnapshot)
  }
  let { incomingFields, changedFields } = processedFields
  const prevDoc = { ...incomingFields }

  if (approves) {
    changedFields = {
      //  ...(addOT && ot ? { ot } : {}),
      ...(addShift && supervisorShift ? { supervisorShift } : {}),
      ...changedFields
    }
  }

  if (userRole === 7 && newState === 8) {
    changedFields.emergencyApprovedByContop = prevState === 8 ? true : false
  }

  changedFields.state = newState

  updateDocumentAndAddEvent(ref, changedFields, userParam, prevDoc, docSnapshot.uid, id, prevState)
}

// ** Modifica otros campos Usuarios
const updateUserPhone = async (id, obj) => {
  const ref = doc(db, 'users', id)
  await updateDoc(ref, { phone: obj.replace(/\s/g, '') })
}

// ** Bloquear o desbloquear un día en la base de datos
const blockDayInDatabase = async (date, cause = '') => {
  try {
    const convertDate = moment(date).startOf().toDate()
    const dateUnix = getUnixTime(convertDate)
    const docRef = doc(collection(db, 'diasBloqueados'), dateUnix.toString())

    const docSnap = await getDoc(docRef)
    const isBlocked = docSnap.exists() ? docSnap.data().blocked : false

    if (isBlocked) {
      await setDoc(docRef, { blocked: false })
      console.log('Día desbloqueado')
    } else if (cause.length > 0) {
      await setDoc(docRef, { blocked: true, cause })
      console.log('Día bloqueado')
    } else {
      console.log('Para bloquear la fecha debes proporcionar un motivo')
    }
  } catch (error) {
    console.error('Error al bloquear/desbloquear el día:', error)
    throw new Error('Error al bloquear/desbloquear el día')
  }
}

export { newDoc, updateDocs, updateUserPhone, blockDayInDatabase }
