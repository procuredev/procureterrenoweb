import * as React from 'react'
import {
  CircularProgress,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material'

export default function AlertDialog({ authUser, state, open, handleClose, callback, approves, loading = false }) {
  let result

  if (approves === undefined) {
    result = authUser.role === 5 && state === (3 || 4) ? 'aprobar' : 'modificar'
  } else if (approves) {
    result = approves.pendingReschedule ? 'pausar' : 'aprobar'
  } else {
    result = 'rechazar'
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <DialogTitle id='alert-dialog-title'>Modificar estado de la solicitud</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <DialogContentText id='alert-dialog-description'>
            ¿Estás segur@ de que quieres {result} la solicitud?
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>No</Button>
        <Button onClick={callback} autoFocus>
          Sí
        </Button>
      </DialogActions>
    </Dialog>
  )
}
