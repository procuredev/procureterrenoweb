// ** Firebase Imports
import { db } from 'src/configs/firebase'
import { collection, doc, addDoc, query, getDoc, getDocs, updateDoc, where } from 'firebase/firestore'
import { getEmailTemplate } from './emailTemplate'
import { exists } from 'i18next'

// Importación de los datos del usuario según el id indicado
const getData = async id => {
  const docRef = doc(db, 'users', id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return docSnap.data()
  } else {
    return undefined
  }
}

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

 // Obtener usuarios con rol 8 según su turno
 const getSupervisorData = async (shift) => {
  // Realiza la consulta según el campo proporcionado
  const q = query(collection(db, 'users'), where('role', '==', 7), where('shift', 'array-contains', shift))

  try {
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No se encontró ningún supervisor para el turno ${shift}`)

      return null
    } else {
      // Accede al UID de la solicitud encontrada
      const uid = querySnapshot.docs[0].id
      const name = querySnapshot.docs[0].data().name
      const email = querySnapshot.docs[0].data().email

      return {uid: uid, name: name, email: email}
    }
  } catch (error) {
    console.log('Error al buscar la solicitud: ', error)

    return null
  }
}


// Función que retorna los usuarios que deben ir en copia y el mensaje respectivo
const getUsersOnCopyAndMessage = (
  user,
  requesterRole,
  requesterEmail,
  prevState,
  newState,
  cOperatorEmail,
  cOwnerEmail,
  plannerEmail,
  admContEmail,
  supervisorEmail,
  petitionerFieldEmail
) => {
  var sendTo = requesterEmail
  var arrayCC = [] // Se inicializa un array vacío
  var message = '' // Se inicializa un string vacío

  const stateChange = `${prevState}-${newState}`

  switch (requesterRole) {
    // Si el rol de quien hizo la solicitud es "Solicitante"
    case 2:
      switch (stateChange) {
        // && prevState es 2 && newState es 3 -> Solicitud aceptada por C.Operator
        case '2-3':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner y Planificador
          message = `la solicitud ha sido aceptada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 2 && newState es 2 -> Solicitud modificada por Solicitante
        case '2-2':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner y Planificador
          message = `la solicitud ha modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 3 && newState es 5 -> Solicitud aceptada por Planificador
        case '3-5':
          sendTo = plannerEmail
          arrayCC = [admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, Planificador Y Adm.Contrato
          message = `la solicitud ha sido actualizada por nuestro Planificador ${user.displayName}. Ahora también es posible encontrar la fecha de término del levantamiento y el número de OT` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 4 && newState es 5 -> Solicitud aceptada por Planificador
        case '4-5':
          sendTo = plannerEmail
          arrayCC = [admContEmail] // Siginifca que hay que mandarle e-mail al Planificador Y Adm.Contrato
          message = `la solicitud ha sido actualizada por nuestro Planificador ${user.displayName}. Ahora también es posible encontrar la fecha de término del levantamiento y el número de OT` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 5 && newState es 6 -> Solicitud aceptada por Adm.Contrato
        case '5-6':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
          message = `la solicitud ha sido aceptada por Procure` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 6 && newState es 1 -> Solicitud replanificada por Procure
        case '6-1':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador y Adm.Contrato
          message = `la solicitud ha debido ser replanificada por Procure` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 2 && newState es 1 -> Solicitud modificada por C.Operator
        case '2-1':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail] // Siginifca que hay que mandarle e-mail al Solicitante y C.Operator
          message = `la solicitud ha sido modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 1 && newState es 2 -> Modificación hecha por C.Operator o Procure, fue modificada nuevamente por Solicitante
        case '1-2':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail] // Siginifca que hay que mandarle e-mail al Solicitante y C.Operator
          message = `la solicitud ha sido modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 1 && newState es 2 -> Modificación hecha por C.Operator o Procure, fue aceptada por Solicitante
        case '1-3':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail] // Siginifca que hay que mandarle e-mail al Solicitante y C.Operator
          message = `la solicitud ha sido aceptada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 3 && newState es 4 -> Solicitud fue aceptada por Contract Owner
        case '3-4':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail] // Siginifca que hay que mandarle e-mail al Solicitante y C.Operator
          message = `la solicitud ha sido aceptada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 5 && newState es 0 -> Modificación hecha por Procure
        case '5-1':
          sendTo = requesterEmail
          arrayCC = [plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, Planificador y Adm.Contrato
          message = `la solicitud ha sido modificada por Procure` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 0 && newState es 6 -> Modificación hecha por Procure fue aceptada por Solicitante
        case '1-6':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
          message = `la solicitud ha sido aceptada por ${user.displayName} y por Procure` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 1 && newState es 0 -> Solicitud rechazada por Solicitante
        case '1-0':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail] // Siginifca que hay que mandarle e-mail al Solicitante y C.Operator
          message = `la solicitud ha sido rechazada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

          // && prevState es 2 && newState es 0 -> Solicitud rechazada por Solicitante/C.Operator
        case '2-0':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail] // Siginifca que hay que mandarle e-mail al Solicitante y C.Operator
          message = `la solicitud ha sido rechazada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 3 && newState es 1 -> Solicitud rechazada por Solicitante/C.Operator/C. Owner/Planificador
        case '3-1':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator y C.Owner
          message = `la solicitud ha sido modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 3 && newState es 0 -> Solicitud rechazada por Solicitante/C.Operator/C. Owner/Planificador
        case '3-0':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator y C.Owner
          message = `la solicitud ha sido rechazada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 4 && newState es 0 -> Solicitud rechazada por Solicitante/C.Operator/C. Owner/Planificador
        case '4-0':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator y C.Owner
          message = `la solicitud ha sido rechazada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 5 && newState es 0 -> Solicitud rechazada por Solicitante/C.Operator/C. Owner/Adm.Cont
        case '5-0':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador y Adm.Contrato
          message = `la solicitud ha sido rechazada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 6 && newState es 0 -> Solicitud rechazada por Solicitante/C.Operator/C. Owner/Adm.Cont
        case '6-0':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador y Adm.Contrato
          message = `la solicitud ha sido rechazada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 6 && newState es 7 -> Supervisor selecciona Proyectistas para el Levantamiento
        case '6-7':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
          message = `nuestro supervisor ${user.displayName} ha seleccionado el equipo que se hará cargo del levantamiento` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 7 && newState es 8 -> Supervisor selecciona Proyectistas para el Levantamiento
        case '7-8':
          sendTo = requesterEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador y Adm.Contrato
          message = `Procure ha finalizado el levantamiento` // Se agrega mensaje que irá en el e-mail
          break
      }
      break

    // Si el rol de quien hizo la solicitud es "Contract Operator"
    case 3:
      switch(stateChange) {

        // && prevState es 3 && newState es 5 -> Soliciutud aceptada por Planificador
        case '3-5':
          sendTo = plannerEmail
          arrayCC = [admContEmail] // Siginifca que hay que mandarle e-mail al Planificador y Adm.Contrato
          message = `la solicitud ha sido actualizada por nuestro Planificador ${user.displayName}. Ahora también es posible encontrar la fecha de término del levantamiento y el número de OT` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 4 && newState es 5 -> Solicitud aceptada por Planificador
        case '4-5':
          sendTo = plannerEmail
          arrayCC = [admContEmail] // Siginifca que hay que mandarle e-mail al Planificador Y Adm.Contrato
          message = `la solicitud ha sido actualizada por nuestro Planificador ${user.displayName}. Ahora también es posible encontrar la fecha de término del levantamiento y el número de OT` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 3 && newState es 1 -> Solicitud rechazada por Solicitante/C.Operator/C. Owner/Planificador
        case '3-1':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator y C.Owner
          message = `la solicitud ha sido modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 3 && newState es 4 -> Solicitud fue aceptada por Contract Owner
        case '3-4':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al Solicitante, Contract Owner y Planificador
          message = `la solicitud ha sido aceptada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 5 && newState es 6 -> Solicitud aceptada por Adm.Contrato
        case '5-6':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, admContEmail, petitionerFieldEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
          message = `la solicitud ha sido aceptada por Procure` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 6 && newState es 1 -> Solicitud replanificada por Procure
        case '6-1':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, admContEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator, C.Owner, Planificador y Adm.Contrato
          message = `la solicitud ha debido ser replanificada por Procure` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 5 && newState es 1 -> Modificación hecha por Procure
        case '5-1':
          sendTo = requesterEmail
          arrayCC = [plannerEmail, admContEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator, Planificador y Adm.Contrato
          message = `la solicitud ha sido modificada por Procure` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 1 && newState es 3 -> Modificación hecha por Procure fue modificada por C.Operator
        case '1-3':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator, C.Owner y Planificador
          message = `la solicitud ha sido modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 1 && newState es 6 -> Modificación hecha por Procure fue aceptada por C.Operator
        case '1-6':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, admContEmail, petitionerFieldEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
          message = `la solicitud ha sido aceptada por ${user.displayName} y por Procure` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es32 && newState es 3 -> Solicitud modificada por Contract Operator
        case '3-3':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner y Planificador
          message = `la solicitud ha modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 3 && newState es 0 -> Solicitud rechazada por C.Operator/C. Owner/Planificador
        case '3-0':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator y C.Owner
          message = `la solicitud ha sido rechazada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 4 && newState es 0 -> Solicitud rechazada por C.Operator/C.Owner/Planificador
        case '4-0':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator y C.Owner
          message = `la solicitud ha sido rechazada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 5 && newState es 10 -> Solicitud rechazada por C.Operator/C.Owner/Adm.Cont
        case '5-0':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, admContEmail, petitionerFieldEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al C.Operator, Planificador y Adm.Contrato
          message = `la solicitud ha sido rechazada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 6 && newState es 10 -> Solicitud rechazada por C.Operator/C.Owner/Adm.Cont
        case '6-0':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, admContEmail, petitionerFieldEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al C.Operator, Planificador y Adm.Contrato
          message = `la solicitud ha sido rechazada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 6 && newState es 7 -> Supervisor selecciona Proyectistas para el Levantamiento
        case '6-7':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, admContEmail, petitionerFieldEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
          message = `nuestro supervisor ${user.displayName} ha seleccionado el equipo que se hará cargo del levantamiento` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 7 && newState es 8 -> Supervisor termina el levantamiento
        case '7-8':
          sendTo = requesterEmail
          arrayCC = [cOwnerEmail, plannerEmail, admContEmail, petitionerFieldEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
          message = `Procure ha finalizado el levantamiento` // Se agrega mensaje que irá en el e-mail
          break
      }
      break

    // Si el rol de quien hizo la solicitud es "Supervisor"
    case 7:
      switch(stateChange) {

        // && prevState es 6 && newState es 7 -> Supervisor selecciona Proyectistas para el Levantamiento
        case '6-7':
          sendTo = petitionerFieldEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
          message = `nuestro supervisor ${user.displayName} ha seleccionado el equipo que se hará cargo del levantamiento` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 7 && newState es 8 -> Supervisor termina el levantamiento
        case '7-8':
          sendTo = petitionerFieldEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
          message = `Procure ha finalizado el levantamiento` // Se agrega mensaje que irá en el e-mail
          break

        // && prevState es 8 && newState es 8 -> Contract Operator valida el levantamiento
        case '8-8':
          sendTo = petitionerFieldEmail
          arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail, supervisorEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
          message = `la solicitud ha sido validada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
          break
      }
      break

    default:
      break
  }

  return { sendTo: sendTo, arrayCC: arrayCC, message: message }
}

export const sendEmailWhenReviewDocs = async (user, prevState, newState, requesterId, requirementId) => {

  const collectionRef = collection(db, 'mail') // Se llama a la colección mail de Firestore

  // Se rescatan los datos globales de la solicitud:
  const requirementRef = doc(db, 'solicitudes', requirementId)
  const requirementSnapshot = await getDoc(requirementRef)
  const requirementData = requirementSnapshot.data()

  const [requesterData, cOwnerData, plannerData, admContData, petitionerData, supervisorData, cOperatorData] = await Promise.all([
    getData(requesterId),
    getData(await searchbyColletionAndField('users', 'role', 4)),
    getData(await searchbyColletionAndField('users', 'role', 5)),
    getData(await searchbyColletionAndField('users', 'role', 6)),
    getData(await searchbyColletionAndField('users', 'name', requirementData.petitioner)),
    requirementData.supervisorShift ? await getSupervisorData(requirementData.supervisorShift) : '',
    getData(await searchbyColletionAndField('users', 'name', requirementData.contop))
  ])

  const requesterEmail = requesterData.email
  const requesterRole = requesterData.role
  const cOwnerEmail = cOwnerData.email
  const plannerEmail = plannerData.email
  const admContEmail = admContData.email
  const petitionerEmail = petitionerData.email
  const supervisorEmail = supervisorData ? supervisorData.email : ''
  const cOperatorEmail = cOperatorData.email

  const usersOnCopyAndMessage = getUsersOnCopyAndMessage(
    user,
    requesterRole,
    requesterEmail,
    prevState,
    newState,
    cOperatorEmail,
    cOwnerEmail,
    plannerEmail,
    admContEmail,
    supervisorEmail,
    petitionerEmail
  )

  const sendTo = usersOnCopyAndMessage.sendTo
  const onCC = usersOnCopyAndMessage.arrayCC
  const message = usersOnCopyAndMessage.message

  // Email dirigido a quien hizo la solicitud, con copia a quien corresponda
  try {
    const newDoc = {} // Se genera un elemento vacío
    const addedDoc = await addDoc(collectionRef, newDoc) // Se agrega este elemento vacío a la colección mail
    const mailId = addedDoc.id // Se obtiene el id del elemento recién agregado

    const docRef = doc(collectionRef, mailId) // Se busca la referencia del elemento recién creado con su id

    const fechaCompleta = new Date() // Constante que almacena la fecha en que se genera la solcitud

    // Se almacenan las constantes a usar en el email
    const userName = requirementData.user
    const mainMessage = `Con fecha ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}, ${message}`
    const requestNumber = requirementData.n_request
    const title = requirementData.title
    const engineering = requirementData.engineering ? 'Si' : 'No'
    const otProcure = requirementData.ot ? requirementData.ot : 'Por definir'
    const supervisor = requirementData.supervisorShift ? supervisorData.name : 'Por definir'
    const start = requirementData.start ? requirementData.start.toDate().toLocaleDateString() : 'Por definir'
    const end = requirementData.end ? requirementData.end.toDate().toLocaleDateString() : 'Por definir'
    const plant = requirementData.plant
    const area = requirementData.area ? requirementData.area : 'No indicado'
    const functionalLocation = (requirementData.fnlocation && requirementData.fnlocation !== '') ? requirementData.fnlocation : 'No indicado'
    const contractOperator = requirementData.contop
    const petitioner = requirementData.petitioner ? requirementData.petitioner : 'No indicado'
    const sapNumber = (requirementData.sap && requirementData.sap !== '') ? requirementData.sap : 'No indicado'
    const operationalType = requirementData.type ? requirementData.type : 'No indicado'
    const machineDetention = requirementData.detention ? requirementData.detention : 'No indicado'
    const jobType = requirementData.objective
    const deliverable = requirementData.deliverable.join(', ')
    const receiver = requirementData.receiver.map(receiver => receiver.email).join(', ')
    const description = requirementData.description
    const lastMessage = ''

    // Llamada al html del email con las constantes previamente indicadads
    const emailHtml = getEmailTemplate(userName, mainMessage, requestNumber, title, engineering, otProcure, supervisor, start, end, plant, area, functionalLocation, contractOperator, petitioner, sapNumber, operationalType, machineDetention, jobType, deliverable, receiver, description, lastMessage)

    // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
    updateDoc(docRef, {
      to: sendTo,
      cc: onCC,
      date: fechaCompleta,
      req: requirementId,
      emailType: 'reviewDocs',
      message: {
        subject: `Solicitud de levantamiento: N°${requirementData.n_request} - ${requirementData.title}`,
        html: emailHtml
      }
    })
    console.log('E-mail de actualizacion enviado con éxito.')
  } catch (error) {
    console.error('Error al enviar email:', error)
    throw error
  }
}
