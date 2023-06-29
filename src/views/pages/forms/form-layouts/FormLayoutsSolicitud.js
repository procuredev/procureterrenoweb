// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebaseAuth'
import { useRouter } from 'next/router'

// ** MUI Imports
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
import OutlinedInput from '@mui/material/OutlinedInput'
import InputAdornment from '@mui/material/InputAdornment'
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

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { useDropzone } from 'react-dropzone'

const FormLayoutsSolicitud = () => {
  const initialValues = {
    title: '',
    opshift: '',
    start: '',
    description: '',
    area: '',
    plant: '',
    objective: '',
    deliverable: [],
    receiver: [],
    type: '',
    petitioner: '',
    sap: '',
    fnlocation: '',
    detention: ''
  }

  // ** Hooks
  const {
    authUser,
    getPetitioner,
    getAllMELUsers,
    newDoc,
    uploadFilesToFirebaseStorage,
    getAllPlantUsers,
    consultDay
  } = useFirebase()
  const router = useRouter()

  // ** States
  const [plants, setPlants] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [files, setFiles] = useState([])
  const [petitioners, setPetitioners] = useState([])
  const [petitionerOpShift, setPetitionerOpShift] = useState([])
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [errors, setErrors] = useState({})

  const [values, setValues] = useState(initialValues)

  const handleChange = prop => async (event, data) => {
    const strFields = ['title', 'description', 'sap', 'fnlocation', 'start']
    const selectFields = ['plant', 'area', 'petitioner', 'opshift', 'type', 'detention', 'objective']
    const autoFields = ['deliverable', 'receiver']
    let newValue

    switch (true) {
      case strFields.includes(prop): {
        newValue = event.target.value
        newValue = validationRegex[prop] ? newValue.replace(validationRegex[prop], '') : newValue
        if (prop === 'start') {
          let startDate = new Date(
            Number(newValue.split('-')[0]),
            Number(newValue.split('-')[1] - 1),
            Number(newValue.split('-')[2])
          )

          const resultDate = await consultDay(startDate)

          if (resultDate.blocked) {
            alert(resultDate.msj)
          } else {
            alert(resultDate.msj)
            setValues({
              ...values,
              start: startDate
            })
          }
        } else {
          setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
        }
        break
      }
      case selectFields.includes(prop): {
        newValue = event.target.value
        if (prop === 'petitioner') {
          getPetitionerOpShift(newValue)
        }
        if (prop === 'plant') {
          findAreas(newValue)
          getPetitionerOptions(newValue)
        }
        setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
        break
      }
      case autoFields.includes(prop): {
        newValue = data
        setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
        break
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

  const validationRegex = {
    title: /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/,
    description: /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/g,
    sap: /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/g,
    fnlocation: /[^0-9]/g
  }

  const validateForm = values => {
    const trimmedValues = {}
    const newErrors = {}
    const textFieldValues = ['title', 'fnlocation', 'sap', 'description']
    for (const key in values) {
      // Error campos vacíos
      if (values[key] === '' || !values[key] || (typeof values[key] === 'object' && values[key].length === 0)) {
        newErrors[key] = 'Por favor, especifica una opción válida'
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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      setFiles(acceptedFiles.map(file => Object.assign(file)))
    }
  })

  const handleRemoveFile = file => {
    const uploadedFiles = files
    const filtered = uploadedFiles.filter(i => i.name !== file.name)
    setFiles([...filtered])
  }

  const renderFilePreview = file => {
    if (file.type.startsWith('image')) {
      return <img width={38} height={38} alt={file.name} src={URL.createObjectURL(file)} />
    } else {
      return <Icon icon='mdi:file-document-outline' />
    }
  }

  const fileList = files.map(file => (
    <ListItem key={file.name}>
      <div className='file-details'>
        <div className='file-preview'>{renderFilePreview(file)}</div>
        <div>
          <Typography className='file-name'>{file.name}</Typography>
          <Typography className='file-size' variant='body2'>
            {Math.round(file.size / 100) / 10 > 1000
              ? `${(Math.round(file.size / 100) / 10000).toFixed(1)} mb`
              : `${(Math.round(file.size / 100) / 10).toFixed(1)} kb`}
          </Typography>
        </div>
      </div>
      <IconButton onClick={() => handleRemoveFile(file)}>
        <Icon icon='mdi:close' fontSize={20} />
      </IconButton>
    </ListItem>
  ))

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

  const handleRemoveAllFiles = () => {
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
    if (Object.keys(formErrors).length === 0 || (values.company === 'Procure' && areFieldsValid)) {
      try {
        const solicitud = await newDoc(values)
        setSuccessMessage('Documento creado exitosamente con ID: ' + solicitud.id)
        await uploadFilesToFirebaseStorage(files, solicitud.id)
        handleRemoveAllFiles()
        setValues(initialValues)
        setErrors({})
      } catch (error) {
        setErrorMessage(error.message)
      }
    } else {
      setErrors(formErrors)
    }
  }

  // establece el estado del solicitante de acuerdo a la planta pasada por parametro.
  const getPetitionerOptions = async plant => {
    let options = await getPetitioner(plant)

    setPetitioners(options)
  }

  // establece el estado del solicitante de acuerdo a la planta pasada por parametro.
  const getPetitionerOptions2 = async plant => {
    let options = await getAllPlantUsers(plant)
    setPetitioners(options)
  }

  // establece el estado del contraturno del solicitante de acuerdo al estado de solicitante seleccionado, pasada por parametro.
  const getPetitionerOpShift = petitioner => {
    let findPetitioner = petitioners.find(user => user.name === petitioner)
    if (findPetitioner) {
      setPetitionerOpShift(findPetitioner.opshift)
    }
  }

  useEffect(() => {
    getAllMELUsers().then(value => setAllUsers(value))
  }, [])

  useEffect(() => {
    let plant = authUser.plant
    if (authUser.role === 2) {
      setValues({ ...values, plant })
      findAreas(plant)
      getPetitionerOptions(plant)
    } else if (authUser.role === 3) {
      getPetitionerOptions2(plant)
    }
  }, [])

  return (
    <Card>
      <CardHeader title='Nueva Solicitud' />
      <CardContent>
        {successMessage && (
          <Alert severity='success'>
            <AlertTitle>Éxito</AlertTitle>
            {successMessage}
          </Alert>
        )}{' '}
        {errorMessage && (
          <Alert severity='error' onClose={() => setErrorMessage('')}>
            <AlertTitle>Error</AlertTitle>
            {errorMessage}
          </Alert>
        )}
      </CardContent>
      <CardContent>
        <form onSubmit={onSubmit}>
          <Grid container spacing={5}>
            {/* Título */}
            <Grid item xs={12}>
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
            </Grid>

            {/* Fecha inicio */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <TextField
                  type='date'
                  InputLabelProps={{ shrink: true, required: true }}
                  label='Fecha'
                  onChange={handleChange('start')}
                  error={errors.start ? true : false}
                  helperText={errors.start}
                />
              </FormControl>
            </Grid>

            {/* Planta */}
            <Grid item xs={12}>
              <FormControl fullWidth disabled={authUser.role === 2} error={errors.plant ? true : false}>
                <InputLabel id='input-label-area'>Planta</InputLabel>
                <Select
                  label='Plant'
                  id='id-plant'
                  labelId='labelId-plant'
                  value={values.plant}
                  onChange={handleChange('plant')}
                >
                  {authUser && authUser.plant === 'allPlants'
                    ? areas.map(plant => {
                        return (
                          <MenuItem key={plant.name} value={plant.name}>
                            {plant.name}
                          </MenuItem>
                        )
                      })
                    : authUser && <MenuItem value={authUser.plant}>{authUser.plant}</MenuItem>}
                </Select>
                {errors.plant && <FormHelperText>{errors.plant}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Área */}
            <Grid item xs={12}>
              <FormControl fullWidth error={errors.area ? true : false}>
                <InputLabel id='input-label-area'>Área</InputLabel>
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
                {errors.area && <FormHelperText>{errors.area}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Functional Location */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <TextField
                  fullWidth
                  type='text'
                  label='Functional Location'
                  value={values.fnlocation}
                  onChange={handleChange('fnlocation')}
                  error={errors.fnlocation ? true : false}
                  helperText={errors.fnlocation}
                  inputProps={{ maxLength: 4 }}
                />
              </FormControl>
            </Grid>

            {/* Solicitante - nombre + num */}

            <Grid item xs={12}>
              <FormControl fullWidth error={errors.petitioner ? true : false}>
                <InputLabel id='input-label-solicitante'>Solicitante</InputLabel>
                <Select
                  value={values.petitioner}
                  onChange={handleChange('petitioner')}
                  label='Solicitante'
                  id='id-solicitante'
                  labelId='labelId-solicitante'
                >
                  {authUser && authUser.plant === 'allPlants'
                    ? petitioners.map(user => {
                        return (
                          <MenuItem key={user.name} value={user.name}>
                            {user.name}
                          </MenuItem>
                        )
                      })
                    : petitioners.map(user => {
                        return (
                          <MenuItem key={user.name} value={user.name}>
                            {user.name}
                          </MenuItem>
                        )
                      })}
                </Select>
                {errors.petitioner && <FormHelperText>{errors.petitioner}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Contraturno del solicitante - nombre + num */}

            <Grid item xs={12}>
              <FormControl fullWidth error={errors.opshift ? true : false}>
                <InputLabel id='input-label-contraturno'>Contraturno del solicitante</InputLabel>
                <Select
                  value={values.opshift}
                  onChange={handleChange('opshift')}
                  label='Contraturno del solicitante'
                  id='id-contraturno'
                  labelId='labelId-contraturno'
                >
                  {authUser.plant === 'allPlants' ? (
                    <MenuItem value={petitionerOpShift}>{petitionerOpShift}</MenuItem>
                  ) : (
                    <MenuItem value={authUser.opshift}>{authUser.opshift}</MenuItem>
                  )}
                </Select>
                {errors.opshift && <FormHelperText>{errors.opshift}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Texto mapa */}
            <Grid item xs={12}>
              <Typography sx={{ mr: 2 }}>
                ¿No sabe en qué área está? {`  `}
                <Link onClick={() => router.replace('/mapa/')}>Haga clic acá para saber</Link>
              </Typography>
            </Grid>

            {/* Box con tipo de operación*/}
            <Grid item xs={12}>
              <FormControl fullWidth error={errors.type ? true : false}>
                <InputLabel id='input-label-type'>Tipo de trabajo</InputLabel>
                <Select
                  label='Tipo de trabajo'
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
                {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Detención maq */}
            <Grid item xs={12}>
              <FormControl fullWidth error={errors.detention ? true : false}>
                <InputLabel id='input-label-detention'>Detención de máquina</InputLabel>
                <Select
                  label='Detención de máquina'
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
                {errors.detention && <FormHelperText>{errors.detention}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                value={values.sap}
                onChange={handleChange('sap')}
                label='Número SAP'
                id='sap-input'
                inputProps={{ maxLength: 10 }}
                InputProps={{
                  endAdornment: (
                    <Tooltip title='Rellena este campo sólo si conoces el número SAP'>
                      <InfoIcon color='action' />
                    </Tooltip>
                  )
                }}
                error={errors.sap ? true : false}
                helperText={errors.sap}
              />
            </Grid>

            {/* Objetivo - Tipo de levantamiento - Select*/}
            <Grid item xs={12}>
              <FormControl fullWidth error={errors.objective ? true : false}>
                <InputLabel id='input-label-objective'>Tipo de Levantamiento</InputLabel>
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
                {errors.objective && <FormHelperText>{errors.objective}</FormHelperText>}
              </FormControl>
            </Grid>

            {/*Entregables - Multiple autocomplete */}
            <Grid item xs={12}>
              <FormControl fullWidth>
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
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <Autocomplete
                  multiple
                  fullWidth
                  options={allUsers}
                  getOptionLabel={user => user.name}
                  isOptionEqualToValue={option => option.name}
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
              </FormControl>
            </Grid>

            {/* Descripción */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <TextField
                  InputLabelProps={{ required: true }}
                  fullWidth
                  type='Text'
                  label='Descripción'
                  inputProps={{ maxLength: 100 }}
                  value={values.description}
                  onChange={handleChange('description')}
                  error={errors.description ? true : false}
                  helperText={errors.description}
                />
              </FormControl>
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
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default FormLayoutsSolicitud
