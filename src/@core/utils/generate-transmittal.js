import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import base64Image from 'src/views/pages/gabinete/base64Image'
import base64MEL from 'src/views/pages/gabinete/base64MEL'

const callAddRegular = require('public/fonts/calibri-normal.js')
const callAddBold = require('public/fonts/calibri-bold.js')

export const generateTransmittal = (tableElement, selected) => {
  const doc = new jsPDF()

  callAddRegular.call(doc)
  callAddBold.call(doc)

  doc.setFont('Calibri', 'normal')
  doc.setFontSize(11)

  doc.addImage(base64Image, 'PNG', 15, 10, 50, 20, undefined, 'FAST')
  doc.addImage(base64MEL, 'PNG', 140, 23, 50, 4.15, undefined, 'FAST')
  // Define las columnas de la tabla
  const columns = ['ÍTEM', 'CÓDIGO CLIENTE', 'DESCRIPCIÓN', 'REV']
  // Define las filas de la tabla
  let rows = []

  const data = Array.from(selected).map(([key, value], index) => {
    if (value.storageBlueprints) {
      // Divide la URL en segmentos separados por '%2F'
      const urlSegments = value.storageBlueprints[0].split('%2F')

      // Obtiene el último segmento, que debería ser el nombre del archivo
      const encodedFileName = urlSegments[urlSegments.length - 1]

      // Divide el nombre del archivo en segmentos separados por '?'
      const fileNameSegments = encodedFileName.split('?')

      // Obtiene el primer segmento, que debería ser el nombre del archivo
      const fileName = decodeURIComponent(fileNameSegments[0])

      rows = [index+1, value.id, value.description, value.revision]
    } else {
      // Devuelve valores predeterminados o vacíos para los objetos que no tienen `storageBlueprints`
      rows = [index+1, value.id, value.description, value.revision]
    }

    return rows
  })

  doc.autoTable({
    startY: 50,
    html: tableElement,
    theme: 'plain',
    styles: {
      font: 'Calibri',
      cellPadding: 1,
      lineColor: 'black',
      lineWidth: 0.1
    },
    columnStyles: {
      0: { fillColor: [191, 191, 191] },
      2: { fillColor: [191, 191, 191] }
    }
  })

  doc.text(
    'Sírvase recibir adjunto (1) copia(s) de los entregables que lista a continuación',
    15,
    doc.lastAutoTable.finalY + 10
  )

  // Agrega la tabla al documento
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [columns],
    body: data,
    theme: 'plain',
    styles: {
      font: 'Calibri',
      halign: 'center',
      lineColor: 'black',
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [191, 191, 191]
    }
  })

  doc.setFont('Calibri', 'bold')
  doc.text(
    '1. Como acuso de su recepción, devuelva una copia de esta firmada a Procure – Administrador de Contrato',
    15,
    doc.lastAutoTable.finalY + 10
  )

  const signatureY = doc.lastAutoTable.finalY + 40

  doc.autoTable({
    startY: signatureY,
    body: [['Control Documentos Servicios Procure SpA']],
    useCss: true,
    styles: {
      font: 'Calibri',
      fontStyle: 'bold',
      valign: 'bottom',
      halign: 'center',
      lineColor: 'black',
      lineWidth: 0.1,
      minCellHeight: 30
    },
    margin: { left: 35, right: 120 }
  })

  doc.autoTable({
    startY: signatureY,
    body: [['Receptor']],
    useCss: true,
    styles: {
      font: 'Calibri',
      fontStyle: 'bold',
      valign: 'bottom',
      halign: 'center',
      lineColor: 'black',
      lineWidth: 0.1,
      minCellHeight: 30
    },
    margin: { left: 120, right: 35 }
  })

  // Descarga el documento
  doc.save('documento.pdf')
}
