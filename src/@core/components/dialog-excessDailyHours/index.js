import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'

const MaxHoursDialog = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Has superado el máximo de horas</DialogTitle>
      <DialogContent>No se pueden exceder 12 horas por día.</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>regresar</Button>
      </DialogActions>
    </Dialog>
  )
}

export default MaxHoursDialog
