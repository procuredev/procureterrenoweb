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

 // Obtener usuarios con rol 8 según su turno
 const getSupervisorData = async (shift) => {
  // Realiza la consulta según el campo proporcionado
  const q = query(collection(db, 'users'), where('role', '==', 7), where('shift', '==', shift))

  try {
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log(`No se encontró ningún vsupervisor para el turno ${shift}`)

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
  prevState,
  newState,
  cOperatorEmail,
  cOwnerEmail,
  plannerEmail,
  admContEmail,
  petitionerFieldEmail
) => {
  var arrayCC = [] // Se inicializa un array vacío
  var message = '' // Se inicializa un string vacío

  // Si el rol de quien hizo la solicitud es "Solicitante"
  if (requesterRole == 2) {
    // && prevState es 2 && newState es 4 -> Solicitud aceptada por C.Operator
    if (prevState == 2 && newState == 4) {
      arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner y Planificador
      message = `la solicitud ha sido aceptada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 4 && newState es 5 -> Solicitud aceptada por Planificador
    else if (prevState == 4 && newState == 5) {
      arrayCC = [plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, Planificador Y Adm.Contrato
      message = `la solicitud ha sido actualizada por nuestro Planificador ${user.displayName}. Ahora también es posible encontrar la fecha de término del levantamiento y el número de OT` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 5 && newState es 6 -> Solicitud aceptada por Adm.Contrato
    else if (prevState == 5 && newState == 6) {
      arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
      message = `la solicitud ha sido aceptada por Procure` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 2 && newState es 1 -> Solicitud modificada por C.Operator
    else if (prevState == 2 && newState == 1) {
      arrayCC = [cOperatorEmail] // Siginifca que hay que mandarle e-mail al Solicitante y C.Operator
      message = `la solicitud ha sido modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 1 && newState es 4 -> Modificación hecha por C.Operator fue aceptada por Solicitante
    else if (prevState == 1 && newState == 4) {
      arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, Planificador y Adm.Contrato
      message = `la solicitud ha sido modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 1 && newState es 2 -> Modificación hecha por C.Operator o Procure, fue modificada nuevamente por Solicitante
    else if (prevState == 1 && newState == 2) {
      arrayCC = [cOperatorEmail] // Siginifca que hay que mandarle e-mail al Solicitante y C.Operator
      message = `la solicitud ha sido modificada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 5 && newState es 1 -> Modificación hecha por Procure
    else if (prevState == 5 && newState == 1) {
      arrayCC = [plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, Planificador y Adm.Contrato
      message = `la solicitud ha sido modificada por Procure` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 1 && newState es 6 -> Modificación hecha por Procure fue aceptada por Solicitante
    else if (prevState == 1 && newState == 6) {
      arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
      message = `la solicitud ha sido aceptada por ${user.displayName} y por Procure` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 2 && newState es 10 -> Solicitud rechazada por C.Operator
    else if (prevState == 2 && newState == 10) {
      arrayCC = [cOperatorEmail] // Siginifca que hay que mandarle e-mail al Solicitante y C.Operator
      message = `la solicitud ha sido rechazada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 5 && newState es 10 -> Solicitud rechazada por Adm.Contrato
    else if (prevState == 5 && newState == 10) {
      arrayCC = [cOperatorEmail, cOwnerEmail, plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al Solicitante, C.Operator, C.Owner, Planificador y Adm.Contrato
      message = `la solicitud ha sido rechazada por nuestro Administrador de Contrato ${user.displayName}` // Se agrega mensaje que irá en el e-mail
    }
  }

  // Si el rol de quien hizo la solicitud es "Contract Operator"
  else if (requesterRole == 3) {
    // && prevState es 3 && newState es 4
    if (prevState == 2 && newState == 4) {
      arrayCC = [cOwnerEmail, plannerEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator y Planificador
      message = `la solicitud ha sido aceptada por ${user.displayName}` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 4 && newState es 5 -> Soliciutud aceptada por Planificador
    else if (prevState == 4 && newState == 5) {
      arrayCC = [plannerEmail, admContEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator, Planificador y Adm.Contrato
      message = `la solicitud ha sido actualizada por nuestro Planificador ${user.displayName}. Ahora también es posible encontrar la fecha de término del levantamiento y el número de OT` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 5 && newState es 6 -> Solicitud aceptada por Adm.Contrato
    else if (prevState == 5 && newState == 6) {
      arrayCC = [cOwnerEmail, plannerEmail, admContEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
      message = `la solicitud ha sido aceptada por Procure` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 5 && newState es 2 -> Modificación hecha por Procure
    else if (prevState == 5 && newState == 2) {
      arrayCC = [plannerEmail, admContEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator, Planificador y Adm.Contrato
      message = `la solicitud ha sido modificada por Procure` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 2 && newState es 6 -> Modificación hecha por Procure fue aceptada por C.Operator
    else if (prevState == 2 && newState == 6) {
      arrayCC = [cOwnerEmail, plannerEmail, admContEmail, petitionerFieldEmail] // Siginifca que hay que mandarle e-mail al C.Operator, C.Owner, Planificador, Adm.Contrato y Supervisor
      message = `la solicitud ha sido aceptada por ${user.displayName} y por Procure` // Se agrega mensaje que irá en el e-mail
    }

    // && prevState es 5 && newState es 10 -> Solicitud rechazada por Procure
    else if (prevState == 5 && newState == 10) {
      arrayCC = [cOwnerEmail, plannerEmail, admContEmail] // Siginifca que hay que mandarle e-mail al C.Operator, Planificador y Adm.Contrato
      message = `la solicitud ha sido rechazada por nuestro Administrador de Contrato ${user.displayName}` // Se agrega mensaje que irá en el e-mail
    }
  }

  // Cualquier otro caso
  else {
  }

  return { arrayCC: arrayCC, message: message }
}

  export const sendEmailWhenReviewDocs = async (user, prevState, newState, requesterId, requirementId) => {

    const collectionRef = collection(db, 'mail') // Se llama a la colección mail de Firestore

    // Se rescatan los datos globales de la solicitud:
    const requirementRef = doc(db, 'solicitudes', requirementId)
    const requirementSnapshot = await getDoc(requirementRef)
    const requirementData = requirementSnapshot.data()

    // Se rescatan los datos de quien hizo la solicitud que puede tener rol 2 o 3
    const requesterData = await getData(requesterId)
    const requesterRole = requesterData.role
    const requesterEmail = requesterData.email

    // Se rescatan los datos del "Contract Owner"
    const cOwnerUid = await searchbyColletionAndField('users', 'role', 4) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del C.Owner
    const cOwnerData = await getData(cOwnerUid)
    const cOwnerEmail = cOwnerData.email

    // Se rescatan los datos del "Planificador"
    const plannerUid = await searchbyColletionAndField('users', 'role', 5) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del Planificador
    const plannerData = await getData(plannerUid)
    const plannerEmail = plannerData.email

    // Se rescatan los datos del "Administrador de Contrato"
    const admContUid = await searchbyColletionAndField('users', 'role', 6) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del Administrador de Contrato
    const admContData = await getData(admContUid)
    const admContEmail = admContData.email

    // Se rescatan los datos de quien se indicó como "solicitante" en ese campo al generar la solicitud
    const petitionerName = requirementData.petitioner // Se rescata el nombre del campo "Solicitiante" en Nueva Solicitud
    const petitionerUid = await searchbyColletionAndField('users', 'name', petitionerName) // Se usa la función searchbyColletion() para buscar dentro de Firestore el uid del solicitante indicado en el campo "Solicitante"
    const dataPetitioner = await getData(petitionerUid) // Para el solicitante indicado en el campo "Solicitante" se obtiene su datos de Firestore
    const petitionerEmail = dataPetitioner.email // Se selecciona el email del solicitante indicado en el campo "Solicitante"

    // Se rescatan los datos de quien será el Supervisor una vez que la solicituc alcanzaels estado 6
    var supervisorEmail = null
    var supervisorName = null
    if (requirementData.supervisorShift) {
      const supervisorShift = requirementData.supervisorShift // Se rescata el nombre del campo "supervisorShift" en la base de datos
      const supervisorData = await getSupervisorData(supervisorShift) // Para el supervisor indicado se obtiene su datos de Firestore
      supervisorEmail = supervisorData.email // Se selecciona el email del supervisor
      supervisorName = supervisorData.name // Se selecciona el email del supervisor
    }


    if (requesterRole == 2) {
      // Si el rol de quien hizo la solicitud es 2

      //Se rescatan los datos del C.Operator
      const cOperatorName = requirementData.contop // Se usa el nombre del C.Operator de la solicitud hecha
      const cOperatorUid = await searchbyColletionAndField('users', 'name', cOperatorName) // Se usa la función searchbyColletion() para buscar dentro de Firestore el usuario que se llame igual al Contract Operator del usuario
      const cOperatorData = await getData(cOperatorUid) // Para este C.Operator se obtiene su datos de Firestore
      const cOperatorEmail = cOperatorData.email // Se selecciona el email del C.Operator



      const usersOnCopyAndMessage = getUsersOnCopyAndMessage(
        user,
        requesterRole,
        prevState,
        newState,
        cOperatorEmail,
        cOwnerEmail,
        plannerEmail,
        admContEmail,
        petitionerEmail
      )

      const onCC = usersOnCopyAndMessage.arrayCC
      const message = usersOnCopyAndMessage.message

      // Email dirigido a quien hizo la solicitud, con copia a quien corresponda
      try {
        const newDoc = {} // Se genera un elemento vacío
        const addedDoc = await addDoc(collectionRef, newDoc) // Se agrega este elemento vacío a la colección mail
        const mailId = addedDoc.id // Se obtiene el id del elemento recién agregado

        const docRef = doc(collectionRef, mailId) // Se busca la referencia del elemento recién creado con su id

        const fechaCompleta = new Date() // Constante que almacena la fecha en que se genera la solcitud

        const startDate = requirementData.start.toDate().toLocaleDateString() // Constante que almacena la fecha de inicio del levantamiento

        // Variable que almacena la fecha de término del levantamiento
        var endDate = null // Se inicializa como null
        // Si el campo existe dentro del documento
        if (requirementData.end) {
          endDate = requirementData.end.toDate().toLocaleDateString() // Se actualiza endDate con el dato existente
        } else {
          // Si el campo no existe dentro del documento
          endDate = 'Por definir' // La variable endDate queda 'Por definir'
        }

        // Variable que almacena el número de OT del levantamiento
        var otNumber = null // Se inicializa como null
        // Si el campo existe dentro del documento
        if (requirementData.ot) {
          otNumber = requirementData.ot // Se actualiza otNumber con el dato existente
        } else {
          // Si el campo no existe dentro del documento
          otNumber = 'Por definir' // La variable otNumber queda 'Por definir'
        }

        // Variable que almacena el Supervisor que estará a cargo del levantamiento
        // Si el campo existe dentro del documento
        if (supervisorName) {
           // Se actualiza supervisorName con el dato existente
        } else {
          // Si el campo no existe dentro del documento
          supervisorName = 'Por definir' // La variable supervisorName queda 'Por definir'
        }

        // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
        updateDoc(docRef, {
          to: requesterEmail,
          cc: onCC,
          date: fechaCompleta,
          req: requirementId,
          emailType: 'reviewDocs',
          message: {
            subject: `Solicitud de levantamiento: N°${requirementData.n_request} - ${requirementData.title}`,
            html: `
              <h2>Estimad@ ${requesterData.name}:</h2>
              <p>Con fecha ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}, ${message}. A continuación puede encontrar el detalle de la solicitud:</p>
              <table style="width:100%;">
                <tr>
                  <td style="text-align:left; padding-left:15px; width:20%;"><strong>N° Solicitud:</strong></td>
                  <td style="text-align:left; width:80%;">${requirementData.n_request}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Título:</strong></td>
                  <td>${requirementData.title}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>N° OT Procure:</strong></td>
                  <td>${otNumber}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Supervisor a cargo del levantamiento:</strong></td>
                  <td>${supervisorName}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Fecha de inicio de levantamiento:</strong></td>
                  <td>${startDate}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Fecha de término de levantamiento:</strong></td>
                  <td>${endDate}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Planta:</strong></td>
                  <td>${requirementData.plant}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Área:</strong></td>
                  <td>${requirementData.area}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Functional Location:</strong></td>
                  <td>${requirementData.fnlocation}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Contract Operator:</strong></td>
                  <td>${requirementData.contop}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Solicitante:</strong></td>
                  <td>${requirementData.petitioner}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>N° SAP:</strong></td>
                  <td>${requirementData.sap}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Tipo de trabajo:</strong></td>
                  <td>${requirementData.type}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Tipo de levantamiento:</strong></td>
                  <td>${requirementData.objective}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Entregables esperados:</strong></td>
                  <td>${requirementData.deliverable.join(', ')}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Destinatarios:</strong></td>
                  <td>${requirementData.receiver.map(receiver => receiver.email).join(', ')}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Descripción del requerimiento:</strong></td>
                  <td>${requirementData.description}</td>
                </tr>
              </table
              <p>Para mayor información revise la solicitud en nuestra página web</p>
              <p>Saludos,<br>Procure Terreno Web</p>
              `
          }
        })
        console.log('E-mail de actualizacion enviado con éxito.')
      } catch (error) {
        console.error('Error al enviar email:', error)
        throw error
      }
    } else if (requesterRole == 3) {
      // Si el rol de quien hizo la solicitud es 3

      //Se rescatan los datos del C.Operator
      const cOperatorEmail = '' // Se selecciona el email del C.Operator



      const usersOnCopyAndMessage = getUsersOnCopyAndMessage(
        user,
        requesterRole,
        prevState,
        newState,
        cOperatorEmail,
        cOwnerEmail,
        plannerEmail,
        admContEmail,
        petitionerEmail
      )

      const onCC = usersOnCopyAndMessage.arrayCC
      const message = usersOnCopyAndMessage.message

      // Email dirigido a quien hizo la solicitud, con copia a quien corresponda
      try {
        const newDoc = {} // Se genera un elemento vacío
        const addedDoc = await addDoc(collectionRef, newDoc) // Se agrega este elemento vacío a la colección mail
        const mailId = addedDoc.id // Se obtiene el id del elemento recién agregado

        const docRef = doc(collectionRef, mailId) // Se busca la referencia del elemento recién creado con su id

        const fechaCompleta = new Date() // Constante que almacena la fecha en que se genera la solcitud

        const startDate = requirementData.start.toDate().toLocaleDateString() // Constante que almacena la fecha de inicio del levantamiento

        // Variable que almacena la fecha de término del levantamiento
        var endDate = null // Se inicializa como null
        // Si el campo existe dentro del documento
        if (requirementData.end) {
          endDate = requirementData.end.toDate().toLocaleDateString() // Se actualiza endDate con el dato existente
        } else {
          // Si el campo no existe dentro del documento
          endDate = 'Por definir' // La variable endDate queda 'Por definir'
        }

        // Variable que almacena el número de OT del levantamiento
        var otNumber = null // Se inicializa como null
        // Si el campo existe dentro del documento
        if (requirementData.ot) {
          otNumber = requirementData.ot // Se actualiza otNumber con el dato existente
        } else {
          // Si el campo no existe dentro del documento
          otNumber = 'Por definir' // La variable otNumber queda 'Por definir'
        }

        // Variable que almacena el Supervisor que estará a cargo del levantamiento
        var supervisorName = null // Se inicializa como null
        // Si el campo existe dentro del documento
        if (requirementData.supervisor) {
          supervisorName = requirementData.supervisor // Se actualiza supervisorName con el dato existente
        } else {
          // Si el campo no existe dentro del documento
          supervisorName = 'Por definir' // La variable supervisorName queda 'Por definir'
        }

        // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
        updateDoc(docRef, {
          to: requesterEmail,
          cc: onCC,
          date: fechaCompleta,
          req: requirementId,
          emailType: 'reviewDocs',
          message: {
            subject: `Solicitud de levantamiento: N°${requirementData.n_request} - ${requirementData.title}`,
            html: `
              <h2>Estimad@ ${requesterData.name}:</h2>
              <p>Con fecha ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}, ${message}. A continuación puede encontrar el detalle de la solicitud:</p>
              <table style="width:100%;">
                <tr>
                  <td style="text-align:left; padding-left:15px; width:20%;"><strong>N° Solicitud:</strong></td>
                  <td style="text-align:left; width:80%;">${requirementData.n_request}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Título:</strong></td>
                  <td>${requirementData.title}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>N° OT Procure:</strong></td>
                  <td>${otNumber}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Supervisor a cargo del levantamiento:</strong></td>
                  <td>${supervisorName}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Fecha de inicio de levantamiento:</strong></td>
                  <td>${startDate}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Fecha de término de levantamiento:</strong></td>
                  <td>${endDate}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Planta:</strong></td>
                  <td>${requirementData.plant}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Área:</strong></td>
                  <td>${requirementData.area}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Functional Location:</strong></td>
                  <td>${requirementData.fnlocation}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Contract Operator:</strong></td>
                  <td>${requirementData.contop}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Solicitante:</strong></td>
                  <td>${requirementData.petitioner}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>N° SAP:</strong></td>
                  <td>${requirementData.sap}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Tipo de trabajo:</strong></td>
                  <td>${requirementData.type}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Tipo de levantamiento:</strong></td>
                  <td>${requirementData.objective}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Entregables esperados:</strong></td>
                  <td>${requirementData.deliverable.join(', ')}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Destinatarios:</strong></td>
                  <td>${requirementData.receiver.map(receiver => receiver.email).join(', ')}</td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-left:15px;"><strong>Descripción del requerimiento:</strong></td>
                  <td>${requirementData.description}</td>
                </tr>
              </table
              <p>Para mayor información revise la solicitud en nuestra página web</p>
              <p>Saludos,<br>Procure Terreno Web</p>
              `
          }
        })
        console.log('E-mail de actualizacion enviado con éxito.')
      } catch (error) {
        console.error('Error al enviar email:', error)
        throw error
      }
    } else {
      // Si el rol de quien hizo la solicitud es cualquier otro
    }
  }
