// primary -> verde procure
// secondary -> gris procure
// success -> verde
// error -> rojo
// warning -> amarillo
// info -> celeste
// grey -> no usar
// orange -> custom naranjo (definido en: src/layouts/UserThemeOptions.js)
// black -> custom negro (definido en: src/layouts/UserThemeOptions.js)
// white -> custom blanco (definido en: src/layouts/UserThemeOptions.js)
// yello -> custom amarillo (definido en: src/layouts/UserThemeOptions.js)
const dictionary = {
  0: { name: 'Rechazado', title: 'Rechazado', longTitle: 'Rechazado', details: 'Rechazado', color: 'secondary' }, // Gris
  1: {
    name: 'Devuelto',
    title: 'Devuelto',
    longTitle: 'Devuelto para revisión',
    details: 'Devuelto a Solicitante para revisión',
    color: 'orange'
  }, // Naranaja
  2: {
    name: 'Solicitante',
    title: 'En revisión',
    longTitle: 'En revisión por MEL',
    details: 'En espera de revisión por Contract Operator',
    color: 'info'
  }, // Azul
  3: {
    name: 'Contract Operator',
    title: 'En revisión',
    longTitle: 'En revisión por Procure',
    details: 'En espera de revisión por Planificador',
    color: 'info'
  }, // Azul
  4: {
    name: 'Contract Owner',
    title: 'En revisión',
    longTitle: 'En revisión por Procure',
    details: 'En espera de revisión por Planificador',
    color: 'info'
  }, // Azul
  5: {
    name: 'Planificador',
    title: 'En revisión',
    longTitle: 'En revisión por Procure',
    details: 'En espera de revisión por Administrador de Contrato',
    color: 'info'
  }, // Azul
  6: {
    name: 'Administrador de Contrato',
    title: 'Agendado',
    longTitle: 'Aprobado por Procure',
    details: 'En espera de asignación de Proyectistas',
    color: 'primary'
  }, // Verde
  7: {
    name: 'Supervisor',
    title: 'En levantamiento',
    longTitle: 'Proyectistas asignados',
    details: 'En espera de término del Levantamiento',
    color: 'primary'
  }, // Verde
  8: {
    name: 'Proyectista',
    title: 'En confección de entregables',
    longTitle: 'En confección de entregables',
    details: 'En confección de entregables',
    color: 'yellow'
  }, // Amarillo
  9: {
    name: 'Gerente',
    title: 'Finalizado',
    longTitle: 'Documentos entregados',
    details: 'Documentos entregados',
    color: 'yellow'
  }, // Amarillo
  100: { name: 'Cargando...', title: 'Cargando...', longTitle: 'Cargando...', details: 'No disponible', color: 'white' } // Blanco
}

export default dictionary
