import * as React from 'react'
import { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  TextField,
  DialogTitle,
  FormControlLabel,
  Checkbox
} from '@mui/material'

export default function AlertDialogGabinete({
  open,
  handleClose,
  callback,
  approves,
  authUser,
  setRemarksState,
  blueprint,
  error,
  setError
}) {
  const [toggleRemarks, setToggleRemarks] = useState(false)

  return (
    <Dialog
      open={open}
      onClose={() => {
        handleClose()
        setToggleRemarks(false)
        setError('')
      }}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <DialogTitle id='alert-dialog-title'>
        {authUser.role === 8 ? 'Enviar' : approves ? 'Aprobar' : 'Rechazar'} entregable de la solicitud
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <DialogContentText id='alert-dialog-description'>
          ¿Estás segur@ de que quieres {authUser.role === 8 ? 'enviar' : approves ? 'aprobar' : 'rechazar'} los
          entregables?
        </DialogContentText>

        {approves && authUser.role === 9 && blueprint?.approvedByDocumentaryControl === true ? (
          <FormControlLabel
            control={<Checkbox onChange={() => setToggleRemarks(!toggleRemarks)} />}
            sx={{ mt: 4 }}
            label='Agregar Comentario'
          />
        ) : !approves ? (
          <FormControlLabel
            control={<Checkbox onChange={() => setToggleRemarks(!toggleRemarks)} />}
            sx={{ mt: 4 }}
            label='Agregar Observación'
          />
        ) : (
          ''
        )}

        {toggleRemarks && !approves ? (
          <TextField sx={{ mt: 4 }} label='Observación' onChange={e => setRemarksState(e.target.value)} />
        ) : toggleRemarks ? (
          <TextField sx={{ mt: 4 }} label='Comentario' onChange={e => setRemarksState(e.target.value)} />
        ) : (
          ''
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            handleClose()
            setToggleRemarks(false)
            setError('')
          }}
        >
          No
        </Button>
        <Button
          onClick={() => {
            authUser.role !== 8 || authUser.role === 8
              ? callback()
              : setError('Por favor, indique fecha de inicio y fecha de término.')
            setToggleRemarks(false)
          }}
          autoFocus
        >
          Sí
        </Button>
      </DialogActions>
    </Dialog>
  )
}
