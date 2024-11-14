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
import { useFirebase } from 'src/context/useFirebase'

// Función que llenará los datos de cada Card con las Plantas y sus respectivos Centros de Costo.
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
              <Typography variant='h8' sx={{ mb: 1 }}>
                {costCenter}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Box>
    </Card>
  )
}

// Dialog que mostrará los Centros de Costo de una Planta y aparacerán los botones para Editar, Borrar, Agregar o Marcar como Principal.
const DialogEditCostCenters = ({dialogOpen, handleDialogClose, selectedPlant, selectedCheckboxIndex, handleCheckboxChange, handleModifyCostCenter, handleDeleteCostCenter, handleCreateCostCenter}) => {
  return (
    <Dialog open={dialogOpen} onClose={handleDialogClose}>
      <DialogTitle>Editar Planta</DialogTitle>
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

        {/* Datos, Botones y Checkbox */}
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
              <IconButton onClick={() => handleDeleteCostCenter(costCenter)} disabled={selectedPlant[1].length<=1}>
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

// Dialog para Agregar un Centro de Costo.
const DialogCreateCostCenter = ({open,value, onClose, onAccept, onChange}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Agregar Centro de Costo</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          type='text'
          inputProps={{inputMode: 'numeric', maxLength: 25}}
          value={value}
          sx={{ mb: 4 }}
          onChange={onChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onAccept} variant="contained" disabled={value === ''}>Guardar</Button>
      </DialogActions>
  </Dialog>
  )
}

// Dialog para modificar un Centro de Costo.
const DialogModify = ({index, value, costCenter, open, onClose, onAccept, onChange}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Modificar Centro de Costo</DialogTitle>
      <DialogContent>
        <TextField
          key={index}
          defaultValue={costCenter}
          fullWidth
          type='text'
          inputProps={{inputMode: 'numeric', maxLength: 25}}
          value={value}
          sx={{ mb: 4 }}
          onChange={onChange}
        />
      </DialogContent>
      <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={onAccept} variant="contained" disabled={value === ''}>Guardar</Button>
        </DialogActions>
  </Dialog>
  )
}

// Dialog para Eliminar un Centro de Costo.
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

// Dialog para definir un Centro de Costo como el Principal.
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

// Dialog de espera mientras se ejecuta alguna acción de modificación a los Centros de Costo.
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


