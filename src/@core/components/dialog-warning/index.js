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

export default function AlertDialog({ open, handleClose, callback, approves, loading = false }) {
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
            ¿Estás segur@ de que quieres{' '}
            {approves === undefined
              ? 'modificar'
              : approves
              ? approves?.pendingReschedule
                ? 'pausar'
                : 'aprobar'
              : 'rechazar'}{' '}
            la solicitud?
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
