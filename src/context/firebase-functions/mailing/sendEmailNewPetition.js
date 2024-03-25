// ** Firebase Imports
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from 'src/configs/firebase'
import { getEmailTemplate } from './emailTemplate'

const moment = require('moment')

// Importación de los datos del usuario según el id indicado
const getUserData = async ids => {
  const usersData = []

  for (const id of ids) {
    const docRef = doc(db, 'users', id)
    const docSnap = await getDoc(docRef)

    if (docSnap) {
      usersData.push(docSnap.data())
    }
  }

  return usersData
}

// Función que busca dentro de la colección indicada y según el campo/field que se indique y que el valor/value sea igual al indicado. Esto retornará el UID de la solicitud.
const searchbyColletionAndField = async (col, field, value) => {
  // Realiza la consulta según el campo proporcionado
  const q = query(collection(db, col), where(field, '==', value))
  let uid = []

  try {
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No se encontró ningún valor en ${col} en el campo ${field}`)

      return null
    } else {
      // Accede al UID de la solicitud encontrada
      const queryDocs = querySnapshot.docs
      queryDocs.forEach(doc => {
        uid.push(doc.id)
      })

      return uid
    }
  } catch (error) {
    console.log('Error al buscar la solicitud: ', error)

    return null
  }
}

// Obtener usuarios con rol 8 según su turno
const getSupervisorData = async shift => {
  // Realiza la consulta según el campo proporcionado
  const q = query(collection(db, 'users'), where('role', '==', 7), where('shift', 'array-contains', shift))

  let supervisorArray = []

  try {
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No se encontró ningún supervisor para el turno ${shift}`)

      return null
    } else {
      const queryDocs = querySnapshot.docs
      queryDocs.forEach(doc => {
        supervisorArray.push(doc.data())
      })

      return supervisorArray
    }
  } catch (error) {
    console.log('Error al buscar la solicitud: ', error)

    return null
  }
}

// Función para leer el contenido de un archivo como base64
const readFileAsBase64 = (file) => {

  // Devuelve una promesa que se resolverá cuando se complete la lectura del archivo.
  return new Promise((resolve, reject) => {

    // Crear un nuevo objeto FileReader.
    const reader = new FileReader()

    // Callback que se llama cuando la lectura del archivo se completa con éxito.
    reader.onload = () => {
      // Extraer el contenido base64 del resultado del FileReader.
      // El resultado se encuentra en el formato "data:[tipo];base64,[contenido]".
      // Por lo tanto, dividimos el resultado por la coma y tomamos la segunda parte que contiene el contenido base64.
      const base64Content = reader.result.split(',')[1]
      resolve(base64Content)
    }
    // Callback que se llama si ocurre un error durante la lectura del archivo.
    reader.onerror = (error) => {
      // Rechazamos la promesa con el error.
      reject(error)
    }
    // Iniciar la lectura del archivo como una URL de datos (data URL) base64.
    reader.readAsDataURL(file)

  })

}

// Función que procesa los archivos adjuntos para poder enviarlos por e-mail.
const processAttachedDocuments = async (documents) => {

  // Se inicializa un array vacío.
  // processedDocuments es un array de objetos que tendrá content, encoding y filename.
  let processedDocuments = []
  let processedDocumentsSize = 0

  // Nos aseguramos que exista documents.
  if (documents) {
    // Ciclo for para recorrer todo el array de archivos adjuntos.
    for (const doc of documents) {

      try {

        // content será el resultado de la función readFileAsBase64.
        const content = await readFileAsBase64(doc)
        // filename será simplemente el nombre(name) del archivo.
        const filename = doc.name

        // Se actualiza el peso de los documentos adjuntos.
        processedDocumentsSize = processedDocumentsSize + content.length

        // Solo se adjuntarán al e-mail aquellos archivos que pesen menos de 1MB por restricciones de Firestore.
        if (processedDocumentsSize < 1024 * 1024) {

          // Se agrega al array la información recién obtenida. encoding siempre será 'base64'.
          processedDocuments.push({ content: content, encoding: 'base64', filename: filename })

        }

      } catch (error) {
        // Se desplegará el error en caso de existir.
        console.error('Error al procesar el documento:', error)
      }

    }
  }

  return processedDocuments

}

