const tableBody = (code, quantity) => {
  const date = new Date()
  const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`

  return `
<tbody>
  <tr>
    <td>Transmittal</td>
    <td>${code}</td>
    <td>Fecha</td>
    <td>${formattedDate}</td>
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
    <td>controldoc72336@procure.cl</td>
    <td>E-mail</td>
    <td>pamela.carrizo@bhp.com</td>
  </tr>
  <tr>
    <td>Cantidad de Documentos</td>
    <td>${quantity}</td>
    <td>Tipo de Archivo</td>
    <td>PDF</td>
  </tr>
</tbody>
`
}

export default tableBody
