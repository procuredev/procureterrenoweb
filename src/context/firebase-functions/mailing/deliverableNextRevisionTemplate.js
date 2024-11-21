// draftmanName es el Nombre del usuario seleccionado por el Supervisor para hacer el Entregable.
// SupervisorName es el nombre del Supervisor o usuario que asigna al Proyectista a ese Entregable.
// ot es el objeto con toda la información del Levamtamiento.
// Codes es un objeto que contiene el Código Procure(id) y Código Cliente(clientCode) del Entregable.
export const getEmailTemplate = (
  nextRevisorName,
  petitionData,
  blueprint,
  updateData
) => {

  const revisorsNames = nextRevisorName.join(', ')

  return `<h2>Estimad@ ${revisorsNames}:</h2>
      <p>Es tu turno de revisar un Entregable de la OT ${petitionData.ot}:</p>
      <ul>
        <li>Código Procure: ${blueprint.id}</li>
        <li>Código MEL: ${blueprint.clientCode}</li>
      </ul>
      <p>Para mayor información revise la información disponible en Gabinete en nuestra página web</p>
      <p>Saludos,<br><a href="https://www.prosite.cl/gabinete">Gabinete Prosite</a></p>`;
};
