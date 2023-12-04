// ** React Imports
import { useState, forwardRef, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'
import DialogContent from '@mui/material/DialogContent'
import EngineeringIcon from '@mui/icons-material/Engineering'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'


// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Hooks Imports
import { useFirebase } from 'src/context/useFirebase'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

export const DialogClientCodeGenerator = ({ handleClose, petition, blueprint, setBlueprintGenerated }) => {
  //falta evaluar la foto del proyectista

  // ** States
  const [error, setError] = useState('')
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
  const [typeOfDiscipline, setTypeOfDiscipline] = useState('')
  const [typeOfDocument, setTypeOfDocument] = useState('')
  const [disciplines, setDisciplines] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [currentDiscipline, setCurrentDiscipline] = useState('')

  // ** Hooks
  const { authUser, generateBlueprintCodeClient, fetchMelDisciplines, fetchMelDeliverableType } = useFirebase()

  const handleChangeTypeOfDiscipline = (event) => {
    setTypeOfDiscipline(event.target.value);
  }

  const handleChangeTypeOfDocument = (event) => {
    setTypeOfDocument(event.target.value);
  }



  const onsubmit = async (doc, blueprintId) => {
    if (typeOfDiscipline && typeOfDocument) {
      //console.log( "DOC: ", petition, "blueprint: ", blueprint,)

      await generateBlueprintCodeClient(typeOfDiscipline, typeOfDocument, petition, blueprint, authUser)
      handleClose();
      setBlueprintGenerated(true)
    } else {
      setError('Por favor, indique tipo de disciplina y tipo de documento.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      let resDisciplines = await fetchMelDisciplines()
      setDisciplines(resDisciplines)
    };

    fetchData();
  }, []);

  useEffect(() => {
    if ( typeOfDiscipline ) {

      const fetchData = async () => {
        let resDeliverableTypes = await fetchMelDeliverableType(typeOfDiscipline)
        setDeliverables(resDeliverableTypes)
      };

      fetchData();
    }

  }, [typeOfDiscipline]);

  return (
      <DialogContent sx={{ position: 'relative', py:0 }}>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 5 }}>
          <Typography variant='body2' sx={{pb:5}}>Establece parámetros para crear el código</Typography>
            <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
              <InputLabel id="demo-select-small-label">Tipo de disciplina</InputLabel>
              <Select
                value={typeOfDiscipline}
                label='Tipo de disciplina'
                id='controlled-select'
                onChange={handleChangeTypeOfDiscipline}
                labelId='controlled-select-label'
              >
                <MenuItem value=''>
                    <em>None</em>
                </MenuItem>

                { Object.entries(disciplines).map(([key, value]) => (
                  <MenuItem key={key} value={key}>
                  <em>{value}</em>
                  </MenuItem>
                  ))
                }


              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 5 }}>
            <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
            <InputLabel id="demo-select-small-label">Tipo de documento</InputLabel>
              <Select
                value={typeOfDocument}
                label='Tipo de documento'
                id='controlled-select'
                onChange={handleChangeTypeOfDocument}
                labelId='controlled-select-label'
              >
                <MenuItem value=''>
                    <em>None</em>
                </MenuItem>
                { deliverables && Object.entries(deliverables).map(([key, value]) => (

                  <MenuItem key={key} value={key}>
                  <em>{value}</em>
                  </MenuItem>
                  ))
                  }

              </Select>
            </FormControl>
          </Box>



        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'end' }}>
          <Button sx={{ lineHeight: '1.5rem', '& svg': { mr: 2 } }} disabled={isSubmitDisabled} onClick={(petition, blueprint) => onsubmit(petition, blueprint)}>
            Crear código
          </Button>
        </Box>
      </DialogContent>

  )
}

