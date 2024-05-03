import React, { useState, useMemo } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'

const DialogCreateHours = ({ open, onClose, onSubmit, otOptions, existingRows, userParams }) => {
  const [inputHoursType, setInputHoursType] = useState('')
  const [plant, setPlant] = useState('')
  const [isGabinete, setIsGabinete] = useState(true)
  const [otNumber, setOtNumber] = useState('')
  const [otID, setOtID] = useState('')
  const [otPlant, setOtPlant] = useState('')
  const [otCostCenter, setOtCostCenter] = useState('')
  const [selectedOt, setSelectedOt] = useState({})

  const handleInputHoursTypeChange = event => {
    setInputHoursType(event.target.value)
    setPlant('')
    setIsGabinete(true)
    setOtNumber('')
  }

  const handlePlantChange = event => {
    setPlant(event.target.value)
  }

  const handleIsGabineteChange = (event, newAlignment) => {
    if (newAlignment !== null) {
      setIsGabinete(newAlignment)
    }
  }

  const handleOtNumberChange = event => {
    const selectedValue = event.target.value
    const foundOt = otOptions.find(option => option.ot === selectedValue)
    if (foundOt) {
      setOtNumber(foundOt.ot)
      setSelectedOt(foundOt)
    }
  }

  const handleSubmit = event => {
    event.preventDefault()
    if (inputHoursType && ((inputHoursType === 'OT' && selectedOt.ot) || (inputHoursType !== 'OT' && plant))) {
      onSubmit({
        inputHoursType,
        plant: inputHoursType === 'OT' ? selectedOt.plant : plant,
        ...(inputHoursType === 'OT' && {
          isGabinete,
          otID: selectedOt.id,
          otNumber: selectedOt.ot,
          costCenter: selectedOt.costCenter
        })
      })
    } else {
      alert('Por favor, llena todos los campos requeridos.')
    }
  }

  const filteredOtOptions = useMemo(() => {
    const existingOtNumbers = new Set(
      existingRows.filter(row => row.inputHoursType === 'OT' && row.isGabinete === isGabinete).map(row => row.otNumber)
    )

    return otOptions.filter(option => !existingOtNumbers.has(option.ot))
  }, [otOptions, existingRows, isGabinete])

  const showISC = useMemo(() => !existingRows.some(row => row.inputHoursType === 'ISC'), [existingRows])
  const showVacations = useMemo(() => !existingRows.some(row => row.inputHoursType === 'Vacaciones'), [existingRows])

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Agregar Nueva Jornada</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin='normal'>
          <InputLabel id='inputHoursType-label'>Tipo de Horas</InputLabel>
          <Select
            labelId='inputHoursType-label'
            id='inputHoursType'
            value={inputHoursType}
            label='Tipo de Horas'
            onChange={handleInputHoursTypeChange}
          >
            {showISC && <MenuItem value='ISC'>ISC</MenuItem>}
            {showVacations && <MenuItem value='Vacaciones'>Vacaciones</MenuItem>}
            <MenuItem value='OT'>OT</MenuItem>
          </Select>
        </FormControl>

        {(inputHoursType === 'ISC' || inputHoursType === 'Vacaciones') && (
          <FormControl fullWidth margin='normal'>
            <InputLabel id='plant-label'>Planta</InputLabel>
            <Select labelId='plant-label' id='plant' value={plant} label='Planta' onChange={handlePlantChange}>
              {userParams.plant.map(plantOption => (
                <MenuItem key={plantOption} value={plantOption}>
                  {plantOption}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {inputHoursType === 'OT' && (
          <>
            <ToggleButtonGroup color='primary' value={isGabinete} exclusive onChange={handleIsGabineteChange} fullWidth>
              <ToggleButton value={true}>Gabinete</ToggleButton>
              <ToggleButton value={false}>Levantamiento</ToggleButton>
            </ToggleButtonGroup>
            <FormControl fullWidth margin='normal'>
              <InputLabel id='otNumber-label'>Número OT</InputLabel>
              <Select
                labelId='otNumber-label'
                id='otNumber'
                value={otNumber}
                label='Número OT'
                onChange={handleOtNumberChange}
              >
                {filteredOtOptions.map(option => (
                  <MenuItem key={option.id} value={option.ot}>
                    {option.ot}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={event => handleSubmit(event)}>Crear</Button>
      </DialogActions>
    </Dialog>
  )
}

export default DialogCreateHours
