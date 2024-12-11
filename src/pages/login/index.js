// ** React Imports
import { useState } from 'react'

// ** Next Imports
import Link from 'next/link'

// ** MUI Components
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import MuiFormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import OutlinedInput from '@mui/material/OutlinedInput'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { styled, useTheme } from '@mui/material/styles'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'

// ** Hooks
import { useSettings } from 'src/@core/hooks/useSettings'
import { useFirebase } from 'src/context/useFirebase'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Styled Components

// Styled component RightWrapper: Estiliza el contenedor Box y adapta su diseño dependiendo del tamaño de la pantalla.
const RightWrapper = styled(Box)(({ theme }) => ({
  width: '100%', // Establece el ancho a 100% del contenedor padre.
  [theme.breakpoints.down('sm')]: { // Cuando el tamaño de la pantalla sea pequeño (menor que 'sm' en el theme).
    margin: 20 // Aplica un margen de 20px.
  },
  [theme.breakpoints.up('sm')]: { // Cuando el tamaño de la pantalla sea mayor o igual a 'sm'.
    maxWidth: 400 // Limita el ancho máximo a 400px.
  }
}))

// Styled component BoxWrapper: Estiliza el contenedor Box para tener un ancho máximo ajustado según el tamaño de la pantalla.
const BoxWrapper = styled(Box)(({ theme }) => ({
  width: '100%', // Establece el ancho a 100% del contenedor padre.
  [theme.breakpoints.down('md')]: { // Cuando el tamaño de la pantalla sea menor que 'md' en el theme.
    maxWidth: 400 // Limita el ancho máximo a 400px.
  }
}))

// Styled component TypographyStyled: Personaliza la tipografía para que tenga un estilo particular.
const TypographyStyled = styled(Typography)(() => ({
  fontWeight: 600, // Establece un peso de fuente de 600 (negrita).
  textAlign: 'center', // Centra el texto.
  letterSpacing: '0.18px' // Aplica un espaciado entre letras de 0.18px.
}))

// Styled component FormControlLabel: Personaliza el componente MuiFormControlLabel de Material-UI.
const FormControlLabel = styled(MuiFormControlLabel)(({ theme }) => ({
  '& .MuiFormControlLabel-label': { // Estiliza específicamente la etiqueta dentro de FormControlLabel.
    fontSize: '0.875rem', // Define el tamaño de la fuente de la etiqueta.
    color: theme.palette.text.secondary // Usa el color secundario del texto desde el tema de Material-UI.
  }
}))

// Esquema de validación usando Yup para los campos 'email' y 'password'.
const schema = yup.object().shape({
  email: yup.string().email('Ingresa un mail válido').required('Por favor, ingresa tu correo'), // Valida que el correo sea una cadena, sea un correo válido y sea obligatorio.
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres') // La contraseña debe tener al menos 6 caracteres.
    .required('Por favor, ingresa tu contraseña') // La contraseña es obligatoria.
})


