import * as React from 'react'
import { useState, useEffect } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Close from '@mui/icons-material/Close'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import DialogTitle from '@mui/material/DialogTitle'
import Paper from '@mui/material/Paper'
import Box from '@mui/system/Box'
import TextField from '@mui/material/TextField'
import Edit from '@mui/icons-material/Edit'
import FormControl from '@mui/material/FormControl'
import Chip from '@mui/material/Chip'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Slide from '@mui/material/Slide'
import Skeleton from '@mui/material/Skeleton'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  timelineOppositeContentClasses
} from '@mui/lab'
import AlertDialog from 'src/@core/components/dialog-warning'
import dictionary from 'src/@core/components/dictionary/index'
import { unixToDate } from 'src/@core/components/unixToDate'
import { useFirebase, getData } from 'src/context/useFirebaseAuth'
import localDate from 'src/@core/utils/handle-date-offset'

// ** Date Library
//import moment from 'moment'
import moment from 'moment-timezone'
import 'moment/locale/es'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

export const FullScreenDialog = ({ open, handleClose, doc, roleData, editButtonVisible }) => {
  // Nueva variable para definir el valor inicial de 'editable'
  let isPlanner = roleData && roleData.id === '5'

  let { title, state, description, start, user, date, plant, area, id, ot, end, shift, userRole } = doc
  const [values, setValues] = useState({})
  const [message, setMessage] = useState('')
  const [editable, setEditable] = useState(isPlanner)
  const [openAlert, setOpenAlert] = useState(false)
  const [eventData, setEventData] = useState(undefined)

  const { updateDocs, useEvents } = useFirebase()

  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'))
  let display = fullScreen ? 'auto' : 'none'

  // Verifica estado
  state = typeof state === 'number' ? state : 100

  const eventArray = useEvents(id)

  const initialValues = {
    title,
    plant,
    area,
    start: start && moment(start.toDate()),
    ...(ot && { ot }),
    ...(end && { end: moment(start.toDate())}),
    ...(shift && { shift }),
    description
  }

  // Actualiza el estado al cambiar de documento, sólo valores obligatorios
  useEffect(() => {
    setValues(initialValues)
  }, [doc])

  useEffect(() => {
    const data = eventArray
    setEventData(data)
  }, [eventArray])

  // Handlea dialog

  const handleOpenAlert = () => {
    if (roleData.id === '5') {
      if (values.end && values.ot) {
        setOpenAlert(true)
      } else {
        setMessage('Debes ingresar OT y fecha de término')
      }
    } else if (roleData.id === '6' && values.start && !values.end) {
      setMessage('Debes modificar la fecha de término')
    } else {
      setOpenAlert(true)
    }
  }

  const writeCallback = () => {
    const newData = {}

    for (const key in values) {
      console.log(values)
      console.log(initialValues)
      if (values[key] && values[key] !== initialValues[key]) {
        newData[key] = values[key]
      }
    }
    if (Object.keys(newData).length > 0) {
      updateDocs(id, values)
    }
    if (Object.keys(newData).length === 0) {
      console.log('No se escribió ningún documento')
    }
    handleCloseAlert()
  }

  const handleCloseAlert = () => {
    setOpenAlert(false)
    setEditable(false)
  }

  // Función onchange utilizando currying
  const handleInputChange = field => event => {
    setValues({ ...values, [field]: event.target.value })
  }

  const handleDateChange = dateField => date => {
    setValues({ ...values, [dateField]: moment(date.toDate())})
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={() => handleClose()}
      TransitionComponent={Transition}
      scroll='body'
    >
      <AlertDialog open={openAlert} handleClose={handleCloseAlert} callback={() => writeCallback()}></AlertDialog>
      <Paper sx={{ margin: 'auto', padding: '30px', overflowY: 'hidden' }}>
        {eventData == undefined ? (
          <Box>
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </Box>
        ) : (
          <Box>
            <Timeline sx={{ [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Chip
                  label={state || state === 0 ? dictionary[state].title : 'Cargando...'}
                  color={state || state === 0 ? dictionary[state].color : 'primary'}
                  size='small'
                  sx={{ width: 180 }}
                />
                <Box>
                  {/*Botón para editar*/}
                  {editButtonVisible && !isPlanner ? (
                    <IconButton
                      onClick={() => setEditable(prev => !prev)}
                      color='primary'
                      aria-label='edit'
                      component='button'
                    >
                      <Edit />
                    </IconButton>
                  ) : (
                    <Typography variant='h5' sx={{ mb: 2.5 }} component='div'>
                      {''}
                    </Typography>
                  )}
                  <IconButton onClick={() => handleClose()} color='primary' aria-label='edit' component='button'>
                    {/*este botón debería cerrar y setEditable false*/}
                    <Close />
                  </IconButton>
                </Box>
              </Box>
              {/*Título */}
              {editable && roleData && roleData.canEditValues ? (
                <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                  <TextField
                    onChange={handleInputChange('title')}
                    label='Título'
                    id='title-input'
                    defaultValue={title}
                    size='small'
                    sx={{ mt: 5, mb: 5, mr: 2 }}
                  />
                </FormControl>
              ) : (
                <Typography variant='h5' sx={{ mb: 2.5 }} component='div'>
                  Título: {title}
                </Typography>
              )}
              <Typography sx={{ mb: 4 }} color='textSecondary'>
                Estado: {state ? dictionary[state].details : ''}
              </Typography>
              {/*Planta*/}
              {editable && roleData && roleData.canEditValues ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                    <TextField
                      onChange={handleInputChange('plant')}
                      label='Planta'
                      id='plant-input'
                      defaultValue={plant}
                      size='small'
                      sx={{ mb: 5, mr: 2, flex: 'auto' }}
                    />
                  </FormControl>
                </Box>
              ) : (
                <Typography sx={{ mb: 4 }} color='textSecondary'>
                  Planta: {plant}
                </Typography>
              )}
              {/*Área*/}
              {editable && roleData && roleData.canEditValues ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                    <TextField
                      onChange={handleInputChange('area')}
                      label='Área'
                      id='area-input'
                      defaultValue={area}
                      size='small'
                      sx={{ mb: 5, mr: 2, flex: 'auto' }}
                    />
                  </FormControl>
                </Box>
              ) : (
                <Typography sx={{ mb: 4 }} color='textSecondary'>
                  Área: {area}
                </Typography>
              )}
              {/*Fecha de inicio*/}
              {editable && roleData && roleData.canEditDate ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap',  mb: 5}}>
                  <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale='es'>
                      <Box display='flex' alignItems='center'>
                        <DatePicker
                          minDate={moment().subtract(1, 'year')}
                          maxDate={moment().add(1, 'year')}
                          label='Fecha de inicio'
                          value={values.start}
                          onChange={handleDateChange('start')}
                          InputLabelProps={{ shrink: true, required: true }}
                        />
                      </Box>
                    </LocalizationProvider>
                  </FormControl>
                </Box>
              ) : (
                <Typography sx={{ mb: 4 }} color='textSecondary'>
                  Fecha de inicio: {start && unixToDate(start.seconds)[0]}
                </Typography>
              )}
              {/*Asigna término */}
              {editable && roleData && roleData.canEditDate ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 5 }}>
                  <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale='es'>
                      <Box display='flex' alignItems='center'>
                        <DatePicker
                          minDate={moment().subtract(1, 'year')}
                          maxDate={moment().add(1, 'year')}
                          label='Fecha de término'
                          value={values.end}
                          onChange={handleDateChange('end')}
                          InputLabelProps={{ shrink: true, required: true }}
                        />
                      </Box>
                    </LocalizationProvider>
                  </FormControl>
                </Box>
              ) : (
                <Typography sx={{ mb: 4 }} color='textSecondary'>
                  Fecha de término: {end && unixToDate(end.seconds)[0]}
                </Typography>
              )}
              {/*Asigna OT */}
              {editable && roleData && roleData.canEditValues ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                    <TextField
                      required={isPlanner}
                      onChange={handleInputChange('ot')}
                      label='OT'
                      id='OT-input'
                      defaultValue={ot}
                      size='small'
                      sx={{ mb: 5, mr: 2, flex: 'auto' }}
                    />
                  </FormControl>
                </Box>
              ) : (
                ot && (
                  <Typography sx={{ mb: 4 }} color='textSecondary'>
                    OT Procure: {ot}
                  </Typography>
                )
              )}
              {/* Turno */}
              {shift && (
                <Typography sx={{ mb: 4 }} color='textSecondary'>
                  Turno: {shift}
                </Typography>
              )}
              {/*Descripción */}
              {editable && roleData && roleData.canEditValues ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                    <TextField
                      onChange={handleInputChange('description')}
                      label='Descripción'
                      id='desc-input'
                      defaultValue={description}
                      size='small'
                      sx={{ mb: 5, mr: 2, flex: 'auto' }}
                    />
                  </FormControl>
                </Box>
              ) : (
                <Typography sx={{ mb: 4 }} color='textSecondary'>
                  Descripción: {description}
                </Typography>
              )}

              {editable ? (
                <Button onClick={() => handleOpenAlert()} variant='contained'>
                  {isPlanner ? 'Aprobar y guardar' : 'Guardar'}
                </Button>
              ) : null}

              {eventData !== undefined &&
                eventData.length > 0 &&
                eventData.map(element => {
                  let modified = element.prevDoc ? (element.prevDoc.start ? 'Modificado' : 'Modificado') : 'Aprobado'
                  let status = element.newState === 10 ? 'Rechazado' : modified

                  return (
                    <div key={element.date}>
                      <TimelineItem>
                        <TimelineOppositeContent color='textSecondary'>
                          {unixToDate(element.date.seconds)}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot />
                          <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                          <Typography variant='body1'>
                            {status} por {element.userName}
                          </Typography>
                          <Typography variant='body2'>{dictionary[element.newState].details}</Typography>
                        </TimelineContent>
                      </TimelineItem>
                    </div>
                  )
                })}
              <TimelineItem sx={{ mt: 1 }}>
                <TimelineOppositeContent color='textSecondary'>
                  {date && unixToDate(date.seconds)}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant='body1'> Solicitud hecha por {user}</Typography>
                  {userRole == 2 ? (
                    <Typography variant='body2'> En espera de revisión de Contract Operator </Typography>
                  ) : userRole == 3 ? (
                    <Typography variant='body2'> En espera de revisión de Planificador</Typography>
                  ) : (
                    <Typography variant='body2'> En espera de revisión</Typography>
                  )}
                </TimelineContent>
              </TimelineItem>
            </Timeline>
          </Box>
        )}
      </Paper>
      <Dialog open={!!message} aria-labelledby='message-dialog-title' aria-describedby='message-dialog-description'>
        <DialogTitle id='message-dialog-title'>Creando solicitud</DialogTitle>
        <DialogContent>
          <DialogContentText id='message-dialog-description'>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessage('')}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}
