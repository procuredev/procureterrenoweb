﻿import { jsPDF } from 'jspdf'

var font =

var callAddBold = function () {
  this.addFileToVFS('calibri-bold.ttf', font)
  this.addFont('calibri-bold.ttf', 'Calibri', 'bold')
}
jsPDF.API.events.push(['addFonts', callAddBold])

module.exports = callAddBold;