// ** React Imports
import { Fragment, useState } from 'react'

// ** Hooks
import { useAuth } from 'src/context/FirebaseContext'
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
import CardSnippet from 'src/@core/components/card-snippet'
import areas from 'src/@core/components/plants-areas/index'

// ** Source code imports
// import * as source from 'src/views/forms/form-elements/file-uploader/FileUploaderSourceCode'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { useDropzone } from 'react-dropzone'

// ** Custom Components Imports
import PageHeader from 'src/@core/components/page-header'

// ** Styled Component
import DropzoneWrapper from 'src/@core/styles/libs/react-dropzone'

// ** Custom Table Components Imports
import TableHeaderNewUser from 'src/views/pages/apps/user/list/TableHeaderNewUser'
import AddNewUserDrawer from 'src/views/pages/apps/user/list/AddNewUserDrawer'


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


const FormLayoutsSolicitud = () => {
  const [values, setValues] = useState({
    title: '',
    start: '',
    description: '',
    area: '',
    plant:'',
    objective: '',
    receiver: ''
  })
  const [plants,setPlants] = useState([])
  const router = useRouter()

  const findAreas = (plant) => {
      let setOfAreas = (areas.find((obj)=>  obj.name === plant)).allAreas
      let areaNames = setOfAreas.map((element)=>Object.values(element).toString())
      setPlants(Object.values(areaNames))
  }

  // ** State Solo para Image Uploader
  const [files, setFiles] = useState([])

  // ** Hooks
  const auth = useAuth();


  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      console.log(acceptedFiles)
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

  const handleSubmit = () => {
    //event.preventDefault();
    auth.newDoc(values)
    setValues({
      title: '',
      start: '',
      description: '',
      area: '',
      objective: '',
      receiver: ''
    })
  }

  const [addUserOpen, setAddUserOpen] = useState(false)


  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen)


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
                fullWidth type='text'
                label='Título'
                value={values.title}
                onChange={() => setValues({ ...values, title: event.target.value })} />
            </Grid>

            {/* Fecha inicio */}
            <Grid item xs={12}>
              <TextField fullWidth type='date' InputLabelProps={{ shrink: true, required: false }} label='Fecha'
                onChange={() => setValues({ ...values, start: (new Date(Number((event.srcElement.value).split('-')[0]), Number((event.srcElement.value).split('-')[1] - 1), Number((event.srcElement.value).split('-')[2]))) })} />
            </Grid>

            {/* Planta */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='input-label-area'>Planta</InputLabel>
                <Select
                  InputLabelProps={{ required: true }}
                  label='Plant'
                  defaultValue='...'
                  id='id-plant'
                  labelId='labelId-plant'
                  value={values.plant}
                  onChange={() => {
                    setValues({ ...values, plant: event.target.dataset.value })
                    findAreas(event.target.dataset.value)}}>
                  {areas.map(plant=>{return(<MenuItem key={plant.name} value={plant.name}>{plant.name}</MenuItem>)})}
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
                  onChange={() => setValues({ ...values, area: event.target.dataset.value })}>

                  {(plants.map(plant=>{return(<MenuItem key={plant} value={plant}>{plant}</MenuItem>)}))}

                </Select>
              </FormControl>
            </Grid>

            {/* Texto mapa */}
            <Grid item xs={12}>
              <Typography sx={{ mr: 2 }}>
                ¿No sabe en qué área está? {`  `}
                <Link onClick={()=>router.replace('/mapa/')}>
                    Haga clic acá para saber
                </Link>
              </Typography>
            </Grid>


            {/* Box con tipo de operación y sap */}
            <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>

            <FormControl sx={{ mb: 5, mr: 2, flex: 'auto' }}>
                <InputLabel id='input-label-type'>Tipo de trabajo</InputLabel>
                <Select
                  InputLabelProps={{ required: true }}
                  label='Tipo de trabajo'
                  defaultValue=''
                  id='id-type'
                  labelId='labelId-type'
                  value={values.type}
                  onChange={() => setValues({ ...values, type: event.target.dataset.value })}>
                  <MenuItem value='Normal'>Normal</MenuItem>
                  <MenuItem value='Outage'>Outage</MenuItem>
                  <MenuItem value='Shutdown'>Shutdown</MenuItem>
                </Select>
                </FormControl>
                <FormControl sx={{ mb: 5, mr: 2, flex: 'auto' }}>
            <TextField
              onChange={e => setValues({ ...values, ot: e.target.value })}
              label="SAP"
              id="sap-input"
              defaultValue='Asignar SAP'
            />
            </FormControl>
            </Box>
            </Grid>

            {/* Objetivo */}
            <Grid item xs={12} sx={{pt:'0 !important'}}>
              <FormControl fullWidth>
                <InputLabel id='input-label-objetivo'>Objetivo</InputLabel>
                <Select
                  InputLabelProps={{ required: true }}
                  label='Objetivo'
                  defaultValue=''
                  id='id-objetivo'
                  labelId='labelId-objetivo'
                  value={values.objective}
                  onChange={() => setValues({ ...values, objective: event.target.dataset.value })}>
                  <MenuItem value='Análisis fotogramétrico'>Análisis fotogramétrico</MenuItem>
                  <MenuItem value='Análisis GPR'>Análisis GPR</MenuItem>
                  <MenuItem value='Inspección Dron'>Inspección Dron</MenuItem>
                  <MenuItem value='Levantamiento 3D'>Levantamiento 3D</MenuItem>
                  <MenuItem value='Levantamiento 3D + Planos'>Levantamiento 3D + Planos</MenuItem>
                  <MenuItem value='Topografía Shutdown'>Topografía Shutdown</MenuItem>
                  <MenuItem value='Topografía shutdown + documentos'>Topografía shutdown + documentos</MenuItem>
                  <MenuItem value='Topografía + documentos'>Topografía + documentos</MenuItem>
                  <MenuItem value='Medición de espesores'>Medición de espesores</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Destinatario */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='input-label-destinatario'>Destinatario</InputLabel>
                <Select
                  InputLabelProps={{ required: true }}
                  value={values.receiver}
                  onChange={() => setValues({ ...values, receiver: event.target.dataset.value })}
                  label='Destinatario'
                  defaultValue=''
                  id='id-destinatario'
                  labelId='labelId-destinatario'>
                  <MenuItem value='Camila Muñoz Jimenez'>
                    Camila Muñoz Jimenez - camila.munoz@bhp.com - Supervisora
                  </MenuItem>
                  <MenuItem value='Felipe Perez Perez'>
                    Felipe Perez Perez - felipe.perez@bhp.com - Supervisor
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Botón nuevo destinatario */}
            <Grid item xs={12}>
              <TableHeaderNewUser toggle={toggleAddUserDrawer} />

              <AddNewUserDrawer open={addUserOpen} toggle={toggleAddUserDrawer} />

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
                    <Box sx={{ display: 'flex', flexDirection: ['column', 'column', 'row'], alignItems: 'center', margin:'auto'}}>
                      <Box sx={{pl:2, display: 'flex', flexDirection: 'column', alignItems: ['center'] ,  margin:'auto'}}>
                        <HeadingTypography variant='h5'>Subir archivos</HeadingTypography>
                        <Icon icon='mdi:file-document-outline' />
                        <Typography sx={{mt:5}} color='textSecondary'>
                          Arrastra las imágenes acá o{' '}
                          <Link onClick={() => handleLinkClick}>
                            haz click acá
                          </Link>{' '}
                          para buscarlas en tu dispositivo
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
