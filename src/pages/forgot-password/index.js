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
                {/* <Box
                component='img'
                sx={{ width: '60%', m: 3,}}
                src='https://raw.githubusercontent.com/carlapazjm/firmaprocure/main/Procure.png'
              /> */}
                {/* <Box sx={{ width: '100%', m: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
              </Box> */}
                <Box sx={{ width: '65%', m: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <svg id='Capa_1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 950.6 349.07'>
                    <rect x='262.35' width='131.58' height='267.11' fill='#92c13d' />
                    <path
                      d='m0,134.98h45.94c27.7,0,45.94,15.9,45.94,42.03v.38c0,28.59-22.09,43.36-48.22,43.36H13.85v46.76H0v-132.53Zm44.18,72.13c20.34,0,33.66-11.74,33.66-29.16v-.38c0-18.93-13.15-28.78-32.96-28.78H13.85v58.31h30.33Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m130.26,134.98h52.78c15.08,0,27.18,4.92,34.89,13.25,5.96,6.44,9.47,15.71,9.47,26.13v.38c0,21.96-14.03,34.84-33.31,38.62l37.7,54.15h-17.01l-35.59-51.5h-35.07v51.5h-13.85v-132.53Zm51.55,67.59c18.41,0,31.56-10.22,31.56-27.26v-.38c0-16.28-11.57-26.13-31.38-26.13h-37.87v53.77h37.7Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m267.47,198.73v-.35c0-33.8,24.43-63.4,60.32-63.4s59.98,29.25,59.98,63.05v.35c0,33.8-24.43,63.4-60.32,63.4s-59.98-29.25-59.98-63.05Zm106.49,0v-.35c0-27.85-19.55-50.62-46.51-50.62s-46.17,22.42-46.17,50.27v.35c0,27.85,19.55,50.62,46.51,50.62s46.17-22.42,46.17-50.27Z'
                      fill={theme.palette.background.paper}
                    />
                    <path
                      d='m426.91,201.62v-.38c0-37.49,25.95-68.54,62.07-68.54,22.27,0,35.59,8.52,47.87,21.02l-9.47,10.98c-10.35-10.6-21.92-18.18-38.57-18.18-27.18,0-47.52,23.85-47.52,54.34v.38c0,30.67,20.51,54.72,47.52,54.72,16.83,0,27.88-7.01,39.63-19.12l9.12,9.66c-12.8,14.01-26.83,23.29-49.09,23.29-35.42,0-61.54-30.1-61.54-68.16Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m572.95,212.03v-77.06h13.85v76.11c0,28.59,14.03,44.68,37.52,44.68s37-14.77,37-43.73v-77.06h13.85v75.92c0,38.62-20.51,58.69-51.2,58.69s-51.02-20.07-51.02-57.56Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m721.09,134.98h52.78c15.08,0,27.18,4.92,34.89,13.25,5.96,6.44,9.47,15.71,9.47,26.13v.38c0,21.96-14.03,34.84-33.31,38.62l37.7,54.15h-17.01l-35.59-51.5h-35.07v51.5h-13.85v-132.53Zm51.55,67.59c18.41,0,31.56-10.22,31.56-27.26v-.38c0-16.28-11.57-26.13-31.38-26.13h-37.87v53.77h37.7Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m861,134.98h88.72v13.63h-74.87v45.25h66.98v13.63h-66.98v46.38h75.74v13.63h-89.6v-132.53Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m.37,343.66l2.36-2.75c3.52,3.13,6.89,4.69,11.56,4.69s7.51-2.37,7.51-5.64v-.1c0-3.08-1.69-4.83-8.76-6.3-7.75-1.66-11.32-4.12-11.32-9.58v-.1c0-5.21,4.67-9.05,11.08-9.05,4.91,0,8.43,1.37,11.85,4.08l-2.22,2.89c-3.13-2.51-6.26-3.6-9.73-3.6-4.38,0-7.18,2.37-7.18,5.36v.09c0,3.13,1.73,4.88,9.15,6.45,7.51,1.61,10.98,4.31,10.98,9.39v.1c0,5.69-4.82,9.39-11.51,9.39-5.35,0-9.73-1.75-13.77-5.31Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m46.79,315.32h24.37v3.41h-20.56v11.33h18.4v3.41h-18.4v11.61h20.81v3.41h-24.61v-33.18Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m92.44,315.32h14.5c4.14,0,7.47,1.23,9.58,3.32,1.64,1.61,2.6,3.93,2.6,6.54v.1c0,5.5-3.85,8.72-9.15,9.67l10.35,13.56h-4.67l-9.78-12.89h-9.63v12.89h-3.8v-33.18Zm14.16,16.92c5.06,0,8.67-2.56,8.67-6.83v-.09c0-4.08-3.18-6.54-8.62-6.54h-10.4v13.46h10.36Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m136.78,315.32h4.24l11.99,28.58,12.04-28.58h4.09l-14.5,33.42h-3.37l-14.5-33.42Z'
                      fill={theme.palette.text.primary}
                    />
                    <path d='m189.51,315.32h3.8v33.18h-3.8v-33.18Z' fill={theme.palette.text.primary} />
                    <path
                      d='m215.08,332v-.1c0-9.39,7.13-17.16,17.05-17.16,6.12,0,9.78,2.13,13.15,5.26l-2.6,2.75c-2.84-2.65-6.02-4.55-10.6-4.55-7.46,0-13.05,5.97-13.05,13.6v.09c0,7.68,5.64,13.7,13.05,13.7,4.62,0,7.66-1.75,10.88-4.79l2.51,2.42c-3.52,3.51-7.37,5.83-13.49,5.83-9.73,0-16.9-7.54-16.9-17.07Z'
                      fill={theme.palette.text.primary}
                    />
                    <path d='m265.83,315.32h3.8v33.18h-3.8v-33.18Z' fill={theme.palette.text.primary} />
                    <path
                      d='m291.4,332v-.1c0-9.15,6.98-17.16,17.24-17.16s17.14,7.92,17.14,17.07v.09c0,9.15-6.98,17.16-17.24,17.16s-17.15-7.92-17.15-17.07Zm30.44,0v-.1c0-7.54-5.59-13.7-13.29-13.7s-13.2,6.07-13.2,13.6v.09c0,7.54,5.59,13.7,13.29,13.7s13.2-6.07,13.2-13.6Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m344.75,343.66l2.36-2.75c3.52,3.13,6.89,4.69,11.56,4.69s7.51-2.37,7.51-5.64v-.1c0-3.08-1.69-4.83-8.76-6.3-7.75-1.66-11.32-4.12-11.32-9.58v-.1c0-5.21,4.67-9.05,11.08-9.05,4.91,0,8.43,1.37,11.85,4.08l-2.22,2.89c-3.13-2.51-6.26-3.6-9.73-3.6-4.38,0-7.18,2.37-7.18,5.36v.09c0,3.13,1.73,4.88,9.15,6.45,7.51,1.61,10.98,4.31,10.98,9.39v.1c0,5.69-4.82,9.39-11.51,9.39-5.35,0-9.73-1.75-13.77-5.31Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m419,315.32h11.7c10.6,0,17.91,7.16,17.91,16.5v.09c0,9.34-7.32,16.59-17.91,16.59h-11.7v-33.18Zm11.7,29.72c8.52,0,13.97-5.69,13.97-13.04v-.1c0-7.35-5.44-13.13-13.97-13.13h-7.9v26.26h7.9Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m470.04,315.32h24.37v3.41h-20.56v11.33h18.4v3.41h-18.4v11.61h20.8v3.41h-24.61v-33.18Z'
                      fill={theme.palette.text.primary}
                    />
                    <path d='m543.86,315.32h3.81v33.18h-3.81v-33.18Z' fill={theme.palette.text.primary} />
                    <path
                      d='m570.92,315.32h3.56l21.24,26.59v-26.59h3.71v33.18h-3.03l-21.77-27.21v27.21h-3.71v-33.18Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m620.85,332v-.1c0-9.1,6.79-17.16,16.9-17.16,5.68,0,9.2,1.61,12.57,4.41l-2.45,2.84c-2.6-2.23-5.49-3.79-10.26-3.79-7.47,0-12.81,6.21-12.81,13.6v.09c0,7.92,5.15,13.79,13.34,13.79,3.85,0,7.42-1.47,9.73-3.32v-8.25h-10.26v-3.37h13.92v13.23c-3.13,2.75-7.85,5.07-13.53,5.07-10.6,0-17.14-7.58-17.14-17.07Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m673.48,315.32h24.37v3.41h-20.56v11.33h18.4v3.41h-18.4v11.61h20.8v3.41h-24.61v-33.18Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m719.13,315.32h3.56l21.24,26.59v-26.59h3.71v33.18h-3.03l-21.77-27.21v27.21h-3.71v-33.18Z'
                      fill={theme.palette.text.primary}
                    />
                    <path d='m770.89,315.32h3.81v33.18h-3.81v-33.18Z' fill={theme.palette.text.primary} />
                    <path
                      d='m797.95,315.32h24.37v3.41h-20.56v11.33h18.4v3.41h-18.4v11.61h20.8v3.41h-24.61v-33.18Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m843.6,315.32h14.5c4.14,0,7.47,1.23,9.59,3.32,1.64,1.61,2.6,3.93,2.6,6.54v.1c0,5.5-3.85,8.72-9.15,9.67l10.36,13.56h-4.67l-9.78-12.89h-9.63v12.89h-3.81v-33.18Zm14.16,16.92c5.06,0,8.67-2.56,8.67-6.83v-.09c0-4.08-3.18-6.54-8.62-6.54h-10.4v13.46h10.35Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m892.14,315.32h3.81v33.18h-3.81v-33.18Zm5.2-9.05l3.8,1.71-5.54,4.41h-3.08l4.82-6.11Z'
                      fill={theme.palette.text.primary}
                    />
                    <path
                      d='m931.67,315.08h3.56l15.36,33.42h-4.09l-3.95-8.77h-18.35l-4,8.77h-3.9l15.36-33.42Zm9.39,21.28l-7.66-16.92-7.71,16.92h15.36Z'
                      fill={theme.palette.text.primary}
                    />
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
