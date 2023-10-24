// ** React Imports
import { useState, useEffect } from 'react'

// ** Next Import
import Link from 'next/link'

import toast from 'react-hot-toast'

// ** MUI Components
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import FormHelperText from '@mui/material/FormHelperText'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'
import { useSettings } from 'src/@core/hooks/useSettings'

// ** Demo Imports
import FooterIllustrationsV2 from 'src/views/pages/auth/FooterIllustrationsV2'

// Styled Components

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

const TypographyStyled = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  letterSpacing: '0.18px',
  marginBottom: theme.spacing(1.5),
  [theme.breakpoints.down('md')]: { marginTop: theme.spacing(8) }
}))

const LinkStyled = styled(Link)(({ theme }) => ({
  display: 'flex',
  '& svg': { mr: 1.5 },
  alignItems: 'center',
  textDecoration: 'none',
  justifyContent: 'center',
  color: theme.palette.primary.main
}))

const ForgotPassword = () => {
  // ** Hooks
  const theme = useTheme()
  const { settings } = useSettings()

  // ** Vars
  const { skin } = settings
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const { resetPassword } = useFirebase()
  const [helperText, setHelperText] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [email, setEmail] = useState('')
  const [alertMessage, setAlertMessage] = useState('')

  const handleEmailChange = event => {
    const updatedEmail = event.target.value
    setEmail(updatedEmail)
    if (/^\S+@\S+\.\S+$/.test(updatedEmail) && helperText) {
      setHelperText('')
    }
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!email || email.trim() === '') {
      setHelperText('Por favor, ingresa tu correo.')

      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setHelperText('Por favor, ingresa un e-mail válido')

      return
    }

    await resetPassword(email)
      .then(user => {
        // Manejar la respuesta exitosa
        setAlertMessage('Se ha enviado un correo con indicaciones para cambiar tu contraseña')
      })
      .catch(error => {
        // Manejar el error y mostrar el mensaje al usuario
        const errorMessage = error.message
        setAlertMessage(errorMessage)
      })
  }

  const imageSource =
    skin === 'bordered' ? 'auth-v2-forgot-password-illustration-bordered' : 'auth-v2-forgot-password-illustration'

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
            <Box sx={{ mb: 6 }}>
              <Box
                sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <Box sx={{ width: '65%', m: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg id="Capa_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 446">
                <rect  x="417.1" y="29.94" fill="#92c13d" width="173.39" height="346.78"/>
                <path fill={theme.palette.text.primary} d="m114.59,221.05h57.12c33.74,0,55.05,19.25,55.05,48.43v.42c0,32.49-26.08,49.46-57.95,49.46h-28.77v46.57h-25.46v-144.87Zm55.05,75.34c19.25,0,31.25-10.76,31.25-25.87v-.41c0-16.97-12.21-25.87-31.25-25.87h-29.59v52.16h29.59Z"/>
                <path fill={theme.palette.text.primary} d="m268.35,221.05h64.57c18.21,0,32.49,5.38,41.81,14.49,7.66,7.87,12,18.63,12,31.25v.42c0,23.8-14.28,38.08-34.56,43.87l39.12,54.85h-30.01l-35.6-50.5h-31.87v50.5h-25.46v-144.87Zm62.71,71.82c18.21,0,29.8-9.52,29.8-24.21v-.41c0-15.52-11.18-24.01-30.01-24.01h-37.05v48.63h37.25Z"/>
                <path fill={theme.palette.background.paper} d="m427.08,293.9v-.41c0-40.77,31.46-74.92,75.96-74.92s75.54,33.73,75.54,74.51v.42c0,40.77-31.46,74.92-75.96,74.92s-75.54-33.74-75.54-74.51Zm124.8,0v-.41c0-28.15-20.49-51.54-49.26-51.54s-48.84,22.97-48.84,51.12v.42c0,28.15,20.49,51.53,49.26,51.53s48.84-22.97,48.84-51.12Z"/>
                <path fill={theme.palette.text.primary} d="m614.16,344.82l15.32-18.21c13.87,12,27.73,18.83,45.74,18.83,15.73,0,25.66-7.24,25.66-18.21v-.41c0-10.35-5.8-15.94-32.7-22.15-30.84-7.45-48.22-16.56-48.22-43.25v-.42c0-24.84,20.7-42.01,49.46-42.01,21.11,0,37.87,6.42,52.57,18.21l-13.66,19.25c-13.04-9.73-26.08-14.9-39.32-14.9-14.9,0-23.59,7.66-23.59,17.18v.41c0,11.18,6.62,16.14,34.35,22.77,30.63,7.45,46.57,18.42,46.57,42.43v.42c0,27.11-21.32,43.25-51.74,43.25-22.15,0-43.05-7.66-60.43-23.18Z"/>
                <path fill={theme.palette.text.primary} d="m773.31,221.05h25.46v144.87h-25.46v-144.87Z"/>
                <path fill={theme.palette.text.primary} d="m888.58,244.64h-45.95v-23.59h117.56v23.59h-45.94v121.28h-25.66v-121.28Z"/>
                <path fill={theme.palette.text.primary} d="m1002.61,221.05h107.41v22.77h-81.96v37.67h72.64v22.76h-72.64v38.91h82.99v22.77h-108.45v-144.87Z"/>
              </svg>
              
                </Box>
                <TypographyStyled sx={{ mt: 5, mb: 5 }} variant='h7'>
                  ¿Olvidaste tu contraseña? 🔒
                </TypographyStyled>
              </Box>
              {errorMessage ? (
                <Alert severity='error' onClose={() => setErrorMessage('')}>
                  <AlertTitle>Error</AlertTitle>
                  {errorMessage}
                </Alert>
              ) : (
                <Typography variant='body2' sx={{ textAlign: 'center' }}>
                  Ingresa tu mail y recibirás un correo para reestablecerla.
                </Typography>
              )}
            </Box>

            <form noValidate autoComplete='off' onSubmit={handleSubmit}>
              <TextField
                error={helperText !== ''}
                autoFocus
                type='email'
                id='email'
                name='email'
                value={email}
                onChange={handleEmailChange}
                label='Email'
                sx={{ display: 'flex', mb: 4 }}
              />
              {helperText && <FormHelperText sx={{ color: 'error.main' }}>{helperText}</FormHelperText>}
              <Button fullWidth size='large' type='submit' variant='contained' sx={{ mt: 5.25, mb: 5.25 }}>
                Reestablecer contraseña
              </Button>
              <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LinkStyled href='/login/'>
                  <Icon icon='mdi:chevron-left' fontSize='2rem' />
                  <span>Volver</span>
                </LinkStyled>
              </Typography>
            </form>
          </BoxWrapper>
        </Paper>
      </RightWrapper>
    </Box>
  )
}

ForgotPassword.guestGuard = true
ForgotPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default ForgotPassword
