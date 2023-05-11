// ** React Imports
import * as React from 'react'
import { useState } from 'react'

// ** Hooks Imports
import { useFirebase } from 'src/context/useFirebaseAuth'

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
    plant: '',
    shift: '',
    company: '',
    role: '',
    contop: '',
    opshift: ''
  }

  // ** States
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState(initialValues)
  const [password, setPassword] = useState('')

  // ** Hooks
  const { createUser, dialog, signAdminBack } = useFirebase()

  const handleChange = prop => event => {
    let newValue = event.target.value
    if (prop === 'rut') {
      // Eliminar cualquier caracter que no sea un número o letra k
      newValue = newValue.replace(/[^0-9kK]/g, '')

      // Aplicar expresión regular para formatear el RUT
      newValue = newValue.replace(/^(\d{1,2})(\d{3})(\d{3})([0-9kK]{1})$/, '$1.$2.$3-$4')
    }
    setValues({ ...values, [prop]: newValue })
  }

  const handleSelectorChange = prop => newValue => {
    setValues({ ...values, [prop]: newValue })
  }

  const validationRegex = {
    name: /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[0-9+]{8,12}$/
  }

  const validateForm = values => {
    const trimmedValues = {}
    const errors = {}
    for (const key in values) {
      // Error campos vacíos
      if (values[key] === '' || !values[key]) {
        errors[key] = 'Por favor, selecciona una opción'
      }

      // Saca espacios en los values
      trimmedValues[key] = values[key].replace(/\s+$/, '')
    }

    // Si es nulo/falsy o el test devuelve false, entrega mensaje de error

    for (const key in validationRegex) {
      if (!trimmedValues[key] || !validationRegex[key].test(trimmedValues[key])) {
        errors[key] = `Por favor, introduce un ${key} válido`
      }
    }

    // Si, el valor ingresado tiene formato de rut (26909763-9 o 26.909.763-9)

    if (isRutLike(values.rut)) {
      // si es 26.909.763-9 lo formatea para eliminar los puntos quedando: 26909763-9
      values.rut = formatRut(values.rut)

      // comprueba con el módulo 11 para corroborar el digito verificador

      if (!validateRut(values.rut)) {
        errors['rut'] = 'dígito verificador incorrecto'
      }
    } else {
      errors['rut'] = 'Por favor, introduce un rut válido'
    }

    return errors
  }

  // agregar codigo que crea un error cuando hay campos "" y que diga "por favor, selecciona un "coso"

  const onSubmit = event => {
    event.preventDefault()
    const formErrors = validateForm(values)
    const requiredKeys = ['name', 'rut', 'phone', 'email', 'company', 'role']
    const areFieldsValid = requiredKeys.every(key => !errors[key])
    if (Object.keys(formErrors).length === 0 || (values.company === 'Procure' && areFieldsValid)) {
      createUser(values)
      setErrors({})
    } else {
      setErrors(formErrors)
    }
  }

  const handleConfirm = () => {
    signAdminBack(values, password)
    setValues(initialValues)
  }

  return (
    <Card>
      <CardHeader title='Registrar usuario' />
      <CardContent>
        <form onSubmit={onSubmit}>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Nombre'
                placeholder='Nombres'
                onChange={handleChange('name')}
                value={values.name}
                error={errors.name ? true : false}
                helperText={errors.name}
              />
            </Grid>
            {/* <Grid item xs={6}>
              <TextField fullWidth label='Apellidos' placeholder='Apellidos' />
            </Grid> */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                label='RUT'
                placeholder='RUT'
                onChange={handleChange('rut')}
                value={values.rut}
                error={errors.rut ? true : false}
                helperText={errors.rut}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label='Teléfono'
                placeholder='Teléfono'
                onChange={handleChange('phone')}
                value={values.phone}
                error={errors.phone ? true : false}
                helperText={errors.phone}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Email'
                placeholder='email@ejemplo.com'
                onChange={handleChange('email')}
                value={values.email}
                error={errors.email ? true : false}
                helperText={errors.email}
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
                  {values.company === 'MEL' && <MenuItem value={'Solicitante'}>Solicitante</MenuItem>}
                  {values.company === 'MEL' && <MenuItem value={'Contract Operator'}>Contract Operator</MenuItem>}
                  {values.company === 'MEL' && <MenuItem value={'Contract Owner'}>Contract Owner</MenuItem>}
                  {values.company === 'Procure' && (
                    <MenuItem value={'Administrador de Contrato'}>Administrador de Contrato</MenuItem>
                  )}
                  {values.company === 'Procure' && <MenuItem value={'Supervisor'}>Supervisor</MenuItem>}
                  {values.company === 'Procure' && <MenuItem value={'Gerente'}>Gerente</MenuItem>}
                  {values.company === 'Procure' && <MenuItem value={'Proyectista'}>Proyectista</MenuItem>}
                </Select>
                {errors.role && <FormHelperText error>{errors.role}</FormHelperText>}
              </FormControl>
            </Grid>

            {values.company === 'MEL' /* && values.role==='Solicitante' */ && (
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
                  <DialogContent>
                    <DialogContentText sx={{ mb: 5 }}>Ingresa tu contraseña para confirmar</DialogContentText>
                    <TextField label='Contraseña' type='password' onInput={e => setPassword(e.target.value)} />
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => handleConfirm()}>Confirmar</Button>
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
