const generateFilterConfig = (authUser, otherWeek) => {
  return {
    all: {
      label: 'Todas las solicitudes',
      canSee: [],
      type: 'General', // Ejemplo de números permitidos para ver este filtro
      filterFunction: doc => true // Mostrar todos los documentos
    },
    pendingApproval: {
      label: 'Por aprobar',
      canSee: [2, 3, 5], // Ejemplo de números permitidos para ver este filtro
      type: 'Estado',
      filterFunction: authUser.role === 5 ? doc => doc.state === 3 || 4 : doc => doc.state === authUser.role - 1
    },
    approved: {
      label: 'Aprobadas',
      canSee: [1, 2, 3], // Ejemplo de números permitidos para ver este filtro
      type: 'Estado',
      filterFunction: doc => doc.state >= 6 && doc.state < 10
    },
    rejected: {
      label: 'Rechazadas',
      canSee: [3, 4, 5], // Ejemplo de números permitidos para ver este filtro
      type: 'Estado',
      filterFunction: doc => doc.state === 10
    },
    inReviewByMEL: {
      label: 'En revisión por MEL',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'Estado',
      filterFunction: doc => doc.state === 2
    },
    inReviewByProcure: {
      label: 'En revisión por Procure',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'Estado',
      filterFunction: doc => doc.state === 5
    },
    approvedByMEL: {
      label: 'Aprobadas por MEL',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'Estado',
      filterFunction: doc => doc.state === 4
    },
    approvedByProcure: {
      label: 'Aprobadas por Procure',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'Estado',
      filterFunction: doc => doc.state >= 6 && doc.state < 10
    },
    myRequests: {
      label: 'Mis solicitudes',
      canSee: [1, 2, 3],
      type: 'Autor',
      filterFunction: doc => doc.uid === authUser.uid
    },
    withOT: {
      label: 'Tiene OT',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'OT',
      filterFunction: doc => doc.hasOwnProperty('ot')
    },
    withoutOT: {
      label: 'Sin OT',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'OT',
      filterFunction: doc => !doc.hasOwnProperty('ot')
    },
    shiftA: {
      label: 'Turno P',
      canSee: [1, 2, 3, 4, 5, 6, 9],
      type: 'Turno',
      filterFunction: doc => otherWeek(doc.start.seconds)
    },
    shiftB: {
      label: 'Turno Q',
      canSee: [1, 2, 3, 4, 5, 6, 9],
      type: 'Turno',
      filterFunction: doc => !otherWeek(doc.start.seconds)
    },
    myWeek: {
      label: 'Aprobadas por Procure en mi semana',
      type: 'General',
      canSee: [1, 7],
      filterFunction: Boolean(authUser.shift === 'A') ? doc => otherWeek(doc.start.seconds) : doc => !otherWeek(doc.start.seconds)
    }
  }
}

export default generateFilterConfig
