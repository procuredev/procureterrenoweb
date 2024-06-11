import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'

const ConfirmDeleteDialog = ({ open, onClose, onConfirm }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Confirmar</DialogTitle>
    <DialogContent>
      <Typography>¿Está seguro que desea eliminar la fila seleccionada?</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancelar</Button>
      <Button onClick={onConfirm} color='error'>
        Eliminar
      </Button>
    </DialogActions>
  </Dialog>
)

export default ConfirmDeleteDialog
