﻿import { jsPDF } from 'jspdf'

var font =

var callAddRegular = function () {
  this.addFileToVFS('calibri-normal.ttf', font)
  this.addFont('calibri-normal.ttf', 'Calibri', 'normal')
}
jsPDF.API.events.push(['addFonts', callAddRegular])

module.exports = callAddRegular;