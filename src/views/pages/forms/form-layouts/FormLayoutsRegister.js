// ** React Imports
import * as React from 'react'
import { useState } from 'react'

// ** Hooks Imports
import { useFirebase } from 'src/context/useFirebaseAuth'

// ** MUI Imports
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
import OutlinedInput from '@mui/material/OutlinedInput'
import InputAdornment from '@mui/material/InputAdornment'
import FormHelperText from '@mui/material/FormHelperText'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// **Validar RUT
import { validateRut, isRutLike, formatRut } from '@fdograph/rut-utilities'

import FreeSoloCreateOptionDialog from 'src/@core/components/textbox-search'
import { SettingsVoice } from '@mui/icons-material'

const FormLayoutsBasic = () => {
  const initialValues = {
    name: '',
    rut: '',
    phone: '',
    email: '',
    company: '',
    role: ''
  }

  // ** States
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState(initialValues)
  const [password, setPassword] = useState('')
  const [dialog, setDialog] = useState(false)
  const [attempts, setAttempts] = useState(0) // Estado para realizar un seguimiento de los intentos realizados
  const [errorMessage, setErrorMessage] = useState('')
  const [dialogError, setDialogError] = useState('')

  // ** Hooks
  const { createUser, signAdminBack, signAdminFailure, addNewContact } = useFirebase()

  const handleChange = prop => event => {
    let newValue = event.target.value

    if (newValue) {
      switch (prop) {
        case 'phone':
          newValue = newValue.replace(/\D/g, '')
          break
        case 'email':
          newValue = newValue.replace(/[^a-zA-Z0-9\-_@.]+/g, '').trim()
          break
        case 'name':
          // Eliminar cualquier caracter que no sea una letra, tilde, guion o "ñ"
          newValue = newValue.replace(/[^A-Za-záéíóúÁÉÍÓÚñÑ\-\s]/g, '')
          break
        case 'rut':
          // Eliminar cualquier caracter que no sea un número o letra k
          newValue = newValue.replace(/[^0-9kK]/g, '')

          // Aplicar expresión regular para formatear el RUT
          newValue = newValue.replace(/^(\d{1,2})(\d{3})(\d{3})([0-9kK]{1})$/, '$1.$2.$3-$4')
          break
        default:
          break
      }
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

  const handleSelectorChange = prop => newValue => {
    setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
  }

  const validationRegex = {
    name: /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s-]+$/,
    email: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
    phone: /^[0-9]{9}$/
  }

  const validateForm = values => {
    const trimmedValues = {}
    const newErrors = {}
    for (const key in values) {
      // Error campos vacíos
      if (values[key] === '' || !values[key]) {
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
          if (!trimmedValues[key] || (validationRegex[key] && !validationRegex[key].test(trimmedValues[key]))) {
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
    const maxAttempts = 2 // Número máximo de intentos permitidos

    try {
      await signAdminBack(values, password)
      setValues(initialValues)
      setAttempts(0) // Reiniciar el contador de intentos si el inicio de sesión es exitoso
      setDialog(false)
    } catch (error) {
      console.log(error)
      setAttempts(attempts + 1) // Incrementar el contador de intentos
      if (error.message === 'FirebaseError: Firebase: Error (auth/wrong-password).') {
        setDialogError('Contraseña incorrecta. Intentos disponibles: ' + (maxAttempts - attempts))
      }
      if (error.message === 'FirebaseError: Firebase: Error (auth/requires-recent-login).') {
        setDialogError('Error, no se creó ningún usuario. Serás redirigid@ al login.')
        setTimeout(() => {
          signAdminFailure().catch(error => {
            console.log(error.message)
          })
          setDialog(false)
          setDialogError('')
        }, 1500)
      }
      if (attempts >= maxAttempts) {
        setDialogError('Contraseña incorrecta, no se creó ningún usuario. Serás redirigid@ al login.')
        setTimeout(() => {
          signAdminFailure().catch(error => {
            console.log(error.message)
          })
          setDialog(false)
          setDialogError('')
        }, 1500)
      }
    }
  }

  return (
    <Card>
      <CardHeader title='Registrar usuario' />
      {errorMessage && (
        <CardContent>
          <Alert severity='error' onClose={() => setErrorMessage('')}>
            <AlertTitle>Error</AlertTitle>
            {errorMessage}
          </Alert>
        </CardContent>
      )}
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
            {/* <Grid item xs={6}>
              <TextField fullWidth label='Apellidos' placeholder='Apellidos' />
            </Grid> */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                type='tel'
                label='RUT'
                placeholder='RUT'
                onChange={handleChange('rut')}
                value={values.rut}
                error={errors.rut ? true : false}
                helperText={errors.rut}
                inputProps={{ maxLength: 12, pattern: '[0-9kK.-]*' }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label='Teléfono'
                type='tel'
                placeholder='Teléfono'
                onChange={handleChange('phone')}
                value={values.phone}
                error={errors.phone ? true : false}
                helperText={errors.phone}
                inputProps={{ maxLength: 9, pattern: '[0-9]*' }}
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

            {values.company === 'MEL' && values.role === (2 || 3) && (
              <>
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
                    <InputLabel>Planta</InputLabel>
                    <Select
                      label='Planta'
                      value={values.plant}
                      onChange={handleChange('plant')}
                      error={errors.plant ? true : false}
                    >
                      <MenuItem value={'Los Colorados'}>Planta Concentradora Los Colorados</MenuItem>
                      <MenuItem value={'Laguna Seca 1'}>Planta Concentradora Laguna Seca | Línea 1</MenuItem>
                      <MenuItem value={'Laguna Seca 2'}>Planta Concentradora Laguna Seca | Línea 2</MenuItem>
                      <MenuItem value={'Chancado y correas'}>Chancado y correas</MenuItem>
                      <MenuItem value={'Puerto Coloso'}>Puerto Coloso</MenuItem>
                      <MenuItem value={'Instalaciones Catodo'}>Instalaciones Cátodo</MenuItem>
                    </Select>
                    {errors.plant && <FormHelperText error>{errors.plant}</FormHelperText>}
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FreeSoloCreateOptionDialog
                    label='Contract Operator'
                    placeholder='Contract Operator'
                    error={errors.contop ? true : false}
                    setterFunction={handleSelectorChange('contop')}
                    value={values.contop}
                    saveContact={addNewContact}
                  />
                  {errors.contop && <FormHelperText error>{errors.contop}</FormHelperText>}
                </Grid>
                <Grid item xs={12}>
                  <FreeSoloCreateOptionDialog
                    label='Contraturno'
                    placeholder='Contraturno'
                    error={errors.opshift ? true : false}
                    setterFunction={handleSelectorChange('opshift')}
                    value={values.opshift}
                    saveContact={addNewContact}
                  />
                  {errors.opshift && <FormHelperText error>{errors.opshift}</FormHelperText>}
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
