// ** Firebase Imports
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore'
import { db } from 'src/configs/firebase'
import { getEmailTemplate } from './assignDeliverableTemplate'

const moment = require('moment')

// Obtener usuarios con rol 5 (Planificador)
// const getPlannerData = async () => {
//   // Realiza la consulta según el campo proporcionado
//   const q = query(collection(db, 'users'), where('role', '==', 5))

//   let plannerArray = []

//   try {
//     const querySnapshot = await getDocs(q)

//     if (querySnapshot.empty) {
//       console.log(`No se encontró ningún Planificador`)

//       return null
//     } else {
//       const queryDocs = querySnapshot.docs
//       queryDocs.forEach(doc => {
//         plannerArray.push(doc.data())
//       })

//       return plannerArray
//     }
//   } catch (error) {
//     console.log('Error al buscar Planificador: ', error)

//     return null
//   }
// }

// // Obtener usuarios con rol 6 (Administrador de Contrato)
// const getContractAdministratorData = async () => {
//   // Realiza la consulta según el campo proporcionado
//   const q = query(collection(db, 'users'), where('role', '==', 6))

//   let contractAdministratorArray = []

//   try {
//     const querySnapshot = await getDocs(q)

//     if (querySnapshot.empty) {
//       console.log(`No se encontró ningún Administrador de Contrato`)

//       return null
//     } else {
//       const queryDocs = querySnapshot.docs
//       queryDocs.forEach(doc => {
//         contractAdministratorArray.push(doc.data())
//       })

//       return contractAdministratorArray
//     }
//   } catch (error) {
//     console.log('Error al buscar al Administrador de Contrato: ', error)

//     return null
//   }
// }


// Función para enviar emails de forma automática.
// user es el usuario conectado que efectúa el envío de la solicitud.
// ot es la información del Levantamiento (en Firebase es cada documento dentro de levantamientos).
// draftman es el Proyectista que selecciona el Supervisor para hacer ese entregable.
// codes es un array de objetos que se genera cuando se crean los códigos de entregables. clientCode es el codigo cliente y id es el codigo Procure.
export const sendEmailAssignDeliverable = async (user, ot, draftman, codes, usersOnCopy) => {

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
      // const usersData = await Promise.all([getPlannerData(), getContractAdministratorData()])
      // const plannerData = usersData[0]
      // const contractAdministratorData = usersData[1]

      // Se definen los emails de Planificador
      // const plannerEmail = plannerData.filter(doc => doc.enabled != false).map(data => data.email)
      // const contractAdministratorEmail = contractAdministratorData.filter(doc => doc.enabled != false).map(data => data.email)

      // Llamada al html del email con las constantes previamente indicadads
      emailHtml = getEmailTemplate(
        draftman.name,
        user.displayName,
        ot,
        codes
      )

      let sendTo = draftman.email
      // En este array deberá incluirse a control.documental@procure.cl
      let arrayCC = [user.email, ...usersOnCopy]

      // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
      updateDoc(docRef, {
        to: sendTo,
        cc: arrayCC,
        date: fechaCompleta,
        deliverableId: codes.id,
        emailType: 'AssignDeliverable',
        message: {
          subject: `Entregable asignado // OT ${ot.ot} // ${codes.id} // ${codes.clientCode}:`,
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
