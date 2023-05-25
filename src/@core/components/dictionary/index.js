const dictionary = {
  1: { name: 'Admin', title: 'En revisión', details: 'En espera de revisión por Contract Operator', color: 'warning' },
  2: { name: 'Solicitante', title: 'En revisión', details: 'En espera de revisión por Contract Operator', color: 'warning' },
  3: { name: 'Contract Operator', title: 'En revisión', details: 'En espera de revisión por Contract Owner', color: 'warning' },
  4: { name: 'Contract Owner', title: 'En revisión', details: 'En espera de revisión por Planificador', color: 'warning' },
  5: { name: 'Planificador', title: 'En revisión', details: 'En espera de revisión por Adm. Contrato', color: 'warning' },
  6: { name: 'Adm. Contrato', title: 'Aprobado', details: 'En espera de revisión por Supervisor', color: 'warning' },
  7: { name: 'Supervisor', title: 'Aprobado', details: 'Aprobado por supervisor', color: 'primary' },
  8: { name: 'Proyectista', title: 'Aprobado', details: 'Aprobado por supervisor', color: 'primary' },
  9: { name: 'Gerente', title: 'Aprobado', details: 'Aprobado por supervisor', color: 'primary' },
  10: { name: 'Rechazado', title: 'Rechazado', details: 'Rechazado', color: 'error' },
  100: { name: 'Cargando...', title: 'Cargando...', details: 'No disponible', color: 'primary' }
}

export default dictionary
