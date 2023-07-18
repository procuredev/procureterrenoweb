// ** Firebase Imports
import { Firebase, db} from 'src/configs/firebase'
import {
  collection,
  doc,
  addDoc,
  query,
  getDoc,
  getDocs,
  updateDoc,
  where
} from 'firebase/firestore'

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

    if (user.role == 2) {
      // Si el usuario tiene rol de Solicitante

      const userContOp = values.contop // Se usa el nombre del C.Operator indicado en la solicitud
      const contOpUid = await searchbyColletionAndField('users', 'name', userContOp) // Se usa la función searchbyColletion() para buscar dentro de Firestore el usuario que se llame igual al Contract Operator del usuario
      const dataContOp = await getData(contOpUid) // Para este C.Operator se obtiene su datos de Firestore
      const cOperatorEmail = dataContOp.email // Se selecciona el email del C.Operator

      // 1ro: Email para el solicitante
      try {
        const newDoc = {} // Se genera un elemento vacío
        const addedDoc = await addDoc(collectionRef, newDoc) // Se agrega este elemento vacío a la colección mail
        const mailId = addedDoc.id // Se obtiene el id del elemento recién agregado

        const docRef = doc(collectionRef, mailId) // Se busca la referencia del elemento recién creado con su id

        const fechaCompleta = new Date() // Constante que almacena la fecha en que se genera la solcitud

        // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
        updateDoc(docRef, {
          to: user.email,
          cc: cOperatorEmail,
          date: fechaCompleta,
          req: reqId,
          emailType: 'NewRequest',
          message: {
            subject: `Solicitud de levantamiento: N°${reqNumber} - ${values.title}`,
            html: `
              <h2>Estimad@ ${user.displayName}:</h2>
              <p>Usted ha generado una solicitud de trabajo el día ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}. A continuación puede encontrar el detalle de la solicitud:</p>
              <table style="width:100%;">
                <tr>
                  <td style="text-align:left; padding-left:15px; width:20%;"><strong>N° Solicitud:</strong></td>
                  <td style="text-align:left; width:80%;">${reqNumber}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Título:</strong></td>
                  <td>${values.title}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Fecha de inicio de levantamiento:</strong></td>
                  <td>${values.start.toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Planta:</strong></td>
                  <td>${values.plant}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Área:</strong></td>
                  <td>${values.area}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Functional Location:</strong></td>
                  <td>${values.fnlocation}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Contract Operator:</strong></td>
                  <td>${values.contop}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>N° SAP:</strong></td>
                  <td>${values.sap}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Tipo de trabajo:</strong></td>
                  <td>${values.type}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Tipo de levantamiento:</strong></td>
                  <td>${values.objective}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Entregables esperados:</strong></td>
                  <td>${values.deliverable.join(', ')}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Destinatarios:</strong></td>
                  <td>${values.receiver.map(receiver => receiver.email).join(', ')}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Descripción del requerimiento:</strong></td>
                  <td>${values.description}</td>
                </tr>
              </table
              <p>Ahora deberá esperar la aprobación de ${userContOp}.</p>
              <p>Para mayor información revise la solicitud en nuestra página web</p>
              <p>Saludos,<br>Procure Terreno Web</p>
              `
          }
        })
        console.log('E-mail a Solicitante de nueva solicitud enviado con éxito.')
      } catch (error) {
        console.error('Error al enviar email:', error)
        throw error
      }
    } else if (user.role == 3) {
      // Si el usuario tiene rol de Contract Operator

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

      // 1ro: Email para el usuario que generó la solicitud (en este caso es el C.Operator)
      try {
        const newDoc = {} // Se genera un elemento vacío
        const addedDoc = await addDoc(collectionRef, newDoc) // Se agrega este elemento vacío a la colección mail
        const mailId = addedDoc.id // Se obtiene el id del elemento recién agregado

        const docRef = doc(collectionRef, mailId) // Se busca la referencia del elemento recién creado con su id

        const fechaCompleta = new Date() // Constante que almacena la fecha en que se genera la solcitud

        // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
        updateDoc(docRef, {
          to: user.email,
          cc: [petitionerEmail, cOwnerEmail, plannerEmail],
          date: fechaCompleta,
          req: reqId,
          emailType: 'NewRequest',
          message: {
            subject: `Solicitud de levantamiento: N°${reqNumber} - ${values.title}`,
            html: `
              <h2>Estimad@ ${user.displayName}:</h2>
              <p>Usted ha generado una solicitud de trabajo el día ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}. A continuación puede encontrar el detalle de la solicitud:</p>
              <table style="width:100%;">
                <tr>
                  <td style="text-align:left; padding-left:15px; width:20%;"><strong>N° Solicitud:</strong></td>
                  <td style="text-align:left; width:80%;">${reqNumber}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Título:</strong></td>
                  <td>${values.title}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Fecha de inicio de levantamiento:</strong></td>
                  <td>${values.start.toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Planta:</strong></td>
                  <td>${values.plant}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Área:</strong></td>
                  <td>${values.area}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Functional Location:</strong></td>
                  <td>${values.fnlocation}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Contract Operator:</strong></td>
                  <td>${values.contop}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Solicitante:</strong></td>
                  <td>${values.petitioner}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>N° SAP:</strong></td>
                  <td>${values.sap}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Tipo de trabajo:</strong></td>
                  <td>${values.type}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Tipo de levantamiento:</strong></td>
                  <td>${values.objective}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Entregables esperados:</strong></td>
                  <td>${values.deliverable.join(', ')}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Destinatarios:</strong></td>
                  <td>${values.receiver.map(receiver => receiver.email).join(', ')}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Descripción del requerimiento:</strong></td>
                  <td>${values.description}</td>
                </tr>
              </table
              <p>Ahora deberá esperar la aprobación de Procure.</p>
              <p>Para mayor información revise la solicitud en nuestra página web</p>
              <p>Saludos,<br>Procure Terreno Web</p>
              `
          }
        })
        console.log('E-mail a C.Operator de nueva solicitud enviado con éxito.')
      } catch (error) {
        console.error('Error al enviar email:', error)
        throw error
      }
    } else {
      // Si el usuario tiene rol de admin
    }
  }
}