// Función principal de módulo de Centros de Costo.
const CentrosDeCosto = () => {
  // ** Hooks
  const { getDomainData, createCostCenter, modifyCostCenter, deleteCostCenter, setDefaultCostCenter } = useFirebase() // Importación de todos los usuarios que pertenezcan a Procure

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
  const [newCostCenterValue, setNewCostCenterValue] = useState('')
  const [dialogCreateCostCenterOpen, setDialogCreateCostCenterOpen] = useState(false)
  const [dialogDefaultCostCenterOpen, setDialogDefaultCostCenterOpen] = useState(false)

  // Función para manejar la edición de una Planta.
  // Se activa al hacer click en Botón Editar "Lápiz" en una Planta.
  const handleEdit = (plant) => {
    setSelectedPlant(plant)
    setDialogOpen(true)
  }

  // Función para manejar el cierre del Dialog de una Planta.
  // Se activa al hacer click en Botón "Cancelar".
  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedPlant(null)
  }

  // Función para eliminar un Centro de Costo.
  // Se activa al hacer click en Botón "Basura".
  // Sólo hará que se abra un nuevo Dialog de Confirmación
  const handleDeleteCostCenter = (costCenter) => {
    setDialogWarningOpen(true)
    setSelectedCostCenter(costCenter)
  }

  // Función para manejar el cierre del Dialog de Eliminación de un Centro de Costo.
  // Se activa al hacer click en Botón "No".
  const handleCloseDialogWarning = () => {
    setDialogWarningOpen(false)
  }

  // Función que maneja la confirmación de eliminación del Centro de Costo.
  // Esta llama a Firebase para su eliminación.
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

  // Función que maneja la aparición del Dialog de espera / Spinner  mientras se ejecuta alguna acción.
  // Las acciones pueden ser: agregar, eliminar, modificar o marcar como principal.
  const handleCloseCircularProgress = () => {
    setWaiting(null)
    window.location.reload() // Recarga la página
  }

  // Función para modificar un Centro de Costo.
  // Se activa al hacer click en Botón Editar "Lápiz".
  // Sólo hará que se abra un nuevo Dialog de Confirmación
  const handleModifyCostCenter = (index, costCenter) => {
    setNewCostCenterValue(costCenter)
    setDialogModifyOpen(true)
    setSelectedCostCenterIndex(index)
    setSelectedCostCenter(costCenter)
  }

  // Función para manejar el cierre del Dialog de Modificación de un Centro de Costo.
  // Se activa al hacer click en Botón "Cancelar".
  const handleCloseDialogModify = () => {
    setNewCostCenterValue('')
    setDialogModifyOpen(false)
  }

  // Función que maneja la confirmación de modificación del Centro de Costo.
  // Esta llama a Firebase para su modificación.
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

  // Función para Crear un Centro de Costo.
  // Se activa al hacer click en Botón "Crear CC".
  // Sólo hará que se abra un nuevo Dialog de Confirmación
  const handleCreateCostCenter = () => {
    setNewCostCenterValue('')
    setDialogCreateCostCenterOpen(true)
  }

  // Función para manejar el cierre del Dialog de Agregar un Centro de Costo.
  // Se activa al hacer click en Botón "Cancelar".
  const handleCloseDialogCreateCostCenter = () => {
    setNewCostCenterValue('')
    setDialogCreateCostCenterOpen(false)
  }

  // Función que maneja la confirmación de Crear un Centro de Costo.
  // Esta llama a Firebase para su Creación.
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

  // Función que maneja la selección de un ceckbox (Marcar como Principal).
  // Además, hará que se abra un nuevo Dialog de Confirmación.
  const handleCheckboxChange = (index) => {
    setSelectedCheckboxIndex(index)
    setDialogDefaultCostCenterOpen(true)
  }

  // Función para manejar el cierre del Dialog de "Marcar como Principal" a un Centro de Costo.
  // Se activa al hacer click en Botón "No".
  const handleCloseDialoDefaultCostCenter = () => {
    setSelectedCheckboxIndex(0)
    setDialogDefaultCostCenterOpen(false)
  }

  // Función que maneja la confirmación de "Marcar como Principal" a un Centro de Costo.
  // Esta llama a Firebase para la modificación del Array de Centros de Costo de esa Planta.
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

  // Función que maneja el cambio de newCostCenterValue.
  const handleInputChange = (event) => {
    var value = event.target.value
    value = value.replace(/\D/g,'')

    setNewCostCenterValue(value)
  }

  // useEffect para almacenar dentro de costCentersData los datos de Centros de Costos de cada Planta.
  // Se actualiza al entrar al módulo o recargar la página.
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


  // Return con Cards y Dialogs

  return (

    //Grid que Contendrá los Cards y los Dialogs.
    <Grid container spacing={2}>

      {/* Cards con cada una de las Plantas y sus Centros de Costos. */}
      {costCentersData.length > 0 ? (
        costCentersData.map((plant, index) => (
          <Grid item xs={12} sm={12} md={6} key={index}>
            <AppCard plant={plant} onEdit={() => handleEdit(plant)} />
          </Grid>
        ))
      ) : (
        <Typography variant="body1">Cargando Plantas y Centros de Costo...</Typography>
      )}

      {/* Dialog de Edición de Una Planta. */}
      {dialogOpen && (
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
      )}

      {/* Dialog de Creación de un Centro de Costo. */}
      <DialogCreateCostCenter
        open={dialogCreateCostCenterOpen}
        value={newCostCenterValue}
        onClose={handleCloseDialogCreateCostCenter}
        onAccept={handleConfirmCreate}
        onChange={handleInputChange}
      />

      {/* Dialog de Modificación de un Centro de Costo. */}
      <DialogModify
        index={selectedCostCenterIndex}
        costCenter={selectedCostCenter}
        open={dialogModifyOpen}
        value={newCostCenterValue}
        onClose={handleCloseDialogModify}
        onAccept={handleConfirmModification}
        onChange={handleInputChange}
      />

      {/* Dialog de Eliminación de un Centro de Costo. */}
      <DialogDeleteWarning
        open={dialogWarningOpen}
        onClose={handleCloseDialogWarning}
        onAccept={handleConfirmDeletion}
      />

      {/* Dialog de "Marcar como Principal" un Centro de Costo. */}
      <DialogDefaultCostCenter
        open={dialogDefaultCostCenterOpen}
        onClose={handleCloseDialoDefaultCostCenter}
        onAccept={handleConfirmDefaultCostCenter}
      />

      {/* Dialog de espera (spinner) mientras se ejecuta alguna acción. */}
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
