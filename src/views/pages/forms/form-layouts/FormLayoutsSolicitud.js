// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebaseAuth'
import { useRouter } from 'next/router'

// ** Date Library
import moment from 'moment'
import 'moment/locale/es'

// ** MUI Imports
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import CardHeader from '@mui/material/CardHeader'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import FormHelperText from '@mui/material/FormHelperText'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import { styled } from '@mui/material/styles'
import areas from 'src/@core/components/plants-areas/index'
import InfoIcon from '@mui/icons-material/Info'
import Tooltip from '@mui/material/Tooltip'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { useDropzone } from 'react-dropzone'
import { useTheme } from '@emotion/react'
import { DonutSmallOutlined } from '@mui/icons-material'

// Styled component for the upload image inside the dropzone area
const Img = styled('img')(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    marginRight: theme.spacing(10)
  },
  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(4)
  },
  [theme.breakpoints.down('sm')]: {
    width: 250
  }
}))

// Styled component for the heading inside the dropzone area
const HeadingTypography = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(4)
  }
}))

//Styled tooltip-popover
const StyledTooltip = styled(Tooltip)(({ theme }) => ({
  /* marginRight: theme.spacing(5), */
  marginLeft: theme.spacing(4),
  fontSize: '1.5em'
}))

const FormLayoutsSolicitud = () => {
  const initialValues = {
    title: '',
    start: moment.utc().startOf('date'),
    plant: '',
    area: '',
    contop: '',
    fnlocation: '',
    petitioner: '',
    opshift: '',
    type: '',
    detention: '',
    sap: '',
    objective: '',
    deliverable: [],
    receiver: [],
    description: ''
  }

  // ** Hooks
  const {
    authUser,
    getPetitioner,
    getReceiverUsers,
    newDoc,
    uploadFilesToFirebaseStorage,
    getAllPlantUsers,
    consultBlockDayInDB,
    consultSAP,
    getUsers
  } = useFirebase()
  const router = useRouter()
  const theme = useTheme()

  // ** States
  const [plants, setPlants] = useState([]) // authUser && authUser.plant.map(plant => plant)
  const [contOpOptions, setContOpOptions] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [files, setFiles] = useState([])
  const [petitioners, setPetitioners] = useState([])
  const [petitionerOpShift, setPetitionerOpShift] = useState([])
  const [alertMessage, setAlertMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState(initialValues)
  const [isUploading, setIsUploading] = useState(false) // Estado para controlar el spinner mientras la solicitud es enviada

  const handleChange = prop => async (event, data) => {
    const strFields = ['title', 'description', 'sap', 'fnlocation']
    const selectFields = ['plant', 'area', 'petitioner', 'opshift', 'type', 'detention', 'objective', 'contop']
    const autoFields = ['deliverable', 'receiver']
    let newValue
    switch (true) {
      case strFields.includes(prop): {
        newValue = event.target.value
        newValue = validationRegex[prop] ? newValue.replace(validationRegex[prop], '') : newValue

        setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
        break
      }
      case selectFields.includes(prop): {
        newValue = event.target.value
        setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
        if (prop === 'petitioner' && authUser.role !== 2) {
          getPetitionerOpShift(newValue)
        }
        if (prop === 'plant') {
          findAreas(newValue)
        }
        break
      }
      case autoFields.includes(prop): {
        newValue = data
        setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
        break
      }
      case prop === 'start': {
        let startDate = event._d
        const resultDate = await consultBlockDayInDB(startDate)
        if (resultDate.blocked) {
          setAlertMessage(resultDate.msj)
        } else {
          setAlertMessage(resultDate.msj)
          setValues({
            ...values,
            start: moment(startDate).startOf('date')
          })
        }
      }
    }

    // Deshacer errores al dar formato correcto
    const isFieldValid = validationRegex[prop] ? !validationRegex[prop].test(newValue) : newValue !== false
    if (errors[prop] && isFieldValid) {
      setErrors(current => {
        const updatedErrors = Object.keys(current).reduce((obj, key) => {
          if (key !== prop) {
            obj[key] = current[key]
          }

          return obj
        }, {})

        return updatedErrors
      })
    }
  }

  const onBlur = async e => {
    const resultSap = await consultSAP(e.target.value)
    if (resultSap.exist) {
      if (resultSap.sapWithOt) {
        console.log(resultSap.sapWithOt)
      }
      console.log(resultSap.sap)
    } else {
      setValues({
        ...values,
        sap: e.target.value
      })
    }
    setAlertMessage(resultSap.msj)

    return resultSap
  }

  const validationRegex = {
    title: /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9- !@#$%^&*()-_-~.+,/\"]/, // /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/,
    description: /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9- !@#$%^&*()-_-~.+,/\"]/, // /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/g,
    sap: /[^A-Z\s0-9- -.\"]/, // /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/g,
    fnlocation: /[^A-Z\s0-9- -.\"]/ // /[^0-9]/g
  }

  const validateForm = values => {
    const trimmedValues = {}
    const newErrors = {}
    const textFieldValues = ['title', 'fnlocation', 'sap', 'description']
    for (const key in values) {
      // Error campos vacíos
      if (key !== 'fnlocation' && key !== 'sap') {
        if ((values[key] === '' || !values[key] || (typeof values[key] === 'object' && values[key].length === 0))) {
          newErrors[key] = 'Por favor, especifica una opción válida'
        }
      }


      // Validaciones solo para claves de tipo string
      if (textFieldValues.includes(values[key])) {
        // Saca espacios en los values
        trimmedValues[key] = values[key].replace(/\s+$/, '')

        // Validación regex para otras claves de tipo string
        if (validationRegex[key] && !validationRegex[key].test(trimmedValues[key])) {
          newErrors[key] = `Por favor, introduce una opción válida`
        }
      }
    }

    return newErrors
  }

  const findAreas = plant => {
    let setOfAreas = areas.find(obj => obj.name === plant)
    if (setOfAreas) {
      let areaNames = setOfAreas.allAreas.map(
        element => Object.keys(element).toString() + ' - ' + Object.values(element).toString()
      )
      setPlants(Object.values(areaNames))
    } else {
      setPlants(['No aplica'])
    }
  }

  /* const getContOp = async plant => {
    console.log(plant, "PLANT2")
    let options = await getUsers(plant)
    console.log(options, "OPTIONS")

    setContOpOptions(options)
  } */

  const validateFiles = acceptedFiles => {
    const imageExtensions = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg', 'heif', 'HEIF']
    const documentExtensions = ['xls', 'xlsx', 'doc', 'docx', 'ppt', 'pptx', 'pdf', 'csv', 'txt']

    const isValidImage = file => {
      const extension = file.name.split('.').pop().toLowerCase()

      return imageExtensions.includes(extension)
    }

    const isValidDocument = file => {
      const extension = file.name.split('.').pop().toLowerCase()

      return documentExtensions.includes(extension)
    }

    const isValidFile = file => {
      return isValidImage(file) || isValidDocument(file)
    }

    const validationResults = acceptedFiles.map(file => {
      return {
        name: file.name,
        isValid: isValidFile(file)
      }
    })

    return validationResults
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      const invalidFiles = validateFiles(acceptedFiles).filter(file => !file.isValid)
      if (invalidFiles.length > 0) {
        console.log(validateFiles(invalidFiles))

        return invalidFiles
      }

      // Agregar los nuevos archivos a los archivos existentes en lugar de reemplazarlos
      setFiles(prevFiles => [...prevFiles, ...acceptedFiles.map(file => Object.assign(file))])
    }
  })

  const handleRemoveFile = file => {
    const uploadedFiles = files
    const filtered = uploadedFiles.filter(i => i.name !== file.name)
    setFiles([...filtered])
  }

  const renderFilePreview = file => {
    return (
      <Paper
        elevation={0} // Ajusta el nivel de elevación según tus preferencias
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px',
          border: `4px solid ${theme.palette.primary.main}`,
          borderRadius: '4px',
          width: '220px'
        }}
      >
        {file.type.startsWith('image') ? (
          <img width={50} height={50} alt={file.name} src={URL.createObjectURL(file)} />
        ) : (
          <Icon icon='mdi:file-document-outline' fontSize={50} />
        )}
        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', ml:'10px' }}>
          {`... ${file.name.slice(file.name.length-15, file.name.length)}`}
        </Typography>
      </Paper>
    )
  }

  const fileList = (
    <Grid container spacing={2}>
      {files.map(file => (
        <Grid item key={file.name}>
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              border: `4px solid ${theme.palette.primary.main}`,
              borderRadius: '4px',
              width: '220px',
              position: 'relative', // Agregamos esta propiedad para posicionar el icono correctamente
            }}
          >
            {file.type.startsWith('image') ? (
              <img width={50} height={50} alt={file.name} src={URL.createObjectURL(file)} />
            ) : (
              <Icon icon='mdi:file-document-outline' fontSize={50} />
            )}
            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', ml:'10px' }}>
              {`... ${file.name.slice(file.name.length-15, file.name.length)}`}
            </Typography>
            <IconButton
              onClick={() => handleRemoveFile(file)}
              sx={{
                position: 'absolute', // Posicionamos el icono en relación al Paper
                top: '0px', // Ajusta el valor según la posición vertical deseada
                right: '0px', // Ajusta el valor según la posición horizontal deseada
              }}
            >
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Paper>
        </Grid>
      ))}
    </Grid>
  )

  const handleRemoveAllFiles = () => {
    setFiles
    setFiles([])
  }

  const handleLinkClick = event => {
    event.preventDefault()
  }

  const onSubmit = async event => {
    event.preventDefault()
    const formErrors = validateForm(values)
    const requiredKeys = ['title']
    const areFieldsValid = requiredKeys.every(key => !formErrors[key])
    const isBlocked = await consultBlockDayInDB(values.start._d)
    const invalidFiles = validateFiles(files).filter(file => !file.isValid)

    if (Object.keys(formErrors).length === 0 || areFieldsValid || !isBlocked || !invalidFiles) {
      try {
        setIsUploading(true) // Se activa el Spinner

        const solicitud = await newDoc({ ...values, start: values.start._d })
        await uploadFilesToFirebaseStorage(files, solicitud.id)

        // Luego de completar la carga, puedes ocultar el spinner
        setIsUploading(false)

        // Se envía el mensaje de éxito
        setAlertMessage('Documento creado exitosamente con ID: ' + solicitud.id)
        handleRemoveAllFiles()
        setValues(initialValues)
        setErrors({})
      } catch (error) {
        setAlertMessage(error.message)
        setIsUploading(false) // Se cierra el spinner en caso de error
      }
    } else {
      setIsUploading(false)
      setErrors(formErrors)
    }
  }

  // establece el estado del contraturno del solicitante de acuerdo al estado de solicitante seleccionado, pasada por parametro.
  const getPetitionerOpShift = petitioner => {
    let findPetitioner = petitioners.find(user => user.name === petitioner)
    if (findPetitioner) {
      setPetitionerOpShift(findPetitioner.opshift)
    }
  }

  useEffect(() => {
    getReceiverUsers(values.plant).then(value => setAllUsers(value))
  }, [])

  // Establece planta solicitante y contop solicitante
  useEffect(() => {
    let plant = authUser && authUser.plant.map(plant => plant)

    if (authUser.role === 2) {
      let onlyPlant = plant[0]
      let userOption = authUser.displayName
      let userOpshift = authUser.opshift
      setValues({ ...values, plant: onlyPlant, opshift: userOpshift, petitioner: userOption })
      findAreas(onlyPlant)
    }
  }, [])

  //Establece opciones de contract operator
  useEffect(() => {
    if (values.plant) {
      getUsers(values.plant).then(value => {
        setContOpOptions(value)
      })
      getReceiverUsers(values.plant).then(value => setAllUsers(value))
      getPetitioner(values.plant).then(value => setPetitioners(value))
    }
  }, [values.plant])

  return (
    <Card>
      <Dialog sx={{ '.MuiDialog-paper': { minWidth: '20%' } }} open={!!alertMessage} maxWidth={false}>
        <DialogTitle sx={{ ml: 2, mt: 4 }} id='alert-dialog-title'>
          Atención
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ m: 2, whiteSpace: 'pre-line' }} id='alert-dialog-description'>
            {alertMessage}
          </DialogContentText>
          <DialogActions>
            <Button
              size='small'
              onClick={() => {
                setAlertMessage('')
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
      <CardContent>
        <form onSubmit={onSubmit}>
          <Grid container spacing={5}>
            {/* Título */}
            <Grid item xs={12}>
              <Box display='flex' alignItems='center'>
                <TextField
                  InputLabelProps={{ required: true }}
                  fullWidth
                  type='text'
                  label='Título'
                  value={values.title}
                  onChange={handleChange('title')}
                  error={errors.title ? true : false}
                  helperText={errors.title}
                  inputProps={{ maxLength: 25 }}
                />
                <StyledTooltip title='Rellena este campo con un título acorde a lo que necesitas. Recomendamos que no exceda las 15 palabras'>
                  <InfoIcon color='action'/>
                </StyledTooltip>
              </Box>
            </Grid>

            {/* Fecha inicio */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale='es'>
                  <Box display='flex' alignItems='center'>
                    <DatePicker
                      minDate={moment().subtract(1, 'year')}
                      maxDate={moment().add(1, 'year')}
                      label='Fecha'
                      value={values.start}
                      onChange={date => handleChange('start')(date)}
                      InputLabelProps={{ shrink: true, required: true }}
                      slotProps={{
                        textField: {
                          error: errors.start ? true : false,
                          helperText: errors.start
                        }
                      }}
                    />
                    <StyledTooltip title='Selecciona la fecha de inicio deseada para la tarea que requieres.'>
                      <InfoIcon color='action' />
                    </StyledTooltip>
                  </Box>
                </LocalizationProvider>
              </FormControl>
            </Grid>

            {/* Planta */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                sx={{ '& .MuiInputBase-root ': { width: '100%' } }}
                disabled={
                  authUser.role === 2 && (authUser.plant === 'Sucursal Santiago' || authUser.plant === 'allPlants')
                }
                error={errors.plant ? true : false}
              >
                <InputLabel id='input-label-area'>Planta</InputLabel>
                <Box display='flex' alignItems='center'>
                  <Select
                    label='Plant'
                    id='id-plant'
                    labelId='labelId-plant'
                    value={values.plant}
                    onChange={handleChange('plant')}
                  >
                    {authUser.role === 2 &&
                    (authUser.plant[0] === 'Sucursal Santiago' || authUser.plant[0] === 'allPlants')
                      ? areas.map(plant => {
                          return (
                            <MenuItem key={plant.name} value={plant.name}>
                              {plant.name}
                            </MenuItem>
                          )
                        })
                      : authUser &&
                        authUser.plant.map(plant => {
                          return (
                            <MenuItem key={plant} value={plant}>
                              {plant}
                            </MenuItem>
                          )
                        })}
                  </Select>
                  <StyledTooltip title='Selecciona la planta correspondiente.'>
                    <InfoIcon color='action' />
                  </StyledTooltip>
                </Box>
                {errors.plant && <FormHelperText>{errors.plant}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Área */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                sx={{ '& .MuiInputBase-root ': { width: '100%' } }}
                error={errors.area ? true : false}
              >
                <InputLabel id='input-label-area'>Área</InputLabel>
                <Box display='flex' alignItems='center' width='100%'>
                  <Select
                    label='Área'
                    defaultValue=''
                    id='id-area'
                    labelId='labelId-area'
                    value={values.area}
                    onChange={handleChange('area')}
                  >
                    {plants.map(plant => {
                      return (
                        <MenuItem key={plant} value={plant}>
                          {plant}
                        </MenuItem>
                      )
                    })}
                  </Select>
                  <StyledTooltip title='Selecciona el área dentro de tu planta en dónde se ejecutará la tarea que requieres.'>
                    <InfoIcon color='action' />
                  </StyledTooltip>
                </Box>
                {errors.area && <FormHelperText>{errors.area}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Texto mapa */}
            <Grid item xs={12}>
              <Typography sx={{ mr: 2 }}>
                ¿No sabe en qué área está? {`  `}
                <Link onClick={() => router.replace('/mapa/')}>Haga clic acá para saber</Link>
              </Typography>
            </Grid>

            {/* Contract operator
            <Grid item xs={12}>
              <Box display='flex' alignItems='center' width='100%'>
                <FormControl
                  fullWidth
                  sx={{ '& .MuiInputBase-root ': { width: '100%' } }}
                  error={errors.contop ? true : false}
                >
                  <InputLabel id='input-label-contop'>Contract operator</InputLabel>
                  <Box display='flex' alignItems='center' width='100%'>
                    <Select
                      label='Contract operator'
                      id='id-contop'
                      labelId='labelId-contop'
                      value={values.contop}
                      onChange={handleChange('contop')}
                    >
                      {contOpOptions.map(contop => {
                        return (
                          <MenuItem key={contop.name} value={contop.name}>
                            {contop.name}
                          </MenuItem>
                        )
                      })}
                    </Select>
                    <StyledTooltip title='Selecciona el Contract Operator a cargo de la Planta donde se ejecutará el trabajo.'>
                      <InfoIcon color='action' />
                    </StyledTooltip>
                  </Box>
                  {errors.contop && <FormHelperText>{errors.contop}</FormHelperText>}
                </FormControl>
              </Box>
            </Grid> */}

            {/* Contract Operator */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                sx={{ '& .MuiInputBase-root ': { width: '100%' } }}
                error={errors.contop ? true : false}
              >
                <InputLabel id='input-label-contop'>Contract Operator</InputLabel>
                <Box display='flex' alignItems='center'>
                  <Select
                    value={values.contop}
                    onChange={handleChange('contop')}
                    label='Contract Operator'
                    id='id-contop'
                    labelId='labelId-contop'
                  >
                    {authUser.role === 3 ? (
                      <MenuItem key={authUser.displayName} value={authUser.displayName}>
                        {authUser.displayName}
                      </MenuItem>
                      ) : (
                      contOpOptions.map(contop => {
                        return (
                          <MenuItem key={contop.name} value={contop.name}>
                            {contop.name}
                          </MenuItem>
                        )
                      }))
                    }
                  </Select>
                  <StyledTooltip title='Selecciona quién es la persona de tu Planta que ha hecho la solicitud de trabajo.'>
                    <InfoIcon color='action' />
                  </StyledTooltip>
                </Box>
                {errors.petitioner && <FormHelperText>{errors.petitioner}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Functional Location */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Box display='flex' alignItems='center'>
                  <TextField
                    fullWidth
                    type='text'
                    label='Functional Location'
                    value={values.fnlocation}
                    onChange={handleChange('fnlocation')}
                    error={errors.fnlocation ? true : false}
                    helperText={errors.fnlocation}
                    inputProps={{ maxLength: 25 }}
                  />
                  <StyledTooltip title='Ingresa el código del Functional Location en dónde será ejecutado el levantamiento.'>
                    <InfoIcon color='action' />
                  </StyledTooltip>
                </Box>
              </FormControl>
            </Grid>

            {/* Solicitante */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                sx={{ '& .MuiInputBase-root ': { width: '100%' } }}
                error={errors.petitioner ? true : false}
              >
                <InputLabel id='input-label-solicitante'>Solicitante</InputLabel>
                <Box display='flex' alignItems='center'>
                  <Select
                    disabled={
                      authUser.role === 2 && (authUser.plant !== 'Sucursal Santiago' || authUser.plant !== 'allPlants')
                    }
                    value={values.petitioner}
                    onChange={handleChange('petitioner')}
                    label='Solicitante'
                    id='id-solicitante'
                    labelId='labelId-solicitante'
                  >
                    {authUser.role === 2 &&
                    (authUser.plant !== 'Sucursal Santiago' || authUser.plant !== 'allPlants') ? (
                      <MenuItem key={authUser.displayName} value={authUser.displayName}>
                        {authUser.displayName}
                      </MenuItem>
                    ) : (
                      petitioners.map(user => {
                        return (
                          <MenuItem key={user.name} value={user.name}>
                            {user.name}
                          </MenuItem>
                        )
                      })
                    )}
                  </Select>
                  <StyledTooltip title='Selecciona quién es la persona de tu Planta que ha hecho la solicitud de trabajo.'>
                    <InfoIcon color='action' />
                  </StyledTooltip>
                </Box>
                {errors.petitioner && <FormHelperText>{errors.petitioner}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Contraturno del Solicitante */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                sx={{ '& .MuiInputBase-root ': { width: '100%' } }}
                error={errors.opshift ? true : false}
              >
                <InputLabel id='input-label-contraturno'>Contraturno del solicitante</InputLabel>
                <Box display='flex' alignItems='center'>
                  <Select
                    disabled={authUser.role === 2}
                    value={values.opshift}
                    onChange={handleChange('opshift')}
                    label='Contraturno del solicitante'
                    id='id-contraturno'
                    labelId='labelId-contraturno'
                  >
                    {authUser.role === 3 ||
                    authUser.plant === 'allPlants' ||
                    authUser.plant === 'Solicitante Santiago' ? (
                      <MenuItem value={petitionerOpShift}>{petitionerOpShift}</MenuItem>
                    ) : (
                      <MenuItem value={authUser.opshift}>{authUser.opshift}</MenuItem>
                    )}
                     <MenuItem value={'No Aplica'}>{'No Aplica'}</MenuItem>
                  </Select>
                  <StyledTooltip title='Corresponde a la persona que trabaja en el turno de la semana siguiente del solicitante.'>
                    <InfoIcon color='action' />
                  </StyledTooltip>
                </Box>
                {errors.opshift && <FormHelperText>{errors.opshift}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Estado Operacional de la Planta */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                sx={{ '& .MuiInputBase-root ': { width: '100%' } }}
                error={errors.type ? true : false}
              >
                <InputLabel id='input-label-type'>Estado Operacional Planta</InputLabel>
                <Box display='flex' alignItems='center'>
                  <Select
                    label='Estado Operacional Planta'
                    defaultValue=''
                    id='id-type'
                    labelId='labelId-type'
                    value={values.type}
                    onChange={handleChange('type')}
                  >
                    <MenuItem value='Normal'>Normal</MenuItem>
                    <MenuItem value='Outage'>Outage</MenuItem>
                    <MenuItem value='Shutdown'>Shutdown</MenuItem>
                  </Select>
                  <StyledTooltip title='Selecciona en qué estado operacional se encontrará el lugar donde se ejecutará la tarea.'>
                    <InfoIcon color='action' />
                  </StyledTooltip>
                </Box>
                {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Máquina Detenida */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                sx={{ '& .MuiInputBase-root ': { width: '100%' } }}
                error={errors.detention ? true : false}
              >
                <InputLabel id='input-label-detention'>¿Estará la máquina detenida?</InputLabel>
                <Box display='flex' alignItems='center'>
                  <Select
                    label='¿Estará la máquina detenida?'
                    defaultValue=''
                    id='id-detention'
                    labelId='labelId-detention'
                    value={values.detention}
                    onChange={handleChange('detention')}
                  >
                    <MenuItem value='yes'>Sí</MenuItem>
                    <MenuItem value='no'>No</MenuItem>
                    <MenuItem value='n/a'>No aplica</MenuItem>
                  </Select>
                  <StyledTooltip title='Selecciona si la máquina estará detenida, no lo estará o no aplica el caso.'>
                    <InfoIcon color='action' />
                  </StyledTooltip>
                </Box>
                {errors.detention && <FormHelperText>{errors.detention}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* SAP */}
            <Grid item xs={12}>
              <Box display='flex' alignItems='center'>
                <TextField
                  InputLabelProps={{ required: false }}
                  fullWidth
                  type='text'
                  label='Número SAP'
                  id='sap-input'
                  onBlur={onBlur}
                  value={values.sap}
                  onChange={handleChange('sap')}
                  error={errors.sap ? true : false}
                  helperText={errors.sap}
                  inputProps={{ maxLength: 10 }}
                />
                <StyledTooltip title='Rellena este campo sólo si conoces el número SAP'>
                  <InfoIcon color='action' />
                </StyledTooltip>
              </Box>
            </Grid>

            {/* Tipo de Levantamiento */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                sx={{ '& .MuiInputBase-root ': { width: '100%' } }}
                error={errors.objective ? true : false}
              >
                <InputLabel id='input-label-objective'>Tipo de Levantamiento</InputLabel>
                <Box display='flex' alignItems='center'>
                  <Select
                    label='Tipo de levantamiento'
                    defaultValue=''
                    id='id-objetivo'
                    labelId='labelId-objetivo'
                    value={values.objective}
                    onChange={handleChange('objective')}
                  >
                    <MenuItem value='Análisis fotogramétrico'>Análisis fotogramétrico</MenuItem>
                    <MenuItem value='Análisis GPR'>Análisis GPR</MenuItem>
                    <MenuItem value='Inspección Dron'>Inspección Dron</MenuItem>
                    <MenuItem value='Levantamiento 3D'>Levantamiento 3D</MenuItem>
                    <MenuItem value='Levantamiento 3D GPS'>Levantamiento 3D GPS</MenuItem>
                    <MenuItem value='Topografía'>Topografía</MenuItem>
                  </Select>
                  <StyledTooltip title='Selecciona cuál es el tipo de levantamiento que necesitas para tu trabajo. Sólo podrás seleccionar una opción. Si requieres más de un tipo de levantamiento, deberás hacer una nueva solicitud para cada tipo de levantamiento.'>
                    <InfoIcon color='action' />
                  </StyledTooltip>
                </Box>
                {errors.objective && <FormHelperText>{errors.objective}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Entregables */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Box display='flex' alignItems='center'>
                  <Autocomplete
                    multiple
                    fullWidth
                    options={['Sketch', 'Plano de Fabricación', 'Plano de Diseño', 'Memoria de Cálculo', 'Informe']}
                    value={values.deliverable}
                    onChange={handleChange('deliverable')}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label='Entregables del levantamiento'
                        InputLabelProps={{ required: true }}
                        error={errors.deliverable ? true : false}
                        helperText={errors.deliverable}
                      />
                    )}
                  />
                  <StyledTooltip title='Selecciona cuál o cuáles serán los entregables que esperas recibir por parte de Procure.'>
                    <InfoIcon color='action' />
                  </StyledTooltip>
                </Box>
              </FormControl>
            </Grid>

            {/* Destinatarios */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Box display='flex' alignItems='center'>
                  <Autocomplete
                    multiple
                    fullWidth
                    options={allUsers}
                    getOptionLabel={user => user.name}
                    value={values.receiver}
                    onChange={handleChange('receiver')}
                    renderInput={params => (
                      <TextField
                        {...params}
                        InputLabelProps={{ required: true }}
                        variant='outlined'
                        label='Destinatarios'
                        error={errors.receiver ? true : false}
                        helperText={errors.receiver}
                      />
                    )}
                  />
                  <StyledTooltip title='Selecciona a quién o a quiénes deberemos enviar los entregables.'>
                    <InfoIcon color='action' />
                  </StyledTooltip>
                </Box>
              </FormControl>
            </Grid>

            {/*Descripción*/}
            <Grid item xs={12}>
              <Box display='flex' alignItems='center'>
                <FormControl fullWidth>
                  <TextField
                    InputLabelProps={{ required: true }}
                    fullWidth
                    type='text'
                    label='Descripción'
                    inputProps={{ maxLength: 100 }}
                    value={values.description}
                    onChange={handleChange('description')}
                    error={errors.description ? true : false}
                    helperText={errors.description}
                  />
                </FormControl>
                <StyledTooltip title='Rellena este campo con toda la información que consideres importante para que podamos ejecutar de mejor manera el levantamiento.'>
                  <InfoIcon color='action' />
                </StyledTooltip>
              </Box>
            </Grid>

            {/* Dropzone archivos */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Fragment>
                  <div {...getRootProps({ className: 'dropzone' })}>
                    <input {...getInputProps()} />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: ['column', 'column', 'row'],
                        alignItems: 'center',
                        margin: 'auto'
                      }}
                    >
                      <Box
                        sx={{ pl: 2, display: 'flex', flexDirection: 'column', alignItems: ['center'], margin: 'auto' }}
                      >
                        <HeadingTypography variant='h5'>Subir archivos</HeadingTypography>
                        <Icon icon='mdi:file-document-outline' />
                        <Typography sx={{ mt: 5 }} color='textSecondary'>
                          Arrastra las imágenes acá o <Link onClick={() => handleLinkClick}>haz click acá</Link> para
                          buscarlas en tu dispositivo
                        </Typography>
                      </Box>
                    </Box>
                  </div>
                  {files.length ? (
                    <Fragment>
                      <List>{fileList}</List>
                      <div className='buttons'>
                        <Button color='error' variant='outlined' onClick={handleRemoveAllFiles}>
                          Quitar todo
                        </Button>
                      </div>
                    </Fragment>
                  ) : null}
                </Fragment>
              </FormControl>
            </Grid>

            {/* Botón submit */}
            <Grid item xs={24}>
              <Box
                sx={{
                  gap: 5,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Button type='submit' variant='contained' size='large'>
                  Enviar Solicitud
                </Button>
                {isUploading && <Dialog sx={{ '.MuiDialog-paper': { minWidth: '20%' } }} open={isUploading} closeAfterTransition={true} maxWidth={false}>
                  <DialogTitle sx={{ mt: 2, textAlign: 'center' }} id='spinner-dialog-title'>
                    Enviando solicitud
                  </DialogTitle>
                  <DialogContent sx={{ textAlign: 'center' }}>
                    <CircularProgress
                    size={40} // Ajusta el tamaño del CircularProgress según tus preferencias
                  />
                  </DialogContent>
                </Dialog>
                }
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default FormLayoutsSolicitud
