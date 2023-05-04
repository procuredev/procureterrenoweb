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
    let newValue = event.target.value;
    if (prop === 'rut') {
      // Eliminar cualquier caracter que no sea un número o letra k
      newValue = newValue.replace(/[^0-9kK]/g, "");

      // Aplicar expresión regular para formatear el RUT
      newValue = newValue.replace(/^(\d{1,2})(\d{3})(\d{3})([0-9kK]{1})$/, "$1.$2.$3-$4");
    }
    setValues({ ...values, [prop]: newValue });
  }

  const validationRegex = {
    name: /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[0-9+]{8,12}$/,
  }

  const validateForm = values => {
    const trimmedValues = {}
    const errors = {}
    for (const key in values) {
      trimmedValues[key] = values[key].replace(/\s+$/, '')
    }

    // Si es nulo/falsy o el test devuelve false, entrega mensaje de error

    for (const key in validationRegex) {
      if (!trimmedValues[key] || !validationRegex[key].test(trimmedValues[key])) {
        errors[key] = `Por favor, introduce un ${key} válido`
      }
    }

    if (isRutLike(values.rut)) {
      values.rut = formatRut(values.rut)

      /*chatgpt dice: Sin embargo, hay un problema en la validación del RUT.
      En la función validateForm, cuando el RUT es válido, se llama a la función validateRut, pero no se hace nada con su resultado.
      Deberías actualizar el código para hacer algo con el resultado, por ejemplo, si el RUT no es válido, establecer el mensaje de error correspondiente en el estado errors.*/
      if (!validateRut(values.rut)) {
        errors['rut'] = 'dígito verificador incorrecto'
      }
    } else {
      errors['rut'] = 'Por favor, introduce un rut válido'
    }

    return errors
  }

  const onSubmit = event => {
    event.preventDefault()
    const formErrors = validateForm(values)
    if (Object.keys(formErrors).length === 0) {
      createUser(values)
      setValues(initialValues)
      setErrors({})
    } else {
      setErrors(formErrors)
    }
  }

  //si existe errors.key, mostrar esto como helpertext y darle el atributo error

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
                <InputLabel id='id'>Planta</InputLabel>
                <Select labelId='id' label='Planta' id='id' value={values.plant} onChange={handleChange('plant')}>
                  <MenuItem value={'Los Colorados'}>Planta Concentradora Los Colorados</MenuItem>
                  <MenuItem value={'Laguna Seca 1'}>Planta Concentradora Laguna Seca | Línea 1</MenuItem>
                  <MenuItem value={'Laguna Seca 2'}>Planta Concentradora Laguna Seca | Línea 2</MenuItem>
                  <MenuItem value={'Chancado y correas'}>Chancado y correas</MenuItem>
                  <MenuItem value={'Puerto Coloso'}>Puerto Coloso</MenuItem>
                  <MenuItem value={'Instalaciones Catodo'}>Instalaciones Cátodo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='id'>Turno</InputLabel>
                <Select labelId='id' label='Turno' id='id' value={values.shift} onChange={handleChange('shift')}>
                  <MenuItem value={'A'}>Turno A</MenuItem>
                  <MenuItem value={'B'}>Turno B</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='id'>Empresa</InputLabel>
                <Select labelId='id' label='Empresa' id='id' value={values.company} onChange={handleChange('company')}>
                  <MenuItem value={'MEL'}>MEL</MenuItem>
                  <MenuItem value={'Procure'}>Procure</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='id'>Rol</InputLabel>
                <Select labelId='id' label='Rol' id='id' value={values.role} onChange={handleChange('role')}>
                  <MenuItem value={'Solicitante'}>Solicitante</MenuItem>
                  <MenuItem value={'Contract Operator'}>Contract Operator</MenuItem>
                  <MenuItem value={'Contract Owner'}>Contract Owner</MenuItem>
                  <MenuItem value={'Administrador de Contrato'}>Administrador de Contrato</MenuItem>
                  <MenuItem value={'Supervisor'}>Supervisor</MenuItem>
                  <MenuItem value={'Gerente'}>Gerente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FreeSoloCreateOptionDialog
                label='Contract Operator'
                placeholder='Contract Operator'
                onChange={handleChange('contop')}
              />
            </Grid>
            <Grid item xs={12}>
              <FreeSoloCreateOptionDialog
                label='Contraturno'
                placeholder='Contraturno'
                onChange={handleChange('opshift')}
              />
            </Grid>
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
                    <DialogContentText sx={{mb:5}}>
                     Ingresa tu contraseña para confirmar
                    </DialogContentText>
                    <TextField
                        label="Contraseña"
                        type="password"
                        onInput={(e)=>setPassword(e.target.value)}
                      />
                  </DialogContent>
                  <DialogActions>
                  <Button onClick={()=>signAdminBack(password)}>
                    Confirmar
                  </Button>
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
