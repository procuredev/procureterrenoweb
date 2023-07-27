// ** React Imports
import { useState, forwardRef, Fragment, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import List from '@mui/material/List'
import Menu from '@mui/material/Menu'
import Avatar from '@mui/material/Avatar'
import CustomAvatar from 'src/@core/components/mui/avatar'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import ListItem from '@mui/material/ListItem'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Fade from '@mui/material/Fade'
import ListItemText from '@mui/material/ListItemText'
import Autocomplete from '@mui/material/Autocomplete'
import useMediaQuery from '@mui/material/useMediaQuery'
import DialogContent from '@mui/material/DialogContent'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import EngineeringIcon from '@mui/icons-material/Engineering';
import TableSpanning from 'src/views/table/mui/TableSpanning'



import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Configs Imports
import themeConfig from 'src/configs/themeConfig'

// ** Hooks Imports
import { useSettings } from 'src/@core/hooks/useSettings'
import { useFirebase } from 'src/context/useFirebaseAuth'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})





export const DialogDoneProject = ({open, doc, proyectistas, handleClose}) => { //falta evaluar la foto del proyectista


  // ** States
  const [show, setShow] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [draftmen, setDraftmen] = useState([])

  const [horasLevantamiento, setHorasLevantamiento] = useState('');
  const [error, setError] = useState('');



  // ** Hooks
  const { settings } = useSettings()
  const hidden = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const { updateDocs, useEvents, reviewDocs } = useFirebase()

  // ** Var
  const { direction } = settings

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClickDelete = name => {
    // Filtramos el array draftmen para mantener todos los elementos excepto aquel con el nombre proporcionado
    const updatedDraftmen = draftmen.filter((draftman) => draftman.name !== name);

    // Actualizamos el estado con el nuevo array actualizado
    setDraftmen(updatedDraftmen);
  }

/*   const handleClose = () => {
    setAnchorEl(null)
  } */

  const handleInputChange = (e) => {
    const inputValue = e.target.value;

    // Verifica si el valor ingresado es un número y si es mayor a 1
    if (!isNaN(inputValue) && Number(inputValue) > 0) {
      setHorasLevantamiento(inputValue);
      setError(''); // Limpia el mensaje de error si existe
    } else {
      setHorasLevantamiento('');
      setError('Por favor, ingrese un número mayor a 1.');
    }
  }

  const handleListItemClick = (option) => {
    // Verificamos si el option ya existe en el array draftmen
    if (!draftmen.some((draftman) => draftman.name === option.name)) {
      // Si no existe, actualizamos el estado añadiendo el nuevo valor al array
      setDraftmen((prevDraftmen) => [...prevDraftmen, option]);
      document.getElementById('add-members').blur(); // Oculta el componente al hacer clic en el ListItem
    }
  }

 const onsubmit = (id) => {
    if (horasLevantamiento !== '') {
      reviewDocs(id, horasLevantamiento)


      // Aquí puedes actualizar el documento 'doc' en la base de datos con el campo 'horas levantamiento'
      // usando la función updateDocs o cualquier método que utilices para actualizar los datos en Firebase
      handleClose();
    } else {
      setError('Por favor, ingrese un número mayor a 0.');
    }
  }

  const getInitials = string => string.split(/\s/).reduce((response, word) => (response += word.slice(0, 1)), '')

  return (

    <Dialog
      fullWidth
      open={open}
      maxWidth='xs'
      scroll='body'
      onClose={() => handleClose()}
      TransitionComponent={Transition}
      onBackdropClick={() => handleClose()}
    >
      <DialogContent sx={{ px: { xs: 8, sm: 15 }, py: { xs: 8, sm: 12.5 }, position: 'relative' }}>
        <IconButton
          size='small'
          onClick={() => handleClose()}
          sx={{ position: 'absolute', right: '1rem', top: '1rem' }}
        >
          <Icon icon='mdi:close' />
        </IconButton>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant='h5' sx={{ mb: 3, lineHeight: '2rem' }}>
            Terminar Levantamiento
          </Typography>
          <Typography variant='body2'>Establece el total de horas</Typography>
        </Box>

          <Box sx={{ mb: 4, textAlign: 'center' }}>
        <TextField
          id='outlined-basic'
          label='Horas del Levantamiento'
          value={horasLevantamiento}
          onChange={handleInputChange}
          error={error !== ''}
          helperText={error}
        />
      </Box>


        <List dense sx={{ py: 4 }}>
          {draftmen.map(draftman => {
            return (
              <ListItem
                key={draftman.name}
                sx={{
                  p: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  '.MuiListItem-container:not(:last-child) &': { mb: 4 }
                }}
              >
                <ListItemAvatar>
                  {draftman.avatar?
                    <Avatar src={`/images/avatars/${draftman.avatar}`} alt={draftman.name} /> :
                    <CustomAvatar skin='light' >
                      {getInitials(draftman.name ? draftman.name : 'John Doe')}
                    </CustomAvatar> }
                </ListItemAvatar>
                <ListItemText
                  primary={draftman.name}
                  secondary={draftman.email}
                  sx={{ m: 0, '& .MuiListItemText-primary, & .MuiListItemText-secondary': { lineHeight: '1.25rem' } }}
                />
                <ListItemSecondaryAction sx={{ right: 0 }}>
                <IconButton
                      size='small'
                      aria-haspopup='true'
                      onClick={() => handleClickDelete(draftman.name)}
                      aria-controls='modal-share-examples'
                    >
                      <Icon icon='mdi:delete-circle-outline' fontSize={20} color= '#f44336' />
                    </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )
          })}
        </List>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          <Button sx={{ lineHeight: '1.5rem', '& svg': { mr: 2 } }} onClick={() => onsubmit(doc.id)}>
            <EngineeringIcon sx={{ fontSize: 18 }} />
            Guardar
          </Button>
        </Box>

      </DialogContent>
    </Dialog>
  )
}

//export default DialogAssignProject
