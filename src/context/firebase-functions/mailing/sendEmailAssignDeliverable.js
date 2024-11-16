// ** Firebase Imports
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from 'src/configs/firebase'
import { getEmailTemplate } from './assignDeliverableTemplate'

const moment = require('moment')

// Obtener usuarios con rol 5
const getPlannerData = async () => {
  // Realiza la consulta según el campo proporcionado
  const q = query(collection(db, 'users'), where('role', '==', 5))

  let plannerArray = []

  try {
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No se encontró ningún Planificador`)

      return null
    } else {
      const queryDocs = querySnapshot.docs
      queryDocs.forEach(doc => {
        plannerArray.push(doc.data())
      })

      return plannerArray
    }
  } catch (error) {
    console.log('Error al buscar Planificador: ', error)

    return null
  }
}

// Obtener usuarios con rol 9 (Control Documental)
const getDocumentControlData = async () => {
  // Realiza la consulta según el campo proporcionado
  const q = query(collection(db, 'users'), where('role', '==', 9))

  let documentControlArray = []

  try {
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No se encontró ningún Control Documental`)

      return null
    } else {
      const queryDocs = querySnapshot.docs
      queryDocs.forEach(doc => {
        documentControlArray.push(doc.data())
      })

      return documentControlArray
    }
  } catch (error) {
    console.log('Error al buscar Control Documental: ', error)

    return null
  }
}


// Función para enviar emails de forma automática.
// user es el usuario conectado que efectúa el envío de la solicitud.
// ot es la información del Levantamiento (en Firebase es cada documento dentro de levantamientos).
// draftman es el Proyectista que selecciona el Supervisor para hacer ese entregable.
// codes es un array de objetos que se genera cuando se crean los códigos de entregables. clientCode es el codigo cliente y id es el codigo Procure.
export const sendEmailAssignDeliverable = async (user, ot, draftman, codes) => {
  const collectionRef = collection(db, 'mail') // Se llama a la colección mail de Firestore

  if (user !== null) {
    const fechaCompleta = new Date() // Constante que almacena la fecha en que se genera la solcitud

    // Declaración de variables

    let emailHtml

    // Try Catch
    try {
      const newDoc = {} // Se genera un elemento vacío
      const addedDoc = await addDoc(collectionRef, newDoc) // Se agrega este elemento vacío a la colección mail
      const mailId = addedDoc.id // Se obtiene el id del elemento recién agregado

      const docRef = doc(collectionRef, mailId) // Se busca la referencia del elemento recién creado con su id

      // Se obtienen los datos de C.Owner, petitioner y Planificador
      const usersData = await Promise.all([getPlannerData(), getDocumentControlData()])
      const plannerData = usersData[0]
      const documentControlData = usersData[1]

      // Se definen los emails de Planificador
      const plannerEmail = plannerData.filter(doc => doc.enabled != false).map(data => data.email)
      const documentControlEmail = documentControlData.filter(doc => doc.enabled != false).map(data => data.email)

      // Llamada al html del email con las constantes previamente indicadads
      emailHtml = getEmailTemplate(
        draftman.name,
        user.displayName,
        ot,
        codes
      )

      let sendTo = draftman.email
      let arrayCC = [user.email, ...plannerEmail, ...documentControlEmail]

      // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
      updateDoc(docRef, {
        to: sendTo,
        cc: arrayCC,
        date: fechaCompleta,
        deliverableId: codes.id,
        emailType: 'AssignDeliverable',
        message: {
          subject: `Entregable asignado // ${codes.id} // ${codes.clientCode}:`,
          html: emailHtml
        }
      })

      console.log('E-mail a Autor enviado con éxito.')
    } catch (error) {
      console.error('Error al enviar email de asignación de entregable:', error)
      throw error
    }
  }
}
