// ** React Imports
import { useState } from 'react'

// ** Next Imports
import Link from 'next/link'
import { useRouter } from 'next/router'

// ** MUI Components
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import useMediaQuery from '@mui/material/useMediaQuery'
import OutlinedInput from '@mui/material/OutlinedInput'
import { styled, useTheme } from '@mui/material/styles'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import MuiFormControlLabel from '@mui/material/FormControlLabel'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'
import useBgColor from 'src/@core/hooks/useBgColor'
import { useSettings } from 'src/@core/hooks/useSettings'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Styled Components

const RightWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.down('sm')]: {
    margin: 20
  },
  [theme.breakpoints.up('sm')]: {
    maxWidth: 400
  }
}))

const BoxWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.down('md')]: {
    maxWidth: 400
  }
}))

const TypographyStyled = styled(Typography)(() => ({
  fontWeight: 600,
  textAlign: 'center',
  letterSpacing: '0.18px'
}))

const FormControlLabel = styled(MuiFormControlLabel)(({ theme }) => ({
  '& .MuiFormControlLabel-label': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary
  }
}))

const schema = yup.object().shape({
  email: yup.string().email('Ingresa un mail válido').required('Por favor, ingresa tu correo'),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('Por favor, ingresa tu contraseña')
})

// const defaultValues = {
//   email: 'admin@materialize.com'
// }

const LoginPage = () => {
  const [errorMessage, setErrorMessage] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // ** Hooks

  const theme = useTheme()
  const { settings } = useSettings()

  // ** Vars
  const { skin } = settings
  const { signInWithEmailAndPassword, signGoogle } = useFirebase()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    // defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(schema)
  })

  const onSubmit = data => {
    const { email, password } = data
    signInWithEmailAndPassword(email, password)
      .then(user => {
        // Manejar la respuesta exitosa
        // console.log(user)
      })
      .catch(error => {
        // Manejar el error y mostrar el mensaje al usuario
        const errorMessage = error.message
        setAlertMessage(errorMessage)

        // setErrorMessage(errorMessage)
      })
  }

  const handleSignGoogle = e => {
    e.preventDefault()
    signGoogle()
      .then(token => {
        // Manejar la respuesta exitosa
      })
      .catch(error => {
        console.log(error)
      })
  }

  return (
    <Box className='content-right'>
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
      <RightWrapper sx={{ margin: 'auto' }}>
        <Paper
          elevation={9}
          sx={{
            margin: 'auto',
            p: 7,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'background.paper'
          }}
        >
          <BoxWrapper>
            <Box
              sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
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
              <TypographyStyled
                variant='h7'
                sx={{ m: 2 }}
              >{`¡Bienvenid@ a ${themeConfig.templateName}!`}</TypographyStyled>

              <Box sx={{ m: 2 }}>
                {errorMessage ? (
                  <Alert severity='error' onClose={() => setErrorMessage('')}>
                    <AlertTitle>Error</AlertTitle>
                    {errorMessage}
                  </Alert>
                ) : (
                  <TypographyStyled variant='h7' sx={{ textAlign: 'center' }}>
                    Iniciar sesión
                  </TypographyStyled>
                )}
              </Box>
            </Box>

            <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              <FormControl fullWidth sx={{ mb: 4 }}>
                <Controller
                  name='email'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextField
                      autoFocus
                      label='Email'
                      value={value}
                      onBlur={onBlur}
                      onChange={onChange}
                      error={Boolean(errors.email)}
                    />
                  )}
                />
                {errors.email && <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>}
              </FormControl>
              <FormControl fullWidth>
                <InputLabel htmlFor='auth-login-v2-password' error={Boolean(errors.password)}>
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
                      id='auth-login-v2-password'
                      error={Boolean(errors.password)}
                      type={showPassword ? 'text' : 'password'}
                      endAdornment={
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => setShowPassword(!showPassword)}
                          >
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
              <Box
                sx={{ mb: 4, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}
              >
                <FormControlLabel
                  label='Recordarme'
                  control={<Checkbox checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />}
                />
                <Typography
                  variant='body2'
                  component={Link}
                  href='/forgot-password'
                  sx={{ color: 'primary.main', textDecoration: 'none' }}
                >
                  Olvidaste tu contraseña?
                </Typography>
              </Box>
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
