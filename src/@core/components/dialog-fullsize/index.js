import React, { Fragment, useState, useEffect } from 'react'
import moment from 'moment-timezone'
import 'moment/locale/es'

import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import {
  Button,
  Paper,
  Box,
  TextField,
  FormControl,
  Chip,
  IconButton,
  Typography,
  Slide,
  Skeleton,
  List,
  ListItem,
  Link,
  Grid,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  DialogTitle,
  Tooltip
} from '@mui/material'

import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  timelineOppositeContentClasses
} from '@mui/lab'

import { Download, Edit, Close, AddComment, ChevronLeft, ChevronRight } from '@mui/icons-material'
import Icon from 'src/@core/components/icon'
import DialogErrorFile from 'src/@core/components/dialog-errorFile'
import AlertDialog from 'src/@core/components/dialog-warning'
import dictionary from 'src/@core/components/dictionary/index'
import { unixToDate } from 'src/@core/components/unixToDate'
import { useFirebase } from 'src/context/useFirebase'

import { useDropzone } from 'react-dropzone'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const StyledFormControl = props => (
  <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }} {...props} />
)

function CustomListItem({
  editable,
  label,
  id,
  value,
  onChange,
  disabled = false,
  required = false,
  multiline = false,
  initialValue
}) {
  return (
    <>
      {editable ? (
        <ListItem id={`list-${label}`} divider={!editable}>
          <StyledFormControl>
            <TextField
              onChange={onChange}
              label={label}
              id={`${id}-input`}
              defaultValue={initialValue}
              disabled={disabled}
              required={required}
              value={value}
              size='small'
              variant='standard'
              fullWidth={true}
              multiline={multiline}
            />
          </StyledFormControl>
        </ListItem>
      ) : (
        initialValue && (
          <ListItem id={`list-${label}`} divider={!editable}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography component='div' sx={{ width: '30%' }}>
                {label}
              </Typography>
              <Typography component='div' sx={{ width: '70%' }}>
                {initialValue}
              </Typography>
            </Box>
          </ListItem>
        )
      )}
    </>
  )
}

function DateListItem({ editable, label, value, onChange, initialValue, customMinDate = null }) {
  return (
    <>
      {editable ? (
        <ListItem id={`list-${label}`} divider={!editable}>
          <StyledFormControl>
            <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale='es'>
              <DatePicker
                dayOfWeekFormatter={day => day.substring(0, 2).toUpperCase()}
                minDate={customMinDate || moment().subtract(1, 'year')}
                maxDate={moment().add(1, 'year')}
                label={label}
                value={value}
                onChange={onChange}
                slotProps={{
                  textField: {
                    size: 'small',
                    required: true,
                    variant: 'standard',
                    fullWidth: true
                  }
                }}
              />
            </LocalizationProvider>
          </StyledFormControl>
        </ListItem>
      ) : (
        initialValue &&
        initialValue.seconds && (
          <ListItem id={`list-${label}`} divider={!editable}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography component='div' sx={{ width: '30%' }}>
                {label}
              </Typography>
              <Typography component='div' sx={{ width: '70%' }}>
                {initialValue && unixToDate(initialValue.seconds)[0]}
              </Typography>
            </Box>
          </ListItem>
        )
      )}
    </>
  )
}

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

  return (
    <Box sx={{ position: 'relative', height: '-webkit-fill-available', p: 2 }}>
      <Box
        component='img'
        src={displaySrc}
        onClick={() => window.open(photoUrl, '_blank')}
        alt='Photo'
        style={{ height: 'inherit', cursor: 'pointer' }}
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

const PhotoGallery = ({ photos }) => {
  const theme = useTheme()

  return (
    <Box sx={{ display: 'contents' }}>
      <IconButton sx={{ margin: 'auto' }} onClick={() => (document.getElementById('gallery').scrollLeft -= 200)}>
        <ChevronLeft />
      </IconButton>
      <Box
        id='gallery'
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          height: '140px',
          overflow: 'auto',
          scrollBehavior:'smooth',
          '::-webkit-scrollbar': { height: '4px', backgroundColor: theme.palette.background.default },
          '::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.divider },
          '::-webkit-scrollbar-track': { backgroundColor: theme.palette.divider }
        }}
      >
        {photos.map((fotoUrl, index) => (
          <PhotoItem key={index} photoUrl={fotoUrl} />
        ))}
      </Box>
      <IconButton sx={{ margin: 'auto' }} onClick={() => (document.getElementById('gallery').scrollLeft += 200)}>
        <ChevronRight />
      </IconButton>
    </Box>
  )
}

