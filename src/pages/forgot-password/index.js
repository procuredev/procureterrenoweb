// ** React Imports
import { useState, useEffect } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Components
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

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

  const [email, setEmail] = useState('')

  const handleEmailChange = event => {
    setEmail(event.target.value)
  }

  const handleSubmit = e => {
    e.preventDefault()

    try {
      resetPassword(email)
      alert('Revisa el link que enviamos a tu correo para actualizar la contraseña')
    } catch (error) {
      alert(error.message)
    }
  }

  const imageSource =
    skin === 'bordered' ? 'auth-v2-forgot-password-illustration-bordered' : 'auth-v2-forgot-password-illustration'

  return (
    <Box className='content-right'>

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
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box component='img' sx={{ width: '60%' }} src='https://raw.githubusercontent.com/carlapazjm/firmaprocure/main/Procure.png' />
          <TypographyStyled sx={{ mt: 5, mb: 5 }} variant='h7'>¿Olvidaste tu contraseña? 🔒</TypographyStyled>
        </Box>
        <Typography variant='body2'>Ingresa tu mail y recibirás un correo para reestablecerla.</Typography>
      </Box>

            <form noValidate autoComplete='off' onSubmit={handleSubmit}>
              <TextField
                autoFocus
                type='email'
                id='email'
                name='email'
                value={email}
                onChange={handleEmailChange}
                label='Email'
                sx={{ display: 'flex', mb: 4 }}
              />
              <Button fullWidth size='large' type='submit' variant='contained' sx={{ mb: 5.25 }}>
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

