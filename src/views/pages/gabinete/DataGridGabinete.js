// ** React Imports
import { useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import Box from '@mui/material/Box'

import { MenuList, MenuItem, Paper, Autocomplete, IconButton, Typography } from '@mui/material'
import {KeyboardDoubleArrowRight, KeyboardDoubleArrowLeft} from '@mui/icons-material';

// ** Custom Components Imports

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

// ** Demo Components Imports
import TableGabinete from 'src/views/table/data-grid/TableGabinete'
import { DialogAssignDesigner } from 'src/@core/components/dialog-assignDesigner'
import { DialogCodeGenerator } from 'src/@core/components/dialog-codeGenerator'

const DataGridGabinete = () => {
  const [menuOpen, setMenuOpen] = useState(true)
  const [currentPetition, setCurrentPetition] = useState('')
  const [currentOT, setCurrentOT] = useState('')
  const [roleData, setRoleData] = useState({ name: 'admin' })
  const [errors, setErrors] = useState({})
  const [open, setOpen] = useState(false)
  const [proyectistas, setProyectistas] = useState([])
  const [blueprints, setBlueprints] = useState([])
  const [openCodeGenerator, setOpenCodeGenerator] = useState(false)
  const [blueprintGenerated, setBlueprintGenerated] = useState(false)
  const [designerAssigned, setDesignerAssigned] = useState(false)

  const { useSnapshot, authUser, getUserData, getBlueprints, fetchPetitionById } = useFirebase()
  let petitions = useSnapshot(false, authUser, true)

  if (authUser.role === 8) {
    petitions = petitions.filter(petition =>
      petition.designerReview?.find(item => item.hasOwnProperty('userId') && item['userId'] === authUser.uid)
    )
  }

  const handleClickOpenCodeGenerator = doc => {
    setOpenCodeGenerator(true)
  }

  const handleCloseCodeGenerator = () => {
    setOpenCodeGenerator(false)
  }

  const handleClickOpen = doc => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleChange = event => {
    const currentDoc = petitions.filter(petition => petition.ot == event.target.value)[0] || ''
    setCurrentPetition(currentDoc)
    setCurrentOT(event.target.value)
  }

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
    const fetchData = async () => {
      if (blueprintGenerated) {
        const resBlueprints = await getBlueprints(currentPetition.id)
        if (resBlueprints) {
          setBlueprints(resBlueprints)
          // Reset flags
          setBlueprintGenerated(false)
        }
      }

      if (currentPetition) {
        const resBlueprints = await getBlueprints(currentPetition.id)


        setBlueprints(resBlueprints)
      }
    }
    fetchData()
  }, [blueprintGenerated, currentPetition])

  return (
    <Box id='main' sx={{ display: 'flex', width: '100%', height: '600px' }}>
      <Paper
      elevation={3}
      sx={{
        maxWidth: '20%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        backgroundColor: !menuOpen && 'transparent',
        m: menuOpen ? 4 : 0,
        p: menuOpen && 5,
        boxShadow: !menuOpen && 'none !important',
      }}>
        <Box sx={{ display: 'flex', mb: 4, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {menuOpen && <Typography variant='button'>Solicitudes</Typography>}
          <IconButton onClick={() => setMenuOpen(prev => !prev)}>
            {menuOpen ? <KeyboardDoubleArrowLeft /> : <KeyboardDoubleArrowRight />}
          </IconButton>
        </Box>
        <Box sx={{ display: menuOpen ? 'block' : 'none', height: '100%', width: '100%' }}>
          <MenuList
            dense
            id='basic-menu'
            open={false}
            sx={{ overflow: 'hidden' }}
          >
            {petitions?.map((petitionItem, index) => (
              <MenuItem key={index} onClick={e => handleChange(e)} value={petitionItem.ot}>
                {petitionItem.ot + ' ' + petitionItem.title + '(' + petitionItem.designerReview?.length + ')'}
              </MenuItem>
            ))}
          </MenuList>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        <Box sx={{ m: 4, display: 'flex' }}>
          <TextField
            sx={{ m: 2.5 }}
            label='Título'
            multiline
            value={currentPetition ? currentPetition.title : ''}
            id='form-props-read-only-input'
            InputProps={{ readOnly: true }}
          />
          <TextField
            sx={{ m: 2.5 }}
            label='Tipo de levantamiento'
            value={currentPetition ? currentPetition.objective : ''}
            id='form-props-read-only-input'
            InputProps={{ readOnly: true }}
          />
          <TextField
            sx={{ m: 2.5 }}
            label='Entregable'
            value={currentPetition ? currentPetition.deliverable.map(item => item) : ''}
            id='form-props-read-only-input'
            InputProps={{ readOnly: true }}
          />
          <Autocomplete
            multiple
            readOnly
            sx={{ m: 2.5, width: '25%'  }}
            value={
              (currentOT && petitions.find(doc => doc.ot == currentOT)?.designerReview?.map(item => item.name)) || []
            }
            options={[]}
            renderInput={params => <TextField {...params} label='Proyectistas asignados' readOnly={true} sx={{ '& .MuiInputBase-inputAdornedStart': {display:'none'} }}/>}
          />
           {authUser.role === 7 ? (
            <Button variant='contained' onClick={() => currentPetition && handleClickOpen(currentPetition)}>
              Asignar proyectista
            </Button>
          ) : (
            <Button
              variant='contained'
              onClick={() => currentPetition && handleClickOpenCodeGenerator(currentPetition)}
            >
              Generar nuevo documento
            </Button>
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
          />
        </Box>
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
    </Box>
  )
}

export default DataGridGabinete
