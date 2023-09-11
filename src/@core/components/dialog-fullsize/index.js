import React, { useState, useEffect } from 'react'
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
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Slide from '@mui/material/Slide'
import Skeleton from '@mui/material/Skeleton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import { Download } from '@mui/icons-material'
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
import { useFirebase } from 'src/context/useFirebase'

import moment from 'moment-timezone'
import 'moment/locale/es'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const StyledFormControl = props => (
  <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }} {...props} />
)

function CustomListItem({
  editable,
  label,
  id,
  value,
  onChange,
  disabled = false,
  required = false,
  multiline = false,
  initialValue
}) {
  return (
    <>
      {editable ? (
        <ListItem id={`list-${label}`} divider={!editable}>
          <StyledFormControl>
            <TextField
              onChange={onChange}
              label={label}
              id={`${id}-input`}
              defaultValue={initialValue}
              disabled={disabled}
              required={required}
              value={value}
              size='small'
              variant='standard'
              fullWidth={true}
              multiline={multiline}
            />
          </StyledFormControl>
        </ListItem>
      ) : (
        initialValue && (
          <ListItem id={`list-${label}`} divider={!editable}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography component='div' sx={{ width: '30%' }}>
                {label}
              </Typography>
              <Typography component='div' sx={{ width: '70%' }}>
                {initialValue}
              </Typography>
            </Box>
          </ListItem>
        )
      )}
    </>
  )
}

