// ** React Imports
import { useState, useEffect, useRef } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import Box from '@mui/material/Box'
import { useGridApiRef } from '@mui/x-data-grid'
import { Autocomplete, ListItemText, ListItem, List } from '@mui/material'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

// ** Custom Components Imports

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

// ** Demo Components Imports
import tableBody from 'public/html/table.js'
import TableGabinete from 'src/views/table/data-grid/TableGabinete'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { generateTransmittal } from 'src/@core/utils/generate-transmittal'
import { DialogAssignDesigner } from 'src/@core/components/dialog-assignDesigner'
import { DialogCodeGenerator } from 'src/@core/components/dialog-codeGenerator'
import DialogErrorTransmittal from 'src/@core/components/dialog-errorTransmittal'
import DialogFinishOt from 'src/@core/components/dialog-finishOt'
import { el } from 'date-fns/locale'

const DataGridGabinete = () => {
  const [currentPetition, setCurrentPetition] = useState(null)
  const [currentOT, setCurrentOT] = useState(null)
  const [currentAutoComplete, setCurrentAutoComplete] = useState(null)
  const [roleData, setRoleData] = useState({ name: 'admin' })
  const [open, setOpen] = useState(false)
  const [proyectistas, setProyectistas] = useState([])
  const [openCodeGenerator, setOpenCodeGenerator] = useState(false)
  const [openFinishOt, setOpenFinishOt] = useState(false)
  const [blueprintGenerated, setBlueprintGenerated] = useState(false)
  const [designerAssigned, setDesignerAssigned] = useState(false)
  const [transmittalGenerated, setTransmittalGenerated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorTransmittal, setErrorTransmittal] = useState(false)
  const [openTransmittalDialog, setOpenTransmittalDialog] = useState(false)
  const [selectedDocs, setSelectedDocs] = useState([])

  const apiRef = useGridApiRef()

  const currentPetitionRef = useRef()

  const {
    useSnapshot,
    authUser,
    getUserData,
    useBlueprints,
    generateTransmittalCounter,
    updateSelectedDocuments,
    finishPetition,
    subscribeToPetition
  } = useFirebase()

  let petitions = useSnapshot(false, authUser, true)

  if (authUser.role === 8) {
    petitions = petitions.filter(petition =>
      petition.designerReview?.find(item => item.hasOwnProperty('userId') && item['userId'] === authUser.uid)
    )
  }

  //let blueprints = useBlueprints(currentPetition?.id)
  const [blueprints, setBlueprints] = useBlueprints(currentPetition?.id)

  const theme = useTheme()
  const smDown = useMediaQuery(theme.breakpoints.down('sm'))
  const mdDown = useMediaQuery(theme.breakpoints.down('md'))
  const lgDown = useMediaQuery(theme.breakpoints.down('lg'))
  const xlDown = useMediaQuery(theme.breakpoints.down('xl'))

  const handleClickOpenCodeGenerator = doc => {
    setOpenCodeGenerator(true)
  }

  const finishOtCallback = () => {
    setIsLoading(true)
    finishPetition(currentPetition, authUser)
      .then(() => {
        setIsLoading(false)
        setOpenFinishOt(false)
      })
      .catch(error => {
        setIsLoading(false)
        console.error(error)
      })
  }

  const handleCloseCodeGenerator = () => {
    setOpenCodeGenerator(false)
  }

  const handleClickOpenFinishOt = doc => {
    setOpenFinishOt(true)
  }

  const handleCloseFinishOt = () => {
    setOpenFinishOt(false)
  }

  const handleClickOpen = doc => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleChange = value => {
    setCurrentOT(value?.value)
    const currentDoc = petitions.find(doc => doc.ot == value?.value)
    setCurrentPetition(currentDoc)
  }

  const handleCloseErrorTransmittal = () => {
    setErrorTransmittal(false)
  }

  const handleGenerateTransmittal = (tableElement, selected, newCode) => {
    generateTransmittal(tableElement, selected, setTransmittalGenerated, newCode)
  }

  const handleOpenTransmittalDialog = () => {
    // Obtén los documentos seleccionados del apiRef de DataGrid
    const selectedDocuments = apiRef.current.getSelectedRows()
    setSelectedDocs(Array.from(selectedDocuments.values()))
    console.log(selectedDocuments)
    setOpenTransmittalDialog(true)
  }

  const handleClickTransmittalGenerator = async currentPetition => {
    try {
      // Actualiza el campo lastTransmittal en cada uno de los documentos seleccionados
      const selected = apiRef.current.getSelectedRows()

      // Ahora, añade este contador al final de tu newCode
      const newCode = await generateTransmittalCounter(currentPetition)

      await updateSelectedDocuments(newCode, selected, currentPetition, authUser)

      let tableElement = document.createElement('table')
      let numberOfDocuments = selected.size

      selected.forEach((value, key) => {
        if (value.hasOwnProperty('storageHlcDocuments') && value.storageHlcDocuments !== null) {
          numberOfDocuments++
        }
      })

      tableElement.innerHTML = tableBody(newCode, numberOfDocuments)

      if (selected.size === 0) {
        setErrorTransmittal(true)
      } else {
        handleGenerateTransmittal(tableElement, selected, newCode)
      }
    } catch (error) {
      console.error('Error al generar Transmittal:', error)
      throw new Error('Error al generar Transmittal')
    }
  }

  const petitionFinished = currentPetition?.otFinished

  useEffect(() => {
    if (currentPetition && currentPetition.id) {
      const idDoc = currentPetition.id

      const unsubscribe = subscribeToPetition(idDoc, newPetition => {
        // Compara el nuevo valor con el ref actual
        if (JSON.stringify(newPetition) !== JSON.stringify(currentPetitionRef.current)) {
          setCurrentPetition(newPetition)
          currentPetitionRef.current = newPetition // Actualiza el ref
        }
      })

      // Devuelve una función para limpiar la suscripción
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe()
        }
      }
    }
  }, [currentPetition])

  // Actualizar el ref cuando `currentPetition` cambie
  useEffect(() => {
    currentPetitionRef.current = currentPetition
  }, [currentPetition])

  useEffect(() => {
    if (currentPetition) {
      const fetchRoleAndProyectistas = async () => {
        if (authUser) {
          // Cargar los proyectistas
          const resProyectistas = await getUserData('getUserProyectistas', null, authUser)
          setProyectistas(resProyectistas)
        }
      }

      fetchRoleAndProyectistas()
    }
  }, [authUser])

  useEffect(() => {
    if (transmittalGenerated) {
      // Aquí puedes realizar las operaciones necesarias para actualizar la interfaz de usuario
      // ...

      // Actualiza 'blueprints'.
      setBlueprints([...blueprints])

      // Luego, restablece el estado a false para estar listo para la próxima generación de transmittal
      setTransmittalGenerated(false)
    }
  }, [transmittalGenerated, setBlueprints])

  return (
    <Box id='main' sx={{ display: 'flex', width: '100%', flexDirection: 'column' }}>
      <Autocomplete
        options={petitions.map(doc => ({ value: doc.ot, title: doc.title }))}
        getOptionLabel={option => option.value + ' ' + option.title + ' '}
        sx={{ mx: 6.5 }}
        onChange={(event, value) => handleChange(value)}
        onInputChange={(event, value) => setCurrentAutoComplete(value)}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        renderInput={params => <TextField {...params} label='OT' />}
      />
      <Box sx={{ m: 4, display: 'flex' }}>
        <TextField
          sx={{ m: 2.5, width: '50%' }}
          label='Tipo de levantamiento'
          value={currentPetition ? currentPetition.objective : ''}
          id='form-props-read-only-input'
          InputProps={{ readOnly: true }}
        />
        <TextField
          sx={{ m: 2.5, width: '50%' }}
          label='Entregable'
          value={currentPetition && currentPetition.deliverable ? currentPetition.deliverable.map(item => item) : ''}
          id='form-props-read-only-input'
          InputProps={{ readOnly: true }}
        />
        <Autocomplete
          multiple
          readOnly
          sx={{ m: 2.5, width: '100%' }}
          value={
            (currentOT && petitions.find(doc => doc.ot == currentOT)?.designerReview?.map(item => item.name)) || []
          }
          options={[]}
          renderInput={params => (
            <TextField
              {...params}
              label='Proyectistas asignados'
              readOnly={true}
              sx={{
                '& .MuiInputBase-inputAdornedStart': { display: 'none' },
                '& .MuiSvgIcon-root': { display: 'none' }
              }}
            />
          )}
        />

        {authUser.role === 5 || authUser.role === 6 ? (
          currentPetition?.otFinished ? (
            <Button
              sx={{ width: '50%', m: 2.5, fontSize: xlDown ? '0.7rem' : '0.8rem' }}
              variant='contained'
              disabled={!currentPetition?.otReadyToFinish}
              onClick={() => currentPetition && handleClickOpenFinishOt(currentPetition)}
              color='info'
            >
              Reanudar OT
            </Button>
          ) : (
            <Button
              sx={{ width: '50%', m: 2.5, fontSize: xlDown ? '0.7rem' : '0.8rem' }}
              variant='contained'
              disabled={!currentPetition?.otReadyToFinish}
              onClick={() => currentPetition && handleClickOpenFinishOt(currentPetition)}
            >
              Finalizar OT
            </Button>
          )
        ) : authUser.role === 8 ? (
          <Button
            sx={{ width: '50%', m: 2.5, fontSize: xlDown ? '0.7rem' : '0.8rem' }}
            variant='contained'
            disabled={currentPetition?.otFinished}
            onClick={() => currentPetition && handleClickOpenCodeGenerator(currentPetition)}
          >
            Generar nuevo documento
          </Button>
        ) : authUser.role === 7 ? (
          <>
            <Button
              sx={{ width: '50%', m: 2.5, fontSize: xlDown ? '0.7rem' : '0.8rem' }}
              variant='contained'
              disabled={currentPetition?.otFinished}
              onClick={() => currentPetition && handleClickOpen(currentPetition)}
            >
              Asignar proyectista
            </Button>
          </>
        ) : authUser.role === 9 ? (
          <Button
            sx={{ width: '50%', m: 2.5, fontSize: xlDown ? '0.7rem' : '0.8rem' }}
            variant='contained'
            disabled={currentPetition?.otFinished}
            onClick={handleOpenTransmittalDialog}
          >
            Generar Transmittal
          </Button>
        ) : (
          ''
        )}

        {authUser.role === 7 &&
        currentPetition &&
        currentPetition.designerReview &&
        currentPetition.designerReview.find(user => user.userId === authUser.uid) ? (
          <Button
            sx={{ width: '50%', m: 2.5, fontSize: xlDown ? '0.7rem' : '0.8rem' }}
            variant='contained'
            disabled={currentPetition?.otFinished}
            onClick={() => currentPetition && handleClickOpenCodeGenerator(currentPetition)}
          >
            Generar nuevo documento
          </Button>
        ) : (
          ''
        )}
      </Box>
      <Box sx={{ m: 4, height: '100%' }}>
        <TableGabinete
          rows={blueprints ? blueprints : []}
          roleData={roleData}
          role={authUser.role}
          petitionId={currentPetition ? currentPetition.id : null}
          petition={currentPetition ? currentPetition : null}
          setBlueprintGenerated={setBlueprintGenerated}
          apiRef={apiRef}
        />
      </Box>

      <DialogAssignDesigner
        open={open}
        handleClose={handleClose}
        doc={petitions.find(petition => petition.ot == currentOT)}
        proyectistas={proyectistas}
        setDesignerAssigned={setDesignerAssigned}
      />
      <Dialog
        open={openTransmittalDialog}
        onClose={() => setOpenTransmittalDialog(false)}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
      >
        <DialogTitle id='alert-dialog-title'>{'Generar Transmittal'}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            ¿Está seguro de que desea generar un transmittal para los siguientes documentos?
          </DialogContentText>
          <List>
            {Array.from(selectedDocs.values()).map(doc => (
              <ListItem key={doc.id}>
                <ListItemText primary={doc.id} secondary={doc.clientCode} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTransmittalDialog(false)} color='primary'>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              handleClickTransmittalGenerator(currentPetition)
              setOpenTransmittalDialog(false)
            }}
            color='primary'
            autoFocus
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
      {openCodeGenerator && (
        <DialogCodeGenerator
          open={openCodeGenerator}
          handleClose={handleCloseCodeGenerator}
          doc={currentPetition}
          roleData={roleData}
          setBlueprintGenerated={setBlueprintGenerated}
        />
      )}
      {openFinishOt && (
        <DialogFinishOt
          open={openFinishOt}
          handleClose={handleCloseFinishOt}
          callback={finishOtCallback}
          isLoading={isLoading}
          petitionFinished={petitionFinished}
        />
      )}
      {errorTransmittal && <DialogErrorTransmittal open={errorTransmittal} handleClose={handleCloseErrorTransmittal} />}
    </Box>
  )
}

export default DataGridGabinete
