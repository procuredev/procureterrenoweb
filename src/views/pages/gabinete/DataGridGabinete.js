// ** React Imports
import { useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import {Chip} from '@mui/material'

// ** Custom Components Imports
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

// ** Demo Components Imports
import TableGabinete from 'src/views/table/data-grid/TableGabinete'
import { DialogAssignDesigner } from 'src/@core/components/dialog-assignDesigner'
import { DialogCodeGenerator } from 'src/@core/components/dialog-codeGenerator'

const DataGridGabinete = () => {
  const [value, setValue] = useState('1')
  const [currentPetition, setCurrentPetition] = useState('')
  const [currentOT, setCurrentOT] = useState('')
  const [roleData, setRoleData] = useState({ name: 'admin' })
  const [errors, setErrors] = useState({})
  const [open, setOpen] = useState(false)
  const [proyectistas, setProyectistas] = useState([])
  const [selectedPetition, setSelectedPetition] = useState('');
  const [blueprints, setBlueprints] = useState([]);
  const [openCodeGenerator, setOpenCodeGenerator] = useState(false)
  const [blueprintGenerated, setBlueprintGenerated] = useState(false);
  const [designerAssigned, setDesignerAssigned] = useState(false);

  const { useSnapshot, authUser, getUserData, getBlueprints, fetchPetitionById} = useFirebase()
  let petitions = useSnapshot(false, authUser, true)

  if(authUser.role === 8){
    petitions = petitions.filter(petition => petition.designerReview?.map(item => item.hasOwnProperty('userId') && item['userId']===authUser.uid))

  }

  const handleClickOpenCodeGenerator = doc => {

    //setDoc(doc)
    setOpenCodeGenerator(true)
  }

  const handleCloseCodeGenerator = () => {
    setOpenCodeGenerator(false)
  }

  const handleClickOpen = doc => {
    //setDoc(doc)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleChange = (event) => {
    const currentDoc = petitions.filter(petition => petition.ot === event.target.value)[0]
    setCurrentPetition(currentDoc)
    setCurrentOT(event.target.value)
  }

  useEffect(() => {
    const fetchRoleAndProyectistas = async () => {
      if (authUser) {
        // Cargar los proyectistas
        const resProyectistas = await getUserData('getUserProyectistas', null, authUser);
        setProyectistas(resProyectistas);
      }
    };

    fetchRoleAndProyectistas();
  }, [authUser]);

  useEffect(() => {
    const fetchData = async () => {
      if ( blueprintGenerated) {
        const updatedPetition = await fetchPetitionById(currentPetition.id);
        if (updatedPetition) {
          setCurrentPetition(updatedPetition);
          // Reset flags
          setBlueprintGenerated(false);
        }
      }
      if (currentPetition) {
        const resBlueprints = await getBlueprints(currentPetition.id);
        setBlueprints(resBlueprints);
      }
    };
    fetchData();
  }, [ blueprintGenerated, currentPetition]);


  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
            <InputLabel id="demo-select-small-label">OT</InputLabel>
            <Select
              value={currentPetition ? currentPetition.ot : ''}
              label='OT'
              id='controlled-select'
              onChange={handleChange}
              labelId='controlled-select-label'
            >
              <MenuItem value=''>
                  <em>None</em>
              </MenuItem>
              {petitions.map((petitionItem, index) => (
                <MenuItem key={index} value={petitionItem.ot}>
                    OT: {petitionItem.ot}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {authUser.role === 7 ?
            (<Button
            variant='contained'
            onClick={() => currentPetition && handleClickOpen(currentPetition)}
            >Asignar proyectista</Button>)
            : (<Button
            variant='contained'
            onClick={() => currentPetition && handleClickOpenCodeGenerator(currentPetition)}
            >Generar nuevo documento
          </Button>)}

          <TextField
            label='Proyectistas asignados'
            multiline
            InputProps={{
              readOnly: true
            }}
            value={currentOT && petitions.find(doc => doc.ot === currentOT).designerReview?.map(item => item.name)}
          />

          <TextField
            label='Título'
            value={currentPetition ? currentPetition.title : ''}
            id='form-props-read-only-input'
            InputProps={{ readOnly: true }}
          />
          <TextField
            label='Tipo de levantamiento'
            value={currentPetition ? currentPetition.objective : ''}
            id='form-props-read-only-input'
            InputProps={{ readOnly: true }}
          />
          <TextField
            label='Entregable'
            value={currentPetition ? currentPetition.deliverable.map(item => item) : ''}
            id='form-props-read-only-input'
            InputProps={{ readOnly: true }}
          />
        </Box>
        <Grid item xs={12}>

            <TableGabinete rows={blueprints ? blueprints : []} roleData={roleData} role={authUser.role} />

        </Grid>

      <DialogAssignDesigner open={open} handleClose={handleClose} doc={currentPetition} proyectistas={proyectistas} setDesignerAssigned={setDesignerAssigned} />
      {openCodeGenerator && <DialogCodeGenerator open={openCodeGenerator} handleClose={handleCloseCodeGenerator} doc={currentPetition} roleData={roleData} setBlueprintGenerated={setBlueprintGenerated} />}
    </Box>
  )
}

export default DataGridGabinete
