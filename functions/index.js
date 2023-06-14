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

// Función que revisa la base de datos cada 1 minuto
exports.checkDatabaseEveryMinute = functions.pubsub.schedule('every 1 minutes').onRun(async context => {
  const mensajesRef = admin.firestore().collection('mensajes')
  const mensajesSnapshot = await mensajesRef.get()

  mensajesSnapshot.forEach(async doc => {
    const uid = doc.id
    const eventsRef = mensajesRef.doc(uid).collection('events')

    // Se ordenan los eventos por fecha y solo se toma el último evento existente
    const eventsSnapshot = await eventsRef.orderBy('date', 'desc').limit(1).get()

    eventsSnapshot.forEach(async eventDoc => {
      const data = eventDoc.data()
      const date = data.date.toDate()
      const ahora = new Date()

      // Si prevState es 3 (el usuario anterior es C.Opetor) && newState es 2 (el usuario actual es solicitante)
      if (data.prevState === 3 && data.newState === 2) {
        // Si ha pasado más de 3 minutos desde la fecha del evento
        if (ahora - date > 3 * 60 * 1000) {
          // Crea un nuevo evento con un UID automático
          const newEvent = {
            date: admin.firestore.Timestamp.fromDate(ahora),
            newState: 5,
            prevState: data.newState,
            user: data.user, // Este debería ser reemplazado por "admin" para que en el historial refleje que fue un cambio automatizado
            userName: data.userName, // Este debería ser reemplazado por "admin" para que en el historial refleje que fue un cambio automatizado
            prevDoc: '' // Manejar correctamente este campo según tus requerimientos
          }

          // Se agrega el nuevo event
          await eventsRef.add(newEvent)

          //se actualiza el state de la solicitud
          await mensajesRef.doc(uid).update({ state: newEvent.newState })
        }
      }
    })
  })

  return null
})
