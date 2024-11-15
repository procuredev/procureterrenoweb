export const getEmailTemplate = (
  draftmanName,
  supervisorName,
  deliverableProcureCode
) => {
  // Generar elementos de lista para cada código en el array
  const items = deliverableProcureCode.map((code) => `<li>${code}</li>`).join("")

  return `<h2>Estimad@ ${draftmanName}:</h2>
      <p>${supervisorName} te ha seleccionado como Autor de los siguientes entregables:</p>
      <ul>
        ${items}
      </ul>
      <p>Para mayor información revise la información disponible en Gabinete en nuestra página web</p>
      <p>Saludos,<br><a href="https://www.prosite.cl/gabinete">Gabinete Prosite</a></p>`;
};
