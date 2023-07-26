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



const data = [
  {
    avatar: '1.png',
    id: 'Can Edit',
    name: 'Lester Palmer',
    email: 'pe@vogeiz.net'
  },
  {
    avatar: '2.png',
    value: 'owner',
    name: 'Mittie Blair',
    email: 'peromak@zukedohik.gov'
  },
  {
    avatar: '3.png',
    value: 'Can Comment',
    name: 'Marvin Wheeler',
    email: 'rumet@jujpejah.net'
  },
  {
    avatar: '4.png',
    value: 'Can View',
    name: 'Nannie Ford',
    email: 'negza@nuv.io'
  },
  {
    avatar: '5.png',
    value: 'Can Edit',
    name: 'Julian Murphy',
    email: 'lunebame@umdomgu.net'
  },
  {
    avatar: '6.png',
    value: 'Can View',
    name: 'Sophie Gilbert',
    email: 'ha@sugit.gov'
  },
  {
    avatar: '7.png',
    value: 'Can Comment',
    name: 'Chris Watkins',
    email: 'zokap@mak.org'
  },
  {
    avatar: '8.png',
    value: 'Can Edit',
    name: 'Adelaide Nichols',
    email: 'ujinomu@jigo.com'
  }
]

const options = [
  {
    avatar: '1.png',
    name: 'Chandler Bing'
  },
  {
    avatar: '2.png',
    name: 'Rachel Green'
  },
  {
    avatar: '3.png',
    name: 'Joey Tribbiani'
  },
  {
    avatar: '4.png',
    name: 'Pheobe Buffay'
  },
  {
    avatar: '5.png',
    name: 'Ross Geller'
  },
  {
    avatar: '8.png',
    name: 'Monica Geller'
  }
]

export const DialogAssignProject = ({open, doc, proyectistas, handleClose}) => { //falta evaluar la foto del proyectista


  // ** States
  const [show, setShow] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [draftmen, setDraftmen] = useState([])



  // ** Hooks
  const { settings } = useSettings()
  const hidden = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const { updateDocs, useEvents, reviewDocs, updateDraftmenAndAddEvent } = useFirebase()

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

  const handleListItemClick = (option) => {
    // Verificamos si el option ya existe en el array draftmen
    if (!draftmen.some((draftman) => draftman.name === option.name)) {
      // Si no existe, actualizamos el estado añadiendo el nuevo valor al array
      setDraftmen((prevDraftmen) => [...prevDraftmen, option]);
      document.getElementById('add-members').blur(); // Oculta el componente al hacer clic en el ListItem
    }
  }

  const onsubmit = (id) => {
    if (draftmen.length > 0) {
      reviewDocs(id, draftmen);
      handleClose();
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
            Agregar Proyectistas
          </Typography>
          <Typography variant='body2'>{doc.title}</Typography>
        </Box>
        <Autocomplete
          autoHighlight
          sx={{ mb: 8 }}
          id='add-members'
          options={proyectistas}
          ListboxComponent={List}
          getOptionLabel={option => option.name}
          renderInput={params => <TextField {...params} size='small' placeholder='Seleccionar proyectistas...' />}
          renderOption={(props, option) => (
            <ListItem {...props} onClick={() => handleListItemClick(option)}>
              <ListItemAvatar>
                {option.avatar? <Avatar src={`/images/avatars/${option.avatar}`} alt={option.name} sx={{ height: 28, width: 28 }} /> :
                  <CustomAvatar skin='light' sx={{ mr: 3, width: 28, height: 28, fontSize: '.8rem' }}>
                  {getInitials(option.name ? option.name : 'John Doe')}
                </CustomAvatar> }

              </ListItemAvatar>
              <ListItemText primary={option.name} />
            </ListItem>
          )}
        />
        <Typography variant='h6'>{`${draftmen.length} Seleccionados`}</Typography>
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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', '& svg': { mr: 2 } }}>
            {/* <Icon icon='mdi:account-multiple-outline' fontSize='1.25rem' />
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {`Public to ${themeConfig.templateName} - Pixinvent`}
            </Typography> */}
          </Box>
          <Button sx={{ lineHeight: '1.5rem', '& svg': { mr: 2 } }} onClick={() => onsubmit(doc.id)}>
            <EngineeringIcon sx={{ fontSize: 18 }} />
            Asignar Proyectistas
          </Button>
        </Box>
        <Menu
          keepMounted
          anchorEl={anchorEl}
          onClose={handleClose}
          open={Boolean(anchorEl)}
          id='modal-share-examples'
          anchorOrigin={{ vertical: 'bottom', horizontal: direction === 'ltr' ? 'right' : 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: direction === 'ltr' ? 'right' : 'left' }}
        >
          <MenuItem value='owner' sx={{ fontSize: '0.875rem' }} onClick={handleClose}>
            Owner
          </MenuItem>
          <MenuItem value='Can Edit' sx={{ fontSize: '0.875rem' }} onClick={handleClose}>
            Can Edit
          </MenuItem>
          <MenuItem value='Can Comment' sx={{ fontSize: '0.875rem' }} onClick={handleClose}>
            Can Comment
          </MenuItem>
          <MenuItem value='Can View' sx={{ fontSize: '0.875rem' }} onClick={handleClose}>
            Can View
          </MenuItem>
        </Menu>
      </DialogContent>
    </Dialog>
  )
}

//export default DialogAssignProject
