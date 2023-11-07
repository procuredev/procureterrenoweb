import { useState, useEffect } from 'react'

// ** Firebase Imports
import { db } from 'src/configs/firebase'
import {
  collection,
  doc,
  Timestamp,
  query,
  getDoc,
  getDocs,
  onSnapshot,
  where,
  or,
  orderBy,
  getCountFromServer,
  documentId
} from 'firebase/firestore'

import { unixToDate } from 'src/@core/components/unixToDate'

// Librería
import { capitalize } from 'lodash'

const moment = require('moment')

// ** Trae colección de eventos
const useEvents = (id, userParam) => {
  const [data, setData] = useState([])

  useEffect(() => {
    if (userParam && id) {
      const q = query(collection(db, 'solicitudes', id, 'events'), orderBy('date', 'desc'))

      const unsubscribe = onSnapshot(q, querySnapshot => {
        try {
          const allDocs = []

          // Una llamada inicial con la devolución de llamada que proporcionas crea una instantánea del documento de inmediato con los contenidos actuales de ese documento.
          // Después, cada vez que cambian los contenidos, otra llamada actualiza la instantánea del documento.

          querySnapshot.forEach(doc => {
            allDocs.push({ ...doc.data(), id: doc.id })
          })
          setData(allDocs)
        } catch (error) {
          console.error('Error al obtener los documentos de Firestore: ', error)

          // Aquí puedes mostrar un mensaje de error
        }
      })

      // Devuelve una función de limpieza que se ejecuta al desmontar el componente
      return () => unsubscribe()
    }
  }, [userParam, id])

  return data
}

// ** Escucha cambios en los documentos en tiempo real
const useSnapshot = (datagrid = false, userParam, control = false) => {
  const [data, setData] = useState([])

  useEffect(() => {
    if (userParam) {
      let q = query(collection(db, 'solicitudes'), where('state', '>=', 0))

      if (datagrid) {
        switch (userParam.role) {
          case 2:
            q = query(collection(db, 'solicitudes'), where('uid', '==', userParam.uid))
            break
          case 3:
            q = query(collection(db, 'solicitudes'), where('plant', 'in', userParam.plant))
            break
          case 5:
            q = query(collection(db, 'solicitudes'), or(where('state', '>=', userParam.role - 2), where('state', '==', 0)))
            break
          case 7:
            q = query(collection(db, 'solicitudes'), or(where('state', '>=', 6), where('state', '==', 0)))
            break
          default:
            if ([4, 6].includes(userParam.role)) {
              q = query(collection(db, 'solicitudes'), or(where('state', '>=', userParam.role - 1), where('state', '==', 0)))
            }
            break
        }
      }

      if (control) {
        switch (userParam.role) {
          case 1:
            q = query(collection(db, 'solicitudes'), where('state', '==', 8))
            break;
          case 7:
            q = query(collection(db, 'solicitudes'), where('state', '==', 8), where('supervisorShift', '==', userParam.shift[0]))
            break;
          default:
            q = query(collection(db, 'solicitudes'), where('state', '==', 8))
            break;
        }}


      const unsubscribe = onSnapshot(q, async querySnapshot => {
        try {
          const allDocs = []

          const promises = querySnapshot.docs.map(async d => {
            const docData = d.data()
            const userSnapshot = await getDoc(doc(db, 'users', docData.uid))
            const name = userSnapshot.data() ? userSnapshot.data().name : 'No definido'
            const newDoc = { ...docData, id: d.id, name }
            allDocs.push(newDoc)
          })

          await Promise.all(promises)

          // Ordena manualmente las solicitudes por 'date' en orden descendente
          const sortedDocs = allDocs.sort((a, b) => b.date.seconds - a.date.seconds)

          setData(sortedDocs)
        } catch (error) {
          console.error('Error al obtener los documentos de Firestore: ', error)

          // Aquí puedes mostrar un mensaje de error
        }
      })

      // Devuelve una función de limpieza que se ejecuta al desmontar el componente
      return () => unsubscribe()
    }
  }, [userParam])

  return data
}

// Obtener los datos de un rol
const getRoleData = async role => {
  const docRef = doc(db, 'roles', role)
  const docSnap = await getDoc(docRef)
  let data = docSnap.data()
  data.id = docSnap.id

  return data
}

const getData = async id => {
  const docRef = doc(db, 'users', id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return docSnap.data()
  } else {
    return undefined
  }
}

