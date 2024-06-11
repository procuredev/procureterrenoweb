// ** React Imports
import { useEffect, useState } from 'react'

// ** Hooks Imports
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
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
    opshift: ''
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

  // ** Hooks
  const { createUser, signAdminBack, signAdminFailure, getUserData, consultUserEmailInDB, authUser, isCreatingProfile, setIsCreatingProfile, getDomainData } = useFirebase()

  // Acá se define en una constante los nombres de las plantas como un array
  // Se agrega la planta "Sucursal Santiago" que tendrá características especiales dentro del sistema
  const getPlantNames = async () => {
    const plants = await getDomainData('plants')
    let plantsArray = Object.keys(plants)
    plantsArray.sort()
    plantsArray = [...plantsArray, 'Sucursal Santiago']
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

  const handleChange = prop => (event, data) => {
    let newValue
    switch (prop) {
      case 'phone':
        newValue = event.target.value.replace(/[^0-9]/g, '')
        newValue = `${newValue[0] || ''} ${newValue.slice(1, 5) || ''} ${newValue.slice(5, 10) || ''}`
        newValue = newValue.trim()
        break
      case 'email':
        newValue = event.target.value.replace(/[^a-zA-Z0-9\-_@.]+/g, '').trim()
        break
      case 'name':
        // Eliminar cualquier caracter que no sea una letra, tilde, guion o "ñ"
        newValue = event.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\-\s]/g, '')
        break
      case 'firstName':
        // Eliminar cualquier caracter que no sea una letra, tilde, guion o "ñ"
        newValue = event.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\-\s]/g, '')
        break
      case 'fatherLastName':
        // Eliminar cualquier caracter que no sea una letra, tilde, guion o "ñ"
        newValue = event.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\-\s]/g, '')
        break
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
    if (newValue && validationRegex[prop] && validationRegex[prop].test(newValue) && errors[prop]) {
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
    name: /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s-]+$/,
    email: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
    phone: /^\d\s\d{4}\s\d{4}$/
  }

  const basicKeys = ['firstName', 'fatherLastName', 'email', 'company', 'role']
  let requiredKeys = [...basicKeys] // Utilizamos spread operator para crear una copia de basicKeys

  const validateForm = values => {
    const trimmedValues = {}
    const newErrors = {}

    switch (true) {
      case values.role === 2 && !values.plant.includes('Sucursal Santiago'):
        requiredKeys.push('shift', 'plant') // Utilizamos push para agregar elementos al array
        break
      case values.role === 3:
        requiredKeys.push('plant')
        break
      case [7, 8].includes(values.role):
        requiredKeys.push('shift')
        break
      default:
        break // Aunque el default esté vacío, se recomienda colocar el break
    }

    for (const key of requiredKeys) {
      // Validaciones solo para claves presentes en requiredKeys
      if (values.hasOwnProperty(key)) {
        // Error para campos vacíos
        if (values[key] === '' || !values[key] || (typeof values[key] === 'object' && values[key].length === 0)) {
          newErrors[key] = 'Por favor, selecciona una opción'
        }

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
            }
            break
          case 'shift':
            if (values.company === 'Procure') {
              const validValues = ['A', 'B']
              const invalidValues = values.shift.filter((value) => !validValues.includes(value))

              if (invalidValues.length > 0) {
                newErrors['shift'] = 'Por favor, selecciona un valor válido (A o B)'
              }
            } else if (values.company === 'MEL') {
              const validValues = ['P', 'Q']
              const invalidValues = values.shift.filter((value) => !validValues.includes(value))

              if (invalidValues.length > 0) {
                newErrors['shift'] = 'Por favor, selecciona un valor válido (P o Q)'
              }
            }
            break
          case 'plant':
            if ((!Array.isArray(values.plant) && values.role !== 2) || values.plant.length === 0) {
              newErrors['plant'] = 'Por favor, introduce al menos un valor'
            // } else if (values.role === 2 && Array.isArray(values.plant) && ![0, 1].includes(values.plant.length)) {
            //   newErrors['plant'] = 'Debes escoger sólo una planta'
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

        // Remover espacios en los valores de tipo string
        if (typeof values[key] === 'string') {
          trimmedValues[key] = values[key].replace(/\s+$/, '')
        }
      }
    }

    return newErrors
  }

  const onBlur = async e => {
    const email = e.target.value

    try {
      await consultUserEmailInDB(email)
      setErrors({})
    } catch (error) {
      setDialog(true)
      setAlertMessage(error.toString())
    }
  }

  const onSubmit = async event => {
    event.preventDefault()
    const formErrors = validateForm(values)
    const areFieldsValid = requiredKeys.every(key => !formErrors[key])

    if (areFieldsValid) {
      let plant
      Array.isArray(values.plant) ? (plant = values.plant) : (plant = values.plant.split(','))

      values.name = values.firstName + (values.fatherLastName.length > 0 ? ' ' : '') + values.fatherLastName + (values.motherLastName.length > 0 ? ' ' : '') + values.motherLastName

      try {
        await createUser({ ...values, plant }, authUser, setOldEmail, setNewUID)
        // Inicia el estado de creación de perfil
        setIsCreatingProfile(true)
        setDialog(true)
        setErrors({})
      } catch (error) {
        setDialog(true)
        setAlertMessage(error.toString())
      }
    } else {
      setErrors(formErrors)
    }
  }

  const handleConfirm = async (values, password) => {
    const maxAttempts = 2 // Número máximo de intentos permitidos

    try {
      const message = await signAdminBack(values, password, oldEmail, newUID)
      setValues(initialValues)
      setAttempts(0) // Reiniciar el contador de intentos si el inicio de sesión es exitoso
      setDialog(true)
      setAlertMessage(message)
      // Finaliza el estado de creación de perfil
      setIsCreatingProfile(false)
    } catch (error) {
      console.log(error)
      setAttempts(attempts + 1) // Incrementar el contador de intentos

      if (error.message === 'FirebaseError: Firebase: Error (auth/wrong-password).') {
        setAlertMessage('Contraseña incorrecta. Intentos disponibles: ' + (maxAttempts - attempts))
      } else if (error.message === 'FirebaseError: Firebase: Error (auth/requires-recent-login).') {
        setAlertMessage('Error, no se creó ningún usuario. Serás redirigid@ al login.')
        setTimeout(() => {
          signAdminFailure().catch(error => {
            console.log(error.message)
          })
          setDialog(false)
          setAlertMessage('')
        }, 1500)
      } else if (attempts >= maxAttempts) {
        setAlertMessage('Contraseña incorrecta, no se creó ningún usuario. Serás redirigid@ al login.')
        setTimeout(() => {
          signAdminFailure().catch(error => {
            console.log(error.message)
          })
          setDialog(false)
          setAlertMessage('')
        }, 1500)
      }
    }
  }

  const handleClose = async () => {
    if (authUser.role !== 1) {
      setAlertMessage('Registro cancelado: no se creó ningún usuario. Serás redirigid@ al login.')
      setTimeout(() => {
        signAdminFailure().catch(error => {
          console.log(error.message)
        })
        setDialog(false)
        setAlertMessage('')
      }, 1500)
    } else {
      setDialog(false)
      setAlertMessage('')
    }
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
            {/* Nombre Completo */}
            {/* <Grid item xs={12}>
              <TextField
                fullWidth
                label='Nombre Completo'
                type='text'
                placeholder='Nombre Completo'
                onChange={handleChange('name')}
                value={values.name}
                error={errors.name ? true : false}
                helperText={errors.name}
                inputProps={{ maxLength: 45 }}
              />
            </Grid> */}

            {/* Primer Nombre */}
            <Grid item xs={12}>
              <TextField
                fullWidth
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
                label='Teléfono'
                type='tel'
                placeholder='Teléfono'
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
                label='Email'
                type='email'
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
                      disabled={values.company !== 'Procure'}
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
            {values.company === 'MEL' && values.role === 2 && values.plant.includes('Sucursal Santiago') && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Ingeniería integrada</InputLabel>
                  <Select
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
            {[2, 7, 8].includes(values.role) && !values.plant.includes('Sucursal Santiago') && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Turno</InputLabel>
                  <Select
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
            {values.company === 'MEL' && values.role === 2 && !values.plant.includes('Sucursal Santiago') && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Contraturno</InputLabel>
                  <Select
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
            )}
            <Grid item xs={12}>
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
                  Crear usuario
                </Button>
                <Dialog open={dialog}>
                  {alertMessage ? (
                    <DialogContent>{alertMessage}</DialogContent>
                  ) : (
                    <DialogContent>
                      <DialogContentText sx={{ mb: 5 }}>Ingresa tu contraseña para confirmar</DialogContentText>
                      <TextField label='Contraseña' type='password' onInput={e => setPassword(e.target.value)} />
                    </DialogContent>
                  )}

                  <DialogActions>
                    <Button onClick={() => handleClose()}>Cerrar</Button>
                    {!alertMessage && <Button onClick={() => handleConfirm(values, password)}>Confirmar</Button>}
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
