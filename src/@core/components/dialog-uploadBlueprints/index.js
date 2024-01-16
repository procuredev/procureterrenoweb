import React, { Fragment, useState, useEffect } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import Close from '@mui/icons-material/Close'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import DialogTitle from '@mui/material/DialogTitle'
import Paper from '@mui/material/Paper'
import Box from '@mui/system/Box'
import TextField from '@mui/material/TextField'
import Edit from '@mui/icons-material/Edit'
import FormControl from '@mui/material/FormControl'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Slide from '@mui/material/Slide'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import { ChevronLeft, ChevronRight, Download } from '@mui/icons-material'
import Link from '@mui/material/Link'
import Icon from 'src/@core/components/icon'
import Grid from '@mui/material/Grid'
import DialogErrorFile from 'src/@core/components/dialog-errorFile'
import { useDropzone } from 'react-dropzone'
import { Timeline, timelineOppositeContentClasses } from '@mui/lab'
import AlertDialog from 'src/@core/components/dialog-warning'
import { useFirebase } from 'src/context/useFirebase'

import moment from 'moment-timezone'
import 'moment/locale/es'

import CustomListItem from 'src/@core/components/custom-list'
import DateListItem from 'src/@core/components/custom-date'
import { InputAdornment } from '@mui/material'
import { DialogClientCodeGenerator } from '../dialog-clientCodeGenerator'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

//esta función se usa para establecer los iconos de los documentos que ya se han adjuntado al documento
function getIconForFileType(filePath) {
  const urlWithoutParams = filePath.split('?')[0]
  const extension = urlWithoutParams.split('.').pop().toLowerCase()

  switch (extension) {
    case 'pdf':
      return '/icons/pdf.png'
    case 'ppt':
    case 'pptx':
      return '/icons/ppt.png'
    case 'doc':
    case 'docx':
      return '/icons/doc.png'
    case 'xls':
    case 'xlsx':
      return '/icons/xls.png'
    default:
      return '/icons/default.png'
  }
}

//esta función se usa para establecer los iconos de los documentos que se van a adjuntar al documento, previo a cargarlos.
const getFileIcon = fileType => {
  switch (fileType) {
    case 'application/pdf':
      return 'mdi:file-pdf'
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'mdi:file-word'
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'mdi:file-excel'
    // ... agregar más tipos de archivo según sea necesario
    default:
      return 'mdi:file-document-outline'
  }
}

// función que renderiza cada elemento adjunto y renderiza la variable 'displaySrc' que usa un condicional en caso que el elemento sea una image muestra el thumbnail, caso contrario muestra el icono según el tipo de archivo
const PhotoItem = ({ photoUrl }) => {
  const urlWithoutParams = photoUrl.split('?')[0]
  const isImage = /\.(jpeg|jpg|gif|png)$/.test(urlWithoutParams.toLowerCase())
  const displaySrc = isImage ? photoUrl : getIconForFileType(photoUrl)

  const onError = () => {
    const imageRef = document.getElementById(photoUrl)
    imageRef.src = 'https://fonts.gstatic.com/s/i/materialiconsoutlined/error/v20/24px.svg'
    imageRef.style.filter = 'contrast(0.5) invert(1)'
    imageRef.style.height = '30px'
    imageRef.style.marginRight = '5px'
    imageRef.nextSibling.style.display = 'none'
    imageRef.parentElement.parentElement.style.height = '30px'
    imageRef.parentElement.style.display = 'flex'
    imageRef.parentElement.style.alignItems = 'center'
    imageRef.parentElement.append('Error al cargar imagen')
  }

  return (
    <Box sx={{ position: 'relative', height: '-webkit-fill-available', p: 2 }}>
      <Box
        component='img'
        id={photoUrl}
        src={displaySrc}
        onClick={() => window.open(photoUrl, '_blank')}
        alt='Photo'
        style={{ height: 90, cursor: 'pointer' }}
        onError={onError}
      />
      <IconButton
        href={photoUrl}
        target='_blank'
        rel='noopener noreferrer'
        sx={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'rgba(220, 220, 220, 0.1)'
        }}
      >
        <Download />
      </IconButton>
    </Box>
  )
}