function DateListItem({ editable, label, value, onChange, initialValue, customMinDate = null }) {
  return (
    <>
      {editable ? (
        <ListItem id={`list-${label}`} divider={!editable}>
          <StyledFormControl>
            <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale='es'>
              <DatePicker
                dayOfWeekFormatter={(day) => day.substring(0, 2).toUpperCase()}
                minDate={customMinDate || moment().subtract(1, 'year')}
                maxDate={moment().add(1, 'year')}
                label={label}
                value={value}
                onChange={onChange}
                slotProps={{
                  textField: {
                    size: 'small',
                    required: true,
                    variant: 'standard',
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </StyledFormControl>
        </ListItem>
      ) : (
        initialValue &&
        initialValue.seconds && (
          <ListItem id={`list-${label}`} divider={!editable}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography component='div' sx={{ width: '30%' }}>
                {label}
              </Typography>
              <Typography component='div' sx={{ width: '70%' }}>
                {initialValue && unixToDate(initialValue.seconds)[0]}
              </Typography>
            </Box>
          </ListItem>
        )
      )}
    </>
  )
}

const PhotoItem = ({ photoUrl }) => (
  <Box sx={{ position: 'relative', height: '-webkit-fill-available', p: 2 }}>
    <Box component='img' src={photoUrl} alt='Photo' style={{ height: 'inherit' }} />
    <IconButton
      href={photoUrl}
      target='_blank'
      rel='noopener noreferrer'
      sx={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(220, 220, 220, 0.1)'
      }}
    >
      <Download />
    </IconButton>
  </Box>
)

const PhotoGallery = ({ photos }) => (
  <Box sx={{ display: 'flex', height: '140px', width: '70%', justifyContent: 'space-around' }}>
    {photos.map((fotoUrl, index) => (
      <PhotoItem key={index} photoUrl={fotoUrl} />
    ))}
  </Box>
)

export const FullScreenDialog = ({ open, handleClose, doc, roleData, editButtonVisible }) => {
  let isPlanner = roleData && roleData.id === '5'

  let {
    title,
    state,
    description,
    start,
    user,
    date,
    plant,
    area,
    id,
    ot,
    end,
    supervisorShift,
    userRole,
    petitioner,
    fotos
  } = doc
  const [values, setValues] = useState({})
  const [message, setMessage] = useState('')
  const [editable, setEditable] = useState(isPlanner)
  const [openAlert, setOpenAlert] = useState(false)
  const [eventData, setEventData] = useState(undefined)
  const [petitionerContact, setPetitionerContact] = useState({})

  const [hasChanges, setHasChanges] = useState({
    title: false,
    plant: false,
    area: false,
    start: false,
    end: false,
    ot: false,
    supervisorShift: false,
    description: false,
    fotos: false
  })

  const theme = useTheme()
  const { updateDocs, useEvents, authUser, getUserData } = useFirebase()
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'))

  // Verifica estado
  state = typeof state === 'number' ? state : 100

  const eventArray = useEvents(id, authUser)

  const PetitionerContactComponent = () => (
    <>
      {petitioner && <Typography>{petitioner}</Typography>}
      {petitionerContact && (
        <>
          <Typography>{petitionerContact.email}</Typography>
          <Typography>{petitionerContact.phone}</Typography>
        </>
      )}
    </>
  )

  const initialValues = {
    title,
    description,
    petitioner,
    plant,
    area,
    date: moment(date.toDate()),
    start: start && moment(start.toDate()),
    ...(ot && { ot }),
    ...(end && { end: moment(end.toDate()) }),
    ...(supervisorShift && { supervisorShift }),
    ...(fotos && { fotos })
  }

  // Establece los contactos del Solicitante
  useEffect(() => {
    const fetchData = async () => {
      const petitionerName = values.petitioner
      const petitionerData = await getUserData('getPetitioner', null, { name: petitionerName })
      setPetitionerContact(petitionerData)
    }

    fetchData()
  }, [values.petitioner])

  // Actualiza el estado al cambiar de documento, sólo valores obligatorios
  useEffect(() => {
    setValues(initialValues)
  }, [doc])

  useEffect(() => {
    const data = eventArray
    setEventData(data)
  }, [eventArray])

  // Handlea dialog

  const handleOpenAlert = async () => {
    const hasFormChanges = Object.values(hasChanges).some(hasChange => hasChange)
    if (roleData.id === '5') {
      // Agrega end y ot
      if (!end && hasChanges.end && !ot && hasChanges.ot) {
        setOpenAlert(true)

        // Ya viene con end u ot
      } else if (end && ot && state === 4) {
        await updateDocs(id, true, authUser)
          .then(handleClose())
          .catch(error => {
            alert(error), console.log(error)
          })

        //No trae ni agrega end/ot
      } else if ((!end && !hasChanges.end) || (!ot && !hasChanges.ot)) {
        setMessage('Debes ingresar ot y fecha de término')
      } else {
        setOpenAlert(true)
      }

      // Planificador cambia start pero no end
    } else if (roleData.id === '6' && hasChanges.start && !hasChanges.end) {
      setMessage('Debes modificar la fecha de término')

      // Planificador cambia cualquier otro campo
    } else if (hasFormChanges) {
      setOpenAlert(true)
    } else {
      setMessage('No has realizado cambios en el formulario.')
    }
  }

  const writeCallback = () => {
    const newData = {}

    for (const key in values) {
      if (hasChanges[key]) {
        newData[key] = values[key]
      }
    }

    if (Object.keys(newData).length > 0) {
      updateDocs(id, newData, authUser)
    } else {
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
    const fieldValue = event.target.value
    setValues({ ...values, [field]: fieldValue })
    setHasChanges({ ...hasChanges, [field]: fieldValue !== initialValues[field] })
  }

  const handleDateChange = dateField => date => {
    const fieldValue = moment(date.toDate())
    setValues({ ...values, [dateField]: fieldValue })
    setHasChanges({ ...hasChanges, [dateField]: !fieldValue.isSame(initialValues[dateField]) })

    // Si cambia start, end debe ser igual a start mas diferencia original
    const isPetitioner = userRole === 2
    const isContop = userRole === 3

    // Variable diferencia original entre start y end
    const docDifference = moment(initialValues.end).diff(moment(initialValues.start), 'days')

    if (dateField === 'start' && end && (isPetitioner || isContop)) {
      const newEnd = moment(date.toDate()).add(docDifference, 'days')
      setValues({ ...values, end: newEnd })
      setHasChanges({ ...hasChanges, end: !newEnd.isSame(initialValues.end) })
    }
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
                  label={state || state === 0 ? dictionary[state].details : 'Cargando...'}
                  color={state || state === 0 ? dictionary[state].color : 'primary'}
                  sx={{ width: 'auto' }}
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
                  ) : null}
                  <IconButton onClick={() => handleClose()} color='primary' aria-label='edit' component='button'>
                    {/*este botón debería cerrar y setEditable false*/}
                    <Close />
                  </IconButton>
                </Box>
              </Box>

              <List>
                <CustomListItem
                  editable={editable && roleData && roleData.canEditValues}
                  label='Título'
                  id='title'
                  initialValue={title}
                  value={values.title}
                  onChange={handleInputChange('title')}
                  required={true}
                />
                <CustomListItem
                  editable={editable && roleData && roleData.canEditValues}
                  label='Descripción'
                  id='desc'
                  initialValue={description}
                  value={values.description}
                  onChange={handleInputChange('description')}
                  multiline={true}
                />
                <CustomListItem
                  editable={editable && roleData && roleData.canEditValues}
                  label='Planta'
                  id='plant'
                  initialValue={plant}
                  value={values.plant}
                  onChange={handleInputChange('plant')}
                />
                <CustomListItem
                  editable={editable && roleData && roleData.canEditValues}
                  label='Área'
                  id='area'
                  initialValue={area}
                  value={values.area}
                  onChange={handleInputChange('area')}
                />
                <CustomListItem
                  editable={false}
                  label='Solicitante'
                  id='petitioner'
                  initialValue={<PetitionerContactComponent />}
                />
                <DateListItem
                  editable={editable && roleData && roleData.canEditStart}
                  label='Inicio'
                  id='start'
                  value={values.start}
                  onChange={handleDateChange('start')}
                  initialValue={start}
                />
                <DateListItem
                  editable={editable && roleData && roleData.canEditEnd}
                  label='Término'
                  id='end'
                  value={values.end}
                  onChange={handleDateChange('end')}
                  initialValue={end}
                  customMinDate={values.start}
                />
                <CustomListItem
                  editable={editable && roleData && roleData.canEditValues}
                  label='OT'
                  id='ot'
                  initialValue={ot}
                  value={values.ot}
                  onChange={handleInputChange('ot')}
                  disabled={!isPlanner}
                  required={isPlanner}
                />
                <CustomListItem editable={false} label='Turno' id='shift' initialValue={supervisorShift} />

                {values.fotos && (
                  <ListItem>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography component='div' sx={{ width: '30%', pr:2 }}>
                        Archivos adjuntos
                      </Typography>
                      <PhotoGallery photos={fotos} />
                    </Box>
                  </ListItem>
                )}
              </List>

              {editable ? (
                <Button
                  sx={{ mt: 3, mb: 5 }}
                  disabled={!Object.values(hasChanges).some(hasChange => hasChange)}
                  onClick={() => handleOpenAlert()}
                  variant='contained'
                >
                  {isPlanner && state <= 4 ? 'Aprobar y guardar' : 'Guardar'}
                </Button>
              ) : null}

              {eventData !== undefined &&
                eventData.length > 0 &&
                eventData.map(element => {
                  let modified = element.prevDoc ? (element.prevDoc.start ? 'Modificado' : 'Modificación aceptada') : 'Aprobado'
                  let status = element.newState === 10 ? 'Rechazado' : modified

                  return (
                    <div key={element.date}>
                      <TimelineItem>
                        <TimelineOppositeContent>{unixToDate(element.date.seconds)}</TimelineOppositeContent>
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
                <TimelineOppositeContent>{date && unixToDate(date.seconds)}</TimelineOppositeContent>
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
