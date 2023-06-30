/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");
// const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Llamada a functions y admin de Firebase
const functions = require('firebase-functions')
const admin = require('firebase-admin')

// Se inicializa el SDK admin de Firebase
admin.initializeApp()

// * Función que revisa la base de datos cada 60 minutos
exports.checkDatabaseEveryOneHour = functions.pubsub.schedule('every 60 minutes').onRun(async context => {
  const requestsRef = admin.firestore().collection('solicitudes') // Se llama a la colección de datos 'solicitudes' en Firestore
  const requestsSnapshot = await requestsRef.where('state', '==', 1).get() // Se llaman a los datos de la colección 'solicitudes' que están en estado 1 (en revisión por Solicitante)
  const requestsDocs = requestsSnapshot.docs // Se almacena en una constante todos los documentos que cumplen con la condición anterior

  // Se revisa cada uno de los documentos existentes en 'solicitudes'
  for (let i = 0; i < requestsDocs.length; i++) {
    const requestDoc = requestsDocs[i] // Se almacena en una constante sólo el documento actual [i]
    const requestUid = requestDoc.id // Se almacena el uid del documento en revisión

    const eventsRequestRef = requestsRef.doc(requestDoc.id).collection('events') // Se llama a la colección 'events' dentro del documento
    const eventsRequestSnapshot = await eventsRequestRef.orderBy('date', 'desc').limit(1).get() // Se llaman y ordenan los eventos por fecha y solo se toma el último evento existente
    const eventDocs = eventsRequestSnapshot.docs // Se almacena en una constante todos los eventos que cumplen con la condición anterior

    // Se revisan todos los 'events' dentro del documento
    for (let j = 0; j < eventDocs.length; j++) {
      const eventDoc = eventDocs[j] // Se almacena en una constante sólo el evento actual [j]
      const eventRequestData = eventDoc.data() // Se almacena en una constante todos los campos dentro del evento

      const eventCreationDate = eventRequestData.date.toDate() // Se almacena en una constante la fecha en que fue creado el evento

      const now = new Date() // Se almacena en una constante la fecha instantánea (ahora)

      // Si prevState es 2 (el usuario anterior es C.Opetor) && newState es 1 (el usuario actual es solicitante)
      if (eventRequestData.prevState === 2 && eventRequestData.newState === 1) {
        // Si ha pasado más de 24 horas desde la fecha del evento
        if (now - eventCreationDate > 24 * 60 * 60 * 1000) {
          // Crea un nuevo evento con un UID automático
          const newEvent = {
            date: admin.firestore.Timestamp.fromDate(now), // Se almacena la fecha en que es revisado
            newState: 4, // El newState será 4 para que lo tenga que revisar el Planificador
            prevState: 1, // El prevState es 1 porque debería haber sido revisado por el Solicitante
            user: 'admin.desarrollo@procure.cl', // Se usa el email del admin para que en el historial refleje que fue un cambio automatizado
            userName: 'admin' // Se usa "admin" para que en el historial refleje que fue un cambio automatizado
          }

          await eventsRequestRef.add(newEvent) // Se agrega el nuevo event

          await requestsRef.doc(requestUid).update({ state: newEvent.newState }) // Se actualiza el state de la solicitud

          // Se escribre en colección 'mail' el nuevo e-mail eviado de forma automática
          try {
            const requestData = requestDoc.data() // Se almacenan todos los datos de la solicitud

            const newDoc = {} // Se genera un elemento vacío
            const emailsRef = admin.firestore().collection('mail') // Se llama a la colección de datos 'mail' en Firestore
            const newEmailRef = await emailsRef.add(newDoc) // Se agrega este elemento vacío a la colección mail
            const mailId = newEmailRef.id // Se obtiene el id del elemento recién agregado

            const usersRef = admin.firestore().collection('users') // Se llama a la referencia de la colección 'users'

            const userSnapshot = await usersRef.doc(requestData.uid).get() // Se llama a los datos del 'usuario' que creó la solicitud
            const userData = userSnapshot.data() // Se almacena dentro de una variable los datos del usuario que creó la solicitud
            const userContractOperator = userData.contop // Se almacena el nombre del Contract Operator que hizo la solicitud

            const userContractOperatorSnapshot = await usersRef.where('name', '==', userContractOperator).get() // Se llama sólo al que cumple con la condición de que su name es igual al del contop del usuario que generó la solicitud
            const userContractOperatorData = userContractOperatorSnapshot.docs[0].data() // Se almacena en una constante los datos del Contract Operator
            const userContractOperatorEmail = userContractOperatorData.email // Se almacena el e-mail del Contract Operator

            const contractOwnerSnapshot = await usersRef.where('role', '==', 4).get() // Se llama sólo al que cumple con la condición de que su rol es 4 (Contract Owner)
            const contractOwnerData = contractOwnerSnapshot.docs[0].data() // Se almacena en una constante los datos del Contract Owner
            const contractOwnerEmail = contractOwnerData.email // Se almacena el e-mail del Contract Owner

            const plannerSnapshot = await usersRef.where('role', '==', 5).get() // Se llama sólo al que cumple con la condición de que su rol es 5 (Planificador)
            const plannerData = plannerSnapshot.docs[0].data() // Se almacena en una constante los datos del Planificador
            const plannerEmail = plannerData.email // Se almacena el e-mail del Planificador

            const admContratoSnapshot = await usersRef.where('role', '==', 6).get() // Se llama sólo al que cumple con la condición de que su rol es 6 (Administrador de Contrato)
            const admContratoData = admContratoSnapshot.docs[0].data() // Se almacena en una constante los datos del Administrador de Contrato
            const admContratoEmail = admContratoData.email // Se almacena el e-mail del Administrador de Contrato

            const fechaCompleta = now // Constante que almacena la fecha instantánea

            const startDate = requestData.start.toDate().toLocaleDateString('es-CL') // Constante que almacena la fecha de inicio del levantamiento

            // Variable que almacena la fecha de término del levantamiento
            var endDate = null // Se inicializa como null
            // Si el campo existe dentro del documento
            if (requestData.end) {
              endDate = requestData.end.toDate().toLocaleDateString('es-CL') // Se actualiza endDate con el dato existente
            } else {
              // Si el campo no existe dentro del documento
              endDate = 'Por definir' // La variable endDate queda 'Por definir'
            }

            // Variable que almacena el número de OT del levantamiento
            var otNumber = null // Se inicializa como null
            // Si el campo existe dentro del documento
            if (requestData.ot) {
              otNumber = requestData.ot // Se actualiza otNumber con el dato existente
            } else {
              // Si el campo no existe dentro del documento
              otNumber = 'Por definir' // La variable otNumber queda 'Por definir'
            }

            // Variable que almacena el Supervisor que estará a cargo del levantamiento
            var supervisorName = null // Se inicializa como null
            // Si el campo existe dentro del documento
            if (requestData.supervisor) {
              supervisorName = requestData.supervisor // Se actualiza supervisorName con el dato existente
            } else {
              // Si el campo no existe dentro del documento
              supervisorName = 'Por definir' // La variable supervisorName queda 'Por definir'
            }

            // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
            await emailsRef.doc(mailId).update({
              to: requestData.userEmail,
              cc: [userContractOperatorEmail, contractOwnerEmail, plannerEmail, admContratoEmail],
              date: fechaCompleta,
              req: requestUid,
              emailType: 'Over24h',
              message: {
                subject: `Solicitud de levantamiento: N°${requestData.n_request} - ${requestData.title}`,
                html: `
                  <h2>Estimad@ ${requestData.user}:</h2>
                  <p>Con fecha ${fechaCompleta.toLocaleDateString()} a las ${fechaCompleta.toLocaleTimeString()}, la revisión que estaba pendiente por su parte ha sido automáticamente aceptada dado que han pasado mas de 24 horas desde que su Contract Operator ${userContractOperator} modificó la fecha del levantamiento. A continuación puede encontrar el detalle de la solicitud:</p>
                  <ul
                    <li>N° Solicitud: ${requestData.n_request}</li>
                    <li>Título: ${requestData.title}</li>
                    <li>Número de OT Procure: ${otNumber}</li>
                    <li>Supervisor Procure a cargo del levantamiento: ${supervisorName}</li>
                    <li>Fecha de inicio de levantamiento: ${startDate}</li>
                    <li>Fecha de término de levantamiento: ${endDate}</li>
                    <li>Planta: ${requestData.plant}</li>
                    <li>Área: ${requestData.area}</li>
                    <li>Solicitante: ${requestData.petitioner}</li>
                    <li>N°SAP: ${requestData.sap}</li>
                    <li>Tipo de trabajo: ${requestData.type}</li>
                    <li>Tipo de levantamiento: ${requestData.objective}</li>
                    <li>Enrtegables esperados: ${requestData.deliverable.join(', ')}</li>
                    <li>Destinatarios: ${requestData.receiver.map(receiver => receiver.email).join(', ')}</li>
                    <li>Descripción del requerimiento: ${requestData.description}</li>
                  </ul>
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
        }
      }
    }
  }

  return null
})

// * Función que revisa la base de datos todos los días a las 6AM
exports.sendInfoToSupervisorAtSixAM = functions.pubsub
  .schedule('every day 11:07')
  .timeZone('Chile/Continental')
  .onRun(async context => {
    const now = new Date() // Se almacena la fecha instantánea
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 4, 0, 0)) // Se almacena la fecha de hoy, ajustando la hora a medianoche
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000) // Se almacena la fecha de mañana, ajustando la fecha al día siguiente

    const requestsRef = admin.firestore().collection('solicitudes') // Se llama a la referencia de Solicitudes

    const requestsSnapshot = await requestsRef.where('start', '>=', today).where('start', '<', tomorrow).get() // Busca documentos cuya fecha de inicio sea hoy

    const requestsDocs = requestsSnapshot.docs
      .filter(doc => 'supervisor' in doc.data())
      .filter(doc => doc.data().state == 6) // Se filtra requestDocs para llamar a aquellos documentos que tienen un campo 'supervisor' y que su estado sea 6 (aprobado por Procure)

    let supervisorArray = [] // Crea un array vacío para almacenar los supervisores

    // Itera sobre cada documento para encontrar los nombres de los Supervisores que tienen trabajos para hoy
    requestsDocs.forEach(doc => {
      const supervisor = doc.data().supervisor // Se almacena el nombre del Supervisor

      // Verifica si el supervisor ya existe en el array. Si no existe, lo añade.
      if (!supervisorArray.includes(supervisor)) {
        supervisorArray.push(supervisor)
      }
    })

    let todayWorks = [] // Array vacío que contendrá todos los trabajos de hoy

    // Se revisa para cada uno de los supervisores que tienen trabajos hoy (teóricamente solo debería haber 1 supervisor)
    for (let i = 0; i < supervisorArray.length; i++) {
      let supervisorTasks = [] // Array vacío que contendrá objetos, donde cada objeto contendrá el nombre del supervisor y las tareas que tiene para hoy

      // Se revisa cada uno de los documentos existentes en 'solicitudes'
      for (let j = 0; j < requestsDocs.length; j++) {
        const requestDoc = requestsDocs[j] // Se almacena el requerimiento j
        const requestDocData = requestDoc.data() // Se obtienen los datos del requerimiento j
        const requestSupervisor = requestDocData.supervisor // Se almacena el nombre del supervisor del levantamiento j

        // Si el nombre del supervisor del levantamiento j es igual al del array supervisorArray[i] se añadirá esta tarea al array
        if (supervisorArray[i] == requestSupervisor) {
          supervisorTasks.push(requestDocData)
        }
      }

      // Se define el objeto a almacenar, el cual contendrá el nombre del supervisor y las tareas que tiene este supervisor
      let supervisorWork = {
        supervisor: supervisorArray[i],
        tasks: supervisorTasks
      }

      // Añade el objeto al array todayWorks
      todayWorks.push(supervisorWork)

      // ** Empezamos a definir el e-mail

      // Se envía el email a cada uno de los supervisores que tienen levantamientos hoy, con una lista de los levantamientos respectictivos
      try {
        const newDoc = {} // Se genera un elemento vacío
        const emailsRef = admin.firestore().collection('mail') // Se llama a la colección de datos 'mail' en Firestore
        const newEmailRef = await emailsRef.add(newDoc) // Se agrega este elemento vacío a la colección mail
        const mailId = newEmailRef.id // Se obtiene el id del elemento recién agregado

        const usersRef = admin.firestore().collection('users') // Se llama a la referencia de la colección 'users'

        const supervisorSnapshot = await usersRef.where('name', '==', supervisorWork.supervisor).get() // Se llama sólo al que cumple con la condición de que su name es igual al del supervisor de la solicitud
        const supervisorData = supervisorSnapshot.docs[0].data() // Se almacena en una constante los datos del Supervisor
        const supervisorEmail = supervisorData.email // Se almacena el e-mail del Supervisor

        const plannerSnapshot = await usersRef.where('role', '==', 5).get() // Se llama sólo al que cumple con la condición de que su rol es 5 (Planificador)
        const plannerData = plannerSnapshot.docs[0].data() // Se almacena en una constante los datos del Planificador
        const plannerEmail = plannerData.email // Se almacena el e-mail del Planificador

        const admContratoSnapshot = await usersRef.where('role', '==', 6).get() // Se llama sólo al que cumple con la condición de que su rol es 6 (Administrador de Contrato)
        const admContratoData = admContratoSnapshot.docs[0].data() // Se almacena en una constante los datos del Administrador de Contrato
        const admContratoEmail = admContratoData.email // Se almacena el e-mail del Administrador de Contrato

        // Si hay mas de 1 levantamiento se escribirá 'levantamientos agendados'
        let youHaveTasks = 'levantamiento agendado'
        if (supervisorTasks.length > 1) {
          youHaveTasks = 'levantamientos agendados'
        }

        // Se define el mensaje html que contendrá, el cual será una lista con todas los levantamientos que tiene que hacer el actual Supervisor durante hoy
        const tasksHtml =
          '<ul>' +
          supervisorWork.tasks
            .map(
              (task, index) => `
        <li>
          Tarea ${index + 1}:
          <ul>
            <li>OT: ${task.ot}</li>
            <li>Título: ${task.title}</li>
            <li>Planta: ${task.plant}</li>
            <li>Solicitante: ${task.petitioner}</li>
          </ul>
        </li>
      `
            )
            .join('') +
          '</ul>'

        // Se actualiza el elemento recién creado, cargando la información que debe llevar el email
        await emailsRef.doc(mailId).update({
          to: supervisorEmail,
          cc: [plannerEmail, admContratoEmail],
          date: now,
          emailType: 'supervisorDailyTasks',
          message: {
            subject: `Resumen de hoy ${today.toLocaleDateString()} - ${supervisorWork.supervisor}`,
            html: `
              <h2>Estimad@ ${supervisorWork.supervisor}:</h2>
              <p>Usted tiene ${supervisorTasks.length} ${youHaveTasks} para hoy. A continuación se presenta el detalle de cada una de ellos:</p>
                ${tasksHtml}
              <p>Para mayor información revise la solicitud en nuestra página web</p>
              <p>Saludos,<br>Procure Terreno Web</p>
              `
          }
        })
        console.log('E-mail de tareas diarias al Supervisor enviado con éxito.')
      } catch (error) {
        console.error('Error al enviar email:', error)
        throw error
      }
    }

    return null
  })
