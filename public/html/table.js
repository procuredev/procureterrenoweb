
// HTML boilerplate
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Table</title>
</head>
<body>
<table id="table">
<tbody>
  <tr>
    <td}>Transmittal</td>
    <td>21286-000-TT-535</td>
    <td>Fecha</td>
    <td>01-09-2023</td>
  </tr>
  <tr>
    <td>N° Contrato</td>
    <td colspan="3">9100072336</td>
  </tr>
  <tr>
    <td>N° Proyecto</td>
    <td colspan="3">21286 // Contrato Marco Levantamientos Plantas - MEL   </td>
  </tr>
  <tr>
    <td>De</td>
    <td>Control Documentos</td>
    <td>Para</td>
    <td>Pamela Carrizo</td>
  </tr>
  <tr>
    <td>Dirección</td>
    <td>Carmencita 25 - Oficina 22</td>
    <td>Dirección</td>
    <td>N/A</td>
  </tr>
  <tr>
    <td>Fono</td>
    <td>+562 2228 9622</td>
    <td>Fono</td>
    <td>N/A</td>
  </tr>
  <tr>
    <td>E-mail</td>
    <td>Controldoc72336@procure.cl</td>
    <td>E-mail</td>
    <td>Pamela.carrizo@bhp.com</td>
  </tr>
  <tr>
    <td>Cantidad de Documentos</td>
    <td>1</td>
    <td>Tipo de Archivo</td>
    <td>PDF</td>
  </tr>
</tbody>
</table>
</body>
</html>
`;

// Create a new DOMParser
const parser = new DOMParser();

// Use the DOMParser to parse the HTML string into a Document object
const doc = parser.parseFromString(html, 'text/html');

// Get a reference to the table element
const tableElement = doc.getElementById("table");

export default tableElement;