// getUserData agrupa funciones relacionadas con la colección 'users'
// identifica que funcion debe ejecutar de acuerdo al parametro 'type' que se le proporcione
// recibe el parametro (userParam = {shift : ''}) para establecer el valor por defecto en caso de recibir sólo los parametros type y plant.
const getUserData = async (type, plant, userParam = { shift: '', name: '' }) => {
  const coll = collection(db, 'users') // Crear una referencia a la colección 'users' en la base de datos
  let allDocs = [] // Arreglo para almacenar los documentos extendidos

  // Mapa de consultas según el tipo
  const queryMap = {
    // Si se proporciona el turno, obtener usuarios solicitantes con el turno opuesto, de lo contrario, obtener usuarios Contrac Operator
    getUsers: () =>
      userParam.shift !== ''
        ? query(
            coll,
            where('plant', 'array-contains-any', plant),
            where('shift', '!=', userParam.shift),
            where('role', '==', 2)
          )
        : query(coll, where('plant', 'array-contains', plant), where('role', '==', 3)),
    getAllPlantUsers: () => query(coll, where('plant', 'array-contains', plant)),
    getAllProcureUsers: () => query(coll, where('company', '==', 'Procure')),
    getUserProyectistas: () => query(coll, where('role', '==', 8), where('shift', 'array-contains', userParam.shift[0])),
    getPetitioner: () => query(coll, where('plant', 'array-contains', plant)),
    getReceiverUsers: () => query(coll, where('plant', 'array-contains', plant), where('role', '==', 2)),
    getUsersByRole: () => query(coll, where('role', '==', userParam.role))
  }

  const queryFunc = queryMap[type] // Obtener la función de consulta según el tipo

  if (!queryFunc) {
    throw new Error(`Invalid type: ${type}`)
  }

  try {
    // Obtener los documentos según la función de consulta y realizar la consulta
    const querySnapshot = await getDocs(queryFunc())

    // Iterar a través de los resultados de la consulta y construir el arreglo de usuarios extendidos
    querySnapshot.forEach(doc => {
      // Construir el objeto de usuario según el tipo y sus datos
      const userObj =
        type === 'getUserProyectistas'
          ? doc.data().urlFoto
            ? {
                userId: doc.id,
                name: doc.data().name,
                avatar: doc.data().urlFoto
              }
            : {
                userId: doc.id,
                name: doc.data().name
              }
          : type === 'getReceiverUsers'
          ? {
              id: doc.id,
              name: doc.data().name,
              email: doc.data().email,
              phone: doc.data().phone
            }
          : {
              ...doc.data(),
              id: doc.id
            }
      allDocs.push(userObj) // Agregar el objeto de usuario al arreglo
    })

    if (type === 'getPetitioner') {
      // Verificar el tipo de usuario actual y agregarlo al arreglo si corresponde
      if (userParam.name) {
        const querySnapshot = await getDocs(query(coll, where('name', '==', userParam.name)))

        if (!querySnapshot.empty) {
          const docSnapshot = querySnapshot.docs[0]

          return { email: docSnapshot.data().email, phone: docSnapshot.data().phone }
        }

        return null // Devolver nulo si no se encuentra el documento
      } else if (userParam.plant === 'allPlants') {
        const allDocsFiltered = allDocs.filter(doc => doc.role === 2)

        return allDocsFiltered
      } else if (userParam.role === 3) {
        return allDocs
      } else if (userParam.id) {
        const docRef = doc(db, 'users', userParam.id)
        const docSnapshot = await getDoc(docRef)

        if (docSnapshot.exists()) {
          allDocs.push({ ...docSnapshot.data(), id: docSnapshot.id })
        }

        return allDocs
      }
    }

    return allDocs // Retornar el arreglo de usuarios extendidos
  } catch (error) {
    console.error('Error fetching documents:', error)

    return null // En caso de error, retornar nulo
  }
}

// Consultar si existen solicitudes para una fecha específica
const dateWithDocs = async date => {
  const allDocs = []

  //const dateUnix = getUnixTime(date) // Convierte la fecha a segundos Unix
  const q = query(collection(db, 'solicitudes'), where('start', '==', new Timestamp(date, 0)))
  const querySnapshot = await getDocs(q)
  querySnapshot.forEach(doc => {
    // doc.data() is never undefined for query doc snapshots
    allDocs.push({ ...doc.data(), id: doc.id })
  })

  if (allDocs.length === 0) {
    return
  }

  return `La fecha que está tratando de agendar tiene ${allDocs.length} Solicitudes. Le recomendamos seleccionar otro día`
}