const PhotoGallery = ({ photos }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      overflow: 'auto',
      height: '140px',
      width: '70%',
      justifyContent: 'space-evently'
    }}
  >
    {photos.map((fotoUrl, index) => (
      <PhotoItem key={index} photoUrl={fotoUrl} />
    ))}
  </Box>
)

export const UploadBlueprintsDialog = ({
  handleClose,
  doc,
  roleData,
  petitionId,
  setBlueprintGenerated,
  currentRow,
  petition,
  checkRoleAndApproval
}) => {
 /*  let isPlanner = roleData && roleData.id === '5' */

  let { id, userId, userName, userEmail, revision, storageBlueprints, description, date, clientCode, storageHlcDocuments } = doc
  const [values, setValues] = useState({})
  const [message, setMessage] = useState('')

/*   const [editable, setEditable] = useState(isPlanner) */
  const [openAlert, setOpenAlert] = useState(false)
  const [files, setFiles] = useState([])
  const [hlcDocuments, setHlcDocuments] = useState([])
  const [errorFileMsj, setErrorFileMsj] = useState('')
  const [errorDialog, setErrorDialog] = useState(false)
  const [generateClientCode, setGenerateClientCode] = useState(false)

  const theme = useTheme()
  const { updateDocs, authUser, addDescription, uploadFilesToFirebaseStorage } = useFirebase()
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'))

  // Verifica estado
  revision = typeof revision === 'string' ? revision : 100

  const initialValues = {
    id,
    clientCode,
    userId,
    userName,
    userEmail,
    revision,
    storageBlueprints,
    storageHlcDocuments,
    description,
    date
  }

  // Actualiza el estado al cambiar de documento, sólo valores obligatorios
  useEffect(() => {
    setValues(initialValues)
  }, [doc])

  // Handlea dialog

  const handleOpenAlert = async () => {
    const hasFormChanges = Object.values(hasChanges).some(hasChange => hasChange)
    if (roleData.id === '5') {
      // Agrega end y ot
      if (!end && hasChanges.end && !ot && hasChanges.ot) {
        setOpenAlert(true)

        // Ya viene con end u ot
      } else if (end && ot && state === 4) {
        await updateDocs(id, true, authUser)
          .then(handleClose())
          .catch(error => {
            alert(error), console.log(error)
          })

        //No trae ni agrega end/ot
      } else if ((!end && !hasChanges.end) || (!ot && !hasChanges.ot)) {
        setMessage('Debes ingresar ot y fecha de término')
      } else {
        setOpenAlert(true)
      }

      // Planificador cambia start pero no end
    } else if (roleData.id === '6' && hasChanges.start && !hasChanges.end) {
      setMessage('Debes modificar la fecha de término')

      // Planificador cambia cualquier otro campo
    } else if (hasFormChanges) {
      setOpenAlert(true)
    } else {
      setMessage('No has realizado cambios en el formulario.')
    }
  }

  const writeCallback = () => {
    const newData = {}

    for (const key in values) {
      if (hasChanges[key]) {
        newData[key] = values[key]
      }
    }

    if (Object.keys(newData).length > 0) {
      updateDocs(id, newData, authUser)
    } else {
      console.log('No se escribió ningún documento')
    }

    handleCloseAlert()
  }

  const handleCloseAlert = () => {
    setOpenAlert(false)
    setEditable(false)
  }

  // Función onchange utilizando currying
  const handleInputChange = field => event => {
    const fieldValue = event.target.value
    setValues({ ...values, [field]: fieldValue })
    //setHasChanges({ ...hasChanges, [field]: fieldValue !== initialValues[field] })
  }

  const validateFiles = acceptedFiles => {
    const imageExtensions = ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'tiff', 'svg', 'heif', 'HEIF']
    const documentExtensions = ['xls', 'xlsx', 'doc', 'docx', 'ppt', 'pptx', 'pdf', 'csv', 'txt']
    const maxSizeBytes = 5 * 1024 * 1024 // 5 MB in bytes

    const isValidImage = file => {
      const extension = file.name.split('.').pop().toLowerCase()

      return imageExtensions.includes(extension) && file.size <= maxSizeBytes
    }

    const isValidDocument = file => {
      const extension = file.name.split('.').pop().toLowerCase()

      return documentExtensions.includes(extension) && file.size <= maxSizeBytes
    }

    const isValidFile = file => {
      return isValidImage(file) || isValidDocument(file)
    }

    const validationResults = acceptedFiles.map(file => {
      return {
        name: file.name,
        isValid: isValidFile(file),
        msj: isValidFile(file) ? `${file.name}` : `${file.name} - El archivo excede el tamaño máximo de 5 MB`
      }
    })

    return validationResults
  }

  const handleOpenErrorDialog = msj => {
    setErrorFileMsj(msj)
    setErrorDialog(true)
  }

  const handleCloseErrorDialog = () => {
    setErrorDialog(false)
  }

  const submitDescription = async () => {
    await addDescription(petitionId, currentRow, values.description)
      .then(() => {
        setBlueprintGenerated(true)
      })
      .catch(err => console.error(err))
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      const invalidFiles = validateFiles(acceptedFiles).filter(file => !file.isValid)
      if (invalidFiles.length > 0) {
        const res = validateFiles(invalidFiles)
        const msj = res[0].msj
        handleOpenErrorDialog(msj)

        return invalidFiles
      }

      if (authUser.role === 9 && doc.approvedByDocumentaryControl && !checkRoleAndApproval(authUser.role, doc)) {
        setHlcDocuments(prevFiles => [...prevFiles, ...acceptedFiles.map(file => Object.assign(file))])
      }

      if ((authUser.uid === doc.userId && !doc.sentByDesigner) ||
      ((authUser.role === 6 || authUser.role === 7) && doc.sentByDesigner && !doc.approvedByDocumentaryControl) ||
      (authUser.role === 9 && (doc.approvedBySupervisor || doc.approvedByContractAdmin) || doc.approvedByDocumentaryControl && checkRoleAndApproval(authUser.role, doc))) {

        // Agregar los nuevos archivos a los archivos existentes en lugar de reemplazarlos
        setFiles(prevFiles => [...prevFiles, ...acceptedFiles.map(file => Object.assign(file))])
      }


    }
  })

  console.log('files', files)



  const handleRemoveFile = file => {
    const uploadedFiles = files
    const filtered = uploadedFiles.filter(i => i.name !== file.name)
    setFiles([...filtered])
  }

  const handleRemoveHLC = file => {
    const uploadedFiles = hlcDocuments
    const filtered = uploadedFiles.filter(i => i.name !== file.name)
    setHlcDocuments([...filtered])
  }

  const fileList = (
    <Grid container spacing={2} sx={{ justifyContent: 'center', m: 2 }}>
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
              position: 'relative' // Agregamos esta propiedad para posicionar el icono correctamente
            }}
          >
            {file.type.startsWith('image') ? (
              <img width={50} height={50} alt={file.name} src={URL.createObjectURL(file)} />
            ) : (
              <Icon icon={getFileIcon(file.type)} fontSize={50} />
            )}
            <Typography
              variant='body2'
              sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', ml: '10px' }}
            >
              {`... ${file.name.slice(file.name.length - 15, file.name.length)}`}
            </Typography>
            <IconButton
              onClick={() => handleRemoveFile(file)}
              sx={{
                position: 'absolute', // Posicionamos el icono en relación al Paper
                top: '0px', // Ajusta el valor según la posición vertical deseada
                right: '0px' // Ajusta el valor según la posición horizontal deseada
              }}
            >
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Paper>
        </Grid>
      ))}
    </Grid>
  )

  const hlcList = (
    <Grid container spacing={2} sx={{ justifyContent: 'center', m: 2 }}>

      {hlcDocuments.map(file => (
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
              position: 'relative' // Agregamos esta propiedad para posicionar el icono correctamente
            }}
          >
            {file.type.startsWith('image') ? (
              <img width={50} height={50} alt={file.name} src={URL.createObjectURL(file)} />
            ) : (
              <Icon icon={getFileIcon(file.type)} fontSize={50} />
            )}
            <Typography
              variant='body2'
              sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', ml: '10px' }}
            >
              {`... ${file.name.slice(file.name.length - 15, file.name.length)}`}
            </Typography>
            <IconButton
              onClick={() => handleRemoveFile(file)}
              sx={{
                position: 'absolute', // Posicionamos el icono en relación al Paper
                top: '0px', // Ajusta el valor según la posición vertical deseada
                right: '0px' // Ajusta el valor según la posición horizontal deseada
              }}
            >
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Paper>
        </Grid>
      ))}
    </Grid>
  )

  const handleSubmitAllFiles = async () => {
    try {
      await uploadFilesToFirebaseStorage(files, doc.id, 'blueprints', petitionId)
      setBlueprintGenerated(true)
      setFiles([])
      setHlcDocuments([])
    } catch (error) {
      console.log(error)
    }
  }

  const handleSubmitHlcDocuments = async () => {
    try {
      await uploadFilesToFirebaseStorage(hlcDocuments, doc.id, 'hlcDocuments', petitionId)
      setBlueprintGenerated(true)
      setFiles([])
      setHlcDocuments([])
    } catch (error) {
      console.log(error)
    }
  }

  const handleRemoveAllFiles = () => {
    setFiles([])
    setHlcDocuments([])
  }

  const handleLinkClick = event => {
    event.preventDefault()
  }

  return (
    <Box>
      <AlertDialog open={openAlert} handleClose={handleCloseAlert} callback={() => writeCallback()}></AlertDialog>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{display:'flex', flexDirection:'column'}}>
        <Typography variant='h5' sx={{lineHeight: 3}}>{values.id || 'Sin código Procure'}</Typography>
        {values.clientCode || (authUser.role===8 || authUser.role===7?
        <Typography
        variant='h6'
        sx={{my:2, display:'flex', alignItems:'center', cursor:'pointer'}}
        onClick={() => {
          if (authUser.uid === doc.userId) {
            setGenerateClientCode((prev) => !prev)
          }
        }}
        >
          Generar código MEL
          <ChevronRight sx={{transform: generateClientCode ? 'rotate(90deg)' : ''}}/>
          </Typography>
        : <Typography> Sin código MEL</Typography>)}
        </Box>
        <Chip label={values.revision} sx={{ textTransform: 'capitalize' }} color='primary' />
      </DialogTitle>

      {generateClientCode ? <DialogClientCodeGenerator
      petition={petition}
      blueprint={currentRow}
      setBlueprintGenerated={setBlueprintGenerated}
      handleClose={()=>setGenerateClientCode(false)}
      /> : null}
      <Box sx={{ margin: 'auto' }}>
        {
          <Box>
            <List>
              <CustomListItem
                editable={authUser.uid === doc.userId}
                label='Descripción'
                id='description'
                initialValue={description}
                value={values.description}
                onChange={handleInputChange('description')}
                required={false}
                inputProps={{endAdornment:
                (description !== values.description) && <InputAdornment position="end">
                  <Button onClick={() => {
                    if (authUser.uid === doc.userId) {
                      submitDescription();
                    }
                  }}> Guardar descripción </Button>
                </InputAdornment>}}
              />
              <DateListItem
                editable={false}
                label='Fecha'
                id='date'
                initialValue={date}
                value={values.date}
                onChange={handleInputChange('date')}
                required={false}
              />
              <CustomListItem
                editable={false}
                label='Creado por'
                id='userName'
                initialValue={userName}
                value={values.userName}
                onChange={handleInputChange('userName')}
                required={false}
              />
              <CustomListItem
                editable={false}
                label='Contacto'
                id='userEmail'
                initialValue={userEmail}
                value={values.userEmail}
                onChange={handleInputChange('userEmail')}
                required={false}
              />
              {doc.storageBlueprints && doc.storageBlueprints.length > 0 && (
                <ListItem>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography component='div' sx={{ width: '30%', pr: 2 }}>
                      Plano adjunto
                    </Typography>
                    <PhotoGallery photos={storageBlueprints} />
                  </Box>
                </ListItem>
              )}

              {doc.storageHlcDocuments && doc.storageHlcDocuments.length > 0 && (
                <ListItem>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Typography component='div' sx={{ width: '30%', pr: 2 }}>
                      HLC adjunto
                    </Typography>
                    <PhotoGallery photos={storageHlcDocuments} />
                  </Box>
                </ListItem>
              )}
              {/* Aquí true debe reemplazarse por el permiso para subir archivos */}
              {true && (
                <ListItem>
                  <FormControl fullWidth>
                    <Fragment>
                      {(authUser.uid === doc.userId && !doc.sentByDesigner) ||
                        ((authUser.role === 6 || authUser.role === 7) && doc.sentByDesigner && !doc.approvedByDocumentaryControl) && !doc.approvedBySupervisor && !doc.approvedByContractAdmin||
                        (authUser.role === 9 && (doc.approvedBySupervisor || doc.approvedByContractAdmin) && doc.approvedByDocumentaryControl && checkRoleAndApproval(authUser.role, doc)) ?
                        <div {...getRootProps({ className: 'dropzone' })} >
                          <input {...getInputProps()} />
                          <Box
                            sx={{
                              my: 5,
                              mx: 'auto',
                              p: 5,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: ['center'],
                              backdropFilter: 'contrast(0.8)',
                              width: '100%',
                              borderRadius: '10px',
                              justifyContent: 'center'
                            }}
                          >
                            <Icon icon='mdi:file-document-outline' />
                            <Typography sx={{ mt: 5 }} color='textSecondary'>
                              <Link onClick={() => handleLinkClick}>Haz click acá</Link> para adjuntar Plano.
                            </Typography>
                          </Box>
                        </div> : ''
                      }
                      {files.length > 0 && (
                        <Fragment>
                          <List>{fileList}</List>
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                            <Button color='error' sx={{ m: 2 }} variant='outlined' onClick={handleRemoveAllFiles}>
                              Quitar todo
                            </Button>
                            <Button color='primary' sx={{ m: 2 }} variant='outlined' onClick={handleSubmitAllFiles}>
                              Subir archivos
                            </Button>
                          </Box>
                        </Fragment>
                      )}
                    </Fragment>
                  </FormControl>
                </ListItem>
              )}

              {/* HLC */}
              {true && (
                <ListItem>
                  <FormControl fullWidth>
                    <Fragment>
                      {(authUser.role === 9 &&  (doc.sentByDesigner || doc.sentBySupervisor) && doc.approvedByDocumentaryControl && !checkRoleAndApproval(authUser.role, doc)) ?
                        <div {...getRootProps({ className: 'dropzone' })} >
                          <input {...getInputProps()} />
                          <Box
                            sx={{
                              my: 5,
                              mx: 'auto',
                              p: 5,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: ['center'],
                              backdropFilter: 'contrast(0.8)',
                              width: '100%',
                              borderRadius: '10px',
                              justifyContent: 'center'
                            }}
                          >
                            <Icon icon='mdi:file-document-outline' />
                            <Typography sx={{ mt: 5 }} color='textSecondary'>
                              <Link onClick={() => handleLinkClick}>Haz click acá</Link> para adjuntar archivo HLC.
                            </Typography>
                          </Box>
                        </div> : ''
                      }
                      {hlcDocuments.length > 0 && doc.approvedByDocumentaryControl && !checkRoleAndApproval(authUser.role, doc) && (
                        <Fragment>
                          <List>{hlcList}</List>
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                            <Button color='error' sx={{ m: 2 }} variant='outlined' onClick={handleRemoveAllFiles}>
                              Quitar todo
                            </Button>
                            <Button color='primary' sx={{ m: 2 }} variant='outlined' onClick={handleSubmitHlcDocuments}>
                              Subir archivos HLC
                            </Button>
                          </Box>
                        </Fragment>
                      )}
                    </Fragment>
                  </FormControl>
                </ListItem>
              )}
            </List>

            {/* {editable ? (
              <Button
                sx={{ mt: 3, mb: 5 }}
                disabled={!Object.values(hasChanges).some(hasChange => hasChange)}
                onClick={() => handleOpenAlert()}
                variant='contained'
              >
                {isPlanner && state <= 4 ? 'Aprobar y guardar' : 'Guardar'}
              </Button>
            ) : null} */}
          </Box>
        }
      </Box>
      {errorDialog && <DialogErrorFile open={errorDialog} handleClose={handleCloseErrorDialog} msj={errorFileMsj} />}
      <Dialog open={!!message} aria-labelledby='message-dialog-title' aria-describedby='message-dialog-description'>
        <DialogTitle id='message-dialog-title'>Creando solicitud</DialogTitle>
        <DialogContent>
          <DialogContentText id='message-dialog-description'>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessage('')}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
