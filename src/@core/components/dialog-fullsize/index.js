import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import moment from 'moment-timezone'
import 'moment/locale/es'
import React, { Fragment, useEffect, useState } from 'react'

import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Link,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Slide,
  TextField,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { LocalizationProvider, MobileDatePicker } from '@mui/x-date-pickers'

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  timelineOppositeContentClasses
} from '@mui/lab'

import { ChevronLeft, ChevronRight, Close, Download, Edit } from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import DialogErrorOt from 'src/@core/components/dialog-error-ot'
import DialogErrorFile from 'src/@core/components/dialog-errorFile'
import AlertDialog from 'src/@core/components/dialog-warning'
import Icon from 'src/@core/components/icon'
import { unixToDate } from 'src/@core/components/unixToDate'
import { useFirebase } from 'src/context/useFirebase'

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
  selectable = false,
  options = [],
  initialValue,
  inputProps
}) {
  return (
    <>
      {editable ? (
        <ListItem id={`list-${label}`} divider={!editable}>
          <StyledFormControl>
            {selectable ? (
              <>
                <InputLabel variant='standard'>
                  {label} {required && <span>*</span>}
                </InputLabel>
                <Select
                  id={`${id}-input`}
                  defaultValue={initialValue}
                  disabled={disabled}
                  required={required}
                  value={value}
                  size='small'
                  variant='standard'
                  fullWidth={true}
                  onChange={onChange}
                >
                  {options &&
                    options.map(option => {
                      return (
                        <MenuItem key={option.name || option} value={option.name || option}>
                          {option.name || option}
                        </MenuItem>
                      )
                    })}
                </Select>
              </>
            ) : (
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
                inputProps={inputProps}
              />
            )}
          </StyledFormControl>
        </ListItem>
      ) : (
        initialValue && (
          <ListItem id={`list-${label}`} divider={!editable}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography component='div' sx={{ width: '40%' }}>
                {label}
              </Typography>
              <Typography component='div' sx={{ width: '60%' }}>
                {initialValue}
              </Typography>
            </Box>
          </ListItem>
        )
      )}
    </>
  )
}

function CustomAutocompleteItem({ selectable, options, editable, label, value, onChange, error, required }) {
  return (
    <Grid item xs={12}>
      <FormControl fullWidth>
        <Box display='flex' alignItems='center'>
          {editable && selectable ? (
            <Autocomplete
              getOptionLabel={option => option.name || option}
              multiple
              fullWidth
              options={options}
              value={value}
              onChange={(_, newValue) => onChange({ target: { value: newValue } })}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    key={index}
                    label={option.name || option}
                    {...getTagProps({ index })}
                    disabled={!editable}
                    clickable={editable}
                    onDelete={() => {
                      const newValue = value.filter((v, i) => i !== index)
                      onChange({ target: { value: newValue } })
                    }}
                  />
                ))
              }
              renderInput={params => (
                <TextField
                  {...params}
                  label={label}
                  InputLabelProps={{ required: required }}
                  error={error ? true : false}
                  helperText={error}
                />
              )}
            />
          ) : (
            <ListItem id={`list-${label}`} divider={!editable}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Typography component='div' sx={{ width: '40%' }}>
                  {label}
                </Typography>
                <Typography component='div' sx={{ width: '60%' }}>
                  {value.join(', ')}
                </Typography>
              </Box>
            </ListItem>
          )}
        </Box>
      </FormControl>
    </Grid>
  )
}

