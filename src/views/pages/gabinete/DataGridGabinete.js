// ** React Imports
import { useState, useEffect, useRef } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import Box from '@mui/material/Box'
import { useGridApiRef } from '@mui/x-data-grid'
import { Autocomplete } from '@mui/material'

// ** Custom Components Imports

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

// ** Demo Components Imports
import tableBody from 'public/html/table.js'
import TableGabinete from 'src/views/table/data-grid/TableGabinete'
import { generateTransmittal } from 'src/@core/utils/generate-transmittal'
import { DialogAssignDesigner } from 'src/@core/components/dialog-assignDesigner'
import { DialogCodeGenerator } from 'src/@core/components/dialog-codeGenerator'
import { DialogFinishOt } from 'src/@core/components/dialog-finishOt'
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

  const handleClickOpenCodeGenerator = doc => {
    setOpenCodeGenerator(true)
  }

  const finishOtCallback = () => {
    setIsLoading(true)
    finishPetition(currentPetition, authUser)
      .then(() => {
        setIsLoading(false)
        setOpenAlert(false)
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

  const handleGenerateTransmittal = (tableElement, selected, newCode) => {
    generateTransmittal(tableElement, selected, setTransmittalGenerated, newCode)
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
        return alert('Seleccione al menos un documento')
      } else {
        handleGenerateTransmittal(tableElement, selected, newCode)
      }
    } catch (error) {
      console.error('Error al generar Transmittal:', error)
      throw new Error('Error al generar Transmittal')
    }
  }

  /*   useEffect(() => {
    if (currentPetition && currentPetition.id) {
      const idDoc = currentPetition.id
      console.log('idDoc:', idDoc)
      const unsubscribe = subscribeToPetition(idDoc, setCurrentPetition)

      // Limpiar la suscripción al desmontar el componente
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe()
        }
      }
    }
  }, []) */

  useEffect(() => {
    if (currentPetition && currentPetition.id) {
      const idDoc = currentPetition.id

      const unsubscribe = subscribeToPetition(idDoc, newPetition => {
        if (JSON.stringify(newPetition) !== JSON.stringify(currentPetitionRef.current)) {
          setCurrentPetition(newPetition)
        }
      })

      // Limpiar la suscripción al desmontar el componente
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe()
        }
      }
    }
  }, [currentPetition])

  useEffect(() => {
    const fetchRoleAndProyectistas = async () => {
      if (authUser) {
        // Cargar los proyectistas
        const resProyectistas = await getUserData('getUserProyectistas', null, authUser)
        setProyectistas(resProyectistas)
      }
    }

    fetchRoleAndProyectistas()
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
              sx={{ '& .MuiInputBase-inputAdornedStart': { display: 'none' } }}
            />
          )}
        />

        {authUser.role === 5 || authUser.role === 6 ? (
          <Button
            variant='contained'
            disabled={!currentPetition?.otReadyToFinish}
            onClick={() => currentPetition && handleClickOpenFinishOt(currentPetition)}
          >
            Finalizar OT
          </Button>
        ) : authUser.role === 8 ? (
          <Button variant='contained' onClick={() => currentPetition && handleClickOpenCodeGenerator(currentPetition)}>
            Generar nuevo documento
          </Button>
        ) : authUser.role === 7 ? (
          <>
            <Button
              sx={{ width: '50%', m: 2.5 }}
              variant='contained'
              onClick={() => currentPetition && handleClickOpen(currentPetition)}
            >
              Asignar proyectista
            </Button>
          </>
        ) : authUser.role === 9 ? (
          <Button
            variant='contained'
            onClick={() => currentPetition && handleClickTransmittalGenerator(currentPetition, blueprints)}
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
          <Button variant='contained' onClick={() => currentPetition && handleClickOpenCodeGenerator(currentPetition)}>
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
        <DialogFinishOt open={openFinishOt} handleClose={handleCloseFinishOt} callback={finishOtCallback} />
      )}
    </Box>
  )
}

export default DataGridGabinete
