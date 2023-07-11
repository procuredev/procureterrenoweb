// ** React Imports
import * as React from 'react'
import { useState } from 'react'

// ** Hooks Imports
import { useFirebase } from 'src/context/useFirebaseAuth'

// ** MUI Imports
import Autocomplete from '@mui/material/Autocomplete'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
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
import InputAdornment from '@mui/material/InputAdornment'
import FormHelperText from '@mui/material/FormHelperText'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'

// **Validar RUT
import { validateRut, isRutLike, formatRut } from '@fdograph/rut-utilities'
import areas from 'src/@core/components/plants-areas'

const FormLayoutsBasic = () => {
  let initialValues = {
    name: '',
    rut: '',
    phone: '',
    email: '',
    company: '',
    role: '',
    plant: [],
    shift: '',
    opshift: '',
  }

  // ** States
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState(initialValues)
  const [password, setPassword] = useState('')
  const [dialog, setDialog] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [contOptions, setContOptions] = useState([])
  const [opShiftOptions, setOpShiftOptions] = useState([])

  // ** Hooks
  const { createUser, signAdminBack, signAdminFailure, getUsers } = useFirebase()

  const handleChange = prop => (event, data) => {
    let newValue
      switch (prop) {
        case 'phone':
          newValue = event.target.value.replace(/[^0-9]/g, '')
          newValue = `${newValue[0]||''} ${newValue.slice(1, 5)||''} ${newValue.slice(5, 10)||''}`
          newValue = newValue.trim()
          break
        case 'email':
          newValue = event.target.value.replace(/[^a-zA-Z0-9\-_@.]+/g, '').trim()
          break
        case 'name':
          // Eliminar cualquier caracter que no sea una letra, tilde, guion o "ñ"
          newValue = event.target.value.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\-\s]/g, '')
          break
        case 'rut':
          // Eliminar cualquier caracter que no sea un número o letra k
          let cv = event.target.value.replace(/[^0-9kK]/g, '')

          // Formatea RUT
          newValue = `${cv.length > 7 ? cv.slice(-9, -7)+'.' : ''}${cv.length > 4 ? cv.slice(-7, -4)+'.' : ''}${cv.length >=2 ? cv.slice(-4, -1)+'-':''}${cv[cv.length - 1] || ''}`;
          newValue = newValue.trim()
          break
        case 'plant':
          newValue = data
          getOptions(newValue)
          break
        case 'shift':
          newValue = event.target.value
          getOptions(values.plant, newValue)
          break
        default:
          newValue = event.target.value
          break
    }
    console.log(newValue)
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

  const names = areas.map(plant=>plant.name)

  const validationRegex = {
    name: /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s-]+$/,
    email: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
    phone: /^\d\s\d{4}\s\d{4}$/
  }

  const validateForm = values => {
    const trimmedValues = {}
    const newErrors = {}
    for (const key in values) {
      // Error campos vacíos
      if (key !== 'opshift' && (values[key] === '' || !values[key])) {
        newErrors[key] = 'Por favor, selecciona una opción'
      }

      // Validaciones solo para claves de tipo string
      if (typeof values[key] === 'string') {
        // Saca espacios en los values
        trimmedValues[key] = values[key].replace(/\s+$/, '')

        // Si, el valor ingresado tiene formato de rut (26909763-9 o 26.909.763-9)
        if (key === 'rut' && isRutLike(values.rut)) {
          // si es 26.909.763-9 lo formatea para eliminar los puntos quedando: 26909763-9
          values.rut = formatRut(values.rut)

          // comprueba con el módulo 11 para corroborar el digito verificador
          if (!validateRut(values.rut)) {
            newErrors['rut'] = 'Dígito verificador incorrecto'
          }
        } else {
          // Validación regex para otras claves de tipo string
          if (
            (key !== 'opshift' && !trimmedValues[key]) ||
            (validationRegex[key] && !validationRegex[key].test(trimmedValues[key]))
          ) {
            newErrors[key] = `Por favor, introduce un ${key} válido`
          }
        }
      }
    }

    return newErrors
  }

  const onSubmit = async event => {
    event.preventDefault()
    const formErrors = validateForm(values)
    const requiredKeys = ['name', 'rut', 'phone', 'email', 'company', 'role']
    const areFieldsValid = requiredKeys.every(key => !formErrors[key])
    if (Object.keys(formErrors).length === 0 || (values.company === 'Procure' && areFieldsValid)) {
      try {
        await createUser(values)
        setDialog(true)
        setErrors({})
      } catch (error) {
        setErrorMessage(error.message)
      }
    } else {
      setErrors(formErrors)
    }
  }

  const handleConfirm = async (values, password) => {
    const maxAttempts = 2; // Número máximo de intentos permitidos

    try {
      const message = await signAdminBack(values, password);
      setValues(initialValues);
      setAttempts(0); // Reiniciar el contador de intentos si el inicio de sesión es exitoso
      setDialog(false);
      setSuccessMessage(message)
    } catch (error) {
      console.log(error);
      setAttempts(attempts + 1); // Incrementar el contador de intentos

      if (error.message === 'FirebaseError: Firebase: Error (auth/wrong-password).') {
        setDialogError('Contraseña incorrecta. Intentos disponibles: ' + (maxAttempts - attempts));
      } else if (error.message === 'FirebaseError: Firebase: Error (auth/requires-recent-login).') {
        setDialogError('Error, no se creó ningún usuario. Serás redirigid@ al login.');
        setTimeout(() => {
          signAdminFailure().catch(error => {
            console.log(error.message);
          });
          setDialog(false);
          setDialogError('');
        }, 1500);
      } else if (attempts >= maxAttempts) {
        setDialogError('Contraseña incorrecta, no se creó ningún usuario. Serás redirigid@ al login.');
        setTimeout(() => {
          signAdminFailure().catch(error => {
            console.log(error.message);
          });
          setDialog(false);
          setDialogError('');
        }, 1500);
      }
    }
  };


  const getOptions = async (plant, shift = '') => {
    let options = await getUsers(plant, shift)
    if (shift) {
      console.log('contraturno')
      setOpShiftOptions(options)
    } else {
      console.log('contract operator')
      setContOptions(options)
    }
  }

  return (
    <Card>
      <CardHeader title='Registrar usuario' />
      <CardContent>
        {successMessage && (
          <Alert severity="success">
            <AlertTitle>Éxito</AlertTitle>
            {successMessage}
          </Alert>
        )} {errorMessage && (
          <Alert severity='error' onClose={() => setErrorMessage('')}>
            <AlertTitle>Error</AlertTitle>
            {errorMessage}
          </Alert>
        )}
      </CardContent>
      <CardContent>
        <form onSubmit={onSubmit}>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Nombre'
                type='text'
                placeholder='Nombres'
                onChange={handleChange('name')}
                value={values.name}
                error={errors.name ? true : false}
                helperText={errors.name}
                inputProps={{ maxLength: 45 }}
              />
            </Grid>

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
        inputProps={{ maxLength:11}}
                InputProps={{ startAdornment: <InputAdornment position='start'>(+56)</InputAdornment> }}
              />
            </Grid>
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
              />
            </Grid>
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
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  label='Rol'
                  value={values.role}
                  onChange={handleChange('role')}
                  error={errors.role ? true : false}
                >
                  {values.company === 'MEL' && <MenuItem value={2}>Solicitante</MenuItem>}
                  {values.company === 'MEL' && <MenuItem value={3}>Contract Operator</MenuItem>}
                  {values.company === 'MEL' && <MenuItem value={4}>Contract Owner</MenuItem>}
                  {values.company === 'Procure' && <MenuItem value={5}>Planificador</MenuItem>}
                  {values.company === 'Procure' && <MenuItem value={6}>Administrador de Contrato</MenuItem>}
                  {values.company === 'Procure' && <MenuItem value={7}>Supervisor</MenuItem>}
                  {values.company === 'Procure' && <MenuItem value={8}>Proyectista</MenuItem>}
                  {values.company === 'Procure' && <MenuItem value={9}>Gerente</MenuItem>}
                </Select>
                {errors.role && <FormHelperText error>{errors.role}</FormHelperText>}
              </FormControl>
            </Grid>

            {values.company === 'MEL' && (values.role === 2 || values.role === 3) && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <Autocomplete
                      multiple
                      fullWidth
                      options={names}
                      value={values.plant}
                      onChange={handleChange('plant')}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Planta'
                          InputLabelProps={{ required: true }}
                          error={errors.plant ? true : false}
                        />
                      )}
                    />
                    {errors.plant && <FormHelperText error>{errors.plant}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Turno</InputLabel>
                    <Select
                      label='Turno'
                      value={values.shift}
                      onChange={handleChange('shift')}
                      error={errors.shift ? true : false}
                    >
                      <MenuItem value={'A'}>Turno A</MenuItem>
                      <MenuItem value={'B'}>Turno B</MenuItem>
                    </Select>
                    {errors.shift && <FormHelperText error>{errors.shift}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Contraturno</InputLabel>
                    <Select
                      label='Contraturno'
                      value={values.opshift}
                      onChange={handleChange('opshift')}

                      /* error={errors.opshift ? true : false} */
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
              </>
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
                  {dialogError && (
                    <Alert severity='error' onClose={() => setDialogError('')}>
                      <AlertTitle>Error</AlertTitle>
                      {dialogError}
                    </Alert>
                  )}
                  <DialogContent>
                    <DialogContentText sx={{ mb: 5 }}>Ingresa tu contraseña para confirmar</DialogContentText>
                    <TextField label='Contraseña' type='password' onInput={e => setPassword(e.target.value)} />
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => handleConfirm(values, password)}>Confirmar</Button>
                  </DialogActions>
                </Dialog>
                {/* <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 2 }}>Already have an account?</Typography>
                  <Link href='/' onClick={e => e.preventDefault()}>
                    Log in
                  </Link>
                </Box> */}
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default FormLayoutsBasic