export const FullScreenDialog = ({ open, handleClose, doc, roleData, editButtonVisible, canComment = false }) => {
  let isPlanner = roleData && roleData.id === '5'

  const [values, setValues] = useState({})
  const [message, setMessage] = useState('')
  const [editable, setEditable] = useState(isPlanner)
  const [openAlert, setOpenAlert] = useState(false)
  const [eventData, setEventData] = useState(undefined)
  const [petitionerContact, setPetitionerContact] = useState({})
  const [files, setFiles] = useState([])
  const [errorFileMsj, setErrorFileMsj] = useState('')
  const [errorDialog, setErrorDialog] = useState(false)
  const [commentDialog, setCommentDialog] = useState(false)
  const [comment, setComment] = useState('')

  const [hasChanges, setHasChanges] = useState({
    title: false,
    plant: false,
    area: false,
    start: false,
    end: false,
    ot: false,
    supervisorShift: false,
    description: false,
    fotos: false
  })

  const theme = useTheme()
  const { updateDocs, useEvents, authUser, getUserData, uploadFilesToFirebaseStorage, addComment } = useFirebase()
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'))
  const eventArray = useEvents(doc?.id, authUser) // TODO: QA caso cuando doc es undefined

  const PetitionerContactComponent = () => (
    <>
      {petitioner && <Typography>{petitioner}</Typography>}
      {petitionerContact && (
        <>
          <Typography>{petitionerContact.email}</Typography>
          <Typography>{petitionerContact.phone}</Typography>
        </>
      )}
    </>
  )

  const initialValues = doc
    ? {
        title: doc.title,
        description: doc.description,
        petitioner: doc.petitioner,
        plant: doc.plant,
        area: doc.area,
        date: moment(doc.date.toDate()),
        start: doc.start && moment(doc.start.toDate()),
        ...(doc.ot && { ot: doc.ot }),
        ...(doc.end && { end: moment(doc.end.toDate()) }),
        ...(doc.supervisorShift && { supervisorShift: doc.supervisorShift }),
        ...(doc.fotos && { fotos: doc.fotos })
      }
    : {}

  // Establece los contactos del Solicitante
  useEffect(() => {
    const fetchData = async () => {
      const petitionerName = values.petitioner
      const petitionerData = await getUserData('getPetitioner', null, { name: petitionerName })
      setPetitionerContact(petitionerData)
    }

    fetchData()
  }, [values.petitioner])

  // Actualiza el estado al cambiar de documento, sólo valores obligatorios
  useEffect(() => {
    setValues(initialValues)
  }, [doc])

  useEffect(() => {
    const data = eventArray
    setEventData(data)
  }, [eventArray])

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

  const handleSubmitComment = async () => {
    await addComment(id, comment, authUser)
      .then(() => {
        setComment('')
        setCommentDialog(false)
      })
      .catch(error => {
        alert(error), console.error(error)
      })
  }

  // Función onchange utilizando currying
  const handleInputChange = field => event => {
    const fieldValue = event.target.value
    setValues({ ...values, [field]: fieldValue })
    setHasChanges({ ...hasChanges, [field]: fieldValue !== initialValues[field] })
  }

  const handleDateChange = dateField => date => {
    const fieldValue = moment(date.toDate())
    setValues({ ...values, [dateField]: fieldValue })
    setHasChanges({ ...hasChanges, [dateField]: !fieldValue.isSame(initialValues[dateField]) })

    // Si cambia start, end debe ser igual a start mas diferencia original
    const isPetitioner = userRole === 2
    const isContop = userRole === 3

    // Variable diferencia original entre start y end
    const docDifference = moment(initialValues.end).diff(moment(initialValues.start), 'days')

    if (dateField === 'start' && end && (isPetitioner || isContop)) {
      const newStart = date
      const newEnd = moment(date.toDate()).add(docDifference, 'days')
      setValues({ ...values, start: newStart, end: newEnd })
      setHasChanges({
        ...hasChanges,
        start: !newStart.isSame(initialValues.start),
        end: !newEnd.isSame(initialValues.end)
      })
    }
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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      const invalidFiles = validateFiles(acceptedFiles).filter(file => !file.isValid)
      if (invalidFiles.length > 0) {
        const res = validateFiles(invalidFiles)
        const msj = res[0].msj
        handleOpenErrorDialog(msj)

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
      await uploadFilesToFirebaseStorage(files, doc.id)
    } catch (error) {
      console.log(error)
    }
  }

  const handleRemoveAllFiles = () => {
    setFiles
    setFiles([])
  }

  const handleLinkClick = event => {
    event.preventDefault()
  }

  if (!doc) return null

  let {
    title,
    state,
    description,
    start,
    user,
    date,
    plant,
    area,
    id,
    ot,
    end,
    supervisorShift,
    userRole,
    petitioner,
    fotos,
    uid
  } = doc

  // Verifica estado
  state = typeof state === 'number' ? state : 100

  return (
    <Dialog
      sx={{ '& .MuiPaper-root': { maxWidth: '800px' } }}
      fullScreen={fullScreen}
      open={open}
      onClose={() => handleClose()}
      TransitionComponent={Transition}
      scroll='body'
    >
      <AlertDialog open={openAlert} handleClose={handleCloseAlert} callback={() => writeCallback()}></AlertDialog>
      <Paper sx={{ margin: 'auto', padding: '30px', overflowY: 'hidden' }}>
        {eventData == undefined ? (
          <Box>
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </Box>
        ) : (
          <Box>
            {canComment && (
              <Box sx={{ position: 'fixed', bottom: '32px', right: '48px' }}>
                <Button
                  onClick={() => setCommentDialog(true)}
                  sx={{ position: 'relative', borderRadius: '50%', height: '64px', width: '64px' }}
                  variant='contained'
                >
                  <Tooltip placement='left-start' title='Agregar comentario'>
                    <AddComment />
                  </Tooltip>
                </Button>
              </Box>
            )}
            <Timeline sx={{ [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Chip
                  label={state || state === 0 ? dictionary[state].details : 'Cargando...'}
                  color={state || state === 0 ? dictionary[state].color : 'primary'}
                  sx={{ width: 'auto' }}
                />
                <Box>
                  {/*Botón para editar*/}
                  {editButtonVisible && !isPlanner ? (
                    <IconButton
                      onClick={() => setEditable(prev => !prev)}
                      color='primary'
                      aria-label='edit'
                      component='button'
                    >
                      <Edit />
                    </IconButton>
                  ) : null}
                  <IconButton onClick={() => handleClose()} color='primary' aria-label='edit' component='button'>
                    {/*este botón debería cerrar y setEditable false*/}
                    <Close />
                  </IconButton>
                </Box>
              </Box>

              <List>
                <CustomListItem
                  editable={editable && roleData && roleData.canEditValues}
                  label='Título'
                  id='title'
                  initialValue={title}
                  value={values.title}
                  onChange={handleInputChange('title')}
                  required={true}
                />
                <CustomListItem
                  editable={editable && roleData && roleData.canEditValues}
                  label='Descripción'
                  id='desc'
                  initialValue={description}
                  value={values.description}
                  onChange={handleInputChange('description')}
                  multiline={true}
                />
                <CustomListItem
                  editable={editable && roleData && roleData.canEditValues}
                  label='Planta'
                  id='plant'
                  initialValue={plant}
                  value={values.plant}
                  onChange={handleInputChange('plant')}
                />
                <CustomListItem
                  editable={editable && roleData && roleData.canEditValues}
                  label='Área'
                  id='area'
                  initialValue={area}
                  value={values.area}
                  onChange={handleInputChange('area')}
                />
                <CustomListItem
                  editable={false}
                  label='Solicitante'
                  id='petitioner'
                  initialValue={<PetitionerContactComponent />}
                />
                <DateListItem
                  editable={editable && roleData && roleData.canEditStart}
                  label='Inicio'
                  id='start'
                  value={values.start}
                  onChange={handleDateChange('start')}
                  initialValue={start}
                />
                <DateListItem
                  editable={editable && roleData && roleData.canEditEnd}
                  label='Término'
                  id='end'
                  value={values.end}
                  onChange={handleDateChange('end')}
                  initialValue={end}
                  customMinDate={values.start}
                />
                <CustomListItem
                  editable={editable && roleData && roleData.canEditValues}
                  label='OT'
                  id='ot'
                  initialValue={ot}
                  value={values.ot}
                  onChange={handleInputChange('ot')}
                  disabled={!isPlanner}
                  required={isPlanner}
                />
                <CustomListItem editable={false} label='Turno' id='shift' initialValue={supervisorShift} />

                {values.fotos ? (
                  <ListItem>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography component='div' sx={{ width: '30%', pr: 2 }}>
                        Archivos adjuntos
                      </Typography>
                      <PhotoGallery photos={fotos} />
                    </Box>
                  </ListItem>
                ) : doc.user === authUser.displayName ? (
                  <ListItem>
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
                              sx={{
                                pl: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: ['center'],
                                margin: 'auto'
                              }}
                            >
                              <Icon icon='mdi:file-document-outline' />
                              <Typography sx={{ mt: 5 }} color='textSecondary'>
                                <Link onClick={() => handleLinkClick}>Haz click acá</Link> para adjuntar archivos.
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
                              <Button color='primary' sx={{ ml: 2 }} variant='outlined' onClick={handleSubmitAllFiles}>
                                Subir archivos
                              </Button>
                            </div>
                          </Fragment>
                        ) : null}
                      </Fragment>
                    </FormControl>
                  </ListItem>
                ) : (
                  ''
                )}
              </List>

              {editable ? (
                <Button
                  sx={{ mt: 3, mb: 5 }}
                  disabled={!Object.values(hasChanges).some(hasChange => hasChange)}
                  onClick={() => handleOpenAlert()}
                  variant='contained'
                >
                  {isPlanner && state <= 4 ? 'Aprobar y guardar' : 'Guardar'}
                </Button>
              ) : null}

              {eventData !== undefined &&
              eventData.length > 0 &&
              // *** Mapea los eventos para los usuarios MEL ***
              [2, 3, 4].includes(authUser.role)
                ? eventData.map(element => {
                    const determineModificationType = element => {
                      if (!element.newState) return 'Comentarios agregados'

                      const isDraftmenAssigned = element.prevDoc && element.prevDoc.draftmen
                      const isHoursEstablished = element.prevDoc && element.prevDoc.hours
                      const emergencyApprovedByContop = element.prevDoc && element.prevDoc.emergencyApprovedByContop
                      const hasPreviousDoc = element.prevDoc
                      const isModifiedStart = hasPreviousDoc && element.prevDoc.start
                      const isStateDecreased = element.newState < element.prevState

                      if (isModifiedStart || isStateDecreased) return 'Modificado'
                      if (isDraftmenAssigned) return 'Proyectistas asignados'
                      if (isHoursEstablished) return 'Levantamiento finalizado'
                      if (hasPreviousDoc) return 'Modificación aceptada'
                      if (emergencyApprovedByContop) return 'Emergencia aprobada'

                      return 'Aprobado'
                    }

                    const status = element.newState === 10 ? 'Rechazado' : determineModificationType(element)

                    const result =
                      element.newState === 5 ? (
                        ''
                      ) : (
                        <div key={element.date}>
                          <TimelineItem>
                            <TimelineOppositeContent>{unixToDate(element.date.seconds)}</TimelineOppositeContent>
                            <TimelineSeparator>
                              <TimelineDot />
                              <TimelineConnector />
                            </TimelineSeparator>
                            <TimelineContent>
                              <Typography variant='body1'>
                                {status} por{' '}
                                {[0, 1, 6, 10].includes(element.newState) && element.prevState === 5
                                  ? 'Procure'
                                  : element.userName}
                              </Typography>
                              <Typography variant='body2'>
                                {dictionary[element.newState]?.details || element.comment}
                              </Typography>
                            </TimelineContent>
                          </TimelineItem>
                        </div>
                      )

                    return result
                  })
                : // *** Mapea los eventos para los usuarios Procure ***
                  eventData.map(element => {
                    const determineModificationType = element => {
                      if (!element.newState) return 'Comentarios agregados'

                      const isDraftmenAssigned = element.prevDoc && element.prevDoc.draftmen
                      const isHoursEstablished = element.prevDoc && element.prevDoc.hours
                      const hasPreviousDoc = element.prevDoc

                      const OTEndAdded =
                        element.prevDoc && element.prevDoc.end === 'none' && element.prevDoc.ot === 'none'
                      const isModifiedStart = hasPreviousDoc && element.prevDoc.start
                      const isStateDecreased = element.newState < element.prevState

                      if (OTEndAdded) return 'Aprobado con OT y fecha de término asignados'
                      if (isModifiedStart || isStateDecreased) return 'Modificado'
                      if (isDraftmenAssigned) return 'Proyectistas asignados'
                      if (isHoursEstablished) return 'Levantamiento finalizado'

                      return 'Aprobado'
                    }

                    const status = element.newState === 10 ? 'Rechazado' : determineModificationType(element)

                    return (
                      <div key={element.date}>
                        <TimelineItem>
                          <TimelineOppositeContent>{unixToDate(element.date.seconds)}</TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot />
                            <TimelineConnector />
                          </TimelineSeparator>
                          <TimelineContent>
                            <Typography variant='body1'>
                              {status} por {element.userName}
                            </Typography>
                            <Typography variant='body2'>
                              {dictionary[element.newState]?.details || element.comment}
                            </Typography>
                          </TimelineContent>
                        </TimelineItem>
                      </div>
                    )
                  })}
              <TimelineItem sx={{ mt: 1 }}>
                <TimelineOppositeContent>{date && unixToDate(date.seconds)}</TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant='body1'> Solicitud hecha por {user}</Typography>
                  {userRole == 2 ? (
                    <Typography variant='body2'> En espera de revisión de Contract Operator </Typography>
                  ) : userRole == 3 ? (
                    <Typography variant='body2'> En espera de revisión de Planificador</Typography>
                  ) : (
                    <Typography variant='body2'> En espera de revisión</Typography>
                  )}
                </TimelineContent>
              </TimelineItem>
            </Timeline>
          </Box>
        )}
      </Paper>
      {errorDialog && <DialogErrorFile open={errorDialog} handleClose={handleCloseErrorDialog} msj={errorFileMsj} />}
      <Dialog open={commentDialog}>
        <DialogTitle id='message-dialog-title'>Agregar comentario</DialogTitle>
        <DialogContent>
          <TextField value={comment} onChange={e => setComment(e.target.value)} multiline fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleSubmitComment()}>Enviar comentario</Button>
          <Button onClick={() => setCommentDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!message} aria-labelledby='message-dialog-title' aria-describedby='message-dialog-description'>
        <DialogTitle id='message-dialog-title'>Creando solicitud</DialogTitle>
        <DialogContent>
          <DialogContentText id='message-dialog-description'>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessage('')}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}
