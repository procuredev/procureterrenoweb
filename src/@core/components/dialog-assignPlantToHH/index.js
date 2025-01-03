import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  OutlinedInput
} from '@mui/material'
import { useFirebase } from 'src/context/useFirebase'

const AssignPlantDialog = ({ open, onClose, userId, dayDocIds, onAssign, row }) => {
  const [plant, setPlant] = useState(row.plant || '')
  const [costCenter, setCostCenter] = useState(row.costCenter || '')
  const [plants, setPlants] = useState([])
  const { getDomainData } = useFirebase()

  useEffect(() => {
    const fetchPlants = async () => {
      const plantsData = await getDomainData('plants')

      const plants = Object.entries(plantsData)
        .filter(([_, value]) => value.enabled)
        .sort((a, b) => a[1].priority - b[1].priority)
        .map(([key]) => key)

      const plantOptions = []

      // Agregar solo los nombres de Plantas
      plants.forEach(plant => {
        plantOptions.push({ id: plant, name: plant })
      })

      setPlants(plantOptions)
    }

    if (open) {
      fetchPlants()
    }
  }, [open, getDomainData])

  const handleAssign = () => {
    if (plant && costCenter.length >= 6) {
      onAssign(plant, costCenter)
      setPlant('')
      setCostCenter('')
      onClose()
    } else {
      alert('Por favor, complete ambos campos con información válida.')
    }
  }

  const handleCostCenterChange = e => {
    const { value } = e.target
    const numericValue = value.replace(/[^0-9]/g, '') // Remueve todos los caracteres no numéricos
    setCostCenter(numericValue)
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Asignar Planta y Centro de Costos</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin='normal'>
          <InputLabel id='plant-select-label'>Planta</InputLabel>
          <Select
            labelId='plant-select-label'
            value={plant}
            onChange={e => setPlant(e.target.value)}
            input={<OutlinedInput label={'Planta'} />}
          >
            {plants.map(option => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          margin='normal'
          label='Centro de Costos'
          value={costCenter}
          onChange={handleCostCenterChange}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setPlant('')
            setCostCenter('')
            onClose()
          }}
        >
          Cancelar
        </Button>
        <Button onClick={handleAssign} disabled={!plant || costCenter.length < 6}>
          Asignar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AssignPlantDialog
