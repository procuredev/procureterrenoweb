// ** Firebase Imports
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore'
import { db } from 'src/configs/firebase'

// ** Imports Propios
import { getUnixTime } from 'date-fns'
import { useEffect, useState } from 'react'
import { solicitudValidator } from '../form-validation/helperSolicitudValidator'
import { sendEmailWhenReviewDocs } from './mailing/sendEmailWhenReviewDocs'

const moment = require('moment')

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
    //* ot,
    end,
    urgency,
    mcDescription,
    costCenter,
    files
  } = values

  const { uid, displayName: user, email: userEmail, role: userRole, engineering } = userParam

  try {
    // 'SolicitudValidator' valida que los datos vienen en "values" cumplan con los campos requeridos.
    solicitudValidator(values, userParam.role)
    // Incrementamos el valor del contador 'otCounter' en la base de datos Firestore y devuelve el nuevo valor.
    const ot = await increaseAndGetNewOTValue()

    // Calculamos el valor de 'deadline' sumando 21 días a 'start'.
    // const deadline = addDays(new Date(start), 21)

    // Teniendo como referencia la fecha 'deadline' calculamos el valor de cuantos días faltan (ó han pasado).
    // const daysToDeadline = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))

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
      // deadline,
      // daysToDeadline,
      costCenter,
      date: Timestamp.fromDate(new Date()),
      engineering,
      ...(urgency && { urgency }),
      ...(ot && { ot }),
      ...(end && { end }),
      ...(mcDescription && { mcDescription })
    })

    // Modificamos el inicio de semana a partir del dia martes y finaliza los días lunes.
    const adjustedDate = moment(values.start).subtract(1, 'day')
    // Utilizamos la función isoWeek() para obtener el número de la semana, puede variar de 1 a 53 en un año determinado.
    const week = moment(adjustedDate.toDate()).isoWeek()

    // Establecemos los campos adicionales de la solicitud.
    await updateDoc(docRef, {
      ...newDoc,
      // Si el usuario que hace la solicitud es Supervisor ó Planificador se genera con estado inicial 6, en caso contrario state se crea con el valor del role del usuario.
      state: userParam.role === 7 || userParam.role === 5 ? 6 : userParam.role,
      // Establecemos el turno del supervisor de acuerdo a la fecha de inicio y se intercalan entre semana considerando que el valor de 'week' sea un valor par o impar.
      supervisorShift: week % 2 === 0 ? 'A' : 'B'
    })

    // Se envía email a quienes corresponda
    // await sendEmailNewPetition(userParam, values, docRef.id, requestNumber)

    console.log('Nueva solicitud creada con éxito.')

    return { id: docRef.id, ot: ot }
  } catch (error) {
    console.error('Error al crear la nueva solicitud:', error)
    throw new Error('Error al crear la nueva solicitud')
  }
}

// Obtenemos un documento de la colección 'solicitudes' y el usuario asociado, con el rol previo del usuario decrementado en 1.
const getDocumentAndUser = async id => {
  const ref = doc(db, 'solicitudes', id)
  const querySnapshot = await getDoc(ref)
  const docSnapshot = querySnapshot.data()
  const userRef = doc(db, 'users', docSnapshot.uid)
  const userQuerySnapshot = await getDoc(userRef)
  const previousRole = userQuerySnapshot.data().role - 1

  return { ref, docSnapshot, previousRole }
}

// Obtienemos el evento más reciente asociado a una solicitud específica.
const getLatestEvent = async id => {
  const eventQuery = query(collection(db, `solicitudes/${id}/events`), orderBy('date', 'desc'), limit(1))
  const eventQuerySnapshot = await getDocs(eventQuery)
  const latestEvent = eventQuerySnapshot.docs.length > 0 ? eventQuerySnapshot.docs[0].data() : false

  return latestEvent
}

// Establecemos el turno del supervisor para una fecha dada, comenzando la semana en martes.
const setSupervisorShift = async date => {
  const adjustedDate = moment(date.toDate()).subtract(1, 'day') // Restar un día para iniciar la semana en martes.
  const week = moment(adjustedDate.toDate()).isoWeek()
  const supervisorShift = week % 2 === 0 ? 'A' : 'B'

  return supervisorShift
}