// Consultar si un día está bloqueado en la base de datos
const consultBlockDayInDB = async date => {
  const startOfDay = moment(date).startOf('day').unix().toString()
  const endOfDay = moment(date).endOf('day').unix().toString()

  const docRef = collection(db, 'diasBloqueados')

  const querySnapshot = await getDocs(
    query(docRef, where(documentId(), '>=', startOfDay), where(documentId(), '<=', endOfDay))
  )

  if (!querySnapshot.empty) {
    // Si hay resultados, al menos un timestamp abarca todo el día
    const blockedDoc = querySnapshot.docs.find(doc => doc.data().blocked)

    if (blockedDoc) {
      const data = blockedDoc.data()

      return { msj: `El día que has seleccionado está bloqueado, motivo: ${data.cause}`, blocked: true }
    } else {
      let msj = await dateWithDocs(date / 1000)

      return { msj, blocked: false }
    }
  } else {
    let msj = await dateWithDocs(date / 1000)

    return { msj, blocked: false }
  }
}

// Consultar si existe un número SAP en la base de datos de solicitudes
const consultSAP = async sap => {
  // Definir la consulta con una condición de igualdad en el campo 'sap' y ordenar por fecha descendente
  const sapQuery = query(collection(db, `solicitudes`), where('sap', '==', sap), orderBy('date', 'desc'))

  // Obtener los documentos que coinciden con la consulta
  const sapQuerySnapshot = await getDocs(sapQuery)

  // Obtener la lista de documentos
  const sapDocs = sapQuerySnapshot.docs

  // Verificar si existen documentos en 'sapDocs'
  if (sapDocs.length > 0) {
    // Arreglos para almacenar las solicitudes con y sin OT asignadas
    let sapWithOt = []
    let sap = []
    let messages
    let otMessages

    // Recorrer cada documento y obtener información adicional del usuario asociado
    await Promise.all(
      sapDocs.map(async docItem => {
        // Obtener la referencia del usuario asociado al documento
        const userRef = doc(db, 'users', docItem.data().uid)
        const userQuerySnapshot = await getDoc(userRef)
        const author = userQuerySnapshot.data().name

        if (docItem.data().ot) {
          // Si el documento tiene una OT asignada, agregarlo al arreglo 'sapWithOt'
          sapWithOt.push({
            title: docItem.data().title,
            author,
            ot: docItem.data().ot,
            date: unixToDate(docItem.data().date.seconds)[0],
            objective: docItem.data().objective
          })
        } else {
          // Si el documento no tiene una OT asignada, agregarlo al arreglo 'sap'
          sap.push({
            title: docItem.data().title,
            author,
            date: unixToDate(docItem.data().date.seconds)[0],
            objective: docItem.data().objective
          })
        }
      })
    )

    if (sap.length > 0) {
      // Si hay solicitudes con OT asignadas, retornar un objeto con información detallada
      messages = sap
        .map(
          item =>
            `Título: ${item.title}\n Solicitante: ${item.author}\n Fecha de solicitud: ${item.date}\n Tipo de Levantamiento: ${item.objective}\n`

          // Si todas las solicitudes están en revisión sin OT asignada, retornar un objeto con información detallada
        )
        .join('\n')
    }

    if (sapWithOt.length > 0) {
      otMessages = sapWithOt
        .map(
          item =>
            `Título: ${item.title}\n OT: ${item.ot}\n Solicitante: ${item.author}\n Fecha de solicitud: ${item.date}\n Tipo de Levantamiento: ${item.objective}\n`
        )
        .join('\n')
    }

    if (sapWithOt.length > 0 && sap.length > 0) {
      return {
        exist: true,
        sap,
        sapWithOt,
        msj:
          `Existen ${sap.length + sapWithOt.length} solicitudes con este número SAP, de las cuales ${
            sapWithOt.length
          } tienen OT asignadas y ${sap.length} están en revisión:\n\n` +
          otMessages +
          `\n` +
          messages
      }
    } else if (sapWithOt.length > 0 && sap.length === 0) {
      return {
        exist: true,
        sapWithOt,
        msj: `Existen ${sap.length + sapWithOt.length} solicitudes con este número SAP, de las cuales ${
          sapWithOt.length
        } tienen OT asignadas:\n\n` + otMessages
      }
    } else {
      return {
        exist: true,
        sap,
        msj:
          `Existen ${sap.length} solicitudes con este número SAP que se encuentran en revisión para ser aprobadas:\n\n` +
          messages
      }
    }
  } else {
    // Si no hay documentos con el número SAP, retornar un objeto indicando que es un nuevo número SAP
    return { exist: false, msj: 'Nuevo número SAP registrado' }
  }
}

