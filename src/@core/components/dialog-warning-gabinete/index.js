import * as React from 'react';
import { useState } from 'react'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker'

//import moment from 'moment'
import moment from 'moment-timezone'
import 'moment/locale/es'

export default function AlertDialogGabinete({open, handleClose, callback, approves, authUser, setRemarksState, blueprint, hours, setHours, error, setError}) {
  const [toggleRemarks, setToggleRemarks] = useState(false)




  const handleDateChangeWrapper = dateField => date => {
    const handleDateChange = date => {
      const fieldValue = moment(date && date.toDate());
      const updatedHours = { ...hours };

      if (dateField === 'start') {
        updatedHours.start = fieldValue;
      } else {
        updatedHours.end = fieldValue;
      }

      setHours(updatedHours);
    };

    handleDateChange(date);
  };

  return (

      <Dialog
        open={open}
        onClose={()=> {handleClose(); setToggleRemarks(false); setError('')}}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
        {(authUser.role === 8 ? 'Enviar' : approves ? 'Aprobar' : 'Rechazar')} entregable de la solicitud
        </DialogTitle>
        <DialogContent sx={{display:'flex', flexDirection:'column'}}>
          <DialogContentText id="alert-dialog-description">
            ¿Estás segur@ de que quieres {(authUser.role === 8 ? 'enviar' : approves ? 'aprobar' : 'rechazar')} los entregables?
          </DialogContentText>

          {approves && authUser.role === 8 ? (
            <>
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant='body2'>Establece el total de horas</Typography>
              </Box>

              <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 5 }}>
                  <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale='es'>
                      <Box display='flex' alignItems='center'>
                        <MobileDateTimePicker
                          dayOfWeekFormatter={(day) => day.substring(0, 2).toUpperCase()}
                          minDate={moment().subtract(1, 'year')}
                          maxDate={moment().add(1, 'year')}
                          label='Fecha de inicio'
                          value={hours.start}
                          onChange={handleDateChangeWrapper('start')}
                          InputLabelProps={{ shrink: true, required: true }}
                        />
                      </Box>
                    </LocalizationProvider>
                  </FormControl>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 5 }}>
                  <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale='es'>
                      <Box display='flex' alignItems='center'>
                        <MobileDateTimePicker
                          dayOfWeekFormatter={(day) => day.substring(0, 2).toUpperCase()}
                          minDate={moment().subtract(1, 'year')}
                          maxDate={moment().add(1, 'year')}
                          label='Fecha de término'
                          value={hours.end}
                          onChange={handleDateChangeWrapper('end')}
                          InputLabelProps={{ shrink: true, required: true }}
                        />
                      </Box>
                    </LocalizationProvider>
                  </FormControl>
                </Box>
                <TextField
                  //id='outlined-basic'
                  //label='Horas del Levantamiento'
                  disabled={true}
                  justifyContent="center"
                  value={hours.total}
                  //onChange={handleInputChange}
                  error={error !== ''}
                  helperText={error}
                />
              </Box>
            </>
            ) : ''

          }

          { approves && authUser.role === 9 && blueprint?.approvedByDocumentaryControl === true  ? (
              <FormControlLabel
                control={<Switch
                  onChange={() => setToggleRemarks(!toggleRemarks)} />}
                  sx={{mt: 4}}
                label="Agregar Comentario"
              />
            ) : !approves ?(
              <FormControlLabel
                control={<Switch
                  onChange={() => setToggleRemarks(!toggleRemarks)} />}
                  sx={{mt: 4}}
                label="Agregar Observación"
              />
            ) : ''
          }

          {toggleRemarks && !approves ? (
              <TextField
              sx={{mt: 4}}
              label='Observación'
              onChange={e => setRemarksState(e.target.value)}
            />
            ) : toggleRemarks ? (
              <TextField
                sx={{mt: 4}}
                label='Comentario'
                onChange={e => setRemarksState(e.target.value)}
              />
            ) : ''
          }




        </DialogContent>
        <DialogActions>
          <Button onClick={()=> {handleClose(); setToggleRemarks(false); setError('')}}>No</Button>
          <Button onClick={() => {
            authUser.role !== 8 || authUser.role === 8 && hours.total !== '' ? callback() : setError('Por favor, indique fecha de inicio y fecha de término.')
          }} autoFocus>
            Sí
          </Button>
        </DialogActions>
      </Dialog>

  );
}
