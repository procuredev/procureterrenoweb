import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import moment from 'moment-timezone'
import 'moment/locale/es'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useFirebase } from 'src/context/useFirebase'

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

// ** Custom Components
import DialogErrorFile from 'src/@core/components/dialog-errorFile'
import Icon from 'src/@core/components/icon'

import {
  CustomAutocomplete,
  CustomSelect,
  CustomTextField,
  FileList,
  HeadingTypography,
  StyledInfoIcon,
  StyledTooltip
} from 'src/@core/components/custom-form/index'

const FormLayoutsSolicitud = () => {
  const initialValues = {
    ot: '',
    urgency: '',
    title: '',
    description: '',
    start: moment().startOf('day'),
    end: null,
    plant: '',
    area: '',
    contop: '',
    costCenter: '',
    fnlocation: '',
    tag: '',
    petitioner: '',
    type: '',
    detention: '',
    sap: '',
    objective: '',
    deliverable: [],
    receiver: []
  }

  // ** Hooks
  const {
    authUser,
    newDoc,
    uploadFilesToFirebaseStorage,
    consultBlockDayInDB,
    consultSAP,
    getUserData,
    getDomainData,
    consultOT
  } = useFirebase()
  const router = useRouter()

  // ** States
  const [areas, setAreas] = useState([])
  const [fixed, setFixed] = useState([])
  const [contOpOptions, setContOpOptions] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [files, setFiles] = useState([])
  const [petitioners, setPetitioners] = useState([])
  const [alertMessage, setAlertMessage] = useState('')
  const [errors, setErrors] = useState({})

  const [values, setValues] = useState(() => {
    const savedFormData = localStorage.getItem('formData')
    if (savedFormData) {
      const parsedFormData = JSON.parse(savedFormData)
      if (parsedFormData.start) {
        parsedFormData.start = moment(parsedFormData.start)
      }
      if (parsedFormData.end) {
        parsedFormData.end = moment(parsedFormData.end)
      }

      return parsedFormData
    }

    return initialValues
  })
  const [errorFileMsj, setErrorFileMsj] = useState('')
  const [errorDialog, setErrorDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [domainData, setDomainData] = useState({})
  const [objectivesOptions, setObjectivesOptions] = useState([])
  const [deliverablesOptions, setDeliverablesOptions] = useState([])
  const [urgencyTypesOptions, setUrgencyTypesOptions] = useState([])
  const [operationalStatusOptions, setOperationalStatusOptions] = useState([])

  const [hasShownDialog, setHasShownDialog] = useState(false)
  const [buttonDisabled, setButtonDisabled] = useState(false)

  const otRef = useRef(null)
  const titleRef = useRef(null)
  const urgencyRef = useRef(null)
  const descriptionRef = useRef(null)
  const endRef = useRef(null)
  const plantRef = useRef(null)
  const areaRef = useRef(null)
  const contopRef = useRef(null)
  const costCenterRef = useRef(null)
  const petitionerRef = useRef(null)
  const typeRef = useRef(null)
  const detentionRef = useRef(null)
  const objectiveRef = useRef(null)
  const deliverableRef = useRef(null)
  const receiverRef = useRef(null)

  const handleGPRSelected = () => {
    const currentWeek = moment().isoWeek()
    const startDate = moment(values.start)
    const currentDate = moment().subtract(1, 'days') // se le disminuye un día para que el calculo de weeksDifference coincida con inTenWeeks
    const weeksDifference = startDate.diff(currentDate, 'weeks')

    const inTenWeeks = moment()
      .locale('es')
      .isoWeeks(currentWeek + 10)
      .format('LL')

    if (weeksDifference < 10) {
      setErrors(prevErrors => ({
        ...prevErrors,
        objective: `El tipo de levantamiento "Análisis GPR" solo está disponible a partir del día ${inTenWeeks}`
      }))
    }
  }

  const handleChange = prop => async (event, data) => {
    const strFields = [
      'title',
      'description',
      'sap',
      'fnlocation',
      'tag',
      'urlVideo',
      'ot',
      'mcDescription',
      'costCenter'
    ]
    const selectFields = ['plant', 'petitioner', 'type', 'detention', 'objective', 'contop', 'urgency']
    const autoFields = ['area', 'deliverable', 'receiver']
    let newValue
    switch (true) {
      case strFields.includes(prop): {
        newValue = event.target.value

        newValue = validationRegex[prop] ? newValue.replace(validationRegex[prop], '') : newValue

        if (prop === 'ot') {
          newValue = Number(newValue)
        }

        setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
        break
      }
      case selectFields.includes(prop): {
        newValue = event.target.value
        newValue = validationRegex[prop] ? newValue.replace(validationRegex[prop], '') : newValue
        setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
        if (prop === 'objective' && newValue === 'Análisis GPR') {
          handleGPRSelected()
        }
        if (prop === 'plant') {
          setValues(prevValues => ({
            ...prevValues,
            [prop]: newValue,
            area: '',
            contop: '',
            receiver: [...fixed]
          }))

          //findAreas(newValue)
        }
        break
      }
      case autoFields.includes(prop): {
        newValue = prop === 'receiver' ? [...fixed, ...data.filter(option => fixed.indexOf(option) === -1)] : data
        setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
        if (prop === 'deliverable') {
          // Verificar si 'Memoria de Cálculo' se ha seleccionado
          if (newValue.includes('Memoria de Cálculo')) {
            if (!hasShownDialog) {
              // Dialog para advertir al usuario sobre la opción "Memoria de Cálculo"
              setAlertMessage(
                'Está seleccionando la opción de Memoria de Cálculo. Esto es un adicional y por lo tanto Procure le enviará un presupuesto para ello. A continuación le solicitamos que explique el motivo de la Memoria de Cálculo, en base a esto Procure generará el presuspuesto.'
              )

              setValues(prevValues => ({ ...prevValues, ['mcDescription']: '' }))

              // Actualizar el estado para indicar que el dialog ya se ha mostrado
              setHasShownDialog(true)
            }
          } else {
            // Si 'Memoria de Cálculo' se ha deseleccionado, restablecer hasShownDialog a false
            if (hasShownDialog) {
              setValues(prevValues => ({ ...prevValues, ['mcDescription']: '' }))
              setHasShownDialog(false)
            }
          }
        }
        break
      }
      case prop === 'end': {
        let endDate = event
        if (endDate < values.start) {
          setErrors(prevErrors => ({
            ...prevErrors,
            end: 'La fecha de término no puede ser inferior a la fecha de inicio.'
          }))
        } else {
          setValues({
            ...values,
            end: endDate
          })
        }
        break
      }
      case prop === 'start': {
        let startDate = event
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

  const handleBlurSap = async e => {
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

  const handleBlurOt = async e => {
    const otValue = e.target.value.trim() // .trim() devuelve el valor sin espacios extra

    // Verifica si el campo OT tiene algún valor antes de hacer la consulta
    if (otValue.length > 0) {
      const resultOt = await consultOT(parseInt(otValue))

      if (resultOt.exist) {
        setAlertMessage(resultOt.msj) // Muestra en Dialog el mensaje de error específico para el campo OT
        // Si existe un OT, establece el mensaje de error específicamente para el campo OT
        setErrors(prevErrors => ({
          ...prevErrors,
          ot: 'Existe una solicitud con ese número de OT.'
        }))
      } else {
        // Si OT no existe, limpia el mensaje de error para OT para asegurar que antiguos mensajes de error no permanezcan después de corregir el valor
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors }
          delete newErrors.ot // Elimina el mensaje de error para OT

          return newErrors
        })
      }
    } else {
      const resultOt = await consultOT(parseInt(otValue))
      // Si el campo OT está vacío, podrías querer manejar este caso también
      // Por ejemplo, estableciendo un mensaje de error indicando que el campo no puede estar vacío
      setErrors(prevErrors => ({
        ...prevErrors,
        ot: 'El campo OT no puede estar vacío.'
      }))
      setAlertMessage('El campo OT no puede estar vacío.')
    }
  }

  const validationRegex = {
    //title: /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9- !@#$%^&*()-_-~.+,/\"]/, // /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/,
    //description: /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9- !@#$%^&*()-_-~.+,/\"]/, // /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/g,
    sap: /[^\s0-9]/, // /[^A-Za-záéíóúÁÉÍÓÚñÑ\s0-9-]/g,
    fnlocation: /[^A-Za-z0-9@\/.-]/, ///[^A-Z\s0-9- -.\"]/, // /[^0-9]/g
    ot: /[^\s0-9]/, // /[^0-9]/g
    tag: /[^A-Za-z0-9@\/.-]/, // /[^A-Z\s0-9- -.\"]/, // /[^0-9]/g
    costCenter: /[^\s0-9]/ // /[^0-9]/g
  }

  const validateForm = values => {
    const trimmedValues = {}
    const newErrors = {}
    const textFieldValues = ['title', 'fnlocation', 'sap', 'description', 'tag', 'costCenter', 'mcDescription']
    const shouldValidateOT = authUser.role === 5 || authUser.role === 7 // validar 'ot' si el usuario tiene el rol 5 o 7.

    // Objeto para traducir lo que se rederiza al usuario
    const fieldLabels = {
      ot: 'OT',
      urgency: 'Urgencia',
      title: 'Título',
      description: 'Descripción',
      end: 'Fecha de término',
      plant: 'Planta',
      area: 'Área',
      contop: 'Contract Operator',
      petitioner: 'Solicitante',
      type: 'Estado Operacional Planta',
      detention: '¿Estará la máquina detenida?',
      objective: 'Tipo de Levantamiento',
      deliverable: 'Entregables del Levantamiento',
      receiver: 'Destinatarios',
      mcDescription: 'Memoria de Cálculo'
    }

    for (const key in values) {
      const excludedFields = authUser.role === 7 ? true : key !== 'end' && key !== 'ot' && key !== 'urgency'
      const costCenterIsRequired = authUser.role === 7 && key === 'costCenter' ? false : true
      const deliverableIsRequired = authUser.role === 5 && key === 'deliverable' ? false : true

      // Error campos vacíos
      if (
        key !== 'fnlocation' &&
        key !== 'sap' &&
        key !== 'tag' &&
        key !== 'urlvideo' &&
        key !== 'mcDescription' &&
        costCenterIsRequired &&
        excludedFields &&
        deliverableIsRequired
      ) {
        if (values[key] === '' || !values[key] || (typeof values[key] === 'object' && values[key].length === 0)) {
          newErrors[key] = `Por favor, especifica una opción válida para ${fieldLabels[key]}`
        }
      } else if (key == 'mcDescription' && values['deliverable'].includes('Memoria de Cálculo') && values[key] === '') {
        newErrors[key] = `Por favor, especifica una opción válida para ${fieldLabels[key]}`
      }

      if (key === 'costCenter' && values[key] === 0) {
        newErrors[key] = 'El campo Centro de Costo no puede ser cero.'
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

      if (key === 'end' && shouldValidateOT) {
        if (!values[key]) {
          newErrors[key] = 'El campo Fecha de Término no puede estar vacío.'
        }
      }

      if (key === 'ot' && shouldValidateOT) {
        if (!values[key]) {
          newErrors[key] = 'El campo OT no puede estar vacío.'
        } else if (values[key] === 0) {
          newErrors[key] = 'El campo OT no puede ser cero.'
        } else if (typeof values[key] !== 'number') {
          newErrors[key] = 'El campo OT debe ser un número.'
        } else if (errors.ot) {
          newErrors[key] = errors.ot
        }
      } else if (textFieldValues.includes(values[key])) {
        // Validaciones solo para claves de tipo string
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

  // useEffect para buscar toda la información de la colección domain en la base de datos
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

        // Se almacena la información de Tabla de Dominio en una variable de entorno
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
        // Se reordena la información de objectives (Tipo de Levantamiento) en domain, para que sean arreglos ordenados alfabéticamente.
        if (domainData && domainData.objectives) {
          const objectives = Object.keys(domainData.objectives).sort()
          setObjectivesOptions(objectives)
        }

        // Se reordena la información de deliverables (Entregables) en domain, para que sean arreglos ordenados alfabéticamente.
        if (domainData && domainData.urgencyTypes) {
          const urgencyTypes = Object.keys(domainData.urgencyTypes).sort()
          setUrgencyTypesOptions(urgencyTypes)
        }

        // Se reordena la información de deliverables (Entregables) en domain, para que sean arreglos ordenados alfabéticamente.
        if (domainData && domainData.operationalStatus) {
          const operationalStatus = Object.keys(domainData.operationalStatus).sort()
          setOperationalStatusOptions(operationalStatus)
        }

        // Se reordena la información de urgencys (Entregables) en domain, para que sean arreglos ordenados alfabéticamente.
        if (domainData && domainData.deliverables) {
          const deliverables = Object.keys(domainData.deliverables).sort()
          setDeliverablesOptions(deliverables)
        }

        // Se reordena la información de areas en domain, para que sea un arreglo que contiene el {N°Area - Nombre de Area}
        const plantData = domainData?.plants?.[values.plant] || {}
        if (plantData) {
          const areas = Object.keys(plantData)
            .map(area => `${area} - ${plantData[area].name}`)
            .sort()
          setAreas(areas)
        }
      } catch (error) {
        console.error('Error buscando los datos:', error)
      }
    }

    getSpecificDomainData()
  }, [domainData, values.plant])

  const validateFiles = acceptedFiles => {
    const imageExtensions = ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'tiff', 'svg', 'heif', 'HEIF']
    const documentExtensions = ['xls', 'xlsx', 'doc', 'docx', 'ppt', 'pptx', 'pdf', 'csv', 'txt']
    const maxSizeBytes = 10 * 1024 * 1024 // 5 MB in bytes

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

  const handleRemoveAllFiles = () => {
    setFiles
    setFiles([])
  }

  const handleLinkClick = event => {
    event.preventDefault()
  }

  // Objeto para mantener las referencias
  const refs = {
    ot: otRef,
    urgency: urgencyRef,
    title: titleRef,
    description: descriptionRef,
    end: endRef,
    plant: plantRef,
    area: areaRef,
    contop: contopRef,
    costCenter: costCenterRef,
    petitioner: petitionerRef,
    type: typeRef,
    detention: detentionRef,
    objective: objectiveRef,
    deliverable: deliverableRef,
    receiver: receiverRef
  }

  const focusFirstError = formErrors => {
    const errorKeys = Object.keys(formErrors)

    const orderedErrorKeys = [
      'ot',
      'urgency',
      'title',
      'description',
      'end',
      'plant',
      'area',
      'contop',
      'costCenter',
      'petitioner',
      'type',
      'detention',
      'objective',
      'deliverable',
      'receiver'
    ] // Orden específico de los elementos de 'errorKeys'

    for (const key of orderedErrorKeys) {
      // Si el key está en errorKeys, y formErrors[key] existe, y refs[key] existe...
      if (errorKeys.includes(key) && formErrors[key] && refs[key] && refs[key].current) {
        // Establece el mensaje de alerta al error correspondiente a key
        setAlertMessage(errors[key])
        // Enfoca el elemento correspondiente a key
        refs[key].current.focus()
        // Sale del bucle: no se procesarán más keys después de encontrar el primer error
        break
      }
    }
  }

  const onSubmit = async event => {
    event.preventDefault()
    setButtonDisabled(true)
    const formErrors = validateForm(values)
    setErrors(formErrors)
    if (Object.keys(formErrors).length > 0) {
      focusFirstError(formErrors) // Pasa formErrors como argumento
    }
    const requiredKeys = ['title']
    const areFieldsValid = requiredKeys.every(key => !formErrors[key])

    const isUrgent =
      ['Outage', 'Shutdown'].includes(values.type) || ['Urgencia', 'Emergencia', 'Oportunidad'].includes(values.urgency)
    const invalidFiles = validateFiles(files).filter(file => !file.isValid)
    let isBlocked = await consultBlockDayInDB(values.start.toDate())

    // Antes de enviar los datos, revisar si 'Memoria de Cálculo' está seleccionado
    if (!values.deliverable.includes('Memoria de Cálculo')) {
      delete values.mcDescription // Eliminar mcDescription si 'Memoria de Cálculo' no está seleccionado
    }

    console.log(formErrors)

    if (
      Object.keys(formErrors).length === 0 &&
      areFieldsValid === true &&
      invalidFiles.length === 0 &&
      ((isBlocked && isBlocked.blocked === false) || isUrgent)
    ) {
      try {
        setIsUploading(true) // Se activa el Spinner

        // Restablecer el estado del formulario a los valores iniciales...
        localStorage.removeItem('formData')

        const solicitud = await newDoc(
          {
            ...values,
            petitioner: values.petitioner.split(' - ')[0],
            receiver: values.receiver.map(option => {
              const { disabled, ...rest } = option

              return {
                id: option.id,
                name: option.name,
                email: option.email,
                phone: option.phone
              }
            }),
            start: moment.tz(values.start.toDate(), 'America/Santiago').startOf('day').toDate(),
            end:
              authUser.role === 5 || authUser.role === 7
                ? moment.tz(values.end.toDate(), 'America/Santiago').startOf('day').toDate()
                : null,
            mcDescription: values.mcDescription ? values.mcDescription : null,
            files: files
          },
          authUser
        )

        await uploadFilesToFirebaseStorage(files, solicitud.id).then(() => {
          setIsUploading(false),
            setButtonDisabled(false),
            handleRemoveAllFiles(),
            setAlertMessage('Documento creado exitosamente'),
            setValues(initialValues),
            setErrors({})
        })
      } catch (error) {
        setAlertMessage(error.message)
        setIsUploading(false) // Se cierra el spinner en caso de error
        setButtonDisabled(false)
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
      setButtonDisabled(false)
      setIsUploading(false)
      setErrors(formErrors)
    }
  }

  // Función asíncrona para buscar la información de los Contract Operator y Solicitantes de la Planta indicada
  const fetchData = async () => {
    try {
      // Obtener opciones de Contract Operator y Solicitantes simultáneamente
      const [contOpOptions, petitioners] = await Promise.all([
        getUserData('getUsers', values.plant),
        getUserData('getPetitioner', values.plant, { role: authUser.role })
      ])

      // Si solo hay una opción de Contract Operator y tiene nombre, establecerla automáticamente en los valores que serán almacenados en Firestore
      if (contOpOptions.length === 1 && contOpOptions[0].name) {
        setValues(prevValues => ({
          ...prevValues,
          contop: contOpOptions[0].name // Establecer automáticamente el Contract Operator seleccionado
        }))
      }

      setContOpOptions(contOpOptions) // Establecer las opciones de Contract Operator en la lista desplegable del formulario

      // Filtrar los Solicitantes para incluir solo aquellos con roles 2 y 3 (para que no aparezcan ni Contract Owner ni usuarios Procure)
      const filteredPetitioners = petitioners.filter(user => user.role == 2 || user.role == 3)
      setPetitioners(filteredPetitioners) // Establecer los Solicitantes filtrados

      // Si solo hay una opción de Contract Operator y tiene un nombre, devolver esa opción
      if (contOpOptions.length === 1 && contOpOptions[0].name) {
        return contOpOptions[0] // Devolver la única opción de Contract Operator disponible
      }
    } catch (error) {
      console.error('Error en la petición:', error) // Manejar errores
    }
  }

  // Función que obtiene los usuarios fijos (Contract Owner y el Contract Operator Seleccionado)
  const getFixedUsers = async () => {
    try {
      // Obtiene los usuarios con roles específicos asociados a una planta
      const [contractOperatorUsers, contractOwnerUser, plantUsers] = await Promise.all([
        getUserData('getUsersByRole', null, { role: 3 }), // Obtener usuarios con el rol de Contract Operator
        getUserData('getUsersByRole', null, { role: 4 }), // Obtener usuarios con el rol de Contract Owner
        getUserData('getReceiverUsers', values.plant) // Obtener usuarios que no son ni Contract Owner ni Contract Operator
      ])

      // Combinar los usuarios obtenidos en un único array de Destinatarios
      const receiverGroup = [...contractOperatorUsers, ...contractOwnerUser, ...plantUsers]

      let fixedOptions = [] // Array para almacenar los Destinatarios fijos

      // Buscar y añadir el Contract Operator seleccionado a las opciones fijas
      const matchingContop = contractOperatorUsers.find(option => option.name === values.contop)
      if (matchingContop) {
        fixedOptions.push({ ...matchingContop, disabled: true }) // Añadir el Contract Operator seleccionado con la propiedad 'disabled'
      }

      // Añadir el Contract Owner a las opciones fijas si está presente
      if (contractOwnerUser) {
        fixedOptions.push({ ...contractOwnerUser[0], disabled: true }) // Añadir el Contract Owner con la propiedad 'disabled'
      }

      // Establecer las opciones fijas en el estado
      setFixed(fixedOptions)

      // Actualizar los valores del estado, estableciendo el Contract Operator seleccionado y Contract Owner como opciones fijas
      setValues(values => ({
        ...values,
        ...(matchingContop && { contop: matchingContop.name }), // Actualizar el valor de 'contop' si se ha encontrado un Contract Operator coincidente
        receiver: [...fixedOptions] // Establecer los receptores como opciones fijas
      }))

      // Establecer todos los usuarios disponibles (receptores y peticionarios) en el estado
      setAllUsers(receiverGroup)
    } catch (error) {
      console.error('Error al obtener datos de usuarios:', error) // Manejar errores
    }
  }

  // useEffect para ejecutar las funciones fetchData y luego getFixedUsers, cuando hay cambios en Planta o en Contract Opetaror.
  useEffect(() => {
    if (values.plant) {
      fetchData().then(getFixedUsers())
    }
  }, [values.plant, values.contop])

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

  useEffect(() => {
    const formDataToSave = { ...values }
    if (formDataToSave.start) {
      formDataToSave.start = formDataToSave.start.format()
    }
    if (formDataToSave.end) {
      formDataToSave.end = formDataToSave.end.format()
    }

    // Guardar los datos del formulario junto con la marca de tiempo actual
    const dataToStore = {
      ...formDataToSave,
      timestamp: new Date().getTime() // Marca de tiempo en milisegundos
    }
    localStorage.setItem('formData', JSON.stringify(dataToStore))
  }, [values])

  useEffect(() => {
    const savedFormData = localStorage.getItem('formData')
    if (savedFormData) {
      /* const { formData, timestamp } = JSON.parse(savedFormData)
      const currentTime = new Date().getTime()

      // Verificar si han pasado 24 horas (24 * 60 * 60 * 1000 milisegundos)
      if (currentTime - timestamp < 24 * 60 * 60 * 1000) {
        if (formData.start) {
          formData.start = moment(formData.start)
        }
        if (formData.end) {
          formData.end = moment(formData.end)
        }
        setValues(formData)
      } else {
        // Limpiar localStorage si han pasado 24 horas
        localStorage.removeItem('formData')
      } */
      const parsedData = JSON.parse(savedFormData)
      const currentTime = new Date().getTime()

      if (currentTime - parsedData.timestamp < 24 * 60 * 60 * 1000) {
        if (parsedData.start) {
          parsedData.start = moment(parsedData.start)
        }
        if (parsedData.end) {
          parsedData.end = moment(parsedData.end)
        }
        // Establecemos los valores directamente sin incluir una propiedad formData.
        setValues(parsedData)
      } else {
        // Limpiar localStorage si han pasado 24 horas
        localStorage.removeItem('formData')
      }
    }
  }, [])

  // useEffect para definir automáticamente el campo 'Solicitante' cuando el usuario conectado tiene rol 2 (Solicitante).
  // En caso de que no tenga rol 2 (Solicitante), deberá seleccionarlo desde la lista desplegable.
  useEffect(() => {
    if (authUser.role === 2) {
      setValues({ ...values, petitioner: authUser.displayName })
    }
  }, [values.petitioner])

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
            {/* Número de OT Procure*/}
            {(authUser.role === 5 || authUser.role === 7) && (
              <>
                <CustomTextField
                  inputRef={otRef}
                  type='text'
                  required
                  label='OT'
                  value={values.ot}
                  onChange={handleChange('ot')}
                  error={errors.ot}
                  inputProps={{ maxLength: 5 }}
                  autoComplete='off'
                  onInput={e => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '')
                  }}
                  helper='Ingresa el número de OT.'
                  onBlur={handleBlurOt}
                />
              </>
            )}

            {/* Tipo de Urgencia */}
            {authUser.role === 7 && (
              <>
                <CustomSelect
                  inputRef={urgencyRef}
                  required
                  options={urgencyTypesOptions}
                  label='Tipo de urgencia'
                  value={values.urgency}
                  onChange={handleChange('urgency')}
                  error={errors.urgency}
                  helper='Selecciona el tipo de urgencia de la tarea.'
                  defaultValue=''
                />
              </>
            )}

            {/* Título */}
            <CustomTextField
              inputRef={titleRef}
              required
              type='text'
              label='Título'
              value={values.title}
              onChange={handleChange('title')}
              error={errors.title}
              inputProps={{ maxLength: 300 }}
              helper='Rellena este campo con un título acorde a lo que necesitas. Recomendamos que no exceda las 15 palabras.'
            />

            {/* Descripción */}
            <CustomTextField
              inputRef={descriptionRef}
              required
              type='text'
              label='Descripción'
              value={values.description}
              onChange={handleChange('description')}
              error={errors.description}
              inputProps={{ maxLength: 1500 }}
              helper='Rellena este campo con toda la información que consideres importante para que podamos ejecutar de mejor manera el levantamiento.'
            />

            {/* Fecha inicio */}
            <Grid item xs={12}>
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
                  <Box display='flex' alignItems='center'>
                    <MobileDatePicker
                      dayOfWeekFormatter={day => day.substring(0, 2).toUpperCase()}
                      minDate={moment().subtract(1, 'year')}
                      maxDate={moment().add(1, 'year')}
                      label='Fecha de inicio *'
                      value={values.start}
                      onChange={date => handleChange('start')(date)}
                      inputFormat='dd/MM/yyyy' // Formato de fecha que no puede ser introducido manualmente
                      InputLabelProps={{ shrink: true, required: true }}
                      slotProps={{
                        textField: {
                          error: errors.start ? true : false,
                          helperText: errors.start
                        },
                        toolbar: { hidden: false }
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
            {(authUser.role === 5 || authUser.role === 7) && (
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
                  <LocalizationProvider
                    dateAdapter={AdapterMoment}
                    adapterLocale='es'
                    localeText={{
                      okButtonLabel: 'Aceptar',
                      cancelButtonLabel: 'Cancelar',
                      datePickerToolbarTitle: 'Selecciona Fecha de Término'
                    }}
                  >
                    <Box display='flex' alignItems='center'>
                      <MobileDatePicker
                        inputRef={endRef}
                        dayOfWeekFormatter={day => day.substring(0, 2).toUpperCase()}
                        minDate={moment().subtract(1, 'year')}
                        maxDate={moment().add(1, 'year')}
                        label='Fecha de término *'
                        value={values.end}
                        onChange={date => handleChange('end')(date)}
                        inputFormat='dd/MM/yyyy' // Formato de fecha que no puede ser introducido manualmente
                        InputLabelProps={{ shrink: true, required: true }}
                        slotProps={{
                          textField: {
                            error: errors.end ? true : false,
                            helperText: errors.end
                          },
                          toolbar: { hidden: false }
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

            {/* Planta */}
            <CustomSelect
              inputRef={plantRef}
              required
              options={[...authUser.plant]}
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

            {/* Área
            <CustomSelect
              inputRef={areaRef}
              required
              options={areas}
              label='Área'
              value={values.area}
              onChange={handleChange('area')}
              error={errors.area}
              helper='Selecciona el área dentro de tu planta en dónde se ejecutará la tarea que requieres.'
              defaultValue=''
            /> */}

            {/* Área */}
            <CustomAutocomplete
              inputRef={areaRef}
              required
              options={areas}
              label='Área'
              value={values.area}
              onChange={handleChange('area')}
              error={errors.area}
              helper='Selecciona el área dentro de tu planta en dónde se ejecutará la tarea que requieres.'
              multiple={false}
            />

            {/* Texto mapa */}
            <Grid item xs={12}>
              <Typography sx={{ mr: 2 }}>
                ¿No sabe en qué área está? {`  `}
                <Link onClick={() => router.replace('/mapa/')}>Haga clic acá para saber</Link>
              </Typography>
            </Grid>

            {/* Contract Operator */}
            <CustomSelect
              inputRef={contopRef}
              required
              options={
                authUser.role === 3 && contOpOptions?.length < 2 ? [{ name: authUser.displayName }] : contOpOptions
              }
              label='Contract Operator'
              value={values.contop}
              onChange={handleChange('contop')}
              error={errors.contop}
              disabled={(authUser.role === 3 && contOpOptions?.length < 2) || contOpOptions?.length < 2}
              helper={
                contOpOptions?.length < 2
                  ? 'Contract Operator de tu Planta que deberá validar la solicitud de trabajo.'
                  : 'Selecciona al Contract Operator de tu Planta que deberá validar la solicitud de trabajo.'
              }
              defaultValue=''
            />

            {/* Centro de Costos */}
            <CustomTextField
              inputRef={costCenterRef}
              required={authUser.role != 7}
              type='text'
              label='Centro de Costos'
              value={values.costCenter}
              onChange={handleChange('costCenter')}
              error={errors.costCenter}
              inputProps={{ maxLength: 25 }}
              autoComplete='off'
              onInput={e => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '')
              }}
              helper='Ingresa el código del Centro de Costos.'
            />

            {/* Functional Location */}
            <CustomTextField
              type='text'
              label='Functional Location'
              value={values.fnlocation}
              onChange={handleChange('fnlocation')}
              error={errors.fnlocation}
              inputProps={{ maxLength: 25 }}
              onInput={e => {
                e.target.value = e.target.value.toUpperCase()
              }}
              helper='Ingresa el código del Functional Location en dónde será ejecutado el levantamiento.'
            />

            {/* TAG */}
            <CustomTextField
              type='text'
              label='TAG'
              value={values.tag}
              onChange={handleChange('tag')}
              error={errors.tag}
              inputProps={{ maxLength: 25 }}
              onInput={e => {
                e.target.value = e.target.value.toUpperCase()
              }}
              helper='Ingresa el código TAG para identificar el equipo.'
            />

            {/* Solicitante */}
            {authUser.role !== 2 && authUser.plant !== 'Sucursal Santiago' && authUser.plant !== 'allPlants' && (
              <CustomSelect
                inputRef={petitionerRef}
                required
                options={
                  authUser.role === 3 ||
                  authUser.role === 5 ||
                  authUser.role === 7 ||
                  authUser.plant === 'allPlants' ||
                  authUser.plant === 'Solicitante Santiago'
                    ? petitioners
                        .map(item => ({ name: `${item.name} - ${item.email}` }))
                        .sort((a, b) => a.name.localeCompare(b.name))
                    : [authUser.displayName]
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
            )}

            {/* Estado Operacional */}
            <CustomSelect
              inputRef={typeRef}
              required
              options={operationalStatusOptions}
              label='Estado Operacional Planta'
              value={values.type}
              onChange={handleChange('type')}
              error={errors.type}
              helper='Selecciona en qué estado operacional se encontrará el lugar donde se ejecutará la tarea.'
              defaultValue=''
            />

            {/* Máquina Detenida */}
            <CustomSelect
              inputRef={detentionRef}
              required
              options={['Sí', 'No', 'No aplica']}
              label='¿Estará la máquina detenida?'
              value={values.detention}
              onChange={handleChange('detention')}
              error={errors.detention}
              helper='Selecciona si la máquina estará detenida, no lo estará o no aplica el caso.'
              defaultValue=''
            />

            {/* SAP */}
            <CustomTextField
              type='text'
              label='Número SAP'
              value={values.sap}
              onChange={handleChange('sap')}
              onBlur={handleBlurSap}
              error={errors.sap}
              inputProps={{ maxLength: 10 }}
              helper='Rellena este campo sólo si conoces el número SAP'
            />

            {/* Tipo de Levantamiento */}
            <CustomSelect
              inputRef={objectiveRef}
              required
              options={objectivesOptions}
              label='Tipo de Levantamiento'
              value={values.objective}
              onChange={handleChange('objective')}
              error={errors.objective}
              helper='Selecciona cuál es el tipo de levantamiento que necesitas para tu trabajo. Sólo podrás seleccionar una opción. Si requieres más de un tipo de levantamiento, deberás hacer una nueva solicitud para cada tipo de levantamiento.'
              defaultValue=''
            />

            {/* Entregables */}
            <CustomAutocomplete
              inputRef={deliverableRef}
              required={authUser.role !== 5}
              options={deliverablesOptions}
              label='Entregables del levantamiento'
              value={values.deliverable}
              onChange={handleChange('deliverable')}
              error={errors.deliverable}
              helper='Selecciona cuál o cuáles serán los entregables que esperas recibir por parte de Procure.'
            />

            {values.deliverable?.includes('Memoria de Cálculo') && (
              <>
                {/* Descripción */}
                <CustomTextField
                  required
                  type='text'
                  label='Descripción Memoria de Cálculo'
                  value={values.mcDescription}
                  onChange={handleChange('mcDescription')}
                  error={errors.mcDescription}
                  inputProps={{ maxLength: 1000 }}
                  helper='Ingresa acá una explicación lo más adecuado posible del porqué necesitas una Memoria de Cálculo. Con esto Procure podrá generar un presupuesto acertado.'
                />
              </>
            )}

            {/* Destinatarios */}
            <CustomAutocomplete
              inputRef={receiverRef}
              required
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
                      <List>
                        <FileList files={files} handleRemoveFile={handleRemoveFile} />
                      </List>
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
                <Button type='submit' variant='contained' size='large' disabled={!!buttonDisabled}>
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
