import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  OutlinedInput,
  Typography,
  Autocomplete,
  TextField
} from '@mui/material'
import { format, getISOWeek, isFuture } from 'date-fns'
import { CustomSelectOptions } from 'src/@core/components/custom-form/index'

const DialogCreateHours = ({ open, onClose, onSubmit, authUser, otOptions, rows, weekStart }) => {
  const [hoursType, setHoursType] = useState('')
  const [otType, setOtType] = useState('')
  const [otNumber, setOtNumber] = useState('')
  const [selectedOT, setSelectedOT] = useState({})
  const [filteredOtOptions, setFilteredOtOptions] = useState([])
  const [errorMessage, setErrorMessage] = useState('')

  // Obtiene los tipos de horas existentes en las filas
  const existingHoursTypes = rows.map(row => row.hoursType.toUpperCase())

  // Filtra las opciones basadas en los tipos de horas existentes
  const getFilteredHoursTypeOptions = () => {
    const options = ['ISC', 'Vacaciones', 'OT']

    if (authUser.role !== 1 && authUser.role !== 5 && authUser.role !== 10 && isFuture(weekStart)) {
      return ['Vacaciones']
    }

    return options.filter(option => option === 'OT' || !existingHoursTypes.includes(option.toUpperCase()))
  }

  const generateRowId = (uid, weekNumber, index) => {
    return `${uid}_${weekNumber}_${new Date().getTime()}`
  }

  const handleFormSubmit = () => {
    const weekNumber = getISOWeek(new Date()) // Usa date-fns para obtener el número de la semana ISO
    const existingRowsCount = rows.length // 'rows' disponibles en el contexto con las filas actuales

    if (hoursType && (hoursType !== 'OT' || (hoursType === 'OT' && otType && otNumber))) {
      const newRowId = generateRowId(authUser.uid, weekNumber, existingRowsCount + 1)

      onSubmit({
        rowId: newRowId,
        hoursType,
        ...(hoursType === 'OT' && {
          otID: selectedOT.id,
          otNumber,
          otType,
          plant: selectedOT.plant,
          costCenter: selectedOT.costCenter
        })
      })
      onClose()
      setErrorMessage('')
    } else {
      setErrorMessage('Por favor, complete todos los campos requeridos.')
    }
  }

  const handleOTNumberChange = (event, newValue) => {
    const otDetails = otOptions.find(option => option.ot === newValue)
    setSelectedOT(otDetails || {})
    setOtNumber(newValue)
  }

  // Filtrar las opciones de otNumber basadas en la selección de otType
  useEffect(() => {
    if (otType) {
      const existingOtNumbers = rows
        .filter(row => row.hoursType === 'OT' && row.otType === otType)
        .map(row => row.otNumber)

      const filteredOptions = otOptions.filter(option => !existingOtNumbers.includes(option.ot))
      setFilteredOtOptions(filteredOptions)
    } else {
      setFilteredOtOptions(otOptions)
    }
  }, [otType, rows, otOptions])

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Crear Nueva Fila</DialogTitle>
      <DialogContent>
        <Box component='form' sx={{ '& .MuiFormControl-root': { marginTop: 2, width: '100%' } }}>
          <CustomSelectOptions
            options={getFilteredHoursTypeOptions()}
            label='Tipo de Horas'
            value={hoursType}
            onChange={e => setHoursType(e.target.value)}
          />
        </Box>
        {hoursType === 'OT' && (
          <Box sx={{ marginTop: 4 }}>
            <CustomSelectOptions
              options={['Gabinete', 'Levantamiento']}
              label='Tipo OT'
              value={otType}
              onChange={e => setOtType(e.target.value)}
            />

            <FormControl fullWidth margin='normal' sx={{ '& .MuiInputBase-root ': { width: '100%' } }}>
              <Box width={'100%'}>
                <Autocomplete
                  id='otNumber-autocomplete'
                  options={filteredOtOptions.map(option => option.ot)}
                  value={otNumber}
                  onChange={handleOTNumberChange}
                  renderInput={params => <TextField {...params} label='Número OT' variant='outlined' />}
                />
              </Box>
            </FormControl>
          </Box>
        )}
        {errorMessage && (
          <Typography color='error' sx={{ mt: 2 }}>
            {errorMessage}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleFormSubmit}>Crear</Button>
      </DialogActions>
    </Dialog>
  )
}

export default DialogCreateHours
