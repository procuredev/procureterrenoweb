// ** React Imports
import { useState, useEffect } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Components
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
const ForgotPasswordIllustrationWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(20),
  paddingRight: '0 !important',
  [theme.breakpoints.down('lg')]: {
    padding: theme.spacing(10)
  }
}))

const ForgotPasswordIllustration = styled('img')(({ theme }) => ({
  maxWidth: '48rem',
  [theme.breakpoints.down('xl')]: {
    maxWidth: '38rem'
  },
  [theme.breakpoints.down('lg')]: {
    maxWidth: '30rem'
  }
}))

const RightWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.up('md')]: {
    maxWidth: 400
  },
  [theme.breakpoints.up('lg')]: {
    maxWidth: 450
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

  const handleSubmit = async e => {
    e.preventDefault()

    resetPassword(email)
  }

  const imageSource =
    skin === 'bordered' ? 'auth-v2-forgot-password-illustration-bordered' : 'auth-v2-forgot-password-illustration'

  return (
    <Box className='content-right'>
      {!hidden ? (
        <Box sx={{ flex: 1, display: 'flex', position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <ForgotPasswordIllustrationWrapper>
            <ForgotPasswordIllustration
              alt='forgot-password-illustration'
              src={`/images/pages/${imageSource}-${theme.palette.mode}.png`}
            />
          </ForgotPasswordIllustrationWrapper>
          <FooterIllustrationsV2 image={`/images/pages/auth-v2-forgot-password-mask-${theme.palette.mode}.png`} />
        </Box>
      ) : null}
      <RightWrapper sx={skin === 'bordered' && !hidden ? { borderLeft: `1px solid ${theme.palette.divider}` } : {}}>
        <Box
          sx={{
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
              sx={{
                top: 30,
                left: 40,
                display: 'flex',
                position: 'absolute',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg
                id='Capa_1'
                data-name='Capa 1'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                width={50}
                height={50}
                viewBox='0 0 448.95 612.43'
              >
                <path
                  N='cls-1'
                  fill='#92c13f'
                  d='M-418.18,727.32h-448.5v-612c1.3-.7,2.7-.36,4-.36q220.13,0,440.23,0a11.85,11.85,0,0,1,4.1.26c.91,1.22.48,2.64.48,4q0,302.22,0,604.46C-417.82,724.86-417.51,726.15-418.18,727.32Z'
                  transform='translate(866.68 -114.89)'
                />
                <path
                  N='cls-2'
                  fill='#ffffff'
                  d='M-487.16,538.48c-.28,26.09-4.23,54.33-16.72,80.82C-522.6,659-554.13,684-595.61,696.07c-45.93,13.35-90.43,9-131.83-16.05-32.79-19.86-53.57-49.36-63.87-85.9-14.57-51.72-11.23-102.6,13.15-150.66,22.44-44.26,59.41-69.91,108.87-76.52,31.74-4.24,62.71-1.49,92.21,12,36.11,16.52,61.07,43.58,75.89,80.27C-491.28,483.73-487.17,509.29-487.16,538.48Z'
                  transform='translate(866.68 -114.89)'
                />
                <path
                  N='cls-1'
                  fill='#92c13f'
                  d='M-531.88,524.81c0,35.47-3.93,60.57-15.86,83.86-15,29.29-37.69,49.15-70.7,55.16-30,5.46-59.08,3.07-85.23-14.23-24.54-16.23-39.65-39.62-46.26-67.94-9.62-41.18-7.47-81.94,10-120.83,16.24-36.2,45.62-54.48,84.68-57.93,19.67-1.74,38.91,0,57.14,8.09,28.16,12.45,45.66,34.67,56.33,62.84C-534.43,493.32-531.83,513.66-531.88,524.81Z'
                  transform='translate(866.68 -114.89)'
                />
              </svg>
              <Typography variant='h6' sx={{ ml: 2, lineHeight: 1, fontWeight: 700, fontSize: '1.5rem !important' }}>
                {themeConfig.templateName}
              </Typography>
            </Box>
            <Box sx={{ mb: 6 }}>
              <TypographyStyled variant='h5'>Forgot Password? 🔒</TypographyStyled>
              <Typography variant='body2'>
                Enter your email and we&prime;ll send you instructions to reset your password
              </Typography>
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
                Send reset link
              </Button>
              <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LinkStyled href='/login/'>
                  <Icon icon='mdi:chevron-left' fontSize='2rem' />
                  <span>Back to login</span>
                </LinkStyled>
              </Typography>
            </form>
          </BoxWrapper>
        </Box>
      </RightWrapper>
    </Box>
  )
}
ForgotPassword.guestGuard = true
ForgotPassword.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default ForgotPassword
