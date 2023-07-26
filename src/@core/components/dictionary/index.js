const dictionary = {
  0: { name: 'Admin', title: 'En revisión', longTitle: 'En revisión', details: 'En espera de revisión por Solicitante', color: 'warning' }, // Blanco
  1: { name: 'Admin', title: 'En revisión', longTitle: 'En revisión', details: 'En espera de revisión por Solicitante', color: 'warning' }, // Naranaja
  2: { name: 'Solicitante', title: 'En revisión', longTitle: 'En revisión por MEL', details: 'En espera de revisión por Contract Operator', color: 'primary'}, // Verde
  3: { name: 'Contract Operator', title: 'En revisión', longTitle: 'En revisión por Procure', details: 'En espera de revisión por Contract Owner', color: 'primary'}, // Verde
  4: { name: 'Contract Owner', title: 'En revisión', longTitle: 'En revisión', details: 'En espera de revisión por Planificador', color: 'primary'}, // Verde
  5: { name: 'Planificador',title: 'En revisión', longTitle: 'En revisión por Procure', details: 'En espera de revisión por Administrador de Contrato', color: 'primary'}, // Verde
  6: { name: 'Administrador de Contrato', title: 'Agendado', longTitle: 'Aprobado por Procure', details: 'En espera de asignación de Proyectistas', color: 'primary' }, // Verde
  7: { name: 'Supervisor', title: 'En levantamiento', longTitle: 'Proyectistas asignados', details: 'En espera de término del levantamiento', color: 'primary' }, // Verde
  8: { name: 'Proyectista', title: 'Levantamiento terminado', longTitle: 'Levantamiento terminado', details: 'Aprobado por supervisor', color: 'primary' }, // Amarillo
  9: { name: 'Gerente', title: 'Finalizado', longTitle: 'Documentos entregados', details: 'Aprobado por supervisor', color: 'primary' }, // Amarillo
  10: { name: 'Rechazado', title: 'Rechazado', longTitle: 'Rechazado', details: 'Rechazado', color: 'secondary' }, // Gris
  100: { name: 'Cargando...', title: 'Cargando...', longTitle: 'Cargando...', details: 'No disponible', color: 'primary' } // Blanco
}

export default dictionary