// Consulta si un correo electrónico existe en la base de datos
const consultUserEmailInDB = async email => {
  // Definir la consulta con una condición de igualdad en el campo 'email'
  const q = query(collection(db, 'users'), where('email', '==', email))

  // Obtener los documentos que coinciden con la consulta
  const emailQuerySnapshot = await getDocs(q)

  // Obtener la lista de documentos
  const emailDocs = emailQuerySnapshot.docs

  // Crear un arreglo para almacenar todos los documentos
  let allDocs = []

  // Recorrer cada documento y agregarlo al arreglo 'allDocs'
  emailDocs.forEach(doc => {
    allDocs.push({ ...doc.data(), id: doc.id })
  })

  // Verificar si existen documentos en 'allDocs'
  if (allDocs.length > 0) {
    // Si hay al menos un documento, lanzar un error indicando que el correo está registrado
    throw new Error(`El correo ${email} se encuentra registrado.`)
  } else {
    // Si no hay documentos, retornar verdadero indicando que el correo no está registrado
    return true
  }
}

const consultDocs = async (type, options = {}) => {
  const coll = collection(db, 'solicitudes');

  try {
    switch (type) {
      case 'all':
        const qAll = query(coll);
        const snapshotAll = await getDocs(qAll);

        return snapshotAll.size;

      case 'byPlants':
        const resultsByPlants = await Promise.all(
          options.plants.map(async plant => {
            const qPlant = query(coll, where('plant', '==', plant));
            const snapshotPlant = await getDocs(qPlant);

            return snapshotPlant.size;
          })
        );

        return resultsByPlants;

      case 'byState':
        const states = [[1, 5], [6, 9], [10, 10]];

        const resultsByState = await Promise.all(
          states.map(async ([start, end]) => {
            const qState = query(coll, where('state', '>=', start), where('state', '<=', end));
            const snapshotState = await getDocs(qState);

            return snapshotState.size;
          })
        );

        return resultsByState;

      default:
        throw new Error(`Invalid type: ${type}`);
    }
  } catch (error) {
    console.error('Error fetching document counts:', error);

    return null;
  }
};

const fetchPlaneProperties = async () => {
  const docRef = doc(db, 'domain', 'blueprintProcureProperties');
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const resDeliverables = await docSnap.data().deliverables
    const resDisciplines = await docSnap.data().disciplines


    return {resDeliverables, resDisciplines }
  } else {
    console.log('El documento no existe');
  }
};

const fetchPetitionById = async id => {
  const docRef = doc(db, 'solicitudes', id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id }
  } else {
    return undefined
  }
}