function DateListItem({ editable, label, value, onChange, initialValue, customMinDate = null }) {
  return (
    <>
      {editable ? (
        <ListItem id={`list-${label}`} divider={!editable}>
          <StyledFormControl>
            <LocalizationProvider
              dateAdapter={AdapterMoment}
              adapterLocale='es'
              localeText={{
                okButtonLabel: 'Aceptar',
                cancelButtonLabel: 'Cancelar',
                datePickerToolbarTitle: 'Selecciona Fecha'
              }}
            >
              <MobileDatePicker
                dayOfWeekFormatter={day => day.substring(0, 2).toUpperCase()}
                minDate={customMinDate || moment().subtract(1, 'year')}
                maxDate={moment().add(1, 'year')}
                label={label}
                value={value}
                onChange={onChange}
                inputFormat='dd/MM/yyyy' // Formato de fecha que no puede ser introducido manualmente
                slotProps={{
                  textField: {
                    size: 'small',
                    required: true,
                    variant: 'standard',
                    fullWidth: true
                  },
                  toolbar: { hidden: false }
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
              <Typography component='div' sx={{ width: '40%' }}>
                {label}
              </Typography>
              <Typography component='div' sx={{ width: '60%' }}>
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

  const getFileName = (content, index) => {
    if (typeof content === 'string') {
      const urlSegments = content.split('%2F')
      const encodedFileName = urlSegments[urlSegments.length - 1]
      const fileNameSegments = encodedFileName.split('?')
      const fileName = decodeURIComponent(fileNameSegments[0])

      return fileName
    } else {
      // Si content no es una cadena, devuelve un valor por defecto o maneja el caso como consideres necesario.
      return ''
    }
  }

  return (
    <Box sx={{ position: 'relative', height: '-webkit-fill-available', p: 2 }}>
      <Typography variant='body2' color='textPrimary' sx={{ mb: 2, pl: 2 }}>
        {getFileName(photoUrl)} {/* Aquí se muestra el nombre del archivo */}
      </Typography>
      <Box
        component='img'
        id={photoUrl}
        src={displaySrc}
        onClick={() => window.open(photoUrl, '_blank')}
        alt='Photo'
        style={{ height: 90, cursor: 'pointer' }}
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
  let isOverflowing = document.getElementById('gallery')?.scrollWidth > document.getElementById('gallery')?.clientWidth

  return (
    <Box sx={{ display: 'contents' }}>
      <IconButton
        sx={{ my: 'auto', display: !isOverflowing && 'none' }}
        onClick={() => (document.getElementById('gallery').scrollLeft -= 200)}
      >
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
          scrollBehavior: 'smooth',
          '::-webkit-scrollbar': { height: '4px', backgroundColor: theme.palette.background.default },
          '::-webkit-scrollbar-thumb': { backgroundColor: theme.palette.divider },
          '::-webkit-scrollbar-track': { backgroundColor: theme.palette.divider }
        }}
      >
        {photos.map((fotoUrl, index) => (
          <PhotoItem key={index} photoUrl={fotoUrl} />
        ))}
      </Box>
      <IconButton
        sx={{ my: 'auto', display: !isOverflowing && 'none' }}
        onClick={() => (document.getElementById('gallery').scrollLeft += 200)}
      >
        <ChevronRight />
      </IconButton>
    </Box>
  )
}

export const FullScreenDialog = ({ open, handleClose, doc, roleData, editButtonVisible, canComment = false }) => {
  let isPlanner = roleData && roleData.id == '5' && doc.state >= 3 // modificacion para que planificador no pueda editar si el estado es menor a 3
  //let isPlanner = roleData && roleData.id == '5'

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
  const [loading, setLoading] = useState(false)
  const [domainData, setDomainData] = useState({})
  const [objectivesArray, setObjectivesArray] = useState([])
  const [deliverablesArray, setDeliverablesArray] = useState([])
  const [plantsNames, setPlantsNames] = useState([])
  const [areasArray, setAreasArray] = useState([])
  const [errorOT, setErrorOT] = useState(false)
  const [errorOtMesage, setErrorOtMesage] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // Estado para manejar el botón para desplegar el acordeón para desplegar información adicional
  const [additionalInfoVisible, setAdditionalInfoVisible] = useState(false)

  const [hasChanges, setHasChanges] = useState({
    title: false,
    plant: false,
    area: false,
    start: false,
    end: false,
    ot: false,
    supervisorShift: false,
    description: false,
    fotos: false,
    costCenter: false
  })

  const theme = useTheme()

  const xs = useMediaQuery(theme.breakpoints.up('xs')) //0-600
  const sm = useMediaQuery(theme.breakpoints.up('sm')) //600-960
  const md = useMediaQuery(theme.breakpoints.up('md')) //960-1280
  const lg = useMediaQuery(theme.breakpoints.up('lg')) //1280-1920
  const xl = useMediaQuery(theme.breakpoints.up('xl')) //1920+

  const {
    updateDocs,
    useEvents,
    authUser,
    getUserData,
    uploadFilesToFirebaseStorage,
    addComment,
    getDomainData,
    domainDictionary,
    consultOT,
    consultBlockDayInDB
  } = useFirebase()
  const small = useMediaQuery(theme.breakpoints.down('sm'))
  const eventArray = useEvents(doc?.id, authUser) // TODO: QA caso cuando doc es undefined

  // Función para desplegar el acordeón de Información Adicional
  const toggleAdditionalInfo = () => {
    setAdditionalInfoVisible(!additionalInfoVisible)
  }

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

  const PetitionerOpshiftContactComponent = () => (
    <>
      {petitionerContact.opshift &&
        petitionerContact.opshift.map((opshiftItem, index) => (
          <div key={index}>
            {index > 0 && <br />}
            <Typography>{'Contraturno ' + Number(index + 1) + ':'}</Typography>
            <Typography>{opshiftItem.name}</Typography>
            <Typography>{opshiftItem.email}</Typography>
            <Typography>{opshiftItem.phone}</Typography>
          </div>
        ))}
    </>
  )

  const handleCloseErrorOt = () => {
    setErrorOT(false)
    setErrorOtMesage('')
  }

  const DeliverableComponent = () => (
    <>
      {values.deliverable &&
        values.deliverable.map((deliverableItem, index) => (
          <div key={index}>
            <Typography>{deliverableItem}</Typography>
          </div>
        ))}
    </>
  )

  const initialValues = doc
    ? {
        title: doc.title,
        description: doc.description,
        petitioner: doc.petitioner,
        plant: doc.plant,
        area: doc.area,
        costCenter: doc.costCenter,
        contop: doc.contop,
        date: moment(doc.date.toDate()),
        start: doc.start && moment(doc.start.toDate()),
        type: doc.type,
        detention: doc.detention,
        deliverable: doc.deliverable,
        objective: doc.objective,
        ...(doc.ot && { ot: doc.ot }),
        ...(doc.end && { end: moment(doc.end.toDate()) }),
        ...(doc.supervisorShift && { supervisorShift: doc.supervisorShift }),
        ...(doc.fotos && { fotos: doc.fotos }),
        ...(doc.draftmen && { draftmen: doc.draftmen })
      }
    : {}

  // useEffect para buscar la información de la Tabla de Dominio cuando se monta el componente
  useEffect(() => {
    const getAllDomainData = async () => {
      try {
        // Se llama a toda la información disponible en colección domain (tabla de dominio)
        const domain = await getDomainData()

        // Manejo de errores para evitar Warning en Consola
        if (!domain) {
          console.error('No se encontraron los datos o datos son indefinidos o null.')

          return
        }

        // Se almacena la información de Tabla de Dominio en una variable de Entorno
        setDomainData(domain)
      } catch (error) {
        console.error('Error buscando los datos:', error)
      }
    }

    getAllDomainData()
  }, [])

  // useEffect para buscar información específica de la colección domain en la base de datos
  useEffect(() => {
    const getSpecificDomainData = async () => {
      try {
        // Se reordena la información de plants en domain, para que sean arreglos ordenados alfabéticamente.
        if (domainData && domainData.plants) {
          const plants = Object.keys(domainData.plants).sort()
          setPlantsNames(plants)
        }

        // Se reordena la información de objectives (Tipo de Levantamiento) en domain, para que sean arreglos ordenados alfabéticamente.
        if (domainData && domainData.objectives) {
          const objectives = Object.keys(domainData.objectives).sort()
          setObjectivesArray(objectives)
        }

        // Se reordena la información de deliverables (Entregables) en domain, para que sean arreglos ordenados alfabéticamente.
        if (domainData && domainData.deliverables) {
          const deliverables = Object.keys(domainData.deliverables).sort()
          setDeliverablesArray(deliverables)
        }

        // Se reordena la información de areas en domain, para que sea un arreglo que contiene el {N°Area - Nombre de Area}
        const plantData = domainData?.plants?.[values.plant] || {}
        if (plantData) {
          const areas = Object.keys(plantData)
            .map(area => `${area} - ${plantData[area].name}`)
            .sort()
          setAreasArray(areas)
        }
      } catch (error) {
        console.error('Error buscando los datos:', error)
      }
    }

    getSpecificDomainData()
  }, [domainData, values.plant])

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

    // Primero, verifica si OT ha cambiado
    if (hasChanges.ot && values.ot !== null && values.ot !== undefined) {
      setLoading(true) // Muestra un indicador de carga, si es aplicable
      const resultOt = await consultOT(values.ot)
      // console.log('resultOt', resultOt)
      setLoading(false) // Oculta el indicador de carga

      if (resultOt.exist) {
        // Si la OT ya existe, muestra un mensaje de error
        setErrorOtMesage(resultOt.msj)
        setErrorOT(true)

        return // Detiene la ejecución para evitar abrir el diálogo de alerta
      }
    }

    if (roleData.id === '5') {
      // Agrega end y ot
      if (!end && hasChanges.end && !ot && hasChanges.ot) {
        setOpenAlert(true)

        // Ya viene con end u ot
      } else if (end && ot && state === 4) {
        setLoading(true)
        await updateDocs(id, true, authUser)
          .then(() => {
            handleClose()
            setLoading(false)
          })
          .catch(error => {
            setLoading(false)
            alert(error), console.log(error)
          })

        //No trae ni agrega end/ot
      } else if ((!end && !hasChanges.end) || (!ot && !hasChanges.ot)) {
        setMessage('Debes ingresar el Número de OT y la Fecha de Término')
      } else if ((!values.costCenter && hasChanges.costCenter) || !values.costCenter) {
        setMessage('Debes ingresar el Centro de Costo')
      } else if (
        (values.deliverable.length === 0 && hasChanges.deliverable) ||
        (values.deliverable.length === 0 && values.state >= 3)
      ) {
        setMessage('Debes ingresar seleccionar al menos un Entregable')
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

  const validationRegex = {
    //title: /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9- !@#$%^&*()-_-~.+,/\"]/, // /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/,
    //description: /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9- !@#$%^&*()-_-~.+,/\"]/, // /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/g,
    sap: /[^\s0-9 \"]/, // /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/g,
    fnlocation: /[^A-Z\s0-9- -.\"]/, // /[^0-9]/g
    ot: /[^A-Z\s0-9- -.\"]/, // /[^0-9]/g
    tag: /[^A-Z\s0-9- -.\"]/, // /[^0-9]/g
    costCenter: /[^A-Z\s0-9- -.\"]/ // /[^0-9]/g
  }

  const writeCallback = async () => {
    const newData = {}

    for (const key in values) {
      if (hasChanges[key]) {
        newData[key] = values[key]
        if (key === 'start' && newData[key]) {
          newData.pendingReschedule = false
          setHasChanges(prev => ({ ...prev, start: false }))
        }
      }
    }

    if (Object.keys(newData).length > 0) {
      // Verificar si la nueva fecha de inicio está bloqueada
      if (newData.start) {
        const resultDate = await consultBlockDayInDB(newData.start.toDate())
        if (resultDate.blocked) {
          // Mostrar el mensaje de bloqueo y no actualizar la solicitud
          setAlertMessage(resultDate.msj)

          return
        }
      }
      setLoading(true)
      await updateDocs(id, newData, authUser)
        .then(() => {
          setLoading(false)
        })
        .catch(error => {
          setLoading(false)
          alert(error), console.log(error)
        })
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
    if (loading || !comment) return
    await addComment(id, comment, authUser)
      .then(() => {
        setLoading(false)
        setComment('')
        setCommentDialog(false)
      })
      .catch(error => {
        setLoading(false)
        alert(error), console.error(error)
      })
  }

  // Función onchange utilizando currying
  const handleInputChange = field => event => {
    let fieldValue = event.target.value

    fieldValue = validationRegex[field] ? fieldValue.replace(validationRegex[field], '') : fieldValue

    // Si el campo es 'ot', convierte el valor a un número
    if (field === 'ot') {
      // Verifica si fieldValue solo contiene dígitos
      if (/^\d+$/.test(fieldValue)) {
        fieldValue = Number(fieldValue)
      } else {
        fieldValue = 0 // O cualquier valor por defecto que quieras usar cuando fieldValue no sea un número
      }
    }

    setValues({ ...values, [field]: fieldValue })
    setHasChanges({ ...hasChanges, [field]: fieldValue !== initialValues[field] })
  }

  const handleDateChange = dateField => async date => {
    const fieldValue = moment(date.toDate())
    setValues({ ...values, [dateField]: fieldValue })
    setHasChanges({ ...hasChanges, [dateField]: !fieldValue.isSame(initialValues[dateField]) })

    // Si cambia start, end debe ser igual a start mas diferencia original
    // userRole es el rol de usuario que creo el documento
    const isPetitioner = userRole === 2
    const isContop = userRole === 3
    const isPlanner = userRole === 5
    const isSupervisor = userRole === 7

    // Variable diferencia original entre start y end
    const docDifference = moment(initialValues.end).diff(moment(initialValues.start), 'days')

    if (dateField === 'start') {
      const resultDate = await consultBlockDayInDB(fieldValue.toDate())
      // Utiliza el resultado de la función para establecer el mensaje de alerta
      setAlertMessage(resultDate.msj)
    }

    if (dateField === 'start' && end && (isPetitioner || isContop || isPlanner || isSupervisor)) {
      const resultDate = await consultBlockDayInDB(fieldValue.toDate())
      setAlertMessage(resultDate.msj)
      const newStart = date
      const newEnd = moment(date.toDate()).add(docDifference, 'days')

      // actualiza el turno segun a la fecha de inicio modificada
      const adjustedDate = moment(newStart).subtract(1, 'day')
      const week = moment(adjustedDate.toDate()).isoWeek()
      const newSupervisorShift = week % 2 === 0 ? 'A' : 'B'

      setValues({ ...values, start: newStart, end: newEnd, supervisorShift: newSupervisorShift })
      setHasChanges({
        ...hasChanges,
        start: !newStart.isSame(initialValues.start),
        end: !newEnd.isSame(initialValues.end),
        supervisorShift: newSupervisorShift !== initialValues.supervisorShift
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
    <Grid container spacing={2} sx={{ p: 4, justifyContent: 'center' }}>
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
    costCenter,
    contop,
    objective,
    type,
    detention,
    deliverable,
    id,
    ot,
    end,
    supervisorShift,
    userRole,
    petitioner,
    fotos,
    draftmen,
    uid
  } = doc

  // Verifica estado
  state = typeof state === 'number' ? state : 100

  return (
    <Dialog
      sx={{ '& .MuiPaper-root': { maxWidth: '800px', width: '100%' } }}
      open={open}
      onClose={() => handleClose()}
      TransitionComponent={Transition}
      scroll='body'
    >
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
      <AlertDialog
        authUser={authUser}
        state={state}
        open={openAlert}
        handleClose={handleCloseAlert}
        callback={() => writeCallback()}
      ></AlertDialog>
      <Paper sx={{ margin: 'auto', padding: small ? 0 : '30px', overflowY: 'hidden' }}>
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
            <Timeline sx={{ [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip
                  label={state || state === 0 ? domainDictionary[state].details : 'Cargando...'}
                  color={state || state === 0 ? domainDictionary[state].color : 'primary'}
                  sx={{ my: 1, width: 'auto' }}
                />
                <Box>
                  {editButtonVisible && !isPlanner && (
                    <IconButton
                      onClick={() => setEditable(prev => !prev)}
                      color='primary'
                      aria-label='edit'
                      component='button'
                    >
                      <Edit />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={() => {
                      handleClose()
                      setEditable(false)
                    }}
                    color='primary'
                    aria-label='close'
                    component='button'
                  >
                    <Close />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', my: 1 }}>
                {' '}
                {canComment && (
                  <Button onClick={() => setCommentDialog(true)} variant='outlined'>
                    Agregar Comentario
                  </Button>
                )}
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
                  multiline={true}
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
                  selectable={true}
                  options={objectivesArray}
                  editable={editable && roleData && roleData.canEditValues}
                  label='Tipo de Levantamiento'
                  id='objective'
                  initialValue={objective}
                  value={values.objective}
                  onChange={handleInputChange('objective')}
                />
                <CustomListItem
                  selectable={true}
                  options={plantsNames}
                  editable={false}
                  label='Planta'
                  id='plant'
                  initialValue={plant}
                  value={values.plant}
                  onChange={handleInputChange('plant')}
                />
                <CustomListItem
                  selectable={true}
                  options={areasArray}
                  editable={editable && roleData && roleData.canEditValues}
                  label='Área'
                  id='area'
                  initialValue={area}
                  value={values.area}
                  onChange={handleInputChange('area')}
                />
                <CustomListItem
                  editable={editable && roleData && roleData.canEditValues}
                  label='Centro de Costos'
                  id='costCenter'
                  initialValue={costCenter}
                  value={values.costCenter}
                  onChange={handleInputChange('costCenter')}
                  disabled={!isPlanner}
                />
                <CustomListItem
                  editable={false}
                  label='Contract Operator'
                  id='contop'
                  initialValue={contop}
                  value={values.contop}
                  required={true}
                  multiline={true}
                />
                <CustomListItem
                  editable={false}
                  label='Estado Operacional'
                  id='type'
                  initialValue={type}
                  value={values.type}
                  onChange={handleInputChange('type')}
                  required={true}
                  multiline={true}
                />
                <CustomListItem
                  editable={false}
                  label='Solicitante'
                  id='petitioner'
                  initialValue={<PetitionerContactComponent />}
                />
                <DateListItem
                  editable={editable && roleData && roleData.canEditStart && state <= 6}
                  disableKeyboard={true} // Deshabilitar la entrada del teclado
                  label='Inicio'
                  id='start'
                  value={values.start}
                  onChange={handleDateChange('start')}
                  initialValue={start}
                />
                <DateListItem
                  editable={editable && roleData && roleData.canEditEnd && state <= 6}
                  disableKeyboard={true} // Deshabilitar la entrada del teclado
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
                  inputProps={{ maxLength: 5 }}
                />
                <CustomListItem editable={false} label='Turno' id='shift' initialValue={supervisorShift} />

                {/* Información Adicional */}
                <ListItem>
                  <Button onClick={toggleAdditionalInfo}>
                    {additionalInfoVisible ? 'Ocultar Información Adicional' : 'Mostrar Información Adicional'}
                  </Button>
                </ListItem>

                {additionalInfoVisible && (
                  <>
                    {petitionerContact.opshift && petitionerContact.opshift[0].name && (
                      <CustomListItem
                        editable={false}
                        label='Contraturno del Solicitante'
                        id='opshift'
                        initialValue={<PetitionerOpshiftContactComponent />}
                      />
                    )}
                    <CustomListItem
                      editable={false}
                      label='¿Máquina detenida?'
                      id='detention'
                      initialValue={detention}
                      value={values.detention}
                      onChange={handleInputChange('detention')}
                      required={true}
                      multiline={true}
                    />
                    {/* <CustomListItem
                      editable={false}
                      label='Entregables'
                      id='deliverable'
                      initialValue={<DeliverableComponent/>}
                    /> */}
                    <CustomAutocompleteItem
                      selectable={true}
                      options={deliverablesArray}
                      editable={editable && roleData && roleData.canEditValues}
                      label='Entregables'
                      id='deliverable'
                      initialValue={deliverable}
                      value={values.deliverable}
                      onChange={handleInputChange('deliverable')}
                    />
                  </>
                )}

                {values.fotos ? (
                  <ListItem>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography component='div' sx={{ width: '30%' }}>
                        Archivos adjuntos
                      </Typography>
                      <Box sx={{ width: '70%', display: 'inline-flex', justifyContent: 'space-between' }}>
                        <PhotoGallery photos={fotos} />
                      </Box>
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
                                pt: 5,
                                pb: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: ['center'],
                                margin: 'auto'
                              }}
                            >
                              <Icon icon='mdi:file-document-outline' />
                              <Typography sx={{ mt: 5 }} align='center' color='textSecondary'>
                                <Link onClick={() => handleLinkClick}>Haz click acá</Link> para adjuntar archivos.
                              </Typography>
                            </Box>
                          </Box>
                        </div>
                        {files.length ? (
                          <Fragment>
                            <List>{fileList}</List>
                            <Box className='buttons' sx={{ alignSelf: 'center', textAlign: 'center' }}>
                              <Button color='error' sx={{ m: 2 }} variant='outlined' onClick={handleRemoveAllFiles}>
                                Quitar todo
                              </Button>
                              <Button color='primary' sx={{ m: 2 }} variant='outlined' onClick={handleSubmitAllFiles}>
                                Subir archivos
                              </Button>
                            </Box>
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

                      const isInputsModified =
                        hasPreviousDoc &&
                        (element.prevDoc.deliverable ||
                          element.prevDoc.title ||
                          element.prevDoc.description ||
                          element.prevDoc.area ||
                          element.prevDoc.objective)
                      const isStateDecreased = element.newState < element.prevState

                      if (isModifiedStart || isStateDecreased || isInputsModified) return 'Modificado'
                      if (isDraftmenAssigned) return `Proyectistas asignados`
                      if (isHoursEstablished) return 'En confección de entregables'
                      if (hasPreviousDoc) return 'Modificación aceptada'
                      if (emergencyApprovedByContop) return 'Emergencia aprobada'

                      return 'Aprobado'
                    }

                    const status = element.newState === 0 ? 'Rechazado' : determineModificationType(element)

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
                                {domainDictionary[element.newState]?.details || element.comment}
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

                      const isInputsModified =
                        hasPreviousDoc &&
                        (element.prevDoc.deliverable ||
                          element.prevDoc.title ||
                          element.prevDoc.description ||
                          element.prevDoc.area ||
                          element.prevDoc.objective)
                      const isStateDecreased = element.newState < element.prevState

                      if (OTEndAdded) return 'Aprobado con OT y fecha de término asignados'
                      if (isModifiedStart || isStateDecreased || isInputsModified) return 'Modificado'
                      if (isDraftmenAssigned) return `Proyectistas asignados`
                      if (isHoursEstablished) return 'En confección de entregables'

                      return 'Aprobado'
                    }

                    const status = element.newState === 0 ? 'Rechazado' : determineModificationType(element)

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
                              {status} por {element.userName}{' '}
                              {status === 'Proyectistas asignados' && element.draftmen
                                ? `: ${element.draftmen.map(x => x.name).join(', ')}`
                                : status === 'Proyectistas asignados'
                                ? values.draftmen.map(x => x.name).join(', ')
                                : ''}
                            </Typography>
                            <Typography variant='body2'>
                              {domainDictionary[element.newState]?.details || element.comment}
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
                  <Typography variant='body1'>
                    {' '}
                    Solicitud hecha por {user} {(userRole == 5 || userRole == 7) && `en nombre de ${values.petitioner}`}
                  </Typography>
                  {userRole == 2 || userRole == 5 ? (
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
      {errorOT && <DialogErrorOt open={errorOT} handleClose={handleCloseErrorOt} errorOtMesage={errorOtMesage} />}
      <Dialog open={commentDialog} sx={{ '& .MuiPaper-root': { maxWidth: '700px', width: '100%', height: 'auto' } }}>
        <DialogTitle id='message-dialog-title'>Agregar comentario</DialogTitle>
        <DialogContent>
          <TextField value={comment} onChange={e => setComment(e.target.value)} multiline rows={5} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialog(false)}>Cerrar</Button>
          <Button
            onClick={() => {
              setLoading(true), handleSubmitComment()
            }}
            disabled={loading}
          >
            Enviar comentario
          </Button>
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
