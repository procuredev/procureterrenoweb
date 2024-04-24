// ** React Imports
import * as React from 'react'
import { useState, forwardRef } from 'react'

import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import moment from 'moment-timezone'
import 'moment/locale/es'

// ** MUI Imports
//import Box from '@mui/material/Box'
//import List from '@mui/material/List'
import Avatar from '@mui/material/Avatar'
import CustomAvatar from 'src/@core/components/mui/avatar'
import ListItem from '@mui/material/ListItem'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Fade from '@mui/material/Fade'
import ListItemText from '@mui/material/ListItemText'
import Autocomplete from '@mui/material/Autocomplete'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import EngineeringIcon from '@mui/icons-material/Engineering'

import NumberInputBasic from 'src/@core/components/custom-number-input/index'

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  Link,
  List,
  Typography
} from '@mui/material'
import { LocalizationProvider, MobileDatePicker } from '@mui/x-date-pickers'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Hooks Imports
import { useFirebase } from 'src/context/useFirebase'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

export const DialogLoadHours = ({ open, doc, proyectistas, handleClose }) => {
  //TODO: evaluar la foto del proyectista

  const options = ['Levantamiento', 'Gabinete']

  const initialValues = {
    type: null,
    day: moment().startOf('day'),
    hours: 0
  }

  // ** States
  const [draftmen, setDraftmen] = useState([])
  const [values, setValues] = useState(() => initialValues)
  const [loading, setLoading] = useState(false)

  // ** Hooks
  const { updateDocs, authUser, setOtHoursWorked } = useFirebase()

  const handleHoursChange = newValue => {
    setValues({ ...values, hours: newValue })
  }

  /*   const handleClose = () => {
    setAnchorEl(null)
  } */

  const handleChange = prop => async (event, data) => {
    if (prop === 'day') {
      let dayDate = event
      setValues({
        ...values,
        day: dayDate
      })
    }
  }

  const onSubmit = id => {
    setLoading(true)
    if (values.type !== null && values.hours !== 0) {
      setOtHoursWorked(id, values, authUser)
        .then(() => {
          //setDraftmen([])
          handleClose()
          setLoading(false)
        })
        .catch(error => {
          handleClose()
          console.error(error)
          setLoading(false)
        })
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
      onBackdropClick={() => {
        //setDraftmen([])
        handleClose()
      }}
    >
      <DialogContent sx={{ px: { xs: 8, sm: 15 }, py: { xs: 8, sm: 12.5 }, position: 'relative', textAlign: 'center' }}>
        <IconButton
          size='small'
          onClick={() => {
            //setDraftmen([])
            handleClose()
          }}
          sx={{ position: 'absolute', right: '1rem', top: '1rem' }}
        >
          <Icon icon='mdi:close' />
        </IconButton>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant='h5' sx={{ mb: 3, lineHeight: '2rem' }}>
            Carga de Horas OT {`${doc.ot}`}
          </Typography>
          <Typography variant='body2'>{doc.title}</Typography>
        </Box>
        {loading ? (
          <CircularProgress sx={{ mb: 5 }} />
        ) : (
          <Box>
            <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
              <LocalizationProvider
                dateAdapter={AdapterMoment}
                adapterLocale='es'
                localeText={{
                  okButtonLabel: 'Aceptar',
                  cancelButtonLabel: 'Cancelar',
                  datePickerToolbarTitle: 'Selecciona Fecha de Comienzo'
                }}
              >
                <Box>
                  <Autocomplete
                    value={values.type}
                    onChange={(event, newValue) => {
                      setValues(prev => ({ ...prev, type: newValue }))
                    }}
                    // inputType={inputType}
                    // onInputChange={(event, newInputType) => {
                    //   setValues(prev => ({ ...prev, type: newInputType }))
                    // }}
                    autoHighlight
                    sx={{ mb: 8 }}
                    id='add-type'
                    options={options}
                    ListboxComponent={List}
                    renderInput={params => <TextField {...params} size='small' placeholder='Seleccionar tipo...' />}
                  />
                  <MobileDatePicker
                    dayOfWeekFormatter={day => day.substring(0, 2).toUpperCase()}
                    minDate={moment().subtract(1, 'year')}
                    maxDate={moment().add(1, 'year')}
                    size='small'
                    label='Fecha de jornada *'
                    value={values.day}
                    onChange={date => handleChange('day')(date)}
                    inputFormat='dd/MM/yyyy' // Formato de fecha que no puede ser introducido manualmente
                    InputLabelProps={{ shrink: true, required: true }}

                    // slotProps={{
                    //   textField: {
                    //     error: errors.start ? true : false,
                    //     helperText: errors.start
                    //   },
                    //   toolbar: { hidden: false }
                    // }}
                  />
                  <NumberInputBasic value={values.hours} onChange={handleHoursChange} />
                </Box>
              </LocalizationProvider>
            </FormControl>

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
                      {draftman.avatar ? (
                        <Avatar src={`/images/avatars/${draftman.avatar}`} alt={draftman.name} />
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
                          {getInitials(draftman.name ? draftman.name : 'John Doe')}
                        </CustomAvatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={draftman.name}
                      secondary={draftman.email}
                      sx={{
                        m: 0,
                        '& .MuiListItemText-primary, & .MuiListItemText-secondary': { lineHeight: '1.25rem' }
                      }}
                    />
                    <ListItemSecondaryAction sx={{ right: 0 }}>
                      <IconButton
                        size='small'
                        aria-haspopup='true'
                        onClick={() => handleClickDelete(draftman.name)}
                        aria-controls='modal-share-examples'
                      >
                        <Icon icon='mdi:delete-forever' fontSize={20} color='#f44336' />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              })}
            </List>
          </Box>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          <Button sx={{ lineHeight: '1.5rem', '& svg': { mr: 2 } }} onClick={() => onSubmit(doc.id)}>
            <AccessTimeOutlinedIcon sx={{ fontSize: 18 }} />
            Cargar Horas
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
