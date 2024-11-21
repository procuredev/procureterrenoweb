// ** Firebase Imports
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from 'src/configs/firebase'
import { fetchPetitionById } from 'src/context/firebase-functions/firestoreQuerys'
import { getEmailTemplate } from './deliverableNextRevisionTemplate'

const moment = require('moment')

// Importación de los datos del usuario según el id indicado
const getUserData = async id => {

  const docRef = doc(db, 'users', id)
  const docSnap = await getDoc(docRef)
  const userData = docSnap.data()

  return userData
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

// Obtener usuarios con rol 5 (Planificador)
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

// Obtener usuarios con rol 6 (Administrador de Contrato)
const getContractAdministratorData = async () => {
  // Realiza la consulta según el campo proporcionado
  const q = query(collection(db, 'users'), where('role', '==', 6))

  let contractAdministratorArray = []

  try {
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No se encontró ningún Administrador de Contrato`)

      return null
    } else {
      const queryDocs = querySnapshot.docs
      queryDocs.forEach(doc => {
        contractAdministratorArray.push(doc.data())
      })

      return contractAdministratorArray
    }
  } catch (error) {
    console.log('Error al buscar al Administrador de Contrato: ', error)

    return null
  }
}

// Obtener usuarios con rol 9 (Control Documental)
const getControlDocumentData = async () => {
  // Realiza la consulta según el campo proporcionado
  const q = query(collection(db, 'users'), where('role', '==', 9))

  let controlDocumentArray = []

  try {
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No se encontró ningún Planificador`)

      return null
    } else {
      const queryDocs = querySnapshot.docs
      queryDocs.forEach(doc => {
        controlDocumentArray.push(doc.data())
      })

      return controlDocumentArray
    }
  } catch (error) {
    console.log('Error al buscar Planificador: ', error)

    return null
  }
}

// Función para obtener los usuarios que deben ir en copia en los e-mails de asignación del Entregable.
const getUserEmailOnCopy = async () => {

  let usersOnCopy = []

  // Se obtienen los datos de C.Owner, petitioner y Planificador
  const usersData = await Promise.all([getPlannerData(), getContractAdministratorData()])
  const plannerData = usersData[0]
  const contractAdministratorData = usersData[1]

  // Se definen los emails de Planificador
  const plannerEmail = plannerData.filter(doc => doc.enabled != false).map(data => data.email)
  const contractAdministratorEmail = contractAdministratorData.filter(doc => doc.enabled != false).map(data => data.email)

  usersOnCopy.push(...plannerEmail, ...contractAdministratorEmail)

  return usersOnCopy

}

const getUserRole = async (userId) => {

}


const getNextRevisorData = async (petitionData, blueprint, updateData) => {

  // nextRevisorData es la data del siguiente Revisor.
  // En el caso de Control Documental, puede haber más de un usuario para ejecutar la revisión.
  let nextRevisorData = []

  // Caso 1 - Siguiente Revisor es Rol 6 (Administrador de Contrato)
  if (updateData && updateData.attentive && updateData.attentive === 6) {

    const contractAdmintratorData = await getContractAdministratorData()
    contractAdmintratorData.forEach(user => {
      if(user.enabled && user.enabled != false) {
        nextRevisorData.push({name: user.name, email: user.email})
      }
    })

    // Caso 2 - Siguiente Revisor es Rol 7 (Supervisor)
  } else if (updateData && updateData.attentive && updateData.attentive === 7) {

    const deliverableSupervisorShift = petitionData.supervisorShift
    const supervisorData = await getSupervisorData(deliverableSupervisorShift)

    const blueprintAuthorData = await getUserData(blueprint.userId)
    const blueprintAuthorRole = blueprintAuthorData.role

    if (blueprintAuthorRole === 7) {
      nextRevisorData.push({name: blueprint.userName, email: blueprint.userEmail})
    } else {
      supervisorData.forEach(user => {
        if(user.enabled && user.enabled != false) {
          nextRevisorData.push({name: user.name, email: user.email})
        }
      })
    }

    // Caso 3 - Siguiente Revisor es Rol 8 (Proyectista)
  } else if (updateData && updateData.attentive && updateData.attentive === 8) {

    nextRevisorData.push({name: blueprint.userName, email: blueprint.userEmail})

    // Caso 4 - Siguiente Revisor es Rol 9 (Control Documental)
  } else if (updateData && updateData.attentive && updateData.attentive === 9) {

    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'www.prosite.cl' || window.location.hostname === 'procureterrenoweb.vercel.app') {
        nextRevisorData.push({name: 'Control Documental', email: 'controldoc72336@procure.cl'})
      } else {
        nextRevisorData.push({name: 'Control Documental', email: 'cdpruebas@procure.cl'})
      }
    } else {
      nextRevisorData.push({name: 'Control Documental', email: 'cdpruebas@procure.cl'})
    }

  } else {
    // No deberían haber más casos
  }

  return nextRevisorData

}

// Función para enviar emails de forma automática.
// user es el usuario conectado que ejecuta la acción.
// petitionID es el ID del la Solicitud/OT en Firestore.
// blueprint es el objeto con la información del entregable, que incluye información del Autor.
// updateData es un objeto que contiene datos del siguiente revisor ("attentive" Rol del siguiente revisor , bla, bla)
export const sendEmailDeliverableNextRevision = async (user, petitionID, blueprint, updateData) => {

  // Si attentive es 4 (Control Documental aprueba Documento para emitir a Cliente)...
  // => Se detiene la ejecución del envío de email.
  if (updateData && updateData.attentive && (updateData.attentive === 4 || updateData.attentive === 10 )) {
    return
  }

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

      const petitionData = await fetchPetitionById(petitionID)

      const nextRevisorData = await getNextRevisorData(petitionData, blueprint, updateData)

      //const filteredNextRevisorData = nextRevisorData.filter(doc => doc.enabled != false)
      const nextRevisorName = nextRevisorData.map(data => data.name)
      const nextRevisorEmail = nextRevisorData.map(data => data.email)

      // Llamada al html del email con las constantes previamente indicadads
      emailHtml = getEmailTemplate(
        nextRevisorName,
        petitionData,
        blueprint,
        updateData
        //nextRevision
      )

      let sendTo = [...nextRevisorEmail]

      // Se agrega a lista de usuarios en copia al Supervisor(user.email) y usersOnCopy.
      let arrayCC = []

      // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
      updateDoc(docRef, {
        to: sendTo,
        cc: arrayCC,
        date: fechaCompleta,
        deliverableId: blueprint.id,
        emailType: 'DeliverableNextRevisor',
        message: {
          subject: `Revsión de Entregable // OT ${petitionData.ot} // ${blueprint.id} // ${blueprint.clientCode}:`,
          html: emailHtml
        }
      })

      console.log('E-mail a Siguiente Revisor enviado con éxito.')
    } catch (error) {
      console.error('Error al enviar email de siguiente revisor de entregable:', error)
      throw error
    }
  }
}
