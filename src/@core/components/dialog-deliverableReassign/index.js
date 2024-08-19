import React, { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'

const ReasignarDialog = ({ open, onClose, selectedRows }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Reasignar Elementos</DialogTitle>
      <DialogContent>
        {selectedRows.map(row => (
          <div key={row.id}>
            {row.nombre} - {row.estado}
          </div>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='primary'>
          Cancelar
        </Button>
        <Button onClick={() => console.log('Reasignar Confirmed', selectedRows)} color='primary'>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReasignarDialog
