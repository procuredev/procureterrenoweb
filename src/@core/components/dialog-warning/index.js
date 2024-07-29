import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  TextField
} from '@mui/material'

// ** React Import

export default function AlertDialog({ authUser, state, open, handleClose, callback, approves, loading = false, cancelReason = null, handleCancelReasonChange = null, domainData = null }) {

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
              <>
                {/* Proyectista de Gabinete */}
                <Select
                  sx={{mt: 4}}
                  //autoFocus
                  fullWidth
                  id='cancel-reason-option'
                  label='Empresasdasdasa'
                  value={cancelReason.option}
                  margin='dense'
                  onChange={handleCancelReasonChange}
                  //onChange={handleChange('company')}
                  //error={errors.company ? true : false}
              >
                {Object.keys(domainData.cancelReasonOptions).map(option => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
              </Select>

              {/* Descripción del motivo de cancelamiento */}
              <TextField
                //autoFocus
                sx={{mt: 4}}
                margin='dense'
                id='cancel-reason-details'
                label='Detalle'
                type='text'
                fullWidth
                value={cancelReason.details}
                onChange={handleCancelReasonChange}
              />
            </>
          )}

        </>


        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>No</Button>
        <Button onClick={callback} autoFocus disabled={result === 'rechazar' && !cancelReason.option && !cancelReason.details}>
          Sí
        </Button>
      </DialogActions>
    </Dialog>
  )
}
