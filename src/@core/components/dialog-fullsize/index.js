import * as React from 'react'
import { useState, useEffect } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Close from '@mui/icons-material/Close'
import Dialog from '@mui/material/Dialog'
import Paper from '@mui/material/Paper'
import Box from '@mui/system/Box'
import TextField from '@mui/material/TextField'
import Edit from '@mui/icons-material/Edit'
import AppBar from '@mui/material/AppBar'
import Chip from '@mui/material/Chip'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import Slide from '@mui/material/Slide'
import Skeleton from '@mui/material/Skeleton'
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

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

export const FullScreenDialog = ({ open, handleClose, doc, roleData }) => {
  let { title, state, description, start, user, date, area, id, ot, end, shift } = doc
  const [values, setValues] = useState({})
  const [editable, setEditable] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [eventData, setEventData] = useState(undefined)

  const { updateDocs, useEvents } = useFirebase()

  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  let display = fullScreen ? 'auto' : 'none'

  // Verifica estado
  state = typeof state === 'number' ? state : 100

  const eventArray = useEvents(id)

  const initialValues = {
    title,
    area,
    start: start.seconds,
    ...(ot && { ot }),
    ...(end && { end }),
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
    setOpenAlert(true)
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

   const formatDate = start => {
    const fecha = unixToDate(start.seconds)[0]
    const partesFecha = fecha.split('/')

    const dia = partesFecha[0]
    const mes = partesFecha[1].padStart(2, '0')
    const año = partesFecha[2]

    const fechaFormateada = año + '-' + mes + '-' + dia

    return fechaFormateada
  }

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={() => handleClose()}
      TransitionComponent={Transition}
      scroll='body'
    >
      <AppBar sx={{ position: 'relative', display: { display } }}>
        <Toolbar>
          <IconButton edge='start' color='inherit' onClick={() => handleClose()} aria-label='close'>
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
            Detalles de la solicitud
          </Typography>
          <Button autoFocus color='inherit' onClick={() => handleClose()}>
            Cerrar
          </Button>
        </Toolbar>
      </AppBar>
      <AlertDialog open={openAlert} handleClose={handleCloseAlert} callback={() => writeCallback()}></AlertDialog>
      <Paper sx={{ width: ' 500px', maxWidth: 700, margin: 'auto', padding: '30px', overflowY: 'hidden' }}>
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
                  label={state ? dictionary[state].title : 'Cargando...'}
                  color={state ? dictionary[state].color : 'primary'}
                  size='small'
                  sx={{ width: 90 }}
                />
                <Box>
                  <IconButton
                    onClick={() => setEditable(prev => !prev)}
                    color='primary'
                    aria-label='edit'
                    component='button'
                  >
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleClose()} color='primary' aria-label='edit' component='button'>
                    {/*este botón debería cerrar y setEditable false*/}
                    <Close />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant='button' sx={{ fontSize: 14, mb: 2 }} color='textSecondary'>
                {state ? dictionary[state].details : ''}
              </Typography>
              {/*Título */}
              {editable && roleData && roleData.canEditValues ? (
                <TextField
                  onChange={e => setValues({ ...values, title: e.target.value })}
                  label='Título'
                  id='title-input'
                  defaultValue={title}
                  size='small'
                  sx={{ mt: 5, mb: 5, mr: 2 }}
                />
              ) : (
                <Typography variant='h5' sx={{ mb: 2.5 }} component='div'>
                  {title}
                </Typography>
              )}
              {/*Área*/}
              {editable && roleData && roleData.canEditValues ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  <TextField
                    onChange={e => setValues({ ...values, area: e.target.value })}
                    label='Área'
                    id='area-input'
                    defaultValue={area}
                    size='small'
                    sx={{ mb: 5, mr: 2, flex: 'auto' }}
                  />
                </Box>
              ) : (
                <Typography sx={{ mb: 4 }} color='textSecondary'>
                  Área {area}
                </Typography>
              )}
              {/*Fecha de inicio*/}
              {editable && roleData && roleData.canEditDate ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  <TextField
                    InputLabelProps={{ shrink: true }}
                    onChange={e => setValues({ ...values, start: localDate(e.target.value) })}
                    label='Fecha de inicio'
                    type='date'
                    id='start-input'
                    defaultValue={start && formatDate(start)}
                    size='small'
                    sx={{ mb: 5, mr: 2, flex: 'auto' }}
                  />
                </Box>
              ) : (
                <Typography sx={{ mb: 4 }} color='textSecondary'>
                  Fecha de inicio: {start && unixToDate(start.seconds)[0]}
                </Typography>
              )}
              {/*Asigna OT */}
              {editable && roleData && roleData.canEditValues ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  <TextField
                    onChange={e => setValues({ ...values, ot: e.target.value })}
                    label='OT'
                    id='OT-input'
                    defaultValue={ot}
                    size='small'
                    sx={{ mb: 5, mr: 2, flex: 'auto' }}
                  />
                </Box>
              ) : (
                ot &&
                <Typography sx={{ mb: 4 }} color='textSecondary'>
                  OT: {ot}
                </Typography>
              )}
              {/*Asigna término */}
              {editable && roleData && roleData.canEditValues ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  <TextField
                    onChange={e => setValues({ ...values, end: localDate(e.target.value) })}
                    InputLabelProps={{ shrink: true }}
                    label='Fecha de término'
                    type='date'
                    id='end-input'
                    size='small'
                    sx={{ mb: 5, mr: 2, flex: 'auto' }}
                    defaultValue={end && formatDate(end)}
                  />
                </Box>
              ) : (
                <Typography sx={{ mb: 4 }} color='textSecondary'>
                  Fecha de término: {end && unixToDate(end.seconds)[0]}
                </Typography>
              )}
              {/*Asigna turno */}
              {editable && roleData && roleData.canEditValues ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  <TextField
                    onChange={e => setValues({ ...values, shift: e.target.value })}
                    label='Asignar turno'
                    id='shift-input'
                    defaultValue='Turno'
                    size='small'
                    sx={{ mb: 5, mr: 2, flex: 'auto' }}
                  />
                </Box>
              ) : ( shift &&
                <Typography sx={{ mb: 4 }} color='textSecondary'>
                  Turno: {shift}
                </Typography>
              )}
              {/*Descripción */}
              {editable && roleData && roleData.canEditValues ? (
                <TextField
                  onChange={e => setValues({ ...values, description: e.target.value })}
                  label='Descripción'
                  id='desc-input'
                  defaultValue={description}
                  size='small'
                  sx={{ mb: 5, mr: 2 }}
                />
              ) : (
                <Typography variant='body2' sx={{ mb: 3 }}>
                  {description}
                </Typography>
              )}

              {editable ? (
                <Button onClick={() => handleOpenAlert()} variant='contained'>
                  Guardar
                </Button>
              ) : null}

              <TimelineItem sx={{ mt: 1 }}>
                <TimelineOppositeContent color='textSecondary'>
                  {date && unixToDate(date.seconds)}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography>{state ? dictionary[state].details : ''}</Typography>
                  <Typography variant='body2'> Creado por {user}</Typography>
                </TimelineContent>
              </TimelineItem>
              {eventData !== undefined &&
                eventData.length > 0 &&
                eventData.map(element => {
                  let modified = element.prevDoc ? (element.prevDoc.start ? 'Devuelto' : 'Modificado') : 'Aprobado'
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
            </Timeline>
          </Box>
        )}
      </Paper>
    </Dialog>
  )
}
