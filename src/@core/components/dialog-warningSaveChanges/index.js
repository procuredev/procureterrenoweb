import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'

const WarningDialog = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Cambios no guardados</DialogTitle>
      <DialogContent>Tienes cambios que no han sido guardados. ¿Deseas continuar sin guardar?</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onConfirm} color='primary'>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WarningDialog