const consultObjetives = async (type, options = {}) => {
  const coll = collection(db, 'solicitudes')
  let queryFunc

  switch (type) {
    case 'all':
      // Consulta para obtener el total de documentos con estado mayor o igual a 6
      queryFunc = async () => {
        const q = query(coll, where('state', '>=', 6))
        const snapshot = await getCountFromServer(q)

        return snapshot.data().count
      }
      break

    case 'week':
      // Consulta para obtener el número de documentos por día de la semana en la semana actual
      queryFunc = async () => {
        const startDate = moment().startOf('isoWeek').toDate()
        const endDate = moment().endOf('isoWeek').toDate()
        const documentsByDay = Array(7).fill(0)
        const q = query(coll, where('state', '>=', 6))
        const snapshot = await getDocs(q)

        snapshot.forEach(doc => {
          const start = doc.data().start.toDate()
          const dayOfWeek = moment(start).isoWeekday()
          if (moment(start).isSameOrAfter(startDate) && moment(start).isSameOrBefore(endDate)) {
            documentsByDay[dayOfWeek - 1]++
          }
        })

        return documentsByDay
      }
      break

    case 'lastSixMonths':
      // Consulta para obtener el número de documentos en los últimos seis meses
      queryFunc = async () => {
        const currentDate = moment()
        const monthsData = []
        const queries = []

        for (let i = 0; i < 6; i++) {
          const monthStartDate = currentDate.clone().subtract(i, 'months').startOf('month').toDate()
          const monthEndDate = currentDate.clone().subtract(i, 'months').endOf('month').toDate()

          const q = query(coll, where('start', '>=', monthStartDate), where('start', '<=', monthEndDate))
          queries.push(getDocs(q))
        }

        const snapshots = await Promise.all(queries)

        snapshots.forEach((snapshot, index) => {
          const filteredDocs = snapshot.docs.filter(doc => doc.data().state >= 6)
          const cant = filteredDocs.length
          const monthStartDate = currentDate.clone().subtract(index, 'months').startOf('month')
          const month = capitalize(monthStartDate.locale('es').format('MMM'))
          monthsData.unshift({ month, cant })
        })

        return monthsData
      }
      break

    case 'byPlants':
      // Consulta para obtener el número de documentos por planta
      queryFunc = async () => {
        const queries = options.plants.map(async plant => {
          const query1 = query(coll, where('plant', '==', plant), where('state', '>=', 6))
          const query2 = query(coll, where('plant', '==', plant), where('state', '==', 7))

          const snapshot1 = await getDocs(query1)
          const snapshot2 = await getDocs(query2)

          return {
            query1: snapshot1.size,
            query2: snapshot2.size
          }
        })
        const results = await Promise.all(queries)

        return results
      }
      break

    case 'byState':
      // Consulta para obtener el número de documentos por estado
      queryFunc = async () => {
        const q1 = query(coll, where('state', '==', 6))
        const q2 = query(coll, where('state', '==', 7))
        const q3 = query(coll, where('state', '>=', 8), where('state', '<', 10))
        const queryAllStates = [q1, q2, q3]

        const snapshots = await Promise.all(queryAllStates.map(getCountFromServer))
        const documentsByState = snapshots.map(snapshot => snapshot.data().count)

        return documentsByState
      }
      break

    default:
      // Lanzar un error si el tipo no es válido
      throw new Error(`Invalid type: ${type}`)
  }

  return queryFunc()
}

const getUsersWithSolicitudes = async () => {
  const collSolicitudes = collection(db, 'solicitudes') // Obtener referencia a la colección 'solicitudes'
  const qSolicitudes = query(collSolicitudes) // Consulta para obtener todas las solicitudes
  const solicitudesSnapshot = await getDocs(qSolicitudes) // Obtener los documentos de las solicitudes

  const solicitudesByUser = {} // Objeto para almacenar el número de solicitudes por usuario

  // Recorrer los documentos de las solicitudes
  solicitudesSnapshot.forEach(doc => {
    const { uid } = doc.data()
    if (uid) {
      // Si el usuario ya tiene solicitudes, incrementar el contador
      if (solicitudesByUser[uid]) {
        solicitudesByUser[uid].docs++
      } else {
        // Si es la primera solicitud del usuario, inicializar el contador
        solicitudesByUser[uid] = {
          id: uid,
          docs: 1
        }
      }
    }
  })

  const sortedUsers = Object.values(solicitudesByUser).sort((a, b) => b.docs - a.docs) // Ordenar los usuarios por cantidad de solicitudes (de mayor a menor)
  const limitedUsers = sortedUsers.slice(0, 10) // Limitar la cantidad de usuarios a 10

  // Consulta adicional a la colección 'users'
  const collUsers = collection(db, 'users') // Obtener referencia a la colección 'users'
  const usersSnapshot = await getDocs(collUsers) // Obtener los documentos de la colección 'users'

  // Mapear los usuarios limitados con sus propiedades
  const usersWithProperties = limitedUsers.map(user => {
    const userSnapshot = usersSnapshot.docs.find(doc => doc.id === user.id) // Encontrar el documento del usuario en el snapshot
    // Si se encontró el usuario en la colección 'users'
    if (userSnapshot) {
      const userData = userSnapshot.data()

      if (userData.urlFoto) {
        return {
          ...user,
          name: userData.name,
          plant: userData.plant,
          avatarSrc: userData.urlFoto
        }
      } else {
        return {
          ...user,
          name: userData.name,
          plant: userData.plant
        }
      }
    } else {
      // Si no se encontró el usuario en la colección 'users', retornar el objeto original
      return user
    }
  })

  return usersWithProperties
}

export {
  useEvents,
  useSnapshot,
  getData,
  getUserData,
  getRoleData,
  consultBlockDayInDB,
  consultSAP,
  consultUserEmailInDB,
  consultDocs,
  consultObjetives,
  getUsersWithSolicitudes,
  fetchPetitionById,
  fetchPlaneProperties
}
