// ** React Imports
import { useEffect, useState } from 'react'

// ** Next Imports
import { useRouter } from 'next/router'

// ** Hooks Imports
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'

// **Validar RUT
import { formatRut, isRutLike, validateRut } from '@fdograph/rut-utilities'

const FormLayoutsBasic = () => {
  let initialValues = {
    name: '',
    firstName: '',
    fatherLastName: '',
    motherLastName: '',
    rut: '',
    phone: '',
    email: '',
    company: '',
    role: '',
    plant: [],
    engineering: '',
    shift: [],
    opshift: '',
    subtype: ''
  }

  // ** States
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState(initialValues)
  const [password, setPassword] = useState('')
  const [dialog, setDialog] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [alertMessage, setAlertMessage] = useState('')
  const [contOptions, setContOptions] = useState([])
  const [opShiftOptions, setOpShiftOptions] = useState([])
  const [oldEmail, setOldEmail] = useState('')
  const [newUID, setNewUID] = useState('')
  const [plantsNames, setPlantsNames] = useState([])
  const [allowableEmails, setAllowableEmails] = useState([])
  const [procureRoles, setProcureRoles] = useState([])
  const [melRoles, setMelRoles] = useState([])
  const [userTypes, setUserTypes] = useState([])
  const [wrongPasswordAdvice, setWrongPasswordAdvice] = useState(false)
  const [tryingCreateUser, setTryingCreateUser] = useState(false)
  const [userAlreadyExists, setUserAlreadyExists] = useState(false)
  const basicKeys = ['firstName', 'fatherLastName', 'email', 'company', 'role']
  const [requiredKeys, setRequiredKeys] = useState([...basicKeys])

  // ** Hooks
  const { createUser, signAdminBack, signAdminFailure, getUserData, consultUserEmailInDB, authUser, isCreatingProfile, setIsCreatingProfile, getDomainData } = useFirebase()

  // Acá se define en una constante los nombres de las plantas como un array
  const getPlantNames = async () => {
    const plants = await getDomainData('plants')
    let plantsArray = Object.keys(plants)
    plantsArray.sort()
    setPlantsNames(plantsArray)
  }

  const getAllowableEmailDomains = async () => {
    const domains = await getDomainData('allowableDomains')
    const array = Object.keys(domains)
    setAllowableEmails(array)
  }

  const getRolesDomains = async () => {
    const roles = await getDomainData('roles')
    const rolesArray = Object.keys(roles).map(key => ({ id: Number(key), ...roles[key] }))

    const rolesMelArray = rolesArray.filter(objeto => [2, 3, 4].includes(objeto.id))
    const rolesProcureArray = rolesArray.filter(objeto => ![2, 3, 4].includes(objeto.id))

    setProcureRoles(rolesProcureArray)
    setMelRoles(rolesMelArray)
  };

  const getUserTypes = async () => {
    const types = await getDomainData('userType')
    const array = Object.keys(types)
    setUserTypes(array)
  }

  // Obtener los nombres de las plantas cuando el componente se monta
  useEffect(() => {
    getPlantNames()
    getAllowableEmailDomains()
    getRolesDomains()
    getUserTypes()
  }, [])

  // Función handleChange. Se ejecuta cada vez que alguno de los campos es cambiado.
  // Formatea valores y se eliminan errors si es que existen.
  const handleChange = prop => (event, data) => {
    let newValue
    switch (prop) {
      case 'phone':
        newValue = event.target.value.replace(/[^0-9]/g, '')
        newValue = `${newValue[0] || ''} ${newValue.slice(1, 5) || ''} ${newValue.slice(5, 10) || ''}`
        newValue = newValue.trim()
        break
      case 'email':
        newValue = event.target.value.toLowerCase().replace(/[^a-zA-Z0-9\-_@.]+/g, '').trim()
        break
      case 'name':
      case 'firstName':
      case 'fatherLastName':
      case 'motherLastName':
        // Eliminar cualquier caracter que no sea una letra, tilde, guion o "ñ"
        newValue = event.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\-\s]/g, '')
        break
      case 'rut':
        // Eliminar cualquier caracter que no sea un número o letra k
        let cv = event.target.value.replace(/[^0-9kK]/g, '')

        // Formatea RUT
        newValue = `${cv.length > 7 ? cv.slice(-9, -7) + '.' : ''}${cv.length > 4 ? cv.slice(-7, -4) + '.' : ''}${
          cv.length >= 2 ? cv.slice(-4, -1) + '-' : ''
        }${cv[cv.length - 1] || ''}`
        newValue = newValue.trim()
        break
      case 'plant':
        newValue = data
        if (!Array.isArray(newValue)) {
          newValue = newValue.split(',')
        }
        getOptions(newValue)
        break

      case 'shift':
        newValue = Array.isArray(event) ? event : [event]
        let plantArray = values.plant
        if (!Array.isArray(values.plant)) {
          plantArray = values.plant.split(',')
        }
        getOptions(plantArray, newValue)
        break

      case 'role':
        newValue = event.target.value
        values.plant = []
        values.shift = []
        values.opshift = ''
        break
      case 'company':
        newValue = event.target.value
        values.role = ''
        break

      default:
        newValue = event.target.value
        break
    }

    setValues(prevValues => ({ ...prevValues, [prop]: newValue }))

    // Deshacer errores al dar formato correcto
    // Primero para aquellos campos que están dentro de validationRegex: firstName, fatherLastName, motherLastName, rut y phone.
    if (validationRegex.hasOwnProperty(prop)) {
      if (newValue && validationRegex[prop].test(newValue) && errors[prop]) {
        setErrors((current) => {
          const { [prop]: _, ...updatedErrors } = current;

          return updatedErrors;
        });
      }
      // Para el resto de los casos, dado que todos son seleccionables, bastará con que newValue exista.
    } else {
      // Si se actualizó el valor, existen errores previos.
      if (newValue && errors[prop]) {
        setErrors((current) => {
          const { [prop]: _, ...updatedErrors } = current;

          return updatedErrors;
        });
      }
    }

  }

  const validationRegex = {
    name: /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s-]+$/,
    firstName: /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s-]+$/,
    fatherLastName: /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s-]+$/,
    motherLastName: /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s-]+$/,
    email: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
    phone: /^\d\s\d{4}\s\d{4}$/
  }

  useEffect(() => {
    console.log(requiredKeys)
  }, [requiredKeys])

  useEffect(() => {
    console.log(values)
  }, [values])

  // useEffect para manejar los requiredkeys a medida que se va manejando el Formulario.
  useEffect(() => {
    // Inicia con las claves básicas.
    let updatedKeys = [...basicKeys]

    // Condiciones para agregar claves adicionales.
    if (values.role === 2) {
      updatedKeys.push('shift', 'plant')
    } else if (values.role === 3) {
      updatedKeys.push('plant')
    } else if ([7, 8].includes(values.role)) {
      updatedKeys.push('shift')
    } else {
      //
    }

    if (values.company === 'Procure') {
      updatedKeys.push('rut', 'subtype')
    }

    // Establece las claves calculadas.
    setRequiredKeys(updatedKeys)

  }, [values.role, values.plant, values.company])

  const validateForm = values => {

    const newErrors = {}

    for (const key of requiredKeys) {
      // Validaciones específicas para cada clave utilizando switch case
      switch (key) {
        case 'email':
          const emailParts = values.email.split('@')
          const emailConcat = allowableEmails.join(' y ')

          if (!allowableEmails.includes(emailParts[1])) {
            newErrors['email'] = `Solo se permiten correos de ${emailConcat}`
          }
          break
        case 'rut':
          if (isRutLike(values.rut)) {
            values.rut = formatRut(values.rut)
            if (!validateRut(values.rut)) {
              newErrors['rut'] = 'Dígito verificador incorrecto'
            }
          } else if (!values.rut || values.rut === '') {
            newErrors['rut'] = 'Por favor, ingresa un valor.'
          }
          break
        case 'shift':
          if (values.company === 'Procure') {
            if (!values.shift || values.shift === '' || !Array.isArray(values.shift) || values.shift.length === 0) {
              newErrors['shift'] = 'Por favor, selecciona un valor válido (A o B)'
            }
          } else if (values.company === 'MEL') {
            if (!values.shift || values.shift === '' || !Array.isArray(values.shift) || values.shift.length === 0) {
              newErrors['shift'] = 'Por favor, selecciona un valor válido (P o Q)'
            }
          }
          break
        case 'plant':
          if ((!Array.isArray(values.plant) && values.role !== 2) || values.plant.length === 0) {
            newErrors['plant'] = 'Por favor, introduce al menos un valor'
          }
          break
        case 'subtype':
          if (!values.subtype || values.subtype === '') {
            newErrors['subtype'] = 'Por favor, selecciona un valor.'
          }
          break
        default:
          // Validación regex para otras claves de tipo string
          if (
            (key !== 'opshift' && !values[key]) ||
            (validationRegex[key] && !validationRegex[key].test(values[key]))
          ) {
            newErrors[key] = `Por favor, introduce un ${key} válido`
          }
      }
    }

    return newErrors
  }

  // Función onBlur. Se ejecuta luego de hacer click fuera del campo previamente seleccionado.
  // name es un parámetro que existe dentro de cada campo.
  const onBlur = async (event) => {
    const { name, value } = event.target // Obtiene el nombre y valor del campo.

    if (name === 'email') {
      try {
        await consultUserEmailInDB(value)

        const emailParts = values.email.split('@')
        const emailConcat = allowableEmails.join(' y ')

        if (!allowableEmails.includes(emailParts[1])) {
          setErrors((currentErrors) => ({
            ...currentErrors,
            [name]: `Solo se permiten correos de ${emailConcat}`
          }))
        } else {
          setErrors((currentErrors) => {
            const { [name]: _, ...rest } = currentErrors

            return rest
          })
        }

      } catch (error) {
        setUserAlreadyExists(true)
        setAlertMessage(error.toString())
        setErrors((currentErrors) => ({
          ...currentErrors,
          [name]: 'El valor ingresado ya existe',
        }))
      }
    }

  }

  const onSubmit = async (event) => {
    event.preventDefault()

    // Validar el formulario
    const formErrors = validateForm(values)
    const areFieldsValid = requiredKeys.every((key) => !formErrors[key])

    if (areFieldsValid) {

      try {

        // Formatear el campo 'plant'
        values.plant = Array.isArray(values.plant) ? values.plant : values.plant.split(',')

        // Se quitan espacios al comienzo y final de cada name.
        values.firstName = values.firstName.trim()
        values.fatherLastName = values.fatherLastName.trim()
        values.motherLastName = values.motherLastName.trim()

        // Construir el nombre completo
        values.name = values.firstName + (values.fatherLastName.length > 0 ? ' ' : '') + values.fatherLastName + (values.motherLastName.length ? ' ' : '') + values.motherLastName

        // Formatear RUT
        if (values.rut) {
          values.rut = values.rut.replace(/[.]/g, '')
        }

        // Crear usuario
        await createUser({ ...values }, authUser, setOldEmail, setNewUID)

        // Cambiar estados tras éxito
        setIsCreatingProfile(true)
        setDialog(true)
        setErrors({})
      } catch (error) {
        console.error('Error al crear el usuario:', error)
        setDialog(true)
        setAlertMessage(error.toString())
      }
    } else {
      // Manejo de errores en la validación
      setErrors(formErrors)
    }
  }


  // Se define router para redirir a los usuariosa otras páginas, de ser necesario.
  const router = useRouter()

  const handleConfirm = async (values, password) => {

    setTryingCreateUser(true)

    const maxAttempts = 3 // Número máximo de intentos permitidos

    const updatedAttempts = attempts + 1
    setAttempts(updatedAttempts)

    // Si ya se han alcanzado los intentos máximos, no continuar
    if (updatedAttempts === 0  || updatedAttempts < maxAttempts) {

      try {
        // Intentar realizar la acción de autenticación
        await signAdminBack(values, password, oldEmail, newUID)

        // Si la autenticación es exitosa
        setValues(initialValues)
        setAttempts(0) // Reiniciar el contador de intentos
        setDialog(false)
        setIsCreatingProfile(false)

      } catch (error) {
          console.log(error)
          // setAttempts(prevAttempts => prevAttempts + 1) // Incrementar el contador de intentos

          if (error.message === 'FirebaseError: Firebase: Error (auth/wrong-password).') {
              setAlertMessage('Contraseña incorrecta. Te quedan ' + (maxAttempts - updatedAttempts) + ' intentos disponibles.')
              setWrongPasswordAdvice(true)
          } else {
            setAlertMessage('Error desconocido')
            setWrongPasswordAdvice(true)
          }
      }

    } else {

      setAlertMessage('Has llegado al límite de contraseñas. Serás redirigido al login.')

        // Mostrar el mensaje durante 3 segundos.
        setTimeout(async () => {
          try {
            await signAdminFailure() // Asegúrate de que esta función sea async si tiene promesas.
            router.push('/login') // Redirige al usuario al login.
            setDialog(false) // Cierra el diálogo.
            setAlertMessage('') // Limpia el mensaje de alerta.
          } catch (error) {
            console.log(error) // Maneja el error.
          }
        }, 3000)

        return // Salir de la función si los intentos han alcanzado el máximo

    }

  }

  // Maneja Cierre de Dialog de ingreso de Contraseña de Admin cuando se hace click en "Cancelar".
  const handleClose = async () => {

    setPassword('')

    if (authUser.role !== 1) {
      setAlertMessage('Registro cancelado: no se creó ningún usuario. Serás redirigid@ al login.')

      try {
        router.push('/login')
        await signAdminFailure()
        //router.push('/login') // Redirige al usuario
      } catch (error) {
        console.log(error)
      }

    } else {
      setDialog(false)
      setAlertMessage('')
    }

  }

  // Maneja Cierre de Dialog donde se indica que usuario se equivocó al indicar la contraseña.
  const handleTryPasswordAgain = async () => {

    setTryingCreateUser(false)

    if (attempts >= 3) {
      handleConfirm()
    }

    setPassword('')
    setAlertMessage('')
    setWrongPasswordAdvice(false)
  }

  // Maneja Cierre de Dialog donde se indica que el e-mail ya existe.
  const handleCloseDialogUserAlreadyExists = async () => {

    setAlertMessage('')
    setUserAlreadyExists(false)

  }

  const getOptions = async (plant, shift = '') => {
    if (plant.length > 0) {
      let options = await getUserData('getUsers', plant, {shift})

      // Verificar si options es null o no es una matriz antes de usar push
      if (!Array.isArray(options)) {
        options = [] // Inicializar como una matriz vacía si no es una matriz válida
      }

      options.push({ name: 'No Aplica' })
      if (shift) {
        setOpShiftOptions(options)
      } else {
        setContOptions(options)
      }
    }
  }

  const rolesToDisplay = values.company === 'MEL' ? melRoles : procureRoles

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit}>
          <Grid container spacing={5}>

            {/* Primer Nombre */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required={requiredKeys.includes('firstName')}
                name='firstName'
                label='Nombre'
                type='text'
                placeholder='Nombre'
                onChange={handleChange('firstName')}
                value={values.firstName}
                error={errors.firstName ? true : false}
                helperText={errors.firstName}
                inputProps={{ maxLength: 25 }}
              />
            </Grid>

            {/* Apellido Parterno */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required={requiredKeys.includes('fatherLastName')}
                name='fatherLastName'
                label='Apellido Paterno'
                type='text'
                placeholder='Apellido Paterno'
                onChange={handleChange('fatherLastName')}
                value={values.fatherLastName}
                error={errors.fatherLastName ? true : false}
                helperText={errors.fatherLastName}
                inputProps={{ maxLength: 25 }}
              />
            </Grid>

            {/* Apellido Materno */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required={requiredKeys.includes('motherLastName')}
                name='motherLastName'
                label='Apellido Materno'
                type='text'
                placeholder='Apellido Materno'
                onChange={handleChange('motherLastName')}
                value={values.motherLastName}
                error={errors.motherLastName ? true : false}
                helperText={errors.motherLastName}
                inputProps={{ maxLength: 25 }}
              />
            </Grid>


            {/* RUT */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required={requiredKeys.includes('rut')}
                name='rut'
                type='tel'
                label='RUT'
                placeholder='RUT'
                onChange={handleChange('rut')}
                value={values.rut}
                error={errors.rut ? true : false}
                helperText={errors.rut}
                inputProps={{ maxLength: 12 }}
              />
            </Grid>

            {/* Teléfono */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required={requiredKeys.includes('phone')}
                name='phone'
                label='Teléfono'
                type='tel'
                placeholder='9 8765 4321'
                onChange={handleChange('phone')}
                value={values.phone}
                error={errors.phone ? true : false}
                helperText={errors.phone}
                inputProps={{ maxLength: 11 }}
                InputProps={{ startAdornment: <InputAdornment position='start'>(+56)</InputAdornment> }}
              />
            </Grid>

            {/* e-mail */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required={requiredKeys.includes('email')}
                name='email'
                label='Email'
                type='tel' // Con esto hago que el campo no admita espacios en blanco.
                placeholder='email@ejemplo.com'
                onChange={handleChange('email')}
                value={values.email}
                error={errors.email ? true : false}
                helperText={errors.email}
                inputProps={{ maxLength: 45 }}
                onBlur={onBlur}
              />
            </Grid>

            {/* Empresa */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Empresa</InputLabel>
                <Select
                  required={requiredKeys.includes('company')}
                  name='company'
                  label='Empresa'
                  value={values.company}
                  onChange={handleChange('company')}
                  error={errors.company ? true : false}
                >
                  <MenuItem value={'MEL'}>MEL</MenuItem>
                  <MenuItem value={'Procure'}>Procure</MenuItem>
                </Select>
                {errors.company && <FormHelperText error>{errors.company}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Rol */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  required={requiredKeys.includes('role')}
                  name='role'
                  label='Rol'
                  value={values.role}
                  onChange={handleChange('role')}
                  error={errors.role ? true : false}
                >
                  {rolesToDisplay.map(role => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.role && <FormHelperText error>{errors.role}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Subtipo */}
            {values.company === 'Procure' && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Subtipo</InputLabel>
                  <Select
                    required={requiredKeys.includes('subtype')}
                    disabled={values.company !== 'Procure'}
                    name='subtype'
                    label='Subtipo'
                    value={values.subtype}
                    onChange={handleChange('subtype')}
                    error={errors.subtype ? true : false}
                  >
                    {userTypes.map(element => (
                      <MenuItem value={element} key={element}>
                        {element}
                      </MenuItem>
                    ))}
                  </Select>
                {errors.subtype && <FormHelperText error>{errors.subtype}</FormHelperText>}
                </FormControl>
              </Grid>
            )}

            {/* Planta */}
            {values.company === 'MEL' && (values.role === 2 || values.role === 3) && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <Autocomplete
                    multiple={true} //{values.role === 3}
                    fullWidth
                    options={plantsNames}
                    value={values.plant}
                    onChange={handleChange('plant')}
                    renderInput={params => (
                      <TextField
                        {...params}
                        required={requiredKeys.includes('plant')}
                        name='plant'
                        label='Planta'
                        InputLabelProps={{ required: false }}
                        error={errors.plant ? true : false}
                        helperText={errors.plant}
                      />
                    )}
                  />
                </FormControl>
              </Grid>
            )}

            {/* Ingeniería Integrada */}
            {values.company === 'MEL' && values.role === 2 && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Ingeniería integrada</InputLabel>
                  <Select
                    required={requiredKeys.includes('engineering')}
                    name='engineering'
                    label='Ingeniería integrada'
                    value={values.engineering}
                    onChange={handleChange('engineering')}
                    error={errors.engineering ? true : false}
                  >
                    {<MenuItem value={true}>Si</MenuItem>}
                    {<MenuItem value={false}>No</MenuItem>}
                  </Select>
                  {errors.engineering && <FormHelperText error>{errors.engineering}</FormHelperText>}
                </FormControl>
              </Grid>
            )}

            {/* Turno */}
            {[2, 7, 8].includes(values.role) && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Turno</InputLabel>
                  <Select
                    required={requiredKeys.includes('shift')}
                    name='shift'
                    label='Turno'
                    value={values.shift}
                    onChange={(event) => {
                      const selectedShifts = event.target.value
                      handleChange('shift')(selectedShifts)
                    }}
                    multiple
                    error={errors.shift ? true : false}
                  >
                    {values.company === 'MEL' && <MenuItem value={'P'}>P</MenuItem>}
                    {values.company === 'MEL' && <MenuItem value={'Q'}>Q</MenuItem>}
                    {values.company === 'Procure' && <MenuItem value={'A'}>A</MenuItem>}
                    {values.company === 'Procure' && <MenuItem value={'B'}>B</MenuItem>}
                  </Select>
                  {errors.shift && <FormHelperText error>{errors.shift}</FormHelperText>}
                </FormControl>
              </Grid>
            )}

            {/* Contraturno */}
            {/* {values.company === 'MEL' && values.role === 2 && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Contraturno</InputLabel>
                  <Select
                    name='opshift'
                    label='Contraturno'
                    value={values.opshift}
                    onChange={handleChange('opshift')}
                    error={errors.opshift ? true : false}
                  >
                    {opShiftOptions.map(element => {
                      return (
                        <MenuItem key={element.name} value={element.name}>
                          {element.name}
                        </MenuItem>
                      )
                    })}
                  </Select>
                  {errors.opshift && <FormHelperText error>{errors.opshift}</FormHelperText>}
                </FormControl>
              </Grid>
            )} */}

            <Grid item xs={12}>
              <Box sx={{ gap: 5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>

                {/* Botón "Crear Usuario" */}
                <Button disabled={Object.keys(errors).length > 0} type='submit' variant='contained' size='large'>
                  Crear usuario
                </Button>

                {/* Dialog para ingresar la contraseña del Admin*/}
                <Dialog
                  open={dialog}
                  sx={{
                    "& .MuiDialog-paper": {
                      width: 'auto',          // Ajusta el tamaño del diálogo
                      maxWidth: 500,          // Limita el tamaño máximo del diálogo (puedes ajustar el valor según sea necesario)
                      margin: 'auto',         // Centra el diálogo
                      overflow: 'hidden',     // Evita el scrollbar cuando el contenido es pequeño
                    },
                  }}
                >
                  {tryingCreateUser ? (
                    <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress size={40} />
                    </DialogContent>
                  ) : (
                    <DialogContent>
                      <DialogContentText sx={{ mb: 5 }}>Ingresa tu contraseña para confirmar.</DialogContentText>
                      <DialogContentText sx={{ mb: 5 }}>Si haces click en "CERRAR" serás redirigido al login.</DialogContentText>
                      <TextField fullWidth label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </DialogContent>
                  )}

                  {tryingCreateUser ? (
                    null // Ya hemos centrado el CircularProgress en el DialogContent, no necesitamos acciones en esta parte.
                  ) : (
                    <DialogActions>
                      <Button disabled={authUser && authUser.role === 1} onClick={async () => await handleClose()}>Cerrar</Button>
                      <Button disabled={!password} onClick={async () => await handleConfirm(values, password)}>Confirmar</Button>
                    </DialogActions>
                  )}
                </Dialog>

                {/* Dialog para indicar Error en ingreso de Contraseña */}
                <Dialog open={wrongPasswordAdvice}>
                  <DialogContent>
                    <DialogContentText sx={{ mb: 5 }}>{alertMessage}</DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={async() => await handleTryPasswordAgain()}>OK</Button>
                  </DialogActions>
                </Dialog>

                {/* Dialog para indicar que ya existe e-mail en Firestore */}
                <Dialog open={userAlreadyExists}>
                  <DialogContent>
                    <DialogContentText sx={{ mb: 5 }}>{alertMessage}</DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={async() => await handleCloseDialogUserAlreadyExists()}>OK</Button>
                  </DialogActions>
                </Dialog>

              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default FormLayoutsBasic
