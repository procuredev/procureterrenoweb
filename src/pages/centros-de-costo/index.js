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
import Typography from '@mui/material/Typography'

// ** Hooks
import { CircularProgress, TextField } from '@mui/material'
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

const DialogEditCostCenters = ({dialogOpen, handleDialogClose, selectedPlant, selectedCheckboxIndex, handleCheckboxChange, handleModifyCostCenter, handleDeleteCostCenter, handleCreateCostCenter}) => {
  return (
    <Dialog open={dialogOpen} onClose={handleDialogClose}>
      <DialogTitle>Editar Centros de Costo</DialogTitle>
      <DialogContent>
        {/* Encabezados de las columnas */}
        <Grid container alignItems="center" sx={{ mb: 2 }}>
          <Grid item sx={{ minWidth: 85, maxWidth: 85 }}>
            <Typography variant="subtitle1">Principal</Typography>
          </Grid>
          <Grid item sx={{ minWidth: 140, maxWidth: 140 }}>
            <Typography variant="subtitle1">Centro de Costo</Typography>
          </Grid>
          <Grid item sx={{ minWidth: 60, maxWidth: 60 }}>
            <Typography variant="subtitle1">Editar</Typography>
          </Grid>
          <Grid item sx={{ minWidth: 50, maxWidth: 50 }}>
            <Typography variant="subtitle1">Eliminar</Typography>
          </Grid>
        </Grid>
        {selectedPlant && selectedPlant[1].map((costCenter, index) => (
          <Grid container alignItems="center" key={`${costCenter}-${index}`}>
            <Grid sx={{minWidth: 85, maxWidth: 85, mb: 4}}>
              <Checkbox checked={selectedCheckboxIndex === index} onChange={() => handleCheckboxChange(index)} />
            </Grid>
            <Grid sx={{ minWidth: 140, maxWidth: 140 , mb:4}}>
              {costCenter}
            </Grid>
            <Grid sx={{minWidth: 60, maxWidth: 60, mb:4}}>
              <IconButton onClick={() => handleModifyCostCenter(index, costCenter)}>
                <EditIcon/>
              </IconButton>
            </Grid>
            <Grid sx={{minWidth: 50, maxWidth: 50, mb:4}}>
              <IconButton onClick={() => handleDeleteCostCenter(costCenter)}>
                <DeleteIcon/>
              </IconButton>
            </Grid>
          </Grid>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDialogClose}>Cancelar</Button>
        <Button onClick={handleCreateCostCenter} variant="contained">Agregar CC</Button>
      </DialogActions>
    </Dialog>
  )
}

const DialogCreateCostCenter = ({open, onClose, onAccept, onChange}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Agregar Centro de Costo</DialogTitle>
      <DialogContent>
        <TextField
          // key={index}
          // defaultValue={costCenter}
          fullWidth
          sx={{ mb: 4 }}
          onChange={onChange}
        />
      </DialogContent>
      <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={onAccept} variant="contained">Guardar</Button>
        </DialogActions>
  </Dialog>
  )
}

const DialogModify = ({index, costCenter, open, onClose, onAccept, onChange}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Modificar Centro de Costo</DialogTitle>
      <DialogContent>
        <TextField
          key={index}
          defaultValue={costCenter}
          fullWidth
          sx={{ mb: 4 }}
          onChange={onChange}
        />
      </DialogContent>
      <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={onAccept} variant="contained">Guardar</Button>
        </DialogActions>
  </Dialog>
  )
}

const DialogDeleteWarning = ({open, onClose, onAccept}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Advertencia</DialogTitle>
      <DialogContent>¿Estás seguro de eliminar este Centro de Costos?</DialogContent>
      <DialogActions>
          <Button onClick={onClose}>No</Button>
          <Button onClick={onAccept} variant="contained">Si</Button>
        </DialogActions>
  </Dialog>
  )
}

const DialogDefaultCostCenter = ({open, onClose, onAccept}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Advertencia</DialogTitle>
      <DialogContent>¿Estás seguro de seleccionar este Centro de Costo como principal?</DialogContent>
      <DialogActions>
          <Button onClick={onClose}>No</Button>
          <Button onClick={onAccept} variant="contained">Si</Button>
        </DialogActions>
  </Dialog>
  )
}