// Función para enviar emails de forma automática
// user es el usuario conectado que efectúa el envío de la solicitud
// values son los valores seleccionados en en formulario de nueva solicitud
// reqId es el número de solicitud (Contador)
export const sendEmailNewPetition = async (user, values, reqId, reqNumber) => {
  const collectionRef = collection(db, 'mail') // Se llama a la colección mail de Firestore

  if (user !== null) {
    const fechaCompleta = new Date() // Constante que almacena la fecha en que se genera la solcitud

    // Declaración de variables
    let userName
    let userContOp
    let mainMessage
    let lastMessage
    let sendTo
    let arrayCC = []
    let emailHtml

    // Si el usuario tiene rol de Solicitante
    if (user.role == 2) {
      // Se usa el nombre del C.Operator indicado en la solicitud
      userContOp = values.contop

      const contOpUid = await searchbyColletionAndField('users', 'name', userContOp) // Se usa la función searchbyColletion() para buscar dentro de Firestore el usuario que se llame igual al Contract Operator del usuario
      const dataContOp = await getUserData(contOpUid) // Para este C.Operator se obtiene su datos de Firestore
      const cOperatorEmail = dataContOp.filter(doc => doc.enabled != false).map(data => data.email) // Se selecciona el email del C.Operator

      // Datos que serán usados en el email
      userName = user.displayName // Nombre de a quien va dirigido el email
      sendTo = user.email // Email de a quien va dirigido el email
      arrayCC = [...cOperatorEmail] // Arreglo de quienes van en copia
      mainMessage = `Usted ha generado una solicitud de trabajo el día ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}` // Mensaje principal
      lastMessage = `Ahora deberá esperar la aprobación de su Contract Operator ${userContOp}.` // Mensaje final

      // Si el usuario tiene rol de Contract Operator
    } else if (user.role == 3) {
      // El Contract Operator será el usuario conectado
      userContOp = user.displayName

      // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del C.Owner, petitioner y Planificador
      const uids = await Promise.all([
        searchbyColletionAndField('users', 'role', 4),
        searchbyColletionAndField('users', 'name', values.petitioner),
        searchbyColletionAndField('users', 'role', 5)
      ])
      const cOwnerUid = uids[0]
      const petitionerUid = uids[1]
      const plannerUid = uids[2]

      // Se obtienen los datos de C.Owner, petitioner y Planificador
      const usersData = await Promise.all([getUserData(cOwnerUid), getUserData(petitionerUid), getUserData(plannerUid)])
      const dataContOwner = usersData[0]
      const dataPetitioner = usersData[1]
      const dataPlanner = usersData[2]

      // Se definen los emails de C.Owner, petitioner y Planificador
      const cOwnerEmail = dataContOwner.filter(doc => doc.enabled != false).map(data => data.email)
      const petitionerEmail = dataPetitioner.filter(doc => doc.enabled != false).map(data => data.email)
      const plannerEmail = dataPlanner.filter(doc => doc.enabled != false).map(data => data.email)

      // Datos que serán usados en el email
      userName = user.displayName // Nombre de a quien va dirigido el email
      sendTo = user.email // Email de a quien va dirigido el email
      arrayCC = [...cOwnerEmail, ...petitionerEmail, ...plannerEmail] // Arreglo de quienes van en copia
      mainMessage = `Usted ha generado una solicitud de trabajo el día ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}` // Mensaje principal
      lastMessage = `Ahora deberá esperar la aprobación de Procure.` // Mensaje final

      // Si el usuario tiene rol Planificador
    } else if (user.role == 5) {
      // Se usa el nombre del C.Operator indicado en la solicitud
      userContOp = values.contop

      // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del C.Operator, C.Owner, Petitioner, Planificador, Administrador de Contrato y Supervisores
      const uids = await Promise.all([
        searchbyColletionAndField('users', 'name', userContOp),
        searchbyColletionAndField('users', 'role', 4),
        await searchbyColletionAndField('users', 'name', values.petitioner),
        searchbyColletionAndField('users', 'role', 5),
        searchbyColletionAndField('users', 'role', 6),
        searchbyColletionAndField('users', 'role', 7)
      ])
      const contOpUid = uids[0]
      const cOwnerUid = uids[1]
      const petitionerUid = uids[2]
      const plannerUid = uids[3]
      const contractAdminUid = uids[4]
      const supervisorUid = uids[5]

      // Se obtienen los datos de C.Operator, C.Owner, Petitioner, Planificador, Administrador de Contrato y Supervisores
      const usersData = await Promise.all([
        getUserData(contOpUid),
        getUserData(cOwnerUid),
        getUserData(petitionerUid),
        getUserData(plannerUid),
        getUserData(contractAdminUid),
        getUserData(supervisorUid)
      ])
      const dataContOp = usersData[0]
      const dataContOwner = usersData[1]
      const dataPetitioner = usersData[2]
      const dataPlanner = usersData[3]
      const dataContractAdmin = usersData[4]
      const dataSupervisor = usersData[5]

      // Se definen los emails de C.Operator, C.Owner, Petitioner, Planificador, Administrador de Contrator y Supervisor
      const cOperatorEmail = dataContOp.filter(doc => doc.enabled != false).map(data => data.email)
      const cOwnerEmail = dataContOwner.filter(doc => doc.enabled != false).map(data => data.email)
      const petitionerEmail = dataPetitioner.filter(doc => doc.enabled != false).map(data => data.email)
      const plannerEmail = dataPlanner.filter(doc => doc.enabled != false).map(data => data.email)
      const contractAdminEmail = dataContractAdmin.filter(doc => doc.enabled != false).map(data => data.email)
      const supervisorEmail = dataSupervisor.filter(doc => doc.enabled != false).map(data => data.email)

      // Datos que serán usados en el email
      userName = dataPetitioner.filter(doc => doc.enabled != false).map(data => data.name) // Nombre de a quien va dirigido el email
      sendTo = petitionerEmail // Email de a quien va dirigido el email
      arrayCC = [...cOperatorEmail, ...cOwnerEmail, ...plannerEmail, ...contractAdminEmail, ...supervisorEmail] // Arreglo de quienes van en copia
      mainMessage = `Con fecha ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()} nuestro Planificador ${
        user.displayName
      } ha ingresado una solicitud de levantamiento a petición suya` // Mensaje principal
      lastMessage = `Ahora deberá esperar la aprobación de su Contract Operator ${userContOp}.` // Mensaje final

      // Si el usuario tiene rol de Supervisor
    } else if (user.role == 7) {
      // Se usa el nombre del C.Operator indicado en la solicitud
      userContOp = values.contop

      // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del C.Operator, C.Owner, Petitioner, Planificador y Administrador de Contrato
      const uids = await Promise.all([
        searchbyColletionAndField('users', 'name', userContOp),
        searchbyColletionAndField('users', 'role', 4),
        await searchbyColletionAndField('users', 'name', values.petitioner),
        searchbyColletionAndField('users', 'role', 5),
        searchbyColletionAndField('users', 'role', 6)
      ])
      const contOpUid = uids[0]
      const cOwnerUid = uids[1]
      const petitionerUid = uids[2]
      const plannerUid = uids[3]
      const contractAdminUid = uids[4]

      // Se obtienen los datos de C.Operator, C.Owner, Petitioner, Planificador y Administrador de Contrato
      const usersData = await Promise.all([
        getUserData(contOpUid),
        getUserData(cOwnerUid),
        getUserData(petitionerUid),
        getUserData(plannerUid),
        getUserData(contractAdminUid)
      ])
      const dataContOp = usersData[0]
      const dataContOwner = usersData[1]
      const dataPetitioner = usersData[2]
      const dataPlanner = usersData[3]
      const dataContractAdmin = usersData[4]

      // Se definen los emails de C.Operator, C.Owner, Petitioner, Planificador, Administrador de Contrator y Supervisor
      const cOperatorEmail = dataContOp.filter(doc => doc.enabled != false).map(data => data.email)
      const cOwnerEmail = dataContOwner.filter(doc => doc.enabled != false).map(data => data.email)
      const petitionerEmail = dataPetitioner.filter(doc => doc.enabled != false).map(data => data.email)
      const plannerEmail = dataPlanner.filter(doc => doc.enabled != false).map(data => data.email)
      const contractAdminEmail = dataContractAdmin.filter(doc => doc.enabled != false).map(data => data.email)
      const supervisorEmail = user.email

      // Datos que serán usados en el email
      userName = dataPetitioner.filter(doc => doc.enabled != false).map(data => data.name) // Nombre de a quien va dirigido el email
      sendTo = petitionerEmail // Email de a quien va dirigido el email
      arrayCC = [...cOperatorEmail, ...cOwnerEmail, ...plannerEmail, ...contractAdminEmail, ...supervisorEmail] // Arreglo de quienes van en copia
      mainMessage = `Con fecha ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()} usted ha solicitado a nuestro Supervisor ${
        user.displayName
      } ejecutar un levantamiento de urgencia` // Mensaje principal
      lastMessage = `El levantamiento será ejecutado lo antes posible. Se recuerda a ${dataContOp.name} que debe aprobar la solicitud en la página web.` // Mensaje final
    }

    // Try Catch
    try {
      const newDoc = {} // Se genera un elemento vacío
      const addedDoc = await addDoc(collectionRef, newDoc) // Se agrega este elemento vacío a la colección mail
      const mailId = addedDoc.id // Se obtiene el id del elemento recién agregado

      const docRef = doc(collectionRef, mailId) // Se busca la referencia del elemento recién creado con su id

      const adjustedDate = moment(values.start).subtract(1, 'day')
      const week = moment(adjustedDate.toDate()).isoWeek()
      const supervisorShift = week % 2 === 0 ? 'A' : 'B'
      const supervisorData = await getSupervisorData(supervisorShift)

      // Se almacenan las constantes a usar en el email
      const requestNumber = reqNumber
      const title = values.title
      const engineering = user.engineering ? 'Si' : 'No'
      const otProcure = values.ot ? values.ot : 'Por definir'
      const supervisor = supervisorData ? supervisorData.filter(doc => doc.enabled != false).map(data => data.name).join(', ') : 'Por definir'
      const start = values.start ? values.start.toLocaleDateString() : 'Por definir'
      const end = values.end ? values.end.toLocaleDateString() : 'Por definir'
      const plant = values.plant
      const area = values.area ? values.area : 'No indicado'
      const costCenter = values.costCenter ? values.costCenter : 'No indicado'
      const functionalLocation = values.fnlocation ? values.fnlocation : 'No indicado'
      const contractOperator = userContOp
      const petitioner = values.petitioner ? values.petitioner : 'No indicado'
      const sapNumber = values.sap ? values.sap : 'No indicado'
      const operationalType = values.type ? values.type : 'No indicado'
      const machineDetention = values.detention ? values.detention : 'No indicado'
      const jobType = values.objective
      const deliverable = values.deliverable && values.deliverable.length !== 0 ? values.deliverable.join(', ') : 'Por definir'
      const receiver = values.receiver.map(receiver => receiver.email).join(', ')
      const description = values.description
      const attachedDocuments = await processAttachedDocuments(values.files)

      // Si la solicitud considera que se le entregue una memoria de cálculo, también se enviará un email notificando a gente de Procure y al Solicitante al respecto
      if (values.deliverable.includes('Memoria de Cálculo')) {
        // Según lo indicado por gerencia, deberá enviarse un email a Cristobal Paillacar, Iván Durán, Felipe Monge y las mismas personas de ArrayCC para que estén notificadads de la solicitud de Memoria de Cálculo
        // Para esto, se han almacenado en la Colección 'domain/emailCalculationReport' los emails de quienes de a quienes tiene que enviarse

        const emailCalculationReportRef = doc(db, 'domain', 'emailCalculationReport')
        const emailCalculationReportSnap = await getDoc(emailCalculationReportRef)
        const emailCalculationReportData = emailCalculationReportSnap.data()
        const procureUsersEmail = emailCalculationReportData.emails // Se selecciona el email de quienes exista en el array
        arrayCC = arrayCC.concat(procureUsersEmail)

        let mcDescription = values.mcDescription ? values.mcDescription : ''
        let specialMessage = `Dentro de los entregables solicitados se encuentra una "Memoria de Cálculo". A continuación puede encontrar el detalle indicado por el Solicitante:` + `<p></p>` + mcDescription + `<p></p>` + `Procure procederá a generar un presupuesto especial para el caso indicado.`
        lastMessage = specialMessage + ' ' + lastMessage
        emailHtml = getEmailTemplate(
          userName,
          mainMessage,
          requestNumber,
          title,
          engineering,
          otProcure,
          supervisor,
          start,
          end,
          plant,
          area,
          costCenter,
          functionalLocation,
          contractOperator,
          petitioner,
          sapNumber,
          operationalType,
          machineDetention,
          jobType,
          deliverable,
          receiver,
          description,
          lastMessage
        )
      } else {
        // Llamada al html del email con las constantes previamente indicadads
        emailHtml = getEmailTemplate(
          userName,
          mainMessage,
          requestNumber,
          title,
          engineering,
          otProcure,
          supervisor,
          start,
          end,
          plant,
          area,
          costCenter,
          functionalLocation,
          contractOperator,
          petitioner,
          sapNumber,
          operationalType,
          machineDetention,
          jobType,
          deliverable,
          receiver,
          description,
          lastMessage
        )
      }

      // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
      updateDoc(docRef, {
        to: sendTo,
        cc: arrayCC,
        date: fechaCompleta,
        req: reqId,
        emailType: 'NewRequest',
        message: {
          subject: `Solicitud de levantamiento: ${values.title}`,
          html: emailHtml,
          attachments: attachedDocuments
        }
      })

      console.log('E-mail a Solicitante de nueva solicitud enviado con éxito.')
    } catch (error) {
      console.error('Error al enviar email:', error)
      throw error
    }
  }
}
