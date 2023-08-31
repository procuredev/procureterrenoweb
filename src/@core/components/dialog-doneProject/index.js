// ** React Imports
import { useState, forwardRef, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Avatar from '@mui/material/Avatar'
import CustomAvatar from 'src/@core/components/mui/avatar'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import ListItem from '@mui/material/ListItem'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'
import ListItemText from '@mui/material/ListItemText'
import DialogContent from '@mui/material/DialogContent'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import EngineeringIcon from '@mui/icons-material/Engineering'
import FormControl from '@mui/material/FormControl'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker'

// ** Date Library
//import moment from 'moment'
import moment from 'moment-timezone'
import 'moment/locale/es'


// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Hooks Imports
import { useFirebase } from 'src/context/useFirebase'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

export const DialogDoneProject = ({ open, doc, handleClose }) => {
  //falta evaluar la foto del proyectista

  // ** States

  const [draftmen, setDraftmen] = useState([])


  const [hours, setHours] = useState({
    start: null,
    end: null,
    total: '',
    hours: 0,
    minutes: 0,
  })
  const [error, setError] = useState('')

  // ** Hooks
  const { updateDocs, authUser } = useFirebase()

  const handleClickDelete = name => {
    // Filtramos el array draftmen para mantener todos los elementos excepto aquel con el nombre proporcionado
    const updatedDraftmen = draftmen.filter(draftman => draftman.name !== name)

    // Actualizamos el estado con el nuevo array actualizado
    setDraftmen(updatedDraftmen)
  }

  const handleInputChange = e => {
    const inputValue = e.target.value

    // Verifica si el valor ingresado es un número y si es mayor a 1
    if (!isNaN(inputValue) && Number(inputValue) > 0) {
      setHours(inputValue)
      setError('') // Limpia el mensaje de error si existe
    } else {
      setHours('')
      setError('Por favor, ingrese un número mayor a 1.')
    }
  }


  const onsubmit = id => {
    if (hours.total !== '') {
      updateDocs(id, { hours: hours.total }, authUser); // Utiliza directamente el estado hours.total
      handleClose();
    } else {
      setError('Por favor, indique fecha de inicio y fecha de término.');
    }
  };

  const handleDateChangeWrapper = dateField => date => {
    const handleDateChange = date => {
      const fieldValue = moment(date.toDate());
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

 /*  useEffect(() => {
    if (hours.start && hours.end) {
      const startOfWorkday = moment(hours.start).set('hour', 8).set('minute', 0);
      const endOfWorkday = moment(hours.start).set('hour', 18).set('minute', 0);
      const startOfLunchBreak = moment(hours.start).set('hour', 12).set('minute', 0);
      const endOfLunchBreak = moment(hours.start).set('hour', 13).set('minute', 0);

      // Filtrar las horas fuera del horario hábil y del horario de descanso
      const filteredStart = moment.max(startOfWorkday, hours.start, endOfLunchBreak);
      const filteredEnd = moment.min(endOfWorkday, hours.end, startOfLunchBreak);

      const duration = moment.duration(filteredEnd.diff(filteredStart));
      const totalMinutesDifference = duration.asMinutes();

      const hoursDifference = Math.floor(totalMinutesDifference / 60);
      const minutesDifference = Math.floor(totalMinutesDifference % 60);

      console.log(hoursDifference, "hoursDifference")
      console.log(minutesDifference, "minutesDifference")

      if (hoursDifference < 0 || minutesDifference < 0) {
        setError('La hora de término debe ser superior a la hora de inicio.')

        return;
      }

      setHours(prevHours => ({
        ...prevHours,
        total: `${hoursDifference} horas ${minutesDifference} minutos`,
        hours: hoursDifference,
        minutes: minutesDifference,
      }));
    }
  }, [hours.start, hours.end]); */

  useEffect(() => {
    if (hours.start && hours.end) {
      const duration = moment.duration(hours.end.diff(hours.start));
      const totalMinutesDifference = duration.asMinutes();

      const hoursDifference = Math.floor(totalMinutesDifference / 60);
      const minutesDifference = Math.floor(totalMinutesDifference % 60);

      if (hoursDifference < 0 || minutesDifference < 0) {
        // Mostrar un mensaje de error o realizar alguna acción en caso de valores negativos
        return;
      }

      setHours(prevHours => ({
        ...prevHours,
        total: `${hoursDifference} horas ${minutesDifference} minutos`,
        hours: hoursDifference,
        minutes: minutesDifference,
      }));
    }
  }, [hours.start, hours.end]);

  const getInitials = string => string.split(/\s/).reduce((response, word) => (response += word.slice(0, 1)), '')

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth='xs'
      scroll='body'
      onClose={() => handleClose()}
      TransitionComponent={Transition}
      onBackdropClick={() => handleClose()}
    >
      <DialogContent sx={{ px: { xs: 8, sm: 15 }, py: { xs: 8, sm: 12.5 }, position: 'relative' }}>
        <IconButton
          size='small'
          onClick={() => handleClose()}
          sx={{ position: 'absolute', right: '1rem', top: '1rem' }}
        >
          <Icon icon='mdi:close' />
        </IconButton>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant='h5' sx={{ mb: 3, lineHeight: '2rem' }}>
            Terminar Levantamiento
          </Typography>
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

        <List dense sx={{ py: 4 }}>
          {draftmen.map(draftman => {
            return (
              <ListItem
                key={draftman.name}
                sx={{
                  p: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  '.MuiListItem-container:not(:last-child) &': { mb: 4 }
                }}
              >
                <ListItemAvatar>
                  {draftman.avatar ? (
                    <Avatar src={`/images/avatars/${draftman.avatar}`} alt={draftman.name} />
                  ) : (
                    <CustomAvatar skin='light'>{getInitials(draftman.name ? draftman.name : 'John Doe')}</CustomAvatar>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={draftman.name}
                  secondary={draftman.email}
                  sx={{ m: 0, '& .MuiListItemText-primary, & .MuiListItemText-secondary': { lineHeight: '1.25rem' } }}
                />
                <ListItemSecondaryAction sx={{ right: 0 }}>
                  <IconButton
                    size='small'
                    aria-haspopup='true'
                    onClick={() => handleClickDelete(draftman.name)}
                    aria-controls='modal-share-examples'
                  >
                    <Icon icon='mdi:delete-circle-outline' fontSize={20} color='#f44336' />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )
          })}
        </List>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          <Button sx={{ lineHeight: '1.5rem', '& svg': { mr: 2 } }} onClick={() => onsubmit(doc.id)}>
            <EngineeringIcon sx={{ fontSize: 18 }} />
            Guardar
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

//export default DialogAssignProject
