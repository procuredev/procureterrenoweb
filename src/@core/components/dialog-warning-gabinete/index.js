import * as React from 'react'
import { useState, useEffect } from 'react'
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
  remarksState,
  blueprint,
  error,
  setError
}) {
  const [toggleRemarks, setToggleRemarks] = useState(!approves)

  console.log('toggleRemarks', toggleRemarks)

  useEffect(() => {
    if (!approves) {
      setToggleRemarks(true)
    } else {
      setToggleRemarks(false)
    }
  }, [approves])

  return (
    <Dialog
      open={open}
      onClose={() => {
        handleClose()
        setToggleRemarks(!approves)
        setRemarksState('')
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
          ¿Estás segur@ de que quieres {authUser.role === 8 ? 'enviar' : approves ? 'aprobar' : 'rechazar'} el
          entregable?
        </DialogContentText>

        {(approves && authUser.role === 9 && blueprint?.approvedByDocumentaryControl === true) ||
        (approves && authUser.role === 9 && blueprint?.revision === 'A') ? ( // Se comenta condicionales por petición de QA
          <FormControlLabel
            control={<Checkbox onChange={() => setToggleRemarks(!toggleRemarks)} />}
            sx={{ mt: 4 }}
            label='Agregar Comentario'
          />
        ) : !approves ? (
          <FormControlLabel control={<Checkbox checked disabled />} sx={{ mt: 4 }} label='Agregar Observación' />
        ) : (
          ''
        )}

        {toggleRemarks && !approves ? (
          <TextField sx={{ mt: 4 }} label='Observación' error={error} onChange={e => setRemarksState(e.target.value)} />
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
            setToggleRemarks(!approves)
            setRemarksState('')
            setError('')
          }}
        >
          No
        </Button>
        <Button
          onClick={() => {
            !approves && remarksState.length === 0
              ? setError('Por favor, agregue una observación para rechazar.')
              : callback()
            setToggleRemarks(false)
          }}
          autoFocus
          disabled={!approves && remarksState.length === 0}
        >
          Sí
        </Button>
      </DialogActions>
    </Dialog>
  )
}
