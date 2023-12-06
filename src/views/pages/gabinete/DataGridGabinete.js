// ** React Imports
import { useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import Box from '@mui/material/Box'

import { MenuList, MenuItem, Paper, Autocomplete, IconButton, Typography } from '@mui/material'
import { KeyboardDoubleArrowRight, KeyboardDoubleArrowLeft } from '@mui/icons-material'

// ** Custom Components Imports

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// ** Demo Components Imports
import TableGabinete from 'src/views/table/data-grid/TableGabinete'
import { DialogAssignDesigner } from 'src/@core/components/dialog-assignDesigner'
import { DialogCodeGenerator } from 'src/@core/components/dialog-codeGenerator'
import Logo_Procure from './../../../images/Logo_Procure.png';

const DataGridGabinete = () => {
  const [currentPetition, setCurrentPetition] = useState('')
  const [currentOT, setCurrentOT] = useState(null)
  const [currentAutoComplete, setCurrentAutoComplete] = useState(null)
  const [roleData, setRoleData] = useState({ name: 'admin' })
  const [errors, setErrors] = useState({})
  const [open, setOpen] = useState(false)
  const [proyectistas, setProyectistas] = useState([])
  const [openCodeGenerator, setOpenCodeGenerator] = useState(false)
  const [blueprintGenerated, setBlueprintGenerated] = useState(false)
  const [designerAssigned, setDesignerAssigned] = useState(false)

  const { useSnapshot, authUser, getUserData, useBlueprints, fetchPetitionById } = useFirebase()
  let petitions = useSnapshot(false, authUser, true)

  if (authUser.role === 8) {
    petitions = petitions.filter(petition =>
      petition.designerReview?.find(item => item.hasOwnProperty('userId') && item['userId'] === authUser.uid)
    )
  }

  const blueprints = useBlueprints(currentPetition?.id)

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

  const handleChange = value => {
    console.log(value)
    setCurrentOT(value?.value)
    const currentDoc = petitions.find(doc => doc.ot == value?.value)
    setCurrentPetition(currentDoc)

  }

  const handleClickTransmittalGenerator = async (currentPetition, blueprints) => {
    const doc = new jsPDF();

       // Obtiene los datos de la imagen
       const response = await fetch(Logo_Procure);
       const blob = await response.blob();

    const getBase64Image = (blob) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = function() {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    getBase64Image(blob).then(base64Image => {
      if (base64Image) {
        // Agrega la imagen al documento PDF
        doc.addImage(base64Image, 'PNG', 15, 40, 180, 160);
      } else {
        console.error('La imagen no se cargó correctamente');
      }
    }).catch(error => {
      console.error('Error al leer la imagen:', error);
    });


    doc.text('Transmittal', 95, 20);
    doc.text(`Titulo: ${currentPetition.title}`, 10, 60);
    doc.text(`OT: ${currentPetition.ot}`, 10, 80);
    doc.text(`Tipo de Levantamiento: ${currentPetition.objective}`, 10, 100);

    // Define las columnas de la tabla
    const columns = ["Codigo", "Revisión", "Descripción", "Archivo", "Fecha"];
    // Define las filas de la tabla

    const data = blueprints.map(obj => {
      if (obj.storageBlueprints) {
        // Divide la URL en segmentos separados por '%2F'
        const urlSegments = obj.storageBlueprints[0].split('%2F');

        // Obtiene el último segmento, que debería ser el nombre del archivo
        const encodedFileName = urlSegments[urlSegments.length - 1];

        // Divide el nombre del archivo en segmentos separados por '?'
        const fileNameSegments = encodedFileName.split('?');

        // Obtiene el primer segmento, que debería ser el nombre del archivo
        const fileName = decodeURIComponent(fileNameSegments[0]);

        return [
          obj.id,
          obj.revision,
          obj.description,
          fileName,
          obj.date.toDate()
        ];
      } else {
        // Devuelve valores predeterminados o vacíos para los objetos que no tienen `storageBlueprints`
        return [
          obj.id,
          obj.revision,
          obj.description,
          "",
          obj.date.toDate()
        ];
      }
    });

    // Agrega la tabla al documento
    doc.autoTable({
      startY: 110,
      head: [columns],
      body: data,
    });

    // Descarga el documento
    doc.save("documento.pdf");
  };

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

  return (
    <Box id='main' sx={{ display: 'flex', width: '100%', height: '600px', flexDirection: 'column' }}>
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
            sx={{ m: 2.5 , width: '50%' }}
            label='Tipo de levantamiento'
            value={currentPetition ? currentPetition.objective : ''}
            id='form-props-read-only-input'
            InputProps={{ readOnly: true }}
          />
          <TextField
            sx={{ m: 2.5, width: '50%'  }}
            label='Entregable'
            value={currentPetition ? currentPetition.deliverable.map(item => item) : ''}
            id='form-props-read-only-input'
            InputProps={{ readOnly: true }}
          />
          <Autocomplete
            multiple
            readOnly
            sx={{ m: 2.5, width: '100%'  }}
            value={
              (currentOT && petitions.find(doc => doc.ot == currentOT)?.designerReview?.map(item => item.name)) || []
            }
            options={[]}
            renderInput={params => <TextField {...params} label='Proyectistas asignados' readOnly={true} sx={{ '& .MuiInputBase-inputAdornedStart': {display:'none'} }}/>}
          />
           {authUser.role === 7 ? (
            <Button
            sx={{width: '50%', m: 2.5}}
            variant='contained' onClick={() => currentPetition && handleClickOpen(currentPetition)}>
              Asignar proyectista
            </Button>
          ) : authUser.role === 9 ? (
            <Button
              variant='contained'
              onClick={() => currentPetition && handleClickTransmittalGenerator(currentPetition, blueprints)}
            >
              Generar Transmittal
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
