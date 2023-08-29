// ** React Imports
import { useState, forwardRef } from 'react'

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
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'

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


  const [hours, setHours] = useState({})
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
    if (hours !== '') {
      updateDocs(id, {hours}, authUser)

      // Aquí puedes actualizar el documento 'doc' en la base de datos con el campo 'horas levantamiento'
      // usando la función updateDocs o cualquier método que utilices para actualizar los datos en Firebase
      handleClose()
    } else {
      setError('Por favor, ingrese un número mayor a 0.')
    }
  }

  const handleDateChange = dateField => date => {
    const fieldValue = moment(date.toDate())
    if (dateField === 'start'){
      setHours({ ...hours, start: fieldValue })
    } else {
      const hoursDifference = fieldValue.diff(hours.start, 'hours');
      setHours({ ...hours, end: fieldValue, total: hoursDifference });
    }

    //setHasChanges({ ...hasChanges, [dateField]: !fieldValue.isSame(initialValues[dateField]) })
  }

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
                  <DateTimePicker
                    minDate={moment().subtract(1, 'year')}
                    maxDate={moment().add(1, 'year')}
                    label='Fecha de inicio'
                    value={hours.start}
                    onChange={handleDateChange('end')}
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
                  <DateTimePicker
                    minDate={moment().subtract(1, 'year')}
                    maxDate={moment().add(1, 'year')}
                    label='Fecha de término'
                    value={hours.end}
                    onChange={handleDateChange('end')}
                    InputLabelProps={{ shrink: true, required: true }}
                  />
                </Box>
              </LocalizationProvider>
            </FormControl>
          </Box>
          <TextField
            id='outlined-basic'
            label='Horas del Levantamiento'
            value={hours.total}
            onChange={handleInputChange}
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
