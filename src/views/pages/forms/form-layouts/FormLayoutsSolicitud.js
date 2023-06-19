// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebaseAuth'
import { useRouter } from 'next/router'

// ** MUI Imports
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
    author: '',
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
    sap: ''
  }

  // ** Hooks
  const { authUser, getPetitioner, getAllMELUsers, newDoc, uploadFilesToFirebaseStorage } = useFirebase()
  const router = useRouter()

  // ** States
  const [plants, setPlants] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [files, setFiles] = useState([])
  const [petitioners, setPetitioners] = useState([])
  const [petitionerOpShift, setPetitionerOpShift] = useState([])

  const [values, setValues] = useState(initialValues)

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

  const handleSubmit = async () => {
    event.preventDefault()
    const solicitud = await newDoc(values)
    await uploadFilesToFirebaseStorage(files, solicitud.id)
    handleRemoveAllFiles()
    setValues(initialValues)
  }

  // establece el estado del solicitante de acuerdo a la planta pasada por parametro.
  const getPetitionerOptions = async plant => {
    let options = await getPetitioner(plant)
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
    if (authUser.role === 2) {
      let plant = authUser.plant
      setValues({ ...values, plant })
      findAreas(plant)
      getPetitionerOptions(plant)
    }
  }, [])

  return (
    <Card>
      <CardHeader title='Nueva Solicitud' />
      <CardContent>
        <form onSubmit={e => e.preventDefault()}>
          <Grid container spacing={5}>
            {/* Título */}
            <Grid item xs={12}>
              <TextField
                InputLabelProps={{ required: true }}
                fullWidth
                type='text'
                label='Título'
                value={values.title}
                onChange={() => setValues({ ...values, title: event.target.value })}
              />
            </Grid>

            {/* Fecha inicio */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                type='date'
                InputLabelProps={{ shrink: true, required: false }}
                label='Fecha'
                onChange={() =>
                  setValues({
                    ...values,
                    start: new Date(
                      Number(event.srcElement.value.split('-')[0]),
                      Number(event.srcElement.value.split('-')[1] - 1),
                      Number(event.srcElement.value.split('-')[2])
                    )
                  })
                }
              />
            </Grid>

            {/* Planta */}
            <Grid item xs={12}>
              <FormControl fullWidth disabled={authUser.role === 2}>
                <InputLabel id='input-label-area'>Planta</InputLabel>
                <Select
                  InputLabelProps={{ required: true }}
                  label='Plant'
                  id='id-plant'
                  labelId='labelId-plant'
                  value={values.plant}
                  onChange={() => {
                    setValues({ ...values, plant: event.target.dataset.value })
                    findAreas(event.target.dataset.value)
                    getPetitionerOptions(event.target.dataset.value)
                  }}
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
              </FormControl>
            </Grid>

            {/* Área */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='input-label-area'>Área</InputLabel>
                <Select
                  InputLabelProps={{ required: true }}
                  label='Área'
                  defaultValue=''
                  id='id-area'
                  labelId='labelId-area'
                  value={values.area}
                  onChange={() => setValues({ ...values, area: event.target.dataset.value })}
                >
                  {plants.map(plant => {
                    return (
                      <MenuItem key={plant} value={plant}>
                        {plant}
                      </MenuItem>
                    )
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Solicitante - nombre + num */}

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='input-label-solicitante'>Solicitante</InputLabel>
                <Select
                  InputLabelProps={{ required: true }}
                  value={values.petitioner}
                  onChange={() => {
                    setValues({ ...values, petitioner: event.target.dataset.value })
                    getPetitionerOpShift(event.target.dataset.value)
                  }}
                  label='Solicitante'
                  id='id-solicitante'
                  labelId='labelId-solicitante'
                >
                  {authUser && authUser.plant === 'allPlants' ? (
                    petitioners.map(user => {
                      return (
                        <MenuItem key={user.name} value={user.name}>
                          {user.name}
                        </MenuItem>
                      )
                    })
                  ) : (
                    <MenuItem value={authUser.displayName}>{authUser.displayName}</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* Contraturno del solicitante - nombre + num */}

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='input-label-contraturno'>Contraturno del solicitante</InputLabel>
                <Select
                  InputLabelProps={{ required: true }}
                  value={values.opshift}
                  onChange={() => setValues({ ...values, opshift: event.target.dataset.value })}
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
              <FormControl fullWidth>
                <InputLabel id='input-label-type'>Tipo de trabajo</InputLabel>
                <Select
                  InputLabelProps={{ required: true }}
                  label='Tipo de trabajo'
                  defaultValue=''
                  id='id-type'
                  labelId='labelId-type'
                  value={values.type}
                  onChange={() => setValues({ ...values, type: event.target.dataset.value })}
                >
                  <MenuItem value='Normal'>Normal</MenuItem>
                  <MenuItem value='Outage'>Outage</MenuItem>
                  <MenuItem value='Shutdown'>Shutdown</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                value={values.sap}
                onChange={() => setValues({ ...values, sap: event.target.value })}
                label='Número SAP'
                id='sap-input'
                InputProps={{
                  endAdornment: (
                    <Tooltip title='Rellena este campo sólo si conoces el número SAP'>
                      <InfoIcon color='action' />
                    </Tooltip>
                  )
                }}
              />
            </Grid>

            {/* Objetivo - Tipo de levantamiento - Select*/}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='input-label-objective'>Tipo de Levantamiento</InputLabel>
                <Select
                  InputLabelProps={{ required: true }}
                  label='Tipo de levantamiento'
                  defaultValue=''
                  id='id-objetivo'
                  labelId='labelId-objetivo'
                  value={values.objective}
                  onChange={event => {
                    const newValue = event.target.value
                    setValues(prevValues => ({
                      ...prevValues,
                      objective: newValue
                    }))
                  }}
                >
                  <MenuItem value='Análisis fotogramétrico'>Análisis fotogramétrico</MenuItem>
                  <MenuItem value='Análisis GPR'>Análisis GPR</MenuItem>
                  <MenuItem value='Inspección Dron'>Inspección Dron</MenuItem>
                  <MenuItem value='Levantamiento 3D'>Levantamiento 3D</MenuItem>
                  <MenuItem value='Levantamiento 3D GPS'>Levantamiento 3D GPS</MenuItem>
                  <MenuItem value='Topografía'>Topografía</MenuItem>
                </Select>
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
                  onChange={(event, newValue) => {
                    console.log(newValue)
                    setValues(prevValues => ({
                      ...prevValues,
                      deliverable: newValue
                    }))
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Entregables del levantamiento'
                      InputLabelProps={{ required: true }}
                      variant='outlined'
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
                  value={values.receiver}
                  onChange={(event, newValue) => {
                    setValues(prevValues => ({
                      ...prevValues,
                      receiver: newValue
                    }))
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      InputLabelProps={{ required: true }}
                      variant='outlined'
                      label='Destinatarios'
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
                  value={values.description}
                  onChange={() => setValues({ ...values, description: event.target.value })}

                  //placeholder='carterleonard@gmail.com'
                  //helperText='You can use letters, numbers & periods'
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
                <Button onClick={() => handleSubmit()} type='submit' variant='contained' size='large'>
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
