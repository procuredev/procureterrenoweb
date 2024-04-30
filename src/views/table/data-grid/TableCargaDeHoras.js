import React, { useState, useEffect } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'

const TableCargaDeHoras = ({ rows, role, otOptions, createWeekHoursByType, updateWeekHoursByType }) => {
  const [open, setOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState({})

  const handleOpenDialog = () => setOpen(true)
  const handleCloseDialog = () => setOpen(false)

  const handleCreate = async () => {
    const result = await createWeekHoursByType({
      actualWeek: '2024-17',
      userID: 'user123',
      inputHoursType: 'OT',
      plant: 'Planta1',
      type: 'Levantamiento',
      otNumber: '1234',
      userUid: 'user123'
    })
    console.log(result)
    handleCloseDialog()
  }

  const handleUpdate = async () => {
    const result = await updateWeekHoursByType('2024-17', 'user123', [
      { docID: selectedRow.id, updates: [{ hoursWorked: 8, day: 'week[0]' }] }
    ])
    console.log(result)
  }

  const columns = [
    { field: 'ot', headerName: 'OT', width: 130 },
    { field: 'type', headerName: 'Type', width: 130 },
    { field: 'hoursWorked', headerName: 'Hours Worked', width: 130, editable: true }
  ]

  return (
    <div style={{ height: 400, width: '100%' }}>
      <Button onClick={handleOpenDialog}>Agregar Nueva Fila</Button>
      <Button onClick={handleUpdate}>Actualizar Tabla</Button>
      <DataGrid rows={rows} columns={columns} onCellEditCommit={params => setSelectedRow(params)} />
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>Agregar Nueva Hora</DialogTitle>
        <DialogContent>
          <TextField label='OT' variant='outlined' fullWidth />
          <TextField label='Hours' variant='outlined' fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreate}>Crear</Button>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default TableCargaDeHoras
