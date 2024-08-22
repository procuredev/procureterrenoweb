// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Import
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// ** Hooks
import { useRouter } from 'next/router'
import { useFirebase } from 'src/context/useFirebase'

// Función que llenará los datos de cada card
const AppCard = ({ plant, onEdit }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h6' sx={{ mb: 1 }}>
              {plant[0]}
            </Typography>
            <IconButton aria-label="edit" onClick={onEdit}>
              <EditIcon />
            </IconButton>
          </Box>
          {plant[1].map(costCenter => (
            <Box key={costCenter} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='h6' sx={{ mb: 1 }}>
                {costCenter}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Box>
    </Card>
  )
}

const CentrosDeCosto = () => {
  // ** Hooks
  const { authUser, getDomainData } = useFirebase() // Importación de todos los usuarios que pertenezcan a Procure
  const router = useRouter() // Importación de router... no sé que utlidad le daré

  // ** States
  const [costCentersData, setCostCentersData] = useState([]) // declaración de constante donde se almacenan los datos de los usuarios de procure
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPlant, setSelectedPlant] = useState(null)
  const [selectedCheckboxIndex, setSelectedCheckboxIndex] = useState(0)

  const handleEdit = (plant) => {
    setSelectedPlant(plant)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedPlant(null)
  }

  const handleSave = () => {
    // Aquí deberías actualizar los datos de `costCentersData` con los cambios realizados en el diálogo
    setDialogOpen(false)
  }

  const handleCheckboxChange = (index) => {
    setSelectedCheckboxIndex(index)
  }

  const handleDeleteCostCenter = () => {
    //
  }

  // useEffect para almacenar dentro de costCentersData
  useEffect(() => {
    const fetchCostCenters = async () => {
      try {
        const costCenters = await getDomainData('costCenters')
        const costCentersArray = Object.keys(costCenters).map((key) => [key, costCenters[key]])

        // Ordenar los elementos alfabéticamente por el nombre del `plant`
        costCentersArray.sort((a, b) => a[0].localeCompare(b[0]))

        setCostCentersData(costCentersArray)
      } catch (error) {
        console.error('Error al obtener los Centros de Costo de Procure:', error)
      }
    }

    fetchCostCenters()
  }, [])


  return (
    <Grid container spacing={2}>
      {costCentersData.length > 0 ? (
        costCentersData.map((plant, index) => (
          <Grid item xs={12} sm={12} md={6} key={index}>
            <AppCard plant={plant} onEdit={() => handleEdit(plant)} />
          </Grid>
        ))
      ) : (
        <Typography variant="body1">Cargando usuarios...</Typography>
      )}

      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Editar Centros de Costo</DialogTitle>
        <DialogContent>
          {selectedPlant && selectedPlant[1].map((costCenter, index) => (
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Checkbox checked={selectedCheckboxIndex === index} onChange={() => handleCheckboxChange(index)} />
              </Grid>
              <Grid item xs>
                <TextField
                  key={index}
                  label={`Centro de Costo ${index + 1}`}
                  defaultValue={costCenter}
                  fullWidth
                  sx={{ mt: 4 }}
                  onChange={(e) => {
                    const updatedPlant = [...selectedPlant]
                    updatedPlant[1][index] = e.target.value
                    setSelectedPlant(updatedPlant)
                  }}
                />
              </Grid>
              <Grid item>
                <IconButton onClick={() => handleDeleteCostCenter()}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

CentrosDeCosto.acl = {
  subject: 'centros-de-costo'
}

export default CentrosDeCosto
