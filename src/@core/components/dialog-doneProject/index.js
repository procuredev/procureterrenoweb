// ** React Imports
import { useState, forwardRef, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'
import DialogContent from '@mui/material/DialogContent'
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
  // ** States

  const [hours, setHours] = useState({
    start: null,
    end: null,
    total: '',
    hours: 0,
    minutes: 0
  })
  const [error, setError] = useState('')
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false)

  // ** Hooks
  const { updateDocs, authUser } = useFirebase()

  const workDayStart = new Date(0, 0, 0, 8, 0) // Hora de inicio de la jornada laboral (08:00 AM)
  const workDayEnd = new Date(0, 0, 0, 20, 0) // Hora de finalización de la jornada laboral (08:00 PM)

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

  const onSubmit = id => {
    if (hours.total !== '') {
      updateDocs(id, { hours: hours.total, investedHours: hours.investedHours }, authUser) // Utiliza directamente el estado hours.total proporcionar msj string al frontend
      handleClose()
    } else {
      setError('Por favor, indique fecha de inicio y fecha de término.')
    }
  }

  const handleDateChangeWrapper = dateField => date => {
    const handleDateChange = date => {
      const fieldValue = moment(date.toDate())
      const updatedHours = { ...hours }

      if (dateField === 'start') {
        updatedHours.start = fieldValue
      } else {
        updatedHours.end = fieldValue
      }

      setHours(updatedHours)
    }

    handleDateChange(date)
  }

  useEffect(() => {
    if (hours.start && hours.end) {
      const workStartHour = 8 // Hora de inicio de la jornada laboral
      const workEndHour = 20 // Hora de finalización de la jornada laboral
      const millisecondsPerHour = 60 * 60 * 1000 // Milisegundos por hora

      let startDate = hours.start.clone()
      let endDate = hours.end.clone()

      // Asegurarse de que las fechas estén dentro de las horas de trabajo
      if (startDate.hour() < workStartHour) {
        startDate.hour(workStartHour).minute(0).second(0).millisecond(0)
      }
      if (endDate.hour() > workEndHour) {
        endDate.hour(workEndHour).minute(0).second(0).millisecond(0)
      } else if (endDate.hour() < workStartHour) {
        endDate.subtract(1, 'day').hour(workEndHour).minute(0).second(0).millisecond(0)
      }

      let totalHoursWithinWorkingDays = 0
      let totalMinutes = 0

      while (startDate.isBefore(endDate)) {
        const currentDayEnd = startDate.clone().hour(workEndHour)

        if (currentDayEnd.isAfter(endDate)) {
          const durationMillis = endDate.diff(startDate)
          totalHoursWithinWorkingDays += Math.floor(durationMillis / millisecondsPerHour)
          totalMinutes += Math.floor((durationMillis % millisecondsPerHour) / (60 * 1000))
        } else {
          const durationMillis = currentDayEnd.diff(startDate)
          totalHoursWithinWorkingDays += Math.floor(durationMillis / millisecondsPerHour)
        }

        startDate.add(1, 'day').hour(workStartHour)
      }

      if (totalMinutes >= 60) {
        totalHoursWithinWorkingDays += Math.floor(totalMinutes / 60)
        totalMinutes %= 60
      }

      if (totalHoursWithinWorkingDays === 0 && totalMinutes === 0) {
        setError('La hora de término debe ser superior a la hora de inicio.')
        setIsSubmitDisabled(true)

        return
      } else {
        setError(null) // Para limpiar cualquier error previo.
        setIsSubmitDisabled(false)
      }
      const startDateAsDate = hours.start.toDate()
      const endDateAsDate = hours.end.toDate()

      setHours(prevHours => ({
        ...prevHours,
        total: `${totalHoursWithinWorkingDays} horas ${totalMinutes} minutos`,
        investedHours: {
          hours: totalHoursWithinWorkingDays,
          minutes: totalMinutes,
          selectedStartDate: startDateAsDate,
          selectedEndDate: endDateAsDate
        }
      }))
    }
  }, [hours.start, hours.end])

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
                    dayOfWeekFormatter={day => day.substring(0, 2).toUpperCase()}
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
                    dayOfWeekFormatter={day => day.substring(0, 2).toUpperCase()}
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
            justifyContent='center'
            value={hours.total}
            //onChange={handleInputChange}
            error={error !== ''}
            helperText={error}
          />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          <Button
            sx={{ lineHeight: '1.5rem', '& svg': { mr: 2 } }}
            disabled={isSubmitDisabled}
            onClick={() => onSubmit(doc.id)}
          >
            <EngineeringIcon sx={{ fontSize: 18 }} />
            Guardar
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

//export default DialogAssignProject