//  Incrementamos el valor del contador 'otCounter' en la base de datos Firestore y devuelve el nuevo valor.
async function increaseAndGetNewOTValue() {
  const counterRef = doc(db, 'counters', 'otCounter')

  try {
    // Utilizamos una transacción para garantizar la consistencia de los datos.
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

/**
 * Procesa los cambios en los campos de un documento comparándolos con los campos actuales.
 * Si un campo ha cambiado o es nuevo, lo guarda y realiza ajustes adicionales si es necesario.
 */
const processFieldChanges = (incomingFields, currentDoc) => {
  const changedFields = {}

  const addDays = (date, days) => {
    if (!(date instanceof Date)) {
      date = new Date(date)
    }
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + days)

    return newDate.getTime()
  }

  for (const key in incomingFields) {
    let value = incomingFields[key]
    let currentFieldValue = currentDoc[key]

    if (key === 'start' || key === 'end' || key === 'deadline') {
      value = moment(value.toDate()).toDate().getTime()
      currentFieldValue = currentFieldValue && currentFieldValue.toDate().getTime()
    }

    if (!currentFieldValue || value !== currentFieldValue) {
      // Verifica si el valor ha cambiado o es nuevo y lo guarda
      if (key === 'start' || key === 'end' || key === 'deadline') {
        value = value && Timestamp.fromDate(moment(value).toDate())
        currentFieldValue = currentFieldValue && Timestamp.fromDate(moment(currentFieldValue).toDate())

        // Verificar si se actualizó 'start' para actualizar 'deadline'
        // if (key === 'start') {
        //   const newDeadline = new Date(addDays(value.toDate(), 21))

        //   changedFields.deadline = newDeadline

        //   const today = new Date()
        //   const millisecondsInDay = 1000 * 60 * 60 * 24

        //   const daysToDeadline = Math.round((newDeadline - today) / millisecondsInDay)

        //   changedFields.daysToDeadline = daysToDeadline
        // }
      }
      changedFields[key] = value
      incomingFields[key] = currentFieldValue || 'none'
    }
  }

  return { changedFields, incomingFields }
}

// La función 'updateDocumentAndAddEvent' Actualiza un documento con los campos cambiados y agrega un registro en la subcolección de eventos.
const updateDocumentAndAddEvent = async (ref, changedFields, userParam, prevDoc, requesterId, id, prevState) => {
  if (Object.keys(changedFields).length > 0) {
    const { email, displayName, role } = userParam

    let newEvent = {
      prevState,
      newState: changedFields.state,
      user: email,
      userName: displayName,
      userRole: role,
      date: Timestamp.fromDate(new Date()),
      ...(prevDoc && Object.keys(prevDoc).length !== 0 ? { prevDoc } : {}),
      ...(changedFields.uprisingInvestedHours && { uprisingInvestedHours: changedFields.uprisingInvestedHours }),
      ...(changedFields.draftmen && { draftmen: changedFields.draftmen })
    }

    await updateDoc(ref, changedFields).then(() => {
      addDoc(collection(db, 'solicitudes', id, 'events'), newEvent)
    })

    await sendEmailWhenReviewDocs(userParam, newEvent.prevState, newEvent.newState, requesterId, id)
  } else {
    console.log('No se escribió ningún documento')
  }
}

const addComment = async (id, comment, userParam) => {
  let newEvent = {
    user: userParam.email,
    userName: userParam.displayName,
    userRole: userParam.role,
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
    petitioner: 2,
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
  const requestMadeByPlanner = userRole === 5
  const requestMadeByMelPetitioner = userRole === 2 && (!latestEvent || (latestEvent && latestEvent.newState === 2))

  const requestMadeByMelPetitionerAndApprovedByContractAdmin =
    userRole === 2 && latestEvent.newState === 3 && latestEvent.userRole === 6

  const rules = new Map([
    [
      2,
      [
        // Si es devuelta x Procure al solicitante y éste acepta, pasa a supervisor (revisada por admin contrato 5 --> 1 --> 6)
        // No se usó dateHasChanged porque el cambio podría haber pasado en el penúltimo evento
        // {
        //   condition: approves && approvedByPlanner && returned && !approveWithChanges,
        //   newState: state.contAdmin,
        //   log: 'Devuelto por Adm Contrato Procure'
        // },

        // // Si es devuelta al Solicitante por Contract Operator y Solicitante acepta (2/3 --> 1 --> 3)
        // {
        //   condition: approves && dateHasChanged && returned && !approveWithChanges,
        //   newState: state.contOperator,
        //   log: 'Devuelto por Cont Operator/Cont Owner MEL'
        // }

        // Para cualquier caso en que Solicitante apruebe o modifique, quedará en state === 2
        // Por lo tanto si la solicitud estaba en state===6, deberá volver a ser aprobada por el Administrador de Contrato.
        {
          condition: approves,
          newState: state.petitioner,
          log: 'Devuelto por Cont Operator/Cont Owner MEL'
        }
      ]
    ],
    [
      3,
      [
        // Contract Operator aprueba una solicitud hecha por Planificador posterior a cerrar el elvantamiento (8 --> 8)
        {
          condition: approves && requestMadeByPlanner,
          newState: state.draftsman,
          plannerPetitionApprovedByContop: true,
          log: 'Emergencia aprobada por Contract Operator'
        },
        // Contract Operator aprueba una solicitud de emergencia hecha por Supervisor posterior a cerrar el elvantamiento (8 --> 8)
        {
          condition: approves && emergencyBySupervisor,
          newState: state.draftsman,
          emergencyApprovedByContop: true,
          log: 'Emergencia aprobada por Contract Operator'
        },
        // Si modifica la solicitud hecha por el Solicitante, se devuelve al solicitante (2 --> 1)
        // {
        //   condition: approves && approveWithChanges && !returned && !modifiedBySameRole,
        //   newState: state.returned,
        //   log: 'Devuelto por Contract Operator hacia Solcitante'
        // },

        // Si aprueba y viene con estado 5 lo pasa a 6 (5 --> 1 --> 6)
        // {
        //   condition: approves && approvedByPlanner && returned && !approveWithChanges,
        //   newState: state.contAdmin,
        //   log: 'Devuelto por Adm Contrato Procure'
        // },

        // // Si vuelve a modificar una devolución, pasa al planificador (revisada por contract owner) (3 --> 1 --> 3)
        // {
        //   condition: approves && !approvedByPlanner && returned,
        //   newState: state.contOperator,
        //   log: 'Devuelto por Cont Owner MEL'
        // }

        // Si modifica algo que estaba en state === 2, deberá pasar a state === 3
        {
          condition: approves && state === 2 && state < 7,
          newState: state.contOperator,
          log: 'Modificado por Contract Operator'
        },

        // Si modifica algo que no estaba en state === 2, deberá pasar a state === 3
        {
          condition: approves && !state === 2 && state < 7,
          newState: state.contOperator,
          log: 'Modificado por Contract Operator'
        }
      ]
    ],
    [
      4,
      [
        // Si modifica, se le devuelve al autor (3 --> 1)
        // {
        //   condition: approveWithChanges ,
        //   newState: state.returned,
        //   log: 'Aprobado por Planificador'
        // }
      ]
    ],
    [
      5,
      [
        // Si el estado del levantamiento es mayor o igual a 8, se mantiene en ese estado.
        {
          condition: approves && state >= 8,
          newState: latestEvent.newState,
          log: 'Modificado por planificador. Se mantiene en el mismo estado.'
        },
        // Si el planificador modifica cualquier campo (6 --> 6)
        {
          condition: approves && approveWithChanges && requestMadeByPlanner,
          newState: state.contAdmin,
          log: 'Modificado por planificador'
        },
        {
          condition: approves && !emergencyBySupervisor && latestEvent.newState >= state.contAdmin,
          newState: latestEvent.newState,
          log: 'Modificado sin cambio de fecha por Planificador1'
        },
        // Planificador acepta cambios de fecha hecho por contract owner (6 --> 6)
        {
          condition: approves && !emergencyBySupervisor && requestMadeByPlanner && modifiedBySameRole,
          newState: state.contAdmin,
          log: 'Planificador acepta cambios de fecha aplicado por contract owner'
        },
        // Planificador modifica solicitud hecha por Supervisor (any --> any)
        {
          condition: approves && emergencyBySupervisor,
          newState: latestEvent.newState ? latestEvent.newState : state.contAdmin,
          log: 'Modificado sin cambiar de estado por Planificador'
        },
        // Planificador acepta Solicitud previamente aceptada por Administrador de Contrato en nombre del Contract Operator
        // (3 --> 6)
        {
          condition: approves && approveWithChanges && requestMadeByMelPetitionerAndApprovedByContractAdmin,
          newState: state.contAdmin,
          log:
            'Aprobado por Planificación: Solicitud Ingresada por MEL y aprobada por Administrador de Contrato en nombre de Contract Operator'
        }
      ]
    ],
    [
      6,
      [
        // Planificador modifica, Adm Contrato no modifica
        // {
        //   condition: approves && !approveWithChanges && dateHasChanged && !requestMadeByMelPetitioner,
        //   newState: state.returned,
        //   log: 'Aprobada con cambio de fecha'
        // },

        // Planificador no modifica, Adm Contrato sí
        // {
        //   condition: approves && approveWithChanges && !dateHasChanged && !requestMadeByMelPetitioner,
        //   newState: state.returned,
        //   log: 'Modificado por adm contrato'
        // },

        // Planificador modifica, Adm Contrato sí modifica
        // {
        //   condition: approves && approveWithChanges && dateHasChanged && !requestMadeByMelPetitioner,
        //   newState: state.returned,
        //   log: 'Modificado por adm contrato y planificador'
        // },

        // Solicitud Modificada por Administrador de Contrato
        {
          condition: approves && !requestMadeByMelPetitioner && latestEvent.newState !== 5,
          newState: latestEvent.newState ? latestEvent.newState : state.contAdmin,
          log: 'Solicitud ingresada por MEL es aprobada por Administrador de Contrato'
        },

        // Solicitud fue ingresada por un Solicitante de MEL
        {
          condition: approves && requestMadeByMelPetitioner,
          newState: state.contOperator,
          log: 'Solicitud ingresada por MEL es aprobada por Administrador de Contrato'
        }
      ]
    ],
    [
      7,
      [
        // Supervisor agrega horas pasando estado de la solicitud a 8
        // Si horas cambia a objeto, en vez de checkear por string se deberá checkear que el objeto tenga {start, end y hours}
        {
          condition: approves && approves.hasOwnProperty('uprisingInvestedHours'),
          newState: state.draftsman,
          log: 'Horas agregadas por Supervisor'
        },
        {
          condition: approves && approves.hasOwnProperty('start'),
          newState: state.contAdmin,
          log: 'fecha modificada por Supervisor'
        },
        {
          condition: approves && approves.hasOwnProperty('gabineteDraftmen'),
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
  let canceled = approves.cancelReason ? true : false
  const hasFieldModifications = typeof approves === 'object' && !Array.isArray(approves)
  const { ref, docSnapshot } = await getDocumentAndUser(id)
  const { start: docStartDate, ot: hasOT, state: prevState, userRole } = docSnapshot
  const latestEvent = await getLatestEvent(id)
  const rejected = 0
  const role = userParam.role
  let newState = !canceled ? getNextState(role, approves, latestEvent, userRole) : rejected
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

  if (userRole === 5 && newState === 8) {
    changedFields.plannerPetitionApprovedByContop = prevState === 8 ? true : false
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

// Maneja la obtención de datos de planos asociados a una solicitud y devuelve un array de datos y una función para actualizarlos.
const useBlueprints = id => {
  const [data, setData] = useState([])
  const [projectistData, setProjectistData] = useState({})

  useEffect(() => {
    if (!id) return undefined

    const unsubscribeAll = [] // Almacenará todas las desuscripciones

    const blueprintsRef = collection(db, `solicitudes/${id}/blueprints`)

    const unsubscribeBlueprints = onSnapshot(blueprintsRef, docSnapshot => {
      if (docSnapshot.docs.length === 0) {
        setData([])
        setProjectistData({})

        return
      }

      let allDocs = []
      let projectistDataTemp = {}

      docSnapshot.docs.forEach(doc => {
        const docData = doc.data()
        const { userName, id } = docData

        // Actualización de agrupación de datos
        if (!docData.deleted && userName && id) {
          const documentType = `${id.split('-')[1]}-${id.split('-')[2]}` // Ej: "500-PL"
          if (!projectistDataTemp[userName]) {
            projectistDataTemp[userName] = {}
          }
          if (!projectistDataTemp[userName][documentType]) {
            projectistDataTemp[userName][documentType] = 0
          }

          projectistDataTemp[userName][documentType] += 1
        }
        const revisionsRef = collection(doc.ref, 'revisions')

        // Suscribirse a cambios en 'revisions'
        const unsubscribeRevisions = onSnapshot(query(revisionsRef, orderBy('date', 'desc')), revisionSnapshot => {
          const revisions = revisionSnapshot.docs.map(revDoc => ({
            id: revDoc.id,
            ...revDoc.data()
          }))

          const newDoc = { id: doc.id, ...docData, revisions }
          const docIndex = allDocs.findIndex(existingDoc => existingDoc.id === doc.id)
          if (docIndex === -1) {
            allDocs.push(newDoc)
          } else {
            allDocs[docIndex] = newDoc
          }

          // Actualizar el estado solo cuando se han procesado todos los documentos.
          if (allDocs.length === docSnapshot.docs.length) {
            setData([...allDocs])
            setProjectistData(projectistDataTemp)
          }
        })

        unsubscribeAll.push(unsubscribeRevisions)
      })
    })

    unsubscribeAll.push(unsubscribeBlueprints)

    // Limpieza: desuscribirse de todos los listeners cuando el componente se desmonta o el ID cambia
    return () => unsubscribeAll.forEach(unsubscribe => unsubscribe())
  }, [id])

  return [data, projectistData, setData]
}

function formatCount(count) {
  return String(count).padStart(3, '0')
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
  remarks
  //hours,
  //investedHours
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
    remarks: remarks || 'sin observaciones'
  }

  return nextRevision
}

// updateBlueprint() actualiza el entregable en la base de datos
const updateBlueprint = async (petitionID, blueprint, approves, userParam, remarks /* hours, investedHours */) => {
  // Obtiene la referencia al documento del entregable (blueprint) en la base de datos
  const blueprintRef = doc(db, 'solicitudes', petitionID, 'blueprints', blueprint.id)
  const solicitudRef = doc(db, 'solicitudes', petitionID)

  // Obtiene la última revisión del plano
  const latestRevision = await getLatestRevision(petitionID, blueprint.id)

  // Calcula la próxima revisión del plano
  const nextRevision = await getNextRevision(approves, latestRevision, userParam, blueprint, remarks)

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
      sentBySupervisor: approves,
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
            approvedByDocumentaryControl: true,
            storageBlueprints:
              approves &&
              ((!blueprint.blueprintCompleted && isApprovedByClient) || (!isApprovedByClient && isRevisionAtLeast1))
                ? blueprint.storageBlueprints
                : null,
            resumeBlueprint:
              (isApprovedByClient && blueprint.blueprintCompleted) ||
              (blueprint.resumeBlueprint && !blueprint.approvedByDocumentaryControl)
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
            sentByDesigner: approves && (isRevisionAtLeastB || isRevisionAtLeast0) && blueprint.sentByDesigner,
            sentBySupervisor: approves && (isRevisionAtLeastB || isRevisionAtLeast0) && blueprint.sentBySupervisor,
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

  // Lee el documento de la 'solicitud previo al incremento de counterBlueprintCompleted'
  const solicitudDocBefore = await getDoc(solicitudRef)
  const blueprintDoc = await getDoc(blueprintRef)

  if (blueprintDoc.data().blueprintCompleted && blueprintDoc.data().resumeBlueprint === false) {
    // Si el documento no tiene un campo 'counterBlueprintCompleted', créalo
    if (!solicitudDocBefore.data().counterBlueprintCompleted) {
      await updateDoc(solicitudRef, { counterBlueprintCompleted: 0 })
    }

    await updateDoc(solicitudRef, { counterBlueprintCompleted: increment(1) })

    // Obtiene la subcolección 'blueprints'
    const blueprintsCollection = collection(db, 'solicitudes', petitionID, 'blueprints')

    // Obtiene todos los documentos de la subcolección
    const blueprintsSnapshot = await getDocs(blueprintsCollection)
    const filteredBlueprints = blueprintsSnapshot.docs.filter(doc => doc.data().deleted !== true)
    // Obtiene la cantidad de documentos en la subcolección
    const numBlueprints = filteredBlueprints.length

    // Lee el documento de la 'solicitud posterior al incremento de counterBlueprintCompleted'
    const solicitudDocAfter = await getDoc(solicitudRef)

    if (solicitudDocAfter.data().counterBlueprintCompleted === numBlueprints) {
      await updateDoc(solicitudRef, { otReadyToFinish: true })
    } else {
      await updateDoc(solicitudRef, { otReadyToFinish: false })
    }
  } else if (
    userParam.role === 9 &&
    blueprint.approvedByDocumentaryControl === true &&
    !blueprintDoc.data().blueprintCompleted &&
    blueprintDoc.data().resumeBlueprint === true
  ) {
    await updateDoc(solicitudRef, { counterBlueprintCompleted: increment(-1), otReadyToFinish: false })
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
        storageHlcDocuments: id[1].storageHlcDocuments ? id[1].storageHlcDocuments[0] : null
      }

      // Añade la nueva revisión a la subcolección de revisiones del entregable (blueprint)
      await addDoc(collection(db, 'solicitudes', currentPetition.id, 'blueprints', id[0], 'revisions'), nextRevision)
    }
  } catch (error) {
    console.error('Error al actualizar documentos seleccionados:', error)
    throw new Error('Error al actualizar documentos seleccionados')
  }
}

// Finaliza una solicitud, actualizando su estado y detalles relacionados con la OT. Se basa en la información de la solicitud actual y el usuario autenticado.
const finishPetition = async (currentPetition, authUser) => {
  try {
    console.log('currentPetition:', currentPetition)
    const petitionRef = doc(db, 'solicitudes', currentPetition.id)
    const petitionDoc = await getDoc(petitionRef)

    console.log('petitionDoc:', petitionDoc.data())

    const otFinished = petitionDoc.data().otFinished
    const otReadyToFinish = petitionDoc.data().otReadyToFinish

    if (!otFinished && otReadyToFinish) {
      await updateDoc(petitionRef, {
        otFinished: true,
        otFinishedBy: { userName: authUser.displayName, userId: authUser.uid, userEmail: authUser.email },
        otFinishedDate: new Date(),
        state: 9
      })
    } else {
      await updateDoc(petitionRef, {
        otFinished: false,
        otFinishedBy: { userName: authUser.displayName, userId: authUser.uid, userEmail: authUser.email },
        otFinishedDate: new Date(),
        state: 8
      })
    }
  } catch (error) {
    console.error('Error al finalizar la solicitud:', error)
    throw new Error('Error al finalizar la solicitud')
  }
}

const fetchWeekHoursByType = async (userId, weekStart, weekEnd) => {
  try {
    const userDocRef = doc(db, 'users', userId)
    const weekHoursRef = collection(userDocRef, 'workedHours')

    const q = query(
      weekHoursRef,
      where('day', '>=', weekStart),
      where('day', '<=', weekEnd),
      where('deleted', '==', false)
    )
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      return { error: 'No records found for this week.' }
    }
    const weekHours = []
    querySnapshot.forEach(doc => {
      weekHours.push({ id: doc.id, ...doc.data() })
    })

    return weekHours
  } catch (error) {
    console.error('Error fetching week hours:', error)

    return { error: 'Failed to fetch week hours.' }
  }
}

const createWeekHoursByType = async (userParams, creations) => {
  const batch = writeBatch(db)
  const userRef = userParams.uid || userParams.id
  try {
    const userDocRef = doc(db, 'users', userRef)
    const weekHoursRef = collection(userDocRef, 'workedHours')

    creations.forEach(change => {
      console.log('change: ', change)
      const newDocRef = doc(weekHoursRef)
      const dayDate = new Date(change.day)
      dayDate.setHours(0, 0, 0, 0)

      const docData = {
        created: Timestamp.fromDate(new Date()),
        day: Timestamp.fromDate(dayDate),
        deleted: false,
        hours: change.newValue,
        hoursSubType:
          change.hoursType === 'ISC'
            ? change.hoursType
            : change.hoursType === 'Vacaciones'
            ? 'VAC'
            : userParams.role === 6 || userParams.role === 7 || userParams.role === 8 || userParams.role === 11
            ? 'OPP'
            : 'OPE',
        hoursType: change.hoursType,
        physicalLocation: '5.1 MEL - NPI&CHO-PRODUCTION CHO',
        user: {
          role: change.userRole,
          shift: change.shift
        },
        //shift: change.shift,
        rowId: change.rowId,
        column: change.field,
        ...(change.hoursType === 'OT'
          ? {
              ot: {
                id: change.otID,
                number: change.otNumber,
                type: change.otType
              }
            }
          : {}),
        ...(change.plant && { plant: change.plant }),
        ...(change.costCenter && { costCenter: change.costCenter })
      }

      batch.set(newDocRef, docData) // Añade la operación de creación al batch
    })

    await batch.commit() // Ejecuta todas las operaciones en el batch
    console.log('All documents successfully created')

    return { success: true }
  } catch (error) {
    console.error('Error creating week hours with batch:', error)

    return { success: false, error: error.message }
  }
}

const updateWeekHoursByType = async (userId, updates) => {
  const batch = writeBatch(db)

  try {
    updates.forEach(update => {
      const docRef = doc(db, 'users', userId, 'workedHours', update.dayDocId)
      batch.update(docRef, { hours: update.newValue })
    })

    await batch.commit()
    console.log('All updates successfully committed')

    return { success: true }
  } catch (error) {
    console.error('Error updating week hours:', error)

    return { success: false, error: error.message }
  }
}

const deleteWeekHoursByType = async (userId, dayDocIds) => {
  const batch = writeBatch(db)

  try {
    dayDocIds.forEach(docId => {
      const docRef = doc(db, 'users', userId, 'workedHours', docId)
      batch.update(docRef, { deleted: true })
    })

    await batch.commit()
    console.log('All documents successfully marked as deleted')

    return { success: true }
  } catch (error) {
    console.error('Error deleting week hours:', error)

    return { success: false, error: error.message }
  }
}

const fetchSolicitudes = async (authUser, otType) => {
  const solicitudesRef = collection(db, 'solicitudes')
  let queryRef = null

  if (authUser.role === 7 || authUser.role === 8) {
    // Filtrar por shift si el usuario tiene uno o dos turnos.
    if (otType === 'Gabinete') {
      queryRef = query(
        solicitudesRef,
        where('state', '==', 8),
        where('supervisorShift', 'in', authUser.shift),
        orderBy('ot')
      )
    } else if (otType === 'Levantamiento') {
      queryRef = query(
        solicitudesRef,
        where('state', '>=', 6),
        where('state', '<=', 8),
        where('supervisorShift', 'in', authUser.shift),
        orderBy('ot')
      )
    }
  } else if (authUser.role === 1 || (authUser.role >= 5 && authUser.role <= 12)) {
    // Usuarios con roles específicos pueden ver todas las solicitudes mayores al estado 6.
    if (otType === 'Gabinete') {
      queryRef = query(solicitudesRef, where('state', '==', 8), orderBy('ot'))
    } else if (otType === 'Levantamiento') {
      queryRef = query(solicitudesRef, where('state', '>=', 6), where('state', '<=', 8), orderBy('ot'))
    }
  }

  try {
    const querySnapshot = await getDocs(queryRef)

    const solicitudes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ot: doc.data().ot,
      plant: doc.data().plant,
      area: doc.data().area,
      costCenter: doc.data().costCenter,
      supervisorShift: doc.data().supervisorShift || []
    }))

    return solicitudes
  } catch (error) {
    console.error('Error fetching solicitudes: ', error)
    throw new Error('Failed to fetch solicitudes.')
  }
}

const fetchUserList = async () => {
  try {
    const userQuery = query(collection(db, 'users'), where('role', '>=', 5), where('role', '<=', 12), orderBy('name'))
    const userListSnapshot = await getDocs(userQuery)

    return userListSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error fetching user list:', error)

    return { error: 'Failed to fetch user list.' }
  }
}

const updateWeekHoursWithPlant = async (userId, dayDocIds, plant, costCenter) => {
  const batch = writeBatch(db)

  dayDocIds.forEach(docId => {
    const docRef = doc(db, 'users', userId, 'workedHours', docId)
    batch.update(docRef, { plant, costCenter })
  })

  try {
    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error('Error updating week hours with plant and cost center:', error)

    return { success: false, error: error.message }
  }
}

const generateBlueprintCodes = async (mappedCodes, docData, quantity, userParam) => {
  const { melDiscipline, melDeliverable, procureDiscipline, procureDeliverable } = mappedCodes

  // Parámetros adicionales
  const idProject = '21286'
  const { ot, plant, area } = docData

  // Crea la referencia al campo específico del contador de Procure
  const procureCounterField = `${procureDiscipline}-${procureDeliverable}-counter`
  const procureCounterRef = doc(db, 'counters', 'blueprints_InternalCode-Counter')

  // Crea la referencia al documento específico del contador MEL
  const melCounterDocId = `${melDiscipline}-${melDeliverable}-counter`
  const melCounterRef = doc(db, 'solicitudes', docData.id, 'clientCodeGeneratorCount', melCounterDocId)

  // Crea la referencia al documento de la solicitud
  const solicitudRef = doc(db, 'solicitudes', docData.id)

  // Función para formatear el contador MEL
  function formatCountMEL(count) {
    return String(count).padStart(5, '0')
  }

  // Función para formatear el contador Procure
  function formatCountProcure(count) {
    return String(count).padStart(3, '0')
  }

  // Función para obtener la definición corta de la planta
  function getShortDefinition(plantLongDef) {
    const shortPlants = ['PCLC', 'LSL1', 'LSL2', 'CHCO', 'PCOL', 'ICAT']

    const valPlant = [
      'Planta Concentradora Los Colorados',
      'Planta Concentradora Laguna Seca | Línea 1',
      'Planta Concentradora Laguna Seca | Línea 2',
      'Chancado y Correas',
      'Puerto Coloso',
      'Instalaciones Cátodo'
    ]
    const index = valPlant.indexOf(plantLongDef)

    return index !== -1 ? shortPlants[index] : 'No se encontró definición corta para esta planta'
  }

  const instalacion = getShortDefinition(plant)
  const areaNumber = area.slice(0, 4)
  const otNumber = `OT${ot}`

  await runTransaction(db, async transaction => {
    const procureCounterDoc = await transaction.get(procureCounterRef)
    const melCounterDoc = await transaction.get(melCounterRef)
    const solicitudDoc = await transaction.get(solicitudRef)

    // Manejo de la situación cuando el documento de MEL no existe
    let melCounter

    if (!melCounterDoc.exists()) {
      melCounter = formatCountMEL(0)
      transaction.set(melCounterRef, { count: melCounter })
    } else {
      melCounter = melCounterDoc.data().count
    }

    // Obtiene el valor actual del contador específico
    const procureCounterData = procureCounterDoc.data()[procureCounterField]
    if (!procureCounterData) {
      throw new Error(`El campo ${procureCounterField} no existe en el documento blueprints_InternalCode-Counter.`)
    }
    let procureCounter = Number(procureCounterData.count)
    melCounter = Number(melCounter)

    // Verificar y actualizar el campo otReadyToFinish en la solicitud
    if (solicitudDoc.exists()) {
      const solicitudData = solicitudDoc.data()
      if (solicitudData.otReadyToFinish === true) {
        transaction.update(solicitudRef, { otReadyToFinish: false })
      } else if (solicitudData.otReadyToFinish === undefined) {
        transaction.update(solicitudRef, { otReadyToFinish: false })
      }
    }

    const newDocs = []

    for (let i = 0; i < quantity; i++) {
      const procureCode = `${idProject}-${procureDiscipline}-${procureDeliverable}-${formatCountProcure(
        procureCounter + i + 1
      )}`

      const melCode = `${idProject}-${otNumber}-${instalacion}-${areaNumber}-${melDiscipline}-${melDeliverable}-${formatCountMEL(
        melCounter + i + 1
      )}`

      newDocs.push({
        id: procureCode,
        clientCode: melCode,
        userId: userParam.userId,
        userName: userParam.name,
        revision: 'iniciado',
        otFinished: false,
        userEmail: userParam.email,
        sentByDesigner: false,
        sentBySupervisor: false,
        date: Timestamp.fromDate(new Date())
      })
    }

    const newProcureCounter = Number(procureCounter) + Number(quantity)
    const newMelCounter = Number(melCounter) + Number(quantity)

    // Actualiza el contador específico en el documento
    transaction.update(procureCounterRef, {
      [`${procureCounterField}.count`]: formatCountProcure(newProcureCounter)
    })
    transaction.update(melCounterRef, { count: formatCountMEL(newMelCounter) })

    const blueprintCollectionRef = collection(db, 'solicitudes', docData.id, 'blueprints')
    newDocs.forEach(newDoc => {
      const newDocRef = doc(blueprintCollectionRef, newDoc.id)
      transaction.set(newDocRef, newDoc)
    })
  })
}

const updateBlueprintAssignment = async (petitionId, blueprintId, newUser) => {
  const batch = writeBatch(db)

  try {
    // Crea una referencia al documento en la subcolección `blueprints`
    const blueprintDocRef = doc(db, 'solicitudes', petitionId, 'blueprints', blueprintId)

    // Actualiza el documento con los nuevos valores
    batch.update(blueprintDocRef, {
      userId: newUser.userId,
      userName: newUser.name,
      userEmail: newUser.email
    })

    // Ejecuta el batch
    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error('Error updating blueprint assignment:', error)

    return { success: false, error: error.message }
  }
}

const getProcureCounter = async procureCounterField => {
  // Crea referencia a Firestore para el contador de Procure
  const procureCounterRef = doc(db, 'counters', 'blueprints_InternalCode-Counter')

  const procureCounterDoc = await getDoc(procureCounterRef)

  if (!procureCounterDoc.exists()) {
    throw new Error(`El documento blueprints_InternalCode-Counter no existe en Firestore.`)
  }

  const currentProcureCounterData = procureCounterDoc.data()[procureCounterField]
  if (!currentProcureCounterData) {
    throw new Error(`El campo ${procureCounterField} no existe en el documento blueprints_InternalCode-Counter.`)
  }

  const currentProcureCounter = Number(currentProcureCounterData.count)

  return currentProcureCounter
}

const markBlueprintAsDeleted = async (mainDocId, procureId) => {
  const blueprintDocRef = doc(db, 'solicitudes', mainDocId, 'blueprints', procureId)

  await updateDoc(blueprintDocRef, {
    deleted: true
  })
}

const deleteBlueprintAndDecrementCounters = async (
  mainDocId,
  procureId,
  procureCounterField,
  currentProcureCounter,
  currentMelCounter,
  melDiscipline,
  melDeliverable
) => {
  // Crea referencias a Firestore para el contador de Procure y MEL
  const procureCounterRef = doc(db, 'counters', 'blueprints_InternalCode-Counter')
  const melCounterDocId = `${melDiscipline}-${melDeliverable}-counter`
  const melCounterRef = doc(db, 'solicitudes', mainDocId, 'clientCodeGeneratorCount', melCounterDocId)

  // Referencia al documento de la subcolección "blueprints" que se eliminará
  const blueprintDocRef = doc(db, 'solicitudes', mainDocId, 'blueprints', procureId)

  // Referencia a la subcolección "revisions"
  const revisionsCollectionRef = collection(blueprintDocRef, 'revisions')

  await runTransaction(db, async transaction => {
    // Verifica si la subcolección 'revisions' tiene documentos
    const revisionsSnapshot = await getDocs(revisionsCollectionRef)

    if (!revisionsSnapshot.empty) {
      // Si existen documentos en la subcolección, se eliminan uno por uno
      revisionsSnapshot.forEach(doc => {
        transaction.delete(doc.ref)
      })
    }

    // Después de eliminar los documentos de la subcolección 'revisions', elimina el documento 'blueprints'
    transaction.delete(blueprintDocRef)

    // Disminuye los contadores
    transaction.update(procureCounterRef, {
      [`${procureCounterField}.count`]: String(currentProcureCounter - 1).padStart(3, '0')
    })

    transaction.update(melCounterRef, {
      count: String(currentMelCounter - 1).padStart(5, '0')
    })
  })
}

export {
  newDoc,
  updateDocs,
  updateUserPhone,
  blockDayInDatabase,
  useBlueprints,
  updateBlueprint,
  addDescription,
  generateTransmittalCounter,
  updateSelectedDocuments,
  addComment,
  updateUserData,
  finishPetition,
  fetchWeekHoursByType,
  createWeekHoursByType,
  updateWeekHoursByType,
  deleteWeekHoursByType,
  fetchSolicitudes,
  fetchUserList,
  updateWeekHoursWithPlant,
  generateBlueprintCodes,
  updateBlueprintAssignment,
  getProcureCounter,
  markBlueprintAsDeleted,
  deleteBlueprintAndDecrementCounters
}
