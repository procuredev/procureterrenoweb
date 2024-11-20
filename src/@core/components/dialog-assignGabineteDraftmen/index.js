// ** React Imports
import { useState, useEffect, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Avatar from '@mui/material/Avatar'
import CustomAvatar from 'src/@core/components/mui/avatar'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import ListItem from '@mui/material/ListItem'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'
import ListItemText from '@mui/material/ListItemText'
import Autocomplete from '@mui/material/Autocomplete'
import DialogContent from '@mui/material/DialogContent'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import EngineeringIcon from '@mui/icons-material/Engineering'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Hooks Imports
import { useFirebase } from 'src/context/useFirebase'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

export const DialogAssignGabineteDraftmen = ({
  open,
  handleClose,
  doc,
  proyectistas,
  gabineteDraftmenState,
  setGabineteDraftmenState
}) => {
  //TODO: Evaluar la foto del proyectista
  // ** States

  const [filteredOptions, setFilteredOptions] = useState(proyectistas)

  // ** Hooks
  const { updateDocs, authUser } = useFirebase()

  useEffect(() => {
    if (doc && doc.gabineteDraftmen && doc.gabineteDraftmen.length > 0) {
      setGabineteDraftmenState(doc.gabineteDraftmen)
    }
  }, [doc])

  console.log('proyectistas', proyectistas)

  const filterOptions = options => {
    // Convierte las opciones seleccionadas y las existentes en doc.gabineteDraftmen en arrays de nombres
    const selectedNamesFromState = gabineteDraftmenState.map(gabineteDraftmen => gabineteDraftmen.name)

    let selectedNamesFromDoc = []
    if (doc && doc.gabineteDraftmen) {
      selectedNamesFromDoc = doc.gabineteDraftmen.map(gabineteDraftmen => gabineteDraftmen.name)
    }

    const allSelectedNames = [...selectedNamesFromState, ...selectedNamesFromDoc]

    // Filtra las opciones y devuelve solo las que no están en el array de nombres seleccionados
    return options.filter(option => !allSelectedNames.includes(option.name))
  }

  useEffect(() => {
    setFilteredOptions(proyectistas)
  }, [proyectistas])

  if (!doc) return null

  const handleClickDelete = name => {
    // Filtramos el array draftmen para mantener todos los elementos excepto aquel con el nombre proporcionado
    const updatedGabineteDraftmenState = gabineteDraftmenState.filter(
      gabineteDraftmen => gabineteDraftmen.name !== name
    )

    // Actualizamos el estado con el nuevo array actualizado
    setGabineteDraftmenState(updatedGabineteDraftmenState)
  }

  const handleListItemClick = option => {
    // Verificamos si el option ya existe en el array draftmen
    if (!gabineteDraftmenState.some(gabineteDraftmen => gabineteDraftmen.name === option.name)) {
      // Si no existe, actualizamos el estado añadiendo el nuevo valor al array
      setGabineteDraftmenState(prevGabineteDraftmen => [...prevGabineteDraftmen, option])
      document.getElementById('add-members').blur() // Oculta el componente al hacer clic en el ListItem
    }
  }

  const onsubmit = id => {
    //si tiene allocation time es porque esta en el doc
    //si no tiene allocation time es porque es nuevo

    //si está en el doc y no está en el state, lo borramos
    //si está en el state y no está en el doc, lo agregamos
    //si está en ambos, dejamos el que está en el doc
    const gabineteDraftmen = gabineteDraftmenState.map(gabineteDraftmen => {
      const gabineteDraftmenInDoc = doc.gabineteDraftmen?.find(item => item.userId === gabineteDraftmen.userId)
      if (gabineteDraftmenInDoc) {
        return gabineteDraftmenInDoc
      } else {
        gabineteDraftmen.allocationTime = new Date().getTime()

        return gabineteDraftmen
      }
    })
    console.log(gabineteDraftmen)
    updateDocs(id, { gabineteDraftmen }, authUser)
    setGabineteDraftmenState([])
    handleClose()
  }

  const getInitials = string => string.split(/\s/).reduce((response, word) => (response += word.slice(0, 1)), '')

  const emptyFields = gabineteDraftmenState.length === 0

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth='xs'
      scroll='body'
      onClose={() => handleClose()}
      TransitionComponent={Transition}
      onBackdropClick={() => {
        setGabineteDraftmenState([])
        handleClose()
      }}
    >
      <DialogContent sx={{ px: { xs: 8, sm: 15 }, py: { xs: 8, sm: 12.5 }, position: 'relative' }}>
        <IconButton
          size='small'
          onClick={() => {
            handleClose()
          }}
          sx={{ position: 'absolute', right: '1rem', top: '1rem' }}
        >
          <Icon icon='mdi:close' />
        </IconButton>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant='h5' sx={{ mb: 3, lineHeight: '2rem' }}>
            Modificar Proyectistas
          </Typography>
          <Typography variant='body2'>{doc.title}</Typography>
        </Box>
        <Autocomplete
          autoHighlight
          sx={{ mb: 8 }}
          id='add-members'
          options={filteredOptions} // Usa las opciones filtradas en lugar de 'proyectistas'
          ListboxComponent={List}
          getOptionLabel={option => option.name}
          renderInput={params => <TextField {...params} size='small' placeholder='Seleccionar proyectistas...' />}
          filterOptions={filterOptions} // Agrega este prop
          renderOption={(props, option) => (
            <ListItem {...props} onClick={() => handleListItemClick(option)}>
              <ListItemAvatar>
                {option.avatar ? (
                  <Avatar src={`/images/avatars/${option.avatar}`} alt={option.name} sx={{ height: 28, width: 28 }} />
                ) : (
                  <CustomAvatar
                    skin='light'
                    sx={{
                      mr: 3,
                      width: 28,
                      height: 28,
                      objectFit: 'contain',
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontSize: '.8rem'
                    }}
                  >
                    {getInitials(option.name ? option.name : 'John Doe')}
                  </CustomAvatar>
                )}
              </ListItemAvatar>
              <ListItemText primary={option.name} />
            </ListItem>
          )}
        />
        <Typography variant='h6'>{`${gabineteDraftmenState.length} Seleccionados`}</Typography>
        <List dense sx={{ py: 4 }}>
          {gabineteDraftmenState.map(gabineteDraftmen => {
            return (
              <ListItem
                key={gabineteDraftmen.name}
                sx={{
                  p: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  '.MuiListItem-container:not(:last-child) &': { mb: 4 }
                }}
              >
                <ListItemAvatar>
                  {gabineteDraftmen.avatar ? (
                    <Avatar src={`/images/avatars/${gabineteDraftmen.avatar}`} alt={gabineteDraftmen.name} />
                  ) : (
                    <CustomAvatar
                      skin='light'
                      sx={{
                        mr: 3,
                        width: 34,
                        height: 34,
                        objectFit: 'contain',
                        bgcolor: 'primary.main',
                        color: 'white',
                        fontSize: '.8rem'
                      }}
                    >
                      {getInitials(gabineteDraftmen.name ? gabineteDraftmen.name : 'John Doe')}
                    </CustomAvatar>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={gabineteDraftmen.name}
                  secondary={gabineteDraftmen.email}
                  sx={{ m: 0, '& .MuiListItemText-primary, & .MuiListItemText-secondary': { lineHeight: '1.25rem' } }}
                />
                <ListItemSecondaryAction sx={{ right: 0 }}>
                  <IconButton
                    size='small'
                    aria-haspopup='true'
                    onClick={() => handleClickDelete(gabineteDraftmen.name)}
                    aria-controls='modal-share-examples'
                  >
                    <Icon icon='mdi:delete-forever' fontSize={20} color='#f44336' />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            )
          })}
        </List>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          <Button
            sx={{ lineHeight: '1.5rem', '& svg': { mr: 2 } }}
            disabled={emptyFields}
            onClick={() => onsubmit(doc.id)}
          >
            <EngineeringIcon sx={{ fontSize: 18 }} />
            Guardar Proyectistas
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
