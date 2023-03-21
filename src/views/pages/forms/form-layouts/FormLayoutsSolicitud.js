// ** React Imports
import { Fragment, useState } from 'react'

// ** Hooks
import { useAuth } from 'src/context/FirebaseContext'

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
  //Imagen

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
    auth.newDoc(title, date, area, objective, receiver, description)
    setTitle('')
    setDate('')
    setArea('')
    setObjective('')
    setReceiver('')
    setDescription('')
    setFiles([])
  }

  const [addUserOpen, setAddUserOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [area, setArea] = useState('')
  const [objective, setObjective] = useState('')
  const [receiver, setReceiver] = useState('')
  const [description, setDescription] = useState('')

  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen)


  return (
    <Card>
      <CardHeader title='Nueva Solicitud' />
      <CardContent>
        <form onSubmit={e => e.preventDefault()}>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <TextField
                fullWidth type='text'
                label='Título'
                value={title}
                onChange={() => setTitle(event.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type='date' InputLabelProps={{ shrink: true, required: false }} label='Fecha'
                onChange={() => setDate(new Date (Number((event.srcElement.value).split('-')[0]),Number((event.srcElement.value).split('-')[1]-1),Number((event.srcElement.value).split('-')[2])))} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='input-label-area'>Área</InputLabel>
                <Select
                  label='Área'
                  defaultValue=''
                  id='id-area'
                  labelId='labelId-area'
                  value={area}
                  onChange={() => setArea(event.target.dataset.value)}>
                  <MenuItem value='2100'>2100</MenuItem>
                  <MenuItem value='3500'>3500</MenuItem>
                  <MenuItem value='3600'>3600</MenuItem>
                  <MenuItem value='3800'>3800</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography sx={{ mr: 2 }}>
                ¿No sabe en qué área está? {`  `}
                <Link target='_blank' href='/mapa-escondida'>
                  Haga click acá para saber
                </Link>
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='input-label-objetivo'>Objetivo</InputLabel>
                <Select
                  label='Objetivo'
                  defaultValue=''
                  id='id-objetivo'
                  labelId='labelId-objetivo'
                  value={objective}
                  onChange={() => setObjective(event.target.dataset.value)}>
                  <MenuItem value='Sketch'>Sketch</MenuItem>
                  <MenuItem value='Plano de Fabricación'>Plano de Fabricación</MenuItem>
                  <MenuItem value='Plano de Diseño'>Plano de Diseño</MenuItem>
                  <MenuItem value='Memoria de Cálculo'>Memoria de Cálculo</MenuItem>
                  <MenuItem value='Informe'>Informe</MenuItem>
                  <MenuItem value='Otro'>Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='input-label-destinatario'>Destinatario</InputLabel>
                <Select
                  value={receiver}
                  onChange={() => setReceiver(event.target.dataset.value)}
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
            <Grid item xs={12}>
              <TableHeaderNewUser toggle={toggleAddUserDrawer} />

              <AddNewUserDrawer open={addUserOpen} toggle={toggleAddUserDrawer} />

            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>

                <TextField
                  fullWidth
                  type='Text'
                  label='Descripción'
                  value={description}
                  onChange={() => setDescription(event.target.value)}

                //placeholder='carterleonard@gmail.com'
                //helperText='You can use letters, numbers & periods'
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Fragment>
                  <div {...getRootProps({ className: 'dropzone' })}>
                    <input {...getInputProps()} />
                    <Box sx={{ display: 'flex', flexDirection: ['column', 'column', 'row'], alignItems: 'center' }}>
                    <Icon icon='mdi:file-document-outline' />
                      <Box sx={{ display: 'flex', flexDirection: 'column', textAlign: ['center', 'center', 'inherit'] }}>
                        <HeadingTypography variant='h5'>Subir archivos</HeadingTypography>
                        <Typography color='textSecondary'>
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
