import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from '@mui/material'

// ** React Import

export default function AlertDialog({ authUser, state, open, handleClose, callback, approves, loading = false, cancelReason = null, handleCancelReasonChange = null }) {

  let result

  if (approves === undefined) {
    result = authUser.role === 5 && state === (3 || 4) ? 'aprobar' : 'modificar'
  } else if (approves) {
    result = approves.pendingReschedule ? 'pausar' : 'aprobar'
  } else {
    result = 'rechazar'
  }

  function capitalize(text) {
    const firstLetter = text.charAt(0)
    const rest = text.slice(1)

    return firstLetter.toUpperCase() + rest
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <DialogTitle id='alert-dialog-title'>{capitalize(result)} estado de la solicitud</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <DialogContentText id='alert-dialog-description'>
              ¿Estás segur@ de que quieres {result} la solicitud? {result === 'rechazar' && 'Deberás indicar la razón por la cual se está cancelando este Levantamiento:'}
            </DialogContentText>
            {result === 'rechazar' && (
              <TextField
                autoFocus
                margin='dense'
                id='block-reason'
                label='Motivo'
                type='text'
                fullWidth
                value={cancelReason}
                onChange={handleCancelReasonChange}
              />
            )}

        </>


        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>No</Button>
        <Button onClick={callback} autoFocus disabled={result === 'rechazar' && !cancelReason}>
          Sí
        </Button>
      </DialogActions>
    </Dialog>
  )
}
