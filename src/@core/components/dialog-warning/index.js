import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField
} from '@mui/material'


// ** React Import

export default function AlertDialog({ authUser, state, open, handleClose, onSubmit, approves, loading = false, cancelReason = null, handleCancelReasonChange = null, domainData = null }) {

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
              <FormControl fullWidth sx={{mt:4, '& .MuiInputBase-root ': { width: '100%' }}}>
                <InputLabel>
                  {'Motivo de Cancelación'}
                </InputLabel>
                <Box display='flex' alignItems='center'>
                  <Select
                    input={<OutlinedInput label={'Motivo de Cancelación'} />}
                    onChange={(event) => handleCancelReasonChange({ target: { id: 'cancel-reason-option', value: event.target.value } })}
                  >
                    {Object.keys(domainData.cancelReasonOptions) &&
                      Object.keys(domainData.cancelReasonOptions).map(option => {
                        return (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        )
                      })}
                  </Select>
                </Box>
              </FormControl>


              {/* Descripción del motivo de cancelamiento */}
              <TextField
                sx={{mt: 4}}
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
      {console.log(cancelReason)}
      <DialogActions>
        <Button onClick={handleClose}>No</Button>
        <Button onClick={onSubmit} autoFocus disabled={result === 'rechazar' && (!cancelReason.option || !cancelReason.details)}>
          Sí
        </Button>
      </DialogActions>
    </Dialog>
  )
}