const DialogWaiting = ({loading, handleClose}) => {
  return (
    <Dialog sx={{ '.MuiDialog-paper': { minWidth: '20%' } }} open={loading !== null} maxWidth={false}>
      <DialogTitle sx={{ mt: 2, textAlign: 'center' }} id='spinner-dialog-title'>
        { loading ? 'Actualizando Centros de Costo' : 'Centros de Costo actualizados con éxito'}
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        { loading ? (
          <CircularProgress size={40} />
        ) : (
          <Button variant="contained" color="primary" onClick={handleClose}>
            Aceptar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}


const CentrosDeCosto = () => {
  // ** Hooks
  const { authUser, getDomainData, createCostCenter, modifyCostCenter, deleteCostCenter, setDefaultCostCenter } = useFirebase() // Importación de todos los usuarios que pertenezcan a Procure
  const router = useRouter() // Importación de router... no sé que utlidad le daré

  // ** States
  const [costCentersData, setCostCentersData] = useState([]) // declaración de constante donde se almacenan los datos de los usuarios de procure
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPlant, setSelectedPlant] = useState(null)
  const [selectedCheckboxIndex, setSelectedCheckboxIndex] = useState(0)
  const [dialogWarningOpen, setDialogWarningOpen] = useState(false)
  const [selectedCostCenter, setSelectedCostCenter] = useState(null)
  const [selectedCostCenterIndex, setSelectedCostCenterIndex] = useState(null)
  const [waiting, setWaiting] = useState(null)
  const [dialogModifyOpen, setDialogModifyOpen] = useState(false)
  const [newCostCenterValue, setNewCostCenterValue] = useState(null)
  const [dialogCreateCostCenterOpen, setDialogCreateCostCenterOpen] = useState(false)
  const [dialogDefaultCostCenterOpen, setDialogDefaultCostCenterOpen] = useState(false)

  const handleEdit = (plant) => {
    setSelectedPlant(plant)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedPlant(null)
  }

  const handleDeleteCostCenter = (costCenter) => {
    setDialogWarningOpen(true)
    setSelectedCostCenter(costCenter)
  }

  const handleCloseDialogWarning = () => {
    setDialogWarningOpen(false)
  }

  const handleConfirmDeletion = async () => {
    setWaiting(true)
    try {
      await deleteCostCenter(selectedPlant[0], selectedCostCenter)
      setWaiting(false)
    } catch (error) {
      console.error('Error eliminando Centro de Costo:', error)
      setWaiting(false)
    }
    setDialogWarningOpen(false)
  }

  const handleCloseCircularProgress = () => {
    setWaiting(null)
    window.location.reload() // Recarga la página
  }

  const handleModifyCostCenter = (index, costCenter) => {
    setDialogModifyOpen(true)
    setSelectedCostCenterIndex(index)
    setSelectedCostCenter(costCenter)
  }

  const handleCloseDialogModify = () => {
    setDialogModifyOpen(false)
  }

  const handleConfirmModification = async () => {
    setWaiting(true)
    try {
      await modifyCostCenter(selectedPlant[0], selectedCostCenterIndex, newCostCenterValue)
      setWaiting(false)
    } catch (error) {
      console.error('Error modificando Centro de Costo:', error)
      setWaiting(false)
    }
    setDialogWarningOpen(false)
  }

  const handleCreateCostCenter = (costCenter) => {
    setDialogCreateCostCenterOpen(true)
  }

  const handleCloseDialogCreateCostCenter = () => {
    setDialogCreateCostCenterOpen(false)
  }

  const handleConfirmCreate = async () => {
    setWaiting(true)
    try {
      await createCostCenter(selectedPlant[0], newCostCenterValue)
      setWaiting(false)
    } catch (error) {
      console.error('Error Agregando Centro de Costo:', error)
      setWaiting(false)
    }
    setDialogWarningOpen(false)
  }

  const handleCheckboxChange = (index) => {
    setSelectedCheckboxIndex(index)
    setDialogDefaultCostCenterOpen(true)
  }

  const handleCloseDialoDefaultCostCenter = () => {
    setSelectedCheckboxIndex(0)
    setDialogDefaultCostCenterOpen(false)
  }

  const handleConfirmDefaultCostCenter = async () => {
    setWaiting(true)
    try {
      await setDefaultCostCenter(selectedPlant[0], selectedCheckboxIndex)
      setWaiting(false)
    } catch (error) {
      console.error('Error modificando Centro de Costo por defecto:', error)
      setWaiting(false)
    }
    setDialogWarningOpen(false)
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

      <DialogEditCostCenters
        dialogOpen={dialogOpen}
        handleDialogClose={handleDialogClose}
        selectedPlant={selectedPlant}
        setSelectedPlant={setSelectedPlant}
        selectedCheckboxIndex={selectedCheckboxIndex}
        handleCheckboxChange={handleCheckboxChange}
        handleModifyCostCenter={handleModifyCostCenter}
        handleDeleteCostCenter={handleDeleteCostCenter}
        handleCreateCostCenter={handleCreateCostCenter}
      />

      <DialogCreateCostCenter
        open={dialogCreateCostCenterOpen}
        onClose={handleCloseDialogCreateCostCenter}
        onAccept={handleConfirmCreate}
        onChange={(event) => {setNewCostCenterValue(event.target.value)}}
      />

      <DialogModify
        index={selectedCostCenterIndex}
        costCenter={selectedCostCenter}
        open={dialogModifyOpen}
        onClose={handleCloseDialogModify}
        onAccept={handleConfirmModification}
        onChange={(event) => {setNewCostCenterValue(event.target.value)}}
      />

      <DialogDeleteWarning
        open={dialogWarningOpen}
        onClose={handleCloseDialogWarning}
        onAccept={handleConfirmDeletion}
      />

      <DialogDefaultCostCenter
        open={dialogDefaultCostCenterOpen}
        onClose={handleCloseDialoDefaultCostCenter}
        onAccept={handleConfirmDefaultCostCenter}
      />

      {waiting !== null && (
        <DialogWaiting loading={waiting} handleClose={handleCloseCircularProgress} />
      )}

    </Grid>
  )
}

CentrosDeCosto.acl = {
  subject: 'centros-de-costo'
}

export default CentrosDeCosto
