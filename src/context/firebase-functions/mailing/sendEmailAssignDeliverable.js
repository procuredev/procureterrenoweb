// ** Firebase Imports
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from 'src/configs/firebase'
import { getEmailTemplate } from './assignDeliverableTemplate'

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

// Función para rescatar el nombre del archivo que se encouentra dentro del array de strings que son subidos a Firestore
// Se entrega como parámetro a attachedArray que es un arreglo de strings
const restructuredAttached = (attachedArray) => {

  // Inicialización del array de objetos que tendrá el link y el name de cada archivo adjunto.
  let modifiedAttached = []

  // Iteración para recorrer el arreglo
  attachedArray.forEach(link => {

    // Se hace una serie de manejos del string usando split, subString y replaceAll.
    const lastPart = link.split('/')
    const lastPartString = lastPart[lastPart.length - 1]
    const lastPartSubString = lastPartString.substring(lastPartString.indexOf("fotos%2F") + 8, lastPartString.lastIndexOf("?"))
    const name = lastPartSubString.replaceAll("%20", " ")
    modifiedAttached.push({link: link, name: name})

  })

  return modifiedAttached

}

// Función para obtener el valor del contador en otCounter
async function getLastOTValue() {

  const counterRef = doc(db, 'counters', 'otCounter')

  try {

    // Se obtiene el número de OT en el contador.
    const counterSnap = await getDoc(counterRef)
    const counterData = counterSnap.data()
    const counter = counterData.counter

    return counter

  } catch (error) {

    console.error('Error:', error)

    throw error
  }

}

// Función para enviar emails de forma automática.
// user es el usuario conectado que efectúa el envío de la solicitud.
// ot es la información del Levantamiento (en Firebase es cada documento dentro de levantamientos).
// draftman es el Proyectista que selecciona el Supervisor para hacer ese entregable.
export const sendEmailAssignDeliverable = async (user, ot, draftman) => {
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


      // Llamada al html del email con las constantes previamente indicadads
      emailHtml = getEmailTemplate(
        draftman.name,
        user.displayName,
        ['codigo 1', 'codigo 2']
      )

      let sendTo = draftman.email
      let arrayCC = [user.email]

      // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
      updateDoc(docRef, {
        to: sendTo,
        cc: arrayCC,
        date: fechaCompleta,
        deliverableId: 'idDelEntregable',
        emailType: 'AssignDeliverable',
        message: {
          subject: `Entregable asignado:`,
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
