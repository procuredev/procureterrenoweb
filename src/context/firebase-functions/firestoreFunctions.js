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
  runTransaction,
  onSnapshot,
  increment
} from 'firebase/firestore'

// ** Imports Propios
import { solicitudValidator } from '../form-validation/helperSolicitudValidator'
import { sendEmailNewPetition } from './mailing/sendEmailNewPetition'
import { sendEmailWhenReviewDocs } from './mailing/sendEmailWhenReviewDocs'
import { getUnixTime, setDayOfYear } from 'date-fns'
import { async } from '@firebase/util'
import { timestamp } from '@antfu/utils'
import { blue } from '@mui/material/colors'
import { useEffect } from 'react'

import { useState } from 'react'

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
      ...(mcDescription && { mcDescription })
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

const addComment = async (id, comment, userParam) => {
  let newEvent = {
    user: userParam.email,
    userName: userParam.displayName,
    date: Timestamp.fromDate(new Date()),
    comment
  }
  await addDoc(collection(db, 'solicitudes', id, 'events'), newEvent)
    .then(() => {
      console.log('Comentario agregado')
    })
    .catch(err => {
      console.error(err)
    })
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
  const emergencyBySupervisor = userRole === 7
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
        // Planificador modifica sin cambios de fecha (any --> planner)
        {
          condition: approves && !changingStartDate && !dateHasChanged,
          newState: state.planner,
          log: 'Modificado sin cambio de fecha por Planificador'
        },
        // Planificador modifica solicitud hecha por Supervisor (any --> any)
        {
          condition: approves && emergencyBySupervisor,
          newState: latestEvent.newState,
          log: 'Modificado sin cambiar de estado por Planificador'
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
        },
        {
          condition: approves && approves.hasOwnProperty('designerReview'),
          newState: state.draftsman,
          log: 'Proyectistas agregados por Supervisor'
        },
        // Supervisor pausa el levantamiento y retrocede a adm contrato
        {
          condition: approves && approves.hasOwnProperty('pendingReschedule') && approves.pendingReschedule === true,
          newState: state.contAdmin,
          log: 'Pausado por Supervisor'
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

// ** Actualiza la información del usuario en Firestore
const updateUserData = async (userId, data) => {
  const ref = doc(db, 'users', userId)
  await updateDoc(ref, data)
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
    } else if (cause && cause.length > 0) {
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

const useBlueprints = id => {
  const [data, setData] = useState([])

  useEffect(() => {
    if (!id) return

    const unsubscribe = onSnapshot(collection(db, `solicitudes/${id}/blueprints`), docSnapshot => {
      try {
        const allDocs = []
        setData([])
        docSnapshot.forEach(doc => {
          const revisions = []

          onSnapshot(query(collection(doc.ref, 'revisions'), orderBy('date', 'desc')), revisionSnapshot => {
            revisionSnapshot.forEach(revisionDoc => {
              revisions.push({ id: revisionDoc.id, ...revisionDoc.data() })
            })
          })

          allDocs.push({ id: doc.id, ...doc.data(), revisions })
          setData(allDocs)
        })
      } catch (error) {
        console.error('Error al obtener los planos:', error)
      }
    })

    return () => unsubscribe()
  }, [id])

  return data
}

function formatCount(count) {
  return String(count).padStart(3, '0')
}

const generateBlueprintCodeClient = async (typeOfDiscipline, typeOfDocument, petition, blueprintId, userParam) => {
  try {
    const idProject = '21286'

    const shortPlants = ['PCLC', 'LSL1', 'LSL2', 'CHCO', 'PCOL', 'ICAT']

    const valPlant = [
      'Planta Concentradora Los Colorados',
      'Planta Concentradora Laguna Seca | Línea 1',
      'Planta Concentradora Laguna Seca | Línea 2',
      'Chancado y Correas',
      'Puerto Coloso',
      'Instalaciones Cátodo'
    ]

    function formatCount(count) {
      // Convierte el conteo a un string y rellena con ceros a la izquierda hasta que la longitud sea 5
      return String(count).padStart(5, '0')
    }

    function getShortDefinition(plantLongDef) {
      const index = valPlant.indexOf(plantLongDef)
      if (index !== -1) {
        return shortPlants[index]
      } else {
        return 'No se encontró definición corta para esta planta'
      }
    }
    const { ot, plant, area, id } = petition

    const otNumber = `OT${ot}`
    const instalacion = getShortDefinition(plant)
    const areaNumber = area.slice(0, 4)

    // Referencia al documento de contador para la combinación específica dentro de la subcolección blueprints
    const counterDocID = `${typeOfDiscipline}-${typeOfDocument}-counter`
    const counterRef = doc(db, 'solicitudes', id, 'clientCodeGeneratorCount', counterDocID)

    // Incrementa el contador dentro de una transacción

    const incrementedCount = await runTransaction(db, async transaction => {
      const counterSnapshot = await transaction.get(counterRef)
      let newCount
      if (!counterSnapshot.exists()) {
        newCount = formatCount(1)
        transaction.set(counterRef, { count: newCount })
      } else {
        newCount = formatCount(Number(counterSnapshot.data().count) + 1)
        transaction.update(counterRef, { count: newCount })
      }

      return newCount // Retorna el nuevo contador para usarlo fuera de la transacción
    })

    // Ahora, añade este contador al final de tu newCode
    const newCode = `${idProject}-${otNumber}-${instalacion}-${areaNumber}-${typeOfDiscipline}-${typeOfDocument}-${incrementedCount}`

    const ref = doc(db, 'solicitudes', id, 'blueprints', blueprintId)
    updateDoc(ref, { clientCode: newCode })

    console.log('newCode:', newCode)
  } catch (error) {
    console.error('Error al generar clientCode:', error)
    throw new Error('Error al generar clientCode')
  }
}

const generateBlueprint = async (typeOfDiscipline, typeOfDocument, petition, userParam) => {
  try {
    const idProject = '21286'

    // Referencia al documento de contador para la combinación específica dentro de la subcolección blueprints
    const counterDocID = `${typeOfDiscipline}-${typeOfDocument}-counter`
    const counterRef = doc(db, 'counters', 'blueprints_InternalCode-Counter')

    // Incrementa el contador dentro de una transacción
    const incrementedCount = await runTransaction(db, async transaction => {
      const counterSnapshot = await transaction.get(counterRef)

      let currentCount
      if (!counterSnapshot.exists() || !counterSnapshot.data()[counterDocID]) {
        currentCount = formatCount(1)
        transaction.set(counterRef, { [counterDocID]: { count: currentCount } }, { merge: true })
      } else {
        currentCount = formatCount(Number(counterSnapshot.data()[counterDocID].count) + 1)
        transaction.update(counterRef, { [counterDocID]: { count: currentCount } })
      }

      return currentCount // Retorna el nuevo contador para usarlo fuera de la transacción
    })

    // Ahora, añade este contador al final de tu newCode
    const newCode = `${idProject}-${typeOfDiscipline}-${typeOfDocument}-${incrementedCount}`

    const docRef = doc(collection(db, 'solicitudes', petition.id, 'blueprints'), newCode)
    await setDoc(docRef, {
      userId: userParam.uid,
      userName: userParam.displayName,
      revision: 'iniciado',
      userEmail: userParam.email,
      sentByDesigner: false,
      sentBySupervisor: false,
      date: Timestamp.fromDate(new Date())
    })

    console.log('newCode:', newCode)
  } catch (error) {
    console.error('Error al generar Blueprint:', error)
    throw new Error('Error al generar Blueprint')
  }
}

const addDescription = async (petitionID, blueprint, description) => {
  const ref = doc(db, 'solicitudes', petitionID, 'blueprints', blueprint)
  updateDoc(ref, { description })
}

// getLatestRevision() obtiene la última revisión de un plano en la base de datos
const getLatestRevision = async (petitionID, blueprintID) => {
  // Obtiene la referencia a la colección de revisiones del entregable (blueprint) en la base de datos
  const revisionsRef = collection(db, 'solicitudes', petitionID, 'blueprints', blueprintID, 'revisions')

  // Obtiene un snapshot de la última revisión del plano, ordenada por fecha en orden descendente
  const revisionsSnapshot = await getDocs(query(revisionsRef, orderBy('date', 'desc'), limit(1)))

  // Si no hay revisiones, devuelve null
  if (revisionsSnapshot.docs && revisionsSnapshot.docs.length === 0) {
    return null
  }

  // Obtiene los datos de la última revisión
  const latestRevision = revisionsSnapshot.docs[0].data()

  // Devuelve los datos de la última revisión
  return latestRevision
}

// getNextRevision calcula la próxima revisión basándose en una serie de condiciones
const getNextRevision = async (
  approve,
  latestRevision,
  { role, email, displayName, uid },
  {
    revision,
    description,
    storageBlueprints,
    approvedByClient,
    approvedByContractAdmin,
    approvedBySupervisor,
    approvedByDocumentaryControl,
    resumeBlueprint,
    userId,
    storageHlcDocuments
  },
  remarks,
  hours,
  investedHours
) => {
  // Inicializa la nueva revisión con el valor actual de la revisión
  let newRevision = revision

  // Calcula el código de carácter de la próxima letra en el alfabeto
  const nextCharCode = revision.charCodeAt(0) + 1

  const nextChar = String.fromCharCode(nextCharCode)

  // Si el rol es 8 y se aprueba, se ejecutan una serie de acciones
  if (role === 8 && approve) {
    // Define las acciones posibles
    const actions = {
      // * Si la revisión es mayor o igual a 'B' y no ha sido aprobada por el cliente, se mantiene la revisión actual
      keepRevision: {
        condition: () =>
          revision.charCodeAt(0) >= 48 && approvedByClient === true && approvedByDocumentaryControl === false,
        action: () => (newRevision = revision)
      },
      incrementResume: {
        condition: () => revision.charCodeAt(0) >= 48 && resumeBlueprint === true,
        action: () => (newRevision = nextChar)
      },
      // * Si la revisión es mayor o igual a 'B', ha sido aprobada por el cliente, se resetea la revisión a '0'
      resetRevision: {
        condition: () => revision.charCodeAt(0) >= 66 && approvedByClient === true,
        action: () => (newRevision = '0')
      },
      // * Si la revisión es 'B', 'C' o 'D', no ha sido aprobada por el cliente y ha sido aprobada por el administrador de contrato o el supervisor, se incrementa la revisión a la siguiente letra
      incrementRevision: {
        condition: () =>
          (revision.charCodeAt(0) >= 66 || revision.charCodeAt(0) >= 48) &&
          approvedByClient === false &&
          approvedByDocumentaryControl === true,
        action: () => (newRevision = nextChar)
      },
      startRevision: {
        condition: () => revision === 'iniciado',
        action: () => (newRevision = 'A')
      },
      incrementRevisionInA: {
        condition: () => revision === 'A',
        action: () => (newRevision = approvedByDocumentaryControl ? nextChar : revision)
      }
    }

    // Ejecuta la acción correspondiente para cada condición que se cumple
    Object.values(actions).forEach(({ condition, action }) => {
      if (condition()) {
        action()
      }
    })
  } else if (role === 7 && approve && userId === uid) {
    // Define las acciones posibles
    const actions = {
      // * Si la revisión es mayor o igual a 'B' y no ha sido aprobada por el cliente, se mantiene la revisión actual
      keepRevision: {
        condition: () =>
          revision.charCodeAt(0) >= 48 && approvedByClient === true && approvedByDocumentaryControl === false,
        action: () => (newRevision = revision)
      },
      incrementResume: {
        condition: () => revision.charCodeAt(0) >= 48 && resumeBlueprint === true,
        action: () => (newRevision = nextChar)
      },
      // * Si la revisión es mayor o igual a 'B', ha sido aprobada por el cliente, se resetea la revisión a '0'
      resetRevision: {
        condition: () => revision.charCodeAt(0) >= 66 && approvedByClient === true,
        action: () => (newRevision = '0')
      },
      // * Si la revisión es 'B', 'C' o 'D', no ha sido aprobada por el cliente y ha sido aprobada por el administrador de contrato o el supervisor, se incrementa la revisión a la siguiente letra
      incrementRevision: {
        condition: () =>
          (revision.charCodeAt(0) >= 66 || revision.charCodeAt(0) >= 48) &&
          approvedByClient === false &&
          approvedByDocumentaryControl === true,
        action: () => (newRevision = nextChar)
      },
      startRevision: {
        condition: () => revision === 'iniciado',
        action: () => (newRevision = 'A')
      },
      incrementRevisionInA: {
        condition: () => revision === 'A',
        action: () => (newRevision = approvedByDocumentaryControl ? nextChar : revision)
      }
    }

    // Ejecuta la acción correspondiente para cada condición que se cumple
    Object.values(actions).forEach(({ condition, action }) => {
      if (condition()) {
        action()
      }
    })
  }

  // Crea el objeto de la próxima revisión con los datos proporcionados y la nueva revisión calculada
  const nextRevision = {
    prevRevision: latestRevision && Object.keys(latestRevision).length === 0 ? latestRevision.newRevision : revision,
    newRevision,
    description,
    storageBlueprints: storageBlueprints[storageBlueprints.length - 1],
    userEmail: email,
    userName: displayName,
    userId: uid,
    date: Timestamp.fromDate(new Date()),
    remarks: remarks || 'sin observaciones',
    drawingHours: hours ? hours : null,
    investedHours: investedHours || null
  }

  return nextRevision
}

// updateBlueprint() actualiza el entregable en la base de datos
const updateBlueprint = async (petitionID, blueprint, approves, userParam, remarks, hours, investedHours) => {
  // Obtiene la referencia al documento del entregable (blueprint) en la base de datos
  const blueprintRef = doc(db, 'solicitudes', petitionID, 'blueprints', blueprint.id)
  const solicitudRef = doc(db, 'solicitudes', petitionID)

  // Obtiene la última revisión del plano
  const latestRevision = await getLatestRevision(petitionID, blueprint.id)

  // Calcula la próxima revisión del plano
  const nextRevision = await getNextRevision(
    approves,
    latestRevision,
    userParam,
    blueprint,
    remarks,
    hours,
    investedHours
  )

  // Comprueba varias condiciones sobre el plano
  const isRevisionAtLeastB = blueprint.revision.charCodeAt(0) >= 66
  const isRevisionAtLeast0 = blueprint.revision.charCodeAt(0) >= 48 && blueprint.revision.charCodeAt(0) <= 57
  const isRevisionAtLeast1 = blueprint.revision.charCodeAt(0) >= 49 && blueprint.revision.charCodeAt(0) <= 57
  const isNotApprovedByAdminAndSupervisor = !blueprint.approvedByContractAdmin && !blueprint.approvedBySupervisor
  const isApprovedByClient = blueprint.approvedByClient
  const isOverResumable = isRevisionAtLeast1 && blueprint.resumeBlueprint && blueprint.blueprintCompleted

  // Inicializa los datos que se van a actualizar
  let updateData = {
    revision: nextRevision.newRevision,
    sentByDesigner: false,
    approvedByContractAdmin: false,
    approvedBySupervisor: false,
    approvedByDocumentaryControl: false,
    sentTime: Timestamp.fromDate(new Date())
  }

  // Define las acciones a realizar en función del rol del usuario
  const roleActions = {
    6: () => ({
      ...updateData,
      sentByDesigner: approves,
      approvedByContractAdmin: approves,
      storageBlueprints: approves ? blueprint.storageBlueprints : null
    }),
    7: (blueprint, authUser) => {
      return blueprint.userId === authUser.uid
        ? {
            ...updateData,
            sentBySupervisor: approves,
            approvedByContractAdmin: approves && blueprint.revision === 'iniciado'
          }
        : {
            ...updateData,
            sentByDesigner: approves,
            approvedBySupervisor: approves,
            storageBlueprints: approves ? blueprint.storageBlueprints : null
          }
    },
    8: () => ({
      ...updateData,
      sentByDesigner: approves,
      approvedBySupervisor:
        (approves && blueprint.revision === 'iniciado') ||
        (blueprint.revision === 'A' && !blueprint.approvedByDocumentaryControl)
    }),
    9: () =>
      (isRevisionAtLeastB || isRevisionAtLeast0) && isNotApprovedByAdminAndSupervisor
        ? {
            ...updateData,
            approvedByClient: blueprint.blueprintCompleted ? false : approves,
            approvedByDocumentaryControl: approves,
            storageBlueprints:
              approves &&
              ((!blueprint.blueprintCompleted && isApprovedByClient) || (!isApprovedByClient && isRevisionAtLeast1))
                ? blueprint.storageBlueprints
                : null,
            resumeBlueprint:
              (isApprovedByClient && blueprint.blueprintCompleted) ||
              (blueprint.resumeBlueprint && blueprint.approvedByDocumentaryControl)
                ? true
                : false,
            blueprintCompleted:
              approves &&
              (((!blueprint.blueprintCompleted || blueprint.resumeBlueprint) && isApprovedByClient) ||
                (!isApprovedByClient && isRevisionAtLeast1))
                ? true
                : false,
            sentByDesigner: false,
            sentBySupervisor: false,
            remarks: remarks ? true : false,
            storageHlcDocuments: null
          }
        : isOverResumable
        ? {
            ...updateData,
            approvedByClient: false,
            approvedByDocumentaryControl: false,
            storageBlueprints: null,
            sentByDesigner: false,
            remarks: remarks ? true : false
          }
        : {
            ...updateData,
            approvedByDocumentaryControl: approves,
            sentByDesigner: approves && (isRevisionAtLeastB || isRevisionAtLeast0),
            sentBySupervisor: approves && (isRevisionAtLeastB || isRevisionAtLeast0),
            storageBlueprints:
              approves && (isRevisionAtLeastB || isRevisionAtLeast0) ? blueprint.storageBlueprints : null
          }
  }

  // Aplica la acción correspondiente al rol del usuario
  updateData = roleActions[userParam.role] ? roleActions[userParam.role](blueprint, userParam) : updateData

  // Actualiza el plano en la base de datos
  await updateDoc(blueprintRef, updateData)

  // Añade la nueva revisión a la subcolección de revisiones del entregable (blueprint)
  await addDoc(collection(db, 'solicitudes', petitionID, 'blueprints', blueprint.id, 'revisions'), nextRevision)

  // Lee el documento de la 'solicitud'
  const solicitudDoc = await getDoc(solicitudRef)
  const blueprintDoc = await getDoc(blueprintRef)

  if (blueprintDoc.data().blueprintCompleted && blueprintDoc.data().resumeBlueprint === false) {
    // Si el documento no tiene un campo 'counterBlueprintCompleted', créalo
    if (!solicitudDoc.data().counterBlueprintCompleted) {
      await updateDoc(solicitudRef, { counterBlueprintCompleted: 0 })
    }

    await updateDoc(solicitudRef, { counterBlueprintCompleted: increment(1) })

    // Obtiene la subcolección 'blueprints'
    const blueprintsCollection = collection(db, 'solicitudes', petitionID, 'blueprints')
    // Obtiene todos los documentos de la subcolección
    const blueprintsSnapshot = await getDocs(blueprintsCollection)
    // Obtiene la cantidad de documentos en la subcolección
    const numBlueprints = blueprintsSnapshot.size

    if (solicitudDoc.data().counterBlueprintCompleted === numBlueprints) {
      await updateDoc(solicitudRef, { state: 9 })
    }
  }
}

const generateTransmittalCounter = async currentPetition => {
  try {
    // Referencia al documento de contador para la combinación específica dentro de la subcolección transmittals
    const counterDocID = `${currentPetition.ot}-counter`
    const counterRef = doc(db, 'counters', 'transmittal_CounterByOt')

    // Incrementa el contador dentro de una transacción
    const incrementedCount = await runTransaction(db, async transaction => {
      const counterSnapshot = await transaction.get(counterRef)

      let currentCount
      if (!counterSnapshot.exists() || !counterSnapshot.data()[counterDocID]) {
        currentCount = formatCount(1)
        transaction.set(counterRef, { [counterDocID]: { count: currentCount } }, { merge: true })
      } else {
        currentCount = formatCount(Number(counterSnapshot.data()[counterDocID].count) + 1)
        transaction.update(counterRef, { [counterDocID]: { count: currentCount } })
      }

      return currentCount // Retorna el nuevo contador para usarlo fuera de la transacción
    })

    const idProject = '21286'

    // Ahora, añade este contador al final de tu newCode
    const newCode = `${idProject}-000-TT-${incrementedCount}`

    return newCode
  } catch (error) {
    console.error('Error al generar Transmittal:', error)
    throw new Error('Error al generar Transmittal')
  }
}

const updateSelectedDocuments = async (newCode, selected, currentPetition, authUser) => {
  try {
    // Actualiza el campo lastTransmittal en cada uno de los documentos seleccionados
    for (const id of selected) {
      const docRef = doc(db, 'solicitudes', currentPetition.id, 'blueprints', id[0])
      await updateDoc(docRef, { lastTransmittal: newCode })

      const nextRevision = {
        prevRevision: id[1].revision,
        newRevision: id[1].revision,
        description: id[1].description,
        storageBlueprints: id[1].storageBlueprints[0],
        userEmail: authUser.email,
        userName: authUser.displayName,
        userId: authUser.uid,
        date: Timestamp.fromDate(new Date()),
        remarks: 'transmittal generado',
        lastTransmittal: newCode,
        storageHlcDocuments: id[1].storageHlcDocuments[0]
      }

      // Añade la nueva revisión a la subcolección de revisiones del entregable (blueprint)
      await addDoc(collection(db, 'solicitudes', currentPetition.id, 'blueprints', id[0], 'revisions'), nextRevision)
    }
  } catch (error) {
    console.error('Error al actualizar documentos seleccionados:', error)
    throw new Error('Error al actualizar documentos seleccionados')
  }
}

export {
  newDoc,
  updateDocs,
  updateUserPhone,
  blockDayInDatabase,
  generateBlueprint,
  useBlueprints,
  updateBlueprint,
  addDescription,
  generateBlueprintCodeClient,
  generateTransmittalCounter,
  updateSelectedDocuments,
  addComment,
  updateUserData
}