const LoginPage = () => {

  // Estados de React
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // ** Hooks
  const theme = useTheme()
  const { settings } = useSettings()

  // ** Vars
  const { signInWithEmailAndPassword, signGoogle } = useFirebase()
  const { control, handleSubmit, formState: { errors } } = useForm({ mode: 'onBlur', resolver: yupResolver(schema) })

  // Función onSubmit.
  // Se ejecuta cuando el usuario hace click en 'Entrar'.
  const onSubmit = async data => {
    const { email, password } = data
    try {
      await signInWithEmailAndPassword(email, password, rememberMe)
    } catch (error) {
      const errorMessage = error.message
      setAlertMessage(errorMessage)
    }
  }

  // Función para manejar el login con Google SSO.
  // const handleSignGoogle = e => {
  //   e.preventDefault()
  //   signGoogle()
  //     .then(token => {
  //       // Manejar la respuesta exitosa
  //     })
  //     .catch(error => {
  //       console.log(error)
  //     })
  // }

  // Se retorna de forma gráfica.
  return (
    <Box className='content-right'>

      {/* Dialog de Errores */}
      <Dialog sx={{ '.MuiDialog-paper': { minWidth: '20%' } }} open={!!alertMessage} maxWidth={false}>
        <DialogTitle sx={{ ml: 2, mt: 4 }} id='alert-dialog-title'>
          Atención
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ m: 2, whiteSpace: 'pre-line' }} id='alert-dialog-description'>
            {alertMessage}
          </DialogContentText>
          <DialogActions>
            <Button size='small'onClick={() => {setAlertMessage('')}}>
              Cerrar
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      {/* Contenedor de elementos en el centro de la página de login */}
      <RightWrapper sx={{ margin: 'auto' }}>
        <Paper elevation={9} sx={{margin: 'auto', p: 7, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'background.paper'}}>
          <BoxWrapper>

            {/* Contenedor de parte de arriba: Logo y Mensaje de Bienvenida */}
            <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

              {/* Logo de la empresa */}
              <Box sx={{ width: '65%', m: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg id='Capa_1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 446'>
                  <rect x='417.1' y='29.94' fill='#92c13d' width='173.39' height='346.78' />
                  <path
                    fill={theme.palette.text.primary}
                    d='m114.59,221.05h57.12c33.74,0,55.05,19.25,55.05,48.43v.42c0,32.49-26.08,49.46-57.95,49.46h-28.77v46.57h-25.46v-144.87Zm55.05,75.34c19.25,0,31.25-10.76,31.25-25.87v-.41c0-16.97-12.21-25.87-31.25-25.87h-29.59v52.16h29.59Z'
                  />
                  <path
                    fill={theme.palette.text.primary}
                    d='m268.35,221.05h64.57c18.21,0,32.49,5.38,41.81,14.49,7.66,7.87,12,18.63,12,31.25v.42c0,23.8-14.28,38.08-34.56,43.87l39.12,54.85h-30.01l-35.6-50.5h-31.87v50.5h-25.46v-144.87Zm62.71,71.82c18.21,0,29.8-9.52,29.8-24.21v-.41c0-15.52-11.18-24.01-30.01-24.01h-37.05v48.63h37.25Z'
                  />
                  <path
                    fill={theme.palette.background.paper}
                    d='m427.08,293.9v-.41c0-40.77,31.46-74.92,75.96-74.92s75.54,33.73,75.54,74.51v.42c0,40.77-31.46,74.92-75.96,74.92s-75.54-33.74-75.54-74.51Zm124.8,0v-.41c0-28.15-20.49-51.54-49.26-51.54s-48.84,22.97-48.84,51.12v.42c0,28.15,20.49,51.53,49.26,51.53s48.84-22.97,48.84-51.12Z'
                  />
                  <path
                    fill={theme.palette.text.primary}
                    d='m614.16,344.82l15.32-18.21c13.87,12,27.73,18.83,45.74,18.83,15.73,0,25.66-7.24,25.66-18.21v-.41c0-10.35-5.8-15.94-32.7-22.15-30.84-7.45-48.22-16.56-48.22-43.25v-.42c0-24.84,20.7-42.01,49.46-42.01,21.11,0,37.87,6.42,52.57,18.21l-13.66,19.25c-13.04-9.73-26.08-14.9-39.32-14.9-14.9,0-23.59,7.66-23.59,17.18v.41c0,11.18,6.62,16.14,34.35,22.77,30.63,7.45,46.57,18.42,46.57,42.43v.42c0,27.11-21.32,43.25-51.74,43.25-22.15,0-43.05-7.66-60.43-23.18Z'
                  />
                  <path fill={theme.palette.text.primary} d='m773.31,221.05h25.46v144.87h-25.46v-144.87Z' />
                  <path
                    fill={theme.palette.text.primary}
                    d='m888.58,244.64h-45.95v-23.59h117.56v23.59h-45.94v121.28h-25.66v-121.28Z'
                  />
                  <path
                    fill={theme.palette.text.primary}
                    d='m1002.61,221.05h107.41v22.77h-81.96v37.67h72.64v22.76h-72.64v38.91h82.99v22.77h-108.45v-144.87Z'
                  />
                </svg>
              </Box>

              {/* Mensaje de bienvenida */}
              <TypographyStyled variant='h7'sx={{ m: 2 }}>
                {`¡Bienvenid@ a ${themeConfig.templateName}!`}
              </TypographyStyled>

            </Box>

            {/* Formulario de parámetros de Login: e-mail y Contraseña */}
            <form noValidate onSubmit={handleSubmit(onSubmit)}>

              {/* e-mail de usuario */}
              <FormControl fullWidth sx={{ mb: 4 }}>
                <Controller
                  name='email'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextField
                      label='e-mail'
                      value={value ? value : ''}
                      onBlur={onBlur}
                      onChange={onChange}
                      error={Boolean(errors.email)}
                      autoComplete='username'
                    />
                  )}
                />
                {errors.email && <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>}
              </FormControl>

              {/* Contraseña */}
              <FormControl fullWidth>
                <InputLabel htmlFor='password' error={Boolean(errors.password)}>
                  Contraseña
                </InputLabel>
                <Controller
                  name='password'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, onBlur } }) => (
                    <OutlinedInput
                      onBlur={onBlur}
                      label='Password'
                      onChange={onChange}
                      id='password'
                      error={Boolean(errors.password)}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete='current-password'
                      endAdornment={
                        <InputAdornment position='end'>
                          <IconButton edge='end' onMouseDown={e => e.preventDefault()} onClick={() => setShowPassword(!showPassword)}>
                            <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} fontSize={20} />
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  )}
                />
                {errors.password && (
                  <FormHelperText sx={{ color: 'error.main' }} id=''>
                    {errors.password.message}
                  </FormHelperText>
                )}
              </FormControl>

              {/* Contenedor de Recordarme y ¿Olvidaste tu Contraseña? */}
              <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>

                {/* Checkbox 'Recordarme' */}
                <FormControlLabel
                  label='Recordarme'
                  control={<Checkbox checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}/>}
                />

                {/* Link '¿Olvidaste tu contraseña?' */}
                <Typography
                  variant='body2'
                  component={Link}
                  href='/forgot-password'
                  sx={{ color: 'primary.main', textDecoration: 'none' }}
                >
                  ¿Olvidaste tu contraseña?
                </Typography>

              </Box>

              {/* Botón 'Entrar' */}
              <Button fullWidth size='large' type='submit' variant='contained' sx={{ mb: 5 }}>
                Entrar
              </Button>

              {/* <Button fullWidth size='large' onClick={(e) => handleSignGoogle(e)} variant='contained' sx={{ mb:3}}>
                Entrar con Google
              </Button>
              <Typography variant='body1' fontSize={12} align='center'>Solo disponible para usuarios registrados Procure</Typography> */}
            </form>
          </BoxWrapper>
        </Paper>
      </RightWrapper>
    </Box>
  )
}

LoginPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
LoginPage.guestGuard = true

export default LoginPage
