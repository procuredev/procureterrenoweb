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
export const sendEmailNewPetition = async (user, values, reqId, reqNumber) => {

  const collectionRef = collection(db, 'mail') // Se llama a la colección mail de Firestore

  if (user !== null) {
    // Primer caso: enviar email cuando se genera una nueva solicitud.

    let userContOp
    let lastMessage
    let arrayCC = []

    // Si el usuario tiene rol de Solicitante
    if (user.role == 2) {
      userContOp = values.contop // Se usa el nombre del C.Operator indicado en la solicitud

      const contOpUid = await searchbyColletionAndField('users', 'name', userContOp) // Se usa la función searchbyColletion() para buscar dentro de Firestore el usuario que se llame igual al Contract Operator del usuario
      const dataContOp = await getData(contOpUid) // Para este C.Operator se obtiene su datos de Firestore
      const cOperatorEmail = dataContOp.email // Se selecciona el email del C.Operator

      arrayCC = [cOperatorEmail]

      lastMessage = `Ahora deberá esperar la aprobación de su Contract Operator ${userContOp}.`
    } else {
      userContOp = user.displayName

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

      arrayCC = [cOwnerEmail, petitionerEmail, plannerEmail]

      lastMessage = `Ahora deberá esperar la aprobación de Procure.`
    }

    // Try Catch
    try {
      const newDoc = {} // Se genera un elemento vacío
      const addedDoc = await addDoc(collectionRef, newDoc) // Se agrega este elemento vacío a la colección mail
      const mailId = addedDoc.id // Se obtiene el id del elemento recién agregado

      const docRef = doc(collectionRef, mailId) // Se busca la referencia del elemento recién creado con su id

      const fechaCompleta = new Date() // Constante que almacena la fecha en que se genera la solcitud

      // Se almacenan las constantes a usar en el email
      const userName = user.displayName
      const mainMessage = `Usted ha generado una solicitud de trabajo el día ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}`
      const requestNumber = reqNumber
      const title = values.title
      const engineering = user.engineering ? 'Si' : 'No'
      const otProcure = values.ot ? values.ot : 'Por definir'
      const supervisor = values.supervisor ? values.supervisor : 'Por definir'
      const start = values.start ? values.start.toLocaleDateString() : 'Por definir'
      const end = 'Por definir'
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

      // Llamada al html del email con las constantes previamente indicadads
      const emailHtml = getEmailTemplate(userName, mainMessage, requestNumber, title, engineering, otProcure, supervisor, start, end, plant, area, functionalLocation, contractOperator, petitioner, sapNumber, operationalType, machineDetention, jobType, deliverable, receiver, description, lastMessage)

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
