// ** Firebase Imports
import { db } from 'src/configs/firebase'
import { collection, doc, addDoc, query, getDoc, getDocs, updateDoc, where } from 'firebase/firestore'
import { getEmailTemplate } from './emailTemplate'

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

// Función para enviar emails de forma automática
// user es el usuario conectado que efectúa el envío de la solicitud
// values son los valores seleccionados en en formulario de nueva solicitud
// reqId es el número de solicitud (Contador)
export const sendEmailNewPetition = async (user, values, reqId, reqNumber) => {

  const collectionRef = collection(db, 'mail') // Se llama a la colección mail de Firestore

  if (user !== null) {
    // Primer caso: enviar email cuando se genera una nueva solicitud.

    const fechaCompleta = new Date() // Constante que almacena la fecha en que se genera la solcitud
    let userName
    let userContOp
    let mainMessage
    let lastMessage
    let sendTo
    let arrayCC = []

    // Si el usuario tiene rol de Solicitante
    if (user.role == 2) {
      userContOp = values.contop // Se usa el nombre del C.Operator indicado en la solicitud

      const contOpUid = await searchbyColletionAndField('users', 'name', userContOp) // Se usa la función searchbyColletion() para buscar dentro de Firestore el usuario que se llame igual al Contract Operator del usuario
      const dataContOp = await getData(contOpUid) // Para este C.Operator se obtiene su datos de Firestore
      const cOperatorEmail = dataContOp.email // Se selecciona el email del C.Operator

      userName = user.displayName

      sendTo = user.email

      arrayCC = [cOperatorEmail]

      mainMessage = `Usted ha generado una solicitud de trabajo el día ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}`

      lastMessage = `Ahora deberá esperar la aprobación de su Contract Operator ${userContOp}.`
    } else if (user.role == 3) {
      // Si el usuario tiene rol de Contract Operator
      userContOp = user.displayName

      const cOwnerUid = await searchbyColletionAndField('users', 'role', 4) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del C.Owner
      const dataContOwner = await getData(cOwnerUid) // Para el C.Owner se obtiene su datos de Firestore
      const cOwnerEmail = dataContOwner.email // Se selecciona el email del C.Owner

      const petitionerName = values.petitioner // Se rescata el nombre del campo "Solicitiante" en Nueva Solicitud
      const petitionerUid = await searchbyColletionAndField('users', 'name', petitionerName) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del solicitante indicado en el campo "Solicitante"
      const dataPetitioner = await getData(petitionerUid) // Para el solicitante indicado en el campo "Solicitante" se obtiene su datos de Firestore
      const petitionerEmail = dataPetitioner.email // Se selecciona el email del solicitante indicado en el campo "Solicitante"

      const plannerUid = await searchbyColletionAndField('users', 'role', 5) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del Planificador
      const dataPlanner = await getData(plannerUid) // Para el Planificador se obtiene su datos de Firestore
      const plannerEmail = dataPlanner.email // Se selecciona el email del C.Owner

      userName = user.displayName

      sendTo = user.email

      arrayCC = [cOwnerEmail, petitionerEmail, plannerEmail]

      mainMessage = `Usted ha generado una solicitud de trabajo el día ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}`

      lastMessage = `Ahora deberá esperar la aprobación de Procure.`
    } else if (user.role == 7){
      // Si el usuario tiene rol de Supervisor

      userContOp = values.contop // Se usa el nombre del C.Operator indicado en la solicitud
      const contOpUid = await searchbyColletionAndField('users', 'name', userContOp) // Se usa la función searchbyColletion() para buscar dentro de Firestore el usuario que se llame igual al Contract Operator del usuario
      const dataContOp = await getData(contOpUid) // Para este C.Operator se obtiene su datos de Firestore
      const cOperatorEmail = dataContOp.email // Se selecciona el email del C.Operator

      const cOwnerUid = await searchbyColletionAndField('users', 'role', 4) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del C.Owner
      const dataContOwner = await getData(cOwnerUid) // Para el C.Owner se obtiene su datos de Firestore
      const cOwnerEmail = dataContOwner.email // Se selecciona el email del C.Owner

      const petitionerName = values.petitioner // Se rescata el nombre del campo "Solicitiante" en Nueva Solicitud
      const petitionerUid = await searchbyColletionAndField('users', 'name', petitionerName) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del solicitante indicado en el campo "Solicitante"
      const dataPetitioner = await getData(petitionerUid) // Para el solicitante indicado en el campo "Solicitante" se obtiene su datos de Firestore
      const petitionerEmail = dataPetitioner.email // Se selecciona el email del solicitante indicado en el campo "Solicitante"

      const plannerUid = await searchbyColletionAndField('users', 'role', 5) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del Planificador
      const dataPlanner = await getData(plannerUid) // Para el Planificador se obtiene su datos de Firestore
      const plannerEmail = dataPlanner.email // Se selecciona el email del Planificador

      const contractAdminUid = await searchbyColletionAndField('users', 'role', 6) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del Administrador de Contrato
      const dataContractAdmin = await getData(contractAdminUid) // Para el Planificador se obtiene su datos de Firestore
      const contractAdminEmail = dataContractAdmin.email // Se selecciona el email del Planificador

      const supervisorEmail = user.email

      userName = dataPetitioner.name

      sendTo = petitionerEmail

      arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, contractAdminEmail, supervisorEmail]

      mainMessage = `Con fecha ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()} usted ha solicitado a nuestro Supervisor ${user.displayName} ejecutar un levantammiento de urgencia`

      lastMessage = `El levantamiento será ejecutado lo antes posible. Se recuerda a ${dataContOp.name} que debe aprobar la solicitud en la página web.`
    }

    // Try Catch
    try {
      const newDoc = {} // Se genera un elemento vacío
      const addedDoc = await addDoc(collectionRef, newDoc) // Se agrega este elemento vacío a la colección mail
      const mailId = addedDoc.id // Se obtiene el id del elemento recién agregado

      const docRef = doc(collectionRef, mailId) // Se busca la referencia del elemento recién creado con su id

      // Se almacenan las constantes a usar en el email
      const requestNumber = reqNumber
      const title = values.title
      const engineering = user.engineering ? 'Si' : 'No'
      const otProcure = values.ot ? values.ot : 'Por definir'
      const supervisor = user.role == 7 ? user.displayName : 'Por definir'
      const start = values.start ? values.start.toLocaleDateString() : 'Por definir'
      const end = values.end ? values.end.toLocaleDateString() : 'Por definir'
      const plant = values.plant
      const area = values.area ? values.area : 'No indicado'
      const functionalLocation = values.fnlocation ? values.fnlocation : 'No indicado'
      const contractOperator = userContOp
      const petitioner = values.petitioner ? values.petitioner : 'No indicado'
      const sapNumber = values.sap ? values.sap : 'No indicado'
      const operationalType = values.type ? values.type : 'No indicado'
      const machineDetention = values.detention ? values.detention : 'No indicado'
      const jobType = values.objective
      const deliverable = values.deliverable.join(', ')
      const receiver = values.receiver.map(receiver => receiver.email).join(', ')
      const description = values.description

      let emailHtml

      // Si la solicitud considera que se le entregue una memoria de cálculo, también se enviará un email notificando a gente de Procure y al Solicitante al respecto
      if (values.deliverable.includes('Memoria de Cálculo')){
        // Según lo indicado por gerencia, deberá enviarse un email a Cristobal Paillacar, Iván Durán, Felipe Monge y las mismas personas de ArrayCC para que estén notificadads de la solicitud de Memoria de Cálculo
        // Para esto, se han almacenado en la Colección 'domain/emailCalculationReport' los emails de quienes de a quienes tiene que enviarse

        const emailCalculationReportRef = doc(db, 'domain', 'emailCalculationReport')
        const emailCalculationReportSnap = await getDoc(emailCalculationReportRef)
        const emailCalculationReportData = emailCalculationReportSnap.data()
        const procureUsersEmail = emailCalculationReportData.emails // Se selecciona el email de quienes exista en el array
        arrayCC = arrayCC.concat(procureUsersEmail)

        let specialMessage = `Dentro de los entregables solicitados se encuentra una "Memoria de Cálculo". Procure procederá a generar una presupuesto especial para el caso indicado.`
        lastMessage = specialMessage + ' ' + lastMessage
        emailHtml = getEmailTemplate(userName, mainMessage, requestNumber, title, engineering, otProcure, supervisor, start, end, plant, area, functionalLocation, contractOperator, petitioner, sapNumber, operationalType, machineDetention, jobType, deliverable, receiver, description, lastMessage)

      } else {
        // Llamada al html del email con las constantes previamente indicadads
        emailHtml = getEmailTemplate(userName, mainMessage, requestNumber, title, engineering, otProcure, supervisor, start, end, plant, area, functionalLocation, contractOperator, petitioner, sapNumber, operationalType, machineDetention, jobType, deliverable, receiver, description, lastMessage)
      }


      // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
      updateDoc(docRef, {
        to: user.email,
        cc: arrayCC,
        date: fechaCompleta,
        req: reqId,
        emailType: 'NewRequest',
        message: {
          subject: `Solicitud de levantamiento: N°${requestNumber} - ${values.title}`,
          html: emailHtml
        }
      })

      console.log('E-mail a Solicitante de nueva solicitud enviado con éxito.')
    } catch (error) {
      console.error('Error al enviar email:', error)
      throw error
    }
  }
}
