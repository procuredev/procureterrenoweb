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
import { useFirebase } from 'src/context/useFirebaseAuth'
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

    await resetPassword(email).then(user => {
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
            <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              {/* <Box
                component='img'
                sx={{ width: '60%', m: 3,}}
                src='https://raw.githubusercontent.com/carlapazjm/firmaprocure/main/Procure.png'
              /> */}
              <Box sx={{ width: '100%', m: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg width='222' height='75' viewBox="0 0 222 75" xmlns='http://www.w3.org/2000/svg'>
                  <defs>
                    <mask id='maskO'>
                      <rect x='0' y='0' width='100%' height='100%' fill={theme.palette.primary.contrastText} />
                      <text x='65' y='59' fontSize='36' fontFamily='Arial' fill={theme.palette.text}>
                        O
                      </text>
                    </mask>
                  </defs>
                  <rect x='0' y='0' width='100%' height='100%' fill={theme.palette.background.paper} />
                  <text x='0' y='60' fontSize='36' fontFamily='Arial' fill={theme.palette.text.primary}>
                    P
                  </text>
                  <text x='35' y='60' fontSize='36' fontFamily='Arial' fill={theme.palette.text.primary}>
                    R
                  </text>
                  <rect x='64' y='0' width='30' height='60' fill='rgb(146, 193, 61)' mask='url(#maskO)' />
                  <text x='95' y='60' fontSize='36' fontFamily='Arial' fill={theme.palette.text.primary}>
                    C
                  </text>
                  <text x='130' y='60' fontSize='36' fontFamily='Arial' fill={theme.palette.text.primary}>
                    U
                  </text>
                  <text x='165' y='60' fontSize='36' fontFamily='Arial' fill={theme.palette.text.primary}>
                    R
                  </text>
                  <text x='200' y='60' fontSize='36' fontFamily='Arial' fill={theme.palette.text.primary}>
                    E
                  </text>
                  <text
                    x='0'
                    y='75'
                    fontSize='11'
                    fontFamily='Arial'
                    textLength='222'
                    lengthAdjust='spacingAndGlyphs'
                    fill={theme.palette.text.primary}
                  >
                    S E R V I C I O S&#xA0;&#xA0;&#xA0;D E&#xA0;&#xA0;&#xA0;I N G E N I E R Í A
                  </text>
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
