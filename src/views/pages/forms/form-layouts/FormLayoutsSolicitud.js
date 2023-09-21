// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'
import { useRouter } from 'next/router'

// ** Date Library
//import moment from 'moment'
import moment from 'moment-timezone'
import 'moment/locale/es'

// ** MUI Imports
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import List from '@mui/material/List'
import plants from 'src/@core/components/plants-areas/index'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import DialogErrorFile from 'src/@core/components/dialog-errorFile'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { useDropzone } from 'react-dropzone'
import { useTheme } from '@emotion/react'

// ** Custom Components
import {
  CustomTextField,
  CustomSelect,
  CustomAutocomplete,
  StyledInfoIcon,
  StyledTooltip,
  HeadingTypography
} from 'src/@core/components/custom-form/index'

const FormLayoutsSolicitud = () => {
  const initialValues = {
    title: '',
    start: moment().startOf('day'),
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
    description: '',
    tag: '',
    end: null,
    ot: '',
    emergency: ''
  }

  // ** Hooks
  const { authUser, newDoc, uploadFilesToFirebaseStorage, consultBlockDayInDB, consultSAP, getUserData } = useFirebase()
  const router = useRouter()
  const theme = useTheme()

  // ** States
  const [areas, setAreas] = useState([])
  const [fixed, setFixed] = useState([])
  const [contOpOptions, setContOpOptions] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [files, setFiles] = useState([])
  const [petitioners, setPetitioners] = useState([])
  const [petitionerOpShift, setPetitionerOpShift] = useState([])
  const [alertMessage, setAlertMessage] = useState('')
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState(initialValues)
  const [errorFileMsj, setErrorFileMsj] = useState('')
  const [errorDialog, setErrorDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false) // Estado para controlar el spinner mientras la solicitud es enviada

  const handleChange = prop => async (event, data) => {
    const strFields = ['title', 'description', 'sap', 'fnlocation', 'tag', 'urlVideo', 'ot', 'urgency']
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
        if (prop === 'objective') {
          const isAnalysisGPRSelected = newValue === 'Análisis GPR'
          const currentWeek = moment().isoWeek()
          const startDate = moment(values.start)
          const currentDate = moment().subtract(1, 'days') // se le disminuye un día para que el calculo de weeksDifference coincida con inTenWeeks
          const weeksDifference = startDate.diff(currentDate, 'weeks')

          const inTenWeeks = moment()
            .locale('es')
            .isoWeeks(currentWeek + 10)
            //.startOf('week')
            .format('LL')

          if (isAnalysisGPRSelected && weeksDifference < 10) {
            setErrors(prevErrors => ({
              ...prevErrors,
              objective: `El tipo de levantamiento "Análisis GPR" solo está disponible a partir del día ${inTenWeeks}`
            }))
          }
        }
        if (prop === 'plant') {
          setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
          findAreas(newValue)
        }
        break
      }
      case autoFields.includes(prop): {
        newValue = prop === 'receiver' ? [...fixed, ...data.filter(option => fixed.indexOf(option) === -1)] : data
        setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
        if (prop === 'deliverable' && newValue.includes('Memoria de Cálculo')) {
          setAlertMessage(
            'Está seleccionando la opción de Memoria de Cálculo. Esto es un adicional y por lo tanto Procure le enviará un presupuesto para ello.'
          )
        }
        break
      }
      case prop === 'end': {
        let endDate = event
        console.log(event,"event")
        setValues({
          ...values,
          end: endDate
        })
        break
      }
      case prop === 'start': {
        let startDate = event
        console.log(event, "eventStart")
        setValues({
          ...values,
          start: startDate
        })

        const resultDate = await consultBlockDayInDB(startDate.toDate())

        if (resultDate.blocked) {
          setAlertMessage(resultDate.msj)
        } else {
          setAlertMessage(resultDate.msj)
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

  const handleBlur = async e => {
    if (values.sap.length > 0) {
      const resultSap = await consultSAP(e.target.value)

      if (resultSap.exist) {
        if (resultSap.sapWithOt) {
          setAlertMessage(resultSap.msj)
        } else {
          setAlertMessage(resultSap.msj)
        }
      } else {
        setValues({
          ...values,
          sap: e.target.value
        })
      }

      return resultSap
    }
  }

  const validationRegex = {
    //title: /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9- !@#$%^&*()-_-~.+,/\"]/, // /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/,
    //description: /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9- !@#$%^&*()-_-~.+,/\"]/, // /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/g,
    sap: /[^\s0-9 \"]/, // /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/g,
    fnlocation: /[^A-Z\s0-9- -.\"]/, // /[^0-9]/g
    tag: /[^A-Z\s0-9- -.\"]/ // /[^0-9]/g
  }

  const validateForm = values => {
    const trimmedValues = {}
    const newErrors = {}
    const textFieldValues = ['title', 'fnlocation', 'sap', 'description', 'tag']
    for (const key in values) {
      // Error campos vacíos
      if (key !== 'fnlocation' && key !== 'sap' && key !== 'tag' && key !== 'urlvideo') {
        if (values[key] === '' || !values[key] || (typeof values[key] === 'object' && values[key].length === 0)) {
          newErrors[key] = 'Por favor, especifica una opción válida'
        }
      }

      if (key === 'objective') {
        const isAnalysisGPRSelected = values[key] === 'Análisis GPR'
        const currentWeek = moment().isoWeek()
        const startDate = moment(values.start)
        const currentDate = moment().subtract(1, 'days') // se le disminuye un día para que el calculo de weeksDifference coincida con inTenWeeks
        const weeksDifference = startDate.diff(currentDate, 'weeks')

        const inTenWeeks = moment()
          .locale('es')
          .isoWeeks(currentWeek + 10)
          //.startOf('week')
          .format('LL')

        if (isAnalysisGPRSelected && weeksDifference < 10) {
          newErrors[key] = `El tipo de levantamiento "Análisis GPR" solo está disponible a partir del día ${inTenWeeks}`
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
    let setOfAreas = plants.find(obj => obj.name == plant)
    if (setOfAreas) {
      let areaNames = setOfAreas.allAreas.map(
        element => Object.keys(element).toString() + ' - ' + Object.values(element).toString()
      )
      setAreas(Object.values(areaNames))
    } else {
      setAreas(['No aplica'])
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
              <Icon icon='mdi:file-document-outline' fontSize={50} />
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
    const isUrgent = ['Outage', 'Shutdown'].includes(values.type) || ['Urgencia', 'Emergencia', 'Oportunidad'].includes(values.urgency)
    const invalidFiles = validateFiles(files).filter(file => !file.isValid)
    let isBlocked = await consultBlockDayInDB(values.start.toDate())
    if (
      Object.keys(formErrors).length === 0 &&
      areFieldsValid === true &&
      invalidFiles.length === 0 &&
      ((isBlocked && isBlocked.blocked === false) || isUrgent)
    ) {
      try {
        setIsUploading(true) // Se activa el Spinner

        const solicitud = await newDoc({ ...values, start: moment.tz(values.start.toDate(), 'America/Santiago').startOf('day').toDate(), end: authUser.role === 7 ? moment.tz(values.end.toDate(), 'America/Santiago').startOf('day').toDate() : null }, authUser)
        await uploadFilesToFirebaseStorage(files, solicitud.id)

        // Luego de completar la carga, puedes ocultar el spinner
        setIsUploading(false)

        // Se envía el mensaje de éxito
        setAlertMessage('Documento creado exitosamente')
        handleRemoveAllFiles()
        setValues(initialValues)
        setErrors({})
      } catch (error) {
        setAlertMessage(error.message)
        setIsUploading(false) // Se cierra el spinner en caso de error
      }
    } else {
      if (
        Object.keys(formErrors).length === 0 &&
        areFieldsValid === true &&
        invalidFiles.length === 0 &&
        isBlocked.blocked &&
        !isUrgent
      ) {
        setAlertMessage('Los días bloqueados sólo aceptan solicitudes tipo outage, shutdown u oportunidad.')
      }
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
    if (!values.contop) return
    ;(async () => {
      const [contOpUsers, contOwnUser, plantUsers] = await Promise.all([
        getUserData('getUsersByRole', null, { role: 3 }),
        getUserData('getUsersByRole', null, { role: 4 }),
        getUserData('getReceiverUsers', values.plant)
      ])

      const contOpName = values.contop
      const petitionerName = values.petitioner
      const filter = [{ name: contOpName }, { name: authUser.displayName }]
      const receiverGroup = contOpUsers.concat(contOwnUser).concat(plantUsers)
      const receiverFilter = receiverGroup.filter(user => ![filter].includes(user.name))

      const fixedValues = [
        petitionerName && petitionerName !== '' && { name: petitionerName, disabled: true },
        contOwnUser && { name: contOwnUser[0].name, disabled: true },
        { name: contOpName, disabled: true }
      ]
      setAllUsers(receiverFilter)
      setFixed(fixedValues)
      setValues({ ...values, receiver: fixedValues })
    })()
  }, [values.plant, values.contop, values.petitioner])

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
  }, [authUser])

  //Establece opciones de contract operator
  useEffect(() => {
    if (values.plant) {
      console.log("Valor actual de plant: ", values.plant);

      const fetchData = async () => {
        await getUserData('getUsers', values.plant)
          .then(contOpOptions => {
            setContOpOptions(contOpOptions)
            if (contOpOptions && contOpOptions.length === 1 && contOpOptions[0].name) {
              setValues({ ...values, contop: contOpOptions[0].name })
            }
          })
          .catch(error => {
            // handle error
          })
        const petitioners = await getUserData('getPetitioner', values.plant, { role: authUser.role })
        setPetitioners(petitioners)
      }
      fetchData()
    }
  }, [values.plant])

  useEffect(() => {
    if (values.objective === 'Análisis GPR') {
      const currentWeek = moment().isoWeek()
      const startDate = moment(values.start)
      const currentDate = moment().subtract(1, 'days') // se le disminuye un día para que el calculo de weeksDifference coincida con inTenWeeks
      const weeksDifference = startDate.diff(currentDate, 'weeks')

      const inTenWeeks = moment()
        .locale('es')
        .isoWeeks(currentWeek + 10)
        //.startOf('week')
        .format('LL')

      if (weeksDifference < 10) {
        setErrors(prevErrors => ({
          ...prevErrors,
          objective: `El tipo de levantamiento "Análisis GPR" solo está disponible a partir del día ${inTenWeeks}`
        }))
      } else {
        setErrors(prevErrors => ({
          ...prevErrors,
          objective: '' // Limpia el error si la fecha es superior a 10 semanas
        }))
      }
    }
  }, [values.start])

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
            <CustomTextField
              required
              type='text'
              label='Título'
              value={values.title}
              onChange={handleChange('title')}
              error={errors.title}
              inputProps={{ maxLength: 100 }}
              helper='Rellena este campo con un título acorde a lo que necesitas. Recomendamos que no exceda las 15 palabras'
            />

            <CustomTextField
              required
              type='text'
              label='Descripción'
              value={values.description}
              onChange={handleChange('description')}
              error={errors.description}
              inputProps={{ maxLength: 500 }}
              helper='Rellena este campo con toda la información que consideres importante para que podamos ejecutar de mejor manera el levantamiento.'
            />

            {/* Fecha inicio */}
            <Grid item xs={12}>
              <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale='es'>
                  <Box display='flex' alignItems='center'>
                    <DatePicker
                      dayOfWeekFormatter={day => day.substring(0, 2).toUpperCase()}
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
                      <StyledInfoIcon color='action' />
                    </StyledTooltip>
                  </Box>
                </LocalizationProvider>
              </FormControl>
            </Grid>

            {/* Fecha finalización */}
            {authUser.role === 7 && (
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                  <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale='es'>
                    <Box display='flex' alignItems='center'>
                      <DatePicker
                        dayOfWeekFormatter={day => day.substring(0, 2).toUpperCase()}
                        minDate={moment().subtract(1, 'year')}
                        maxDate={moment().add(1, 'year')}
                        label='Fecha de término'
                        value={values.end}
                        onChange={date => handleChange('end')(date)}
                        InputLabelProps={{ shrink: true, required: true }}
                        slotProps={{
                          textField: {
                            error: errors.end ? true : false,
                            helperText: errors.end
                          }
                        }}
                      />
                      <StyledTooltip title='Selecciona la fecha de finalización deseada para la tarea que requieres.'>
                        <StyledInfoIcon color='action' />
                      </StyledTooltip>
                    </Box>
                  </LocalizationProvider>
                </FormControl>
              </Grid>
            )}

            <CustomSelect
              options={
                authUser.role === 7 || authUser.role === 2 && (authUser.plant === 'Sucursal Santiago' || authUser.plant === 'allPlants')
                  ? plants
                  : [authUser.plant[0]]
              }
              label='Planta'
              value={values.plant}
              onChange={handleChange('plant')}
              error={errors.plant}
              disabled={
                authUser.role === 2 && (authUser.plant === 'Sucursal Santiago' || authUser.plant === 'allPlants')
              }
              helper='Selecciona la planta correspondiente.'
              defaultValue=''
            />

            <CustomSelect
              options={areas}
              label='Área'
              value={values.area}
              onChange={handleChange('area')}
              error={errors.area}
              disabled={
                authUser.role === 2 && (authUser.plant === 'Sucursal Santiago' || authUser.plant === 'allPlants')
              }
              helper='Selecciona el área dentro de tu planta en dónde se ejecutará la tarea que requieres.'
              defaultValue=''
            />

            {/* Texto mapa */}
            <Grid item xs={12}>
              <Typography sx={{ mr: 2 }}>
                ¿No sabe en qué área está? {`  `}
                <Link onClick={() => router.replace('/mapa/')}>Haga clic acá para saber</Link>
              </Typography>
            </Grid>

            <CustomSelect
              options={authUser.role === 3 ? [{ name: authUser.displayName }] : contOpOptions}
              label='Contract Operator'
              value={values.contop}
              onChange={handleChange('contop')}
              error={errors.contop}
              disabled={authUser.role === 3}
              helper='Selecciona quién es la persona de tu Planta que ha hecho la solicitud de trabajo.'
              defaultValue=''
            />

            {authUser.role === 7 && (
              <CustomTextField
                label='OT'
                value={values.ot}
                onChange={handleChange('ot')}
                error={errors.ot}
                inputProps={{ maxLength: 5 }}
                helper='Ingresa el número de OT.'
              />
            )}

            <CustomTextField
              type='text'
              label='Functional Location'
              value={values.fnlocation}
              onChange={handleChange('fnlocation')}
              error={errors.fnlocation}
              inputProps={{ maxLength: 25 }}
              helper='Ingresa el código del Functional Location en dónde será ejecutado el levantamiento.'
            />

            <CustomTextField
              type='text'
              label='TAG'
              value={values.tag}
              onChange={handleChange('tag')}
              error={errors.tag}
              inputProps={{ maxLength: 25 }}
              helper='Ingresa el código TAG para identificar el equipo.'
            />

            <CustomSelect
              options={
                (authUser.role === 3 ||authUser.role === 7 || authUser.plant === 'allPlants' || authUser.plant === 'Solicitante Santiago'
                  ? petitioners.map(item => ({ name: item.name }))
                  : [authUser.displayName])
              }
              label='Solicitante'
              value={values.petitioner}
              onChange={handleChange('petitioner')}
              error={errors.petitioner}
              disabled={
                authUser.role === 2 && (authUser.plant !== 'Sucursal Santiago' || authUser.plant !== 'allPlants')
              }
              helper='Selecciona quién es la persona de tu Planta que ha hecho la solicitud de trabajo.'
              defaultValue=''
            />

            <CustomSelect
              options={
                (authUser.role === 7 || authUser.role === 3 || authUser.plant === 'allPlants' || authUser.plant === 'Solicitante Santiago'
                  ? [petitionerOpShift]
                  : [authUser.opshift]) || 'No aplica'
              }
              label='Contraturno del solicitante'
              value={values.opshift}
              onChange={handleChange('opshift')}
              error={errors.opshift}
              disabled={authUser.role === 2}
              helper='Corresponde a la persona que trabaja en el turno de la semana siguiente del solicitante.'
              defaultValue=''
            />

            <CustomSelect
              options={['Normal', 'Outage', 'Shutdown']}
              label='Estado Operacional Planta'
              value={values.type}
              onChange={handleChange('type')}
              error={errors.type}
              helper='Selecciona en qué estado operacional se encontrará el lugar donde se ejecutará la tarea.'
              defaultValue=''
            />

            {authUser.role === 7 && (
              <CustomSelect
                options={['Urgencia', 'Emergencia', 'Oportunidad']}
                label='Tipo de urgencia'
                value={values.urgency}
                onChange={handleChange('urgency')}
                error={errors.urgency}
                helper='Selecciona el tipo de urgencia de la tarea.'
                defaultValue=''
              />
            )}

            <CustomSelect
              options={['Sí', 'No', 'No aplica']}
              label='¿Estará la máquina detenida?'
              value={values.detention}
              onChange={handleChange('detention')}
              error={errors.detention}
              helper='Selecciona si la máquina estará detenida, no lo estará o no aplica el caso.'
              defaultValue=''
            />

            <CustomTextField
              required
              type='text'
              label='Número SAP'
              value={values.sap}
              onChange={handleChange('sap')}
              onBlur={handleBlur}
              error={errors.sap}
              inputProps={{ maxLength: 10 }}
              helper='Rellena este campo sólo si conoces el número SAP'
            />

            <CustomSelect
              options={[
                'Análisis fotogramétrico',
                'Análisis GPR',
                'Inspección Dron',
                'Levantamiento 3D',
                'Levantamiento 3D GPS',
                'Topografía'
              ]}
              label='Tipo de Levantamiento'
              value={values.objective}
              onChange={handleChange('objective')}
              error={errors.objective}
              helper='Selecciona cuál es el tipo de levantamiento que necesitas para tu trabajo. Sólo podrás seleccionar una opción. Si requieres más de un tipo de levantamiento, deberás hacer una nueva solicitud para cada tipo de levantamiento.'
              defaultValue=''
            />

            <CustomAutocomplete
              options={[
                'Sketch',
                'Plano de Fabricación',
                'Plano de Diseño',
                'Memoria de Cálculo',
                'Informe',
                'Nube de Puntos'
              ]}
              label='Entregables del levantamiento'
              value={values.deliverable}
              onChange={handleChange('deliverable')}
              error={errors.deliverable}
              helper='Selecciona cuál o cuáles serán los entregables que esperas recibir por parte de Procure.'
            />

            <CustomAutocomplete
              isOptionEqualToValue={(option, value) => option.name === value.name}
              options={allUsers}
              label='Destinatarios'
              value={values.receiver}
              onChange={handleChange('receiver')}
              error={errors.receiver}
              helper='Selecciona a quién o a quiénes deberemos enviar los entregables.'
            />

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
                {isUploading && (
                  <Dialog
                    sx={{ '.MuiDialog-paper': { minWidth: '20%' } }}
                    open={isUploading}
                    closeAfterTransition={true}
                    maxWidth={false}
                  >
                    <DialogTitle sx={{ mt: 2, textAlign: 'center' }} id='spinner-dialog-title'>
                      Enviando solicitud
                    </DialogTitle>
                    <DialogContent sx={{ textAlign: 'center' }}>
                      <CircularProgress size={40} />
                    </DialogContent>
                  </Dialog>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
      {errorDialog && <DialogErrorFile open={errorDialog} handleClose={handleCloseErrorDialog} msj={errorFileMsj} />}
    </Card>
  )
}

export default FormLayoutsSolicitud
