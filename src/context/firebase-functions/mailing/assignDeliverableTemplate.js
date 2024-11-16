export const getEmailTemplate = (
  draftmanName,
  supervisorName,
  ot,
  codes
) => {

  return `<h2>Estimad@ ${draftmanName}:</h2>
      <p>${supervisorName} te ha seleccionado como Autor de un entregable de la OT ${ot.ot}:</p>
      <ul>
        <li>Código Procure: ${codes.id}</li>
        <li>Código MEL: ${codes.clientCode}</li>
      </ul>
      <p>Para mayor información revise la información disponible en Gabinete en nuestra página web</p>
      <p>Saludos,<br><a href="https://www.prosite.cl/gabinete">Gabinete Prosite</a></p>`;
};
