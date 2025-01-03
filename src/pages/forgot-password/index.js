// ** React Imports
import { useState } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Components
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import FormHelperText from '@mui/material/FormHelperText'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

// ** Logo Procure
import LogoProcure from 'src/images/logoProcure'

// Styled Components

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

// Styled component LinkStyled: Personaliza un link, para que tenga un estilo particular.
const LinkStyled = styled(Link)(({ theme }) => ({
  display: 'flex', // Configuración del display como flex, lo que permite usar propiedades de alineación de los elementos hijos.
  '& svg': { mr: 1.5 }, // Cuando el componente Link contiene un ícono en forma de SVG, aplica margen derecho (mr) de 1.5 unidades.
  alignItems: 'center', // Alineación vertical de los elementos dentro del contenedor usando 'center' para centrar.
  textDecoration: 'none', // Eliminar la decoración de texto (subrayado) que es el comportamiento por defecto de los enlaces.
  justifyContent: 'center', // Asegura que los elementos hijos se alineen de manera centrada en el contenedor horizontalmente.
  color: theme.palette.primary.main
}));

const ForgotPassword = () => {
  // ** Hooks
  const theme = useTheme()

  // ** Vars
  const { resetPassword } = useFirebase()
  const [helperText, setHelperText] = useState('')
  const [email, setEmail] = useState('')
  const [alertMessage, setAlertMessage] = useState('')

  // Función para manejar el cambio del campo e-mail.
  const handleEmailChange = event => {
    const updatedEmail = event.target.value
    setEmail(updatedEmail)
    if (/^\S+@\S+\.\S+$/.test(updatedEmail) && helperText) {
      setHelperText('')
    }
  }

  // Función para manejar el envío del Formulario.
  const handleSubmit = async e => {
    e.preventDefault()

    // Primero se valida que el campo e-mail sea no vacío.
    if (!email || email.trim() === '') {
      setHelperText('Por favor, ingresa tu correo.')

      return
    }

    // Luego se valida que el valor de e-mail cumpla con el formato requerido.
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setHelperText('Por favor, ingresa un e-mail válido')

      return
    }

    // Luego se ejecuta el cambio de e-mail
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
            <Button size='small' onClick={() => {setAlertMessage('')}}>
              Cerrar
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      {/* Contenedor de elementos en el centro de la página */}
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

            {/* Contenedor de parte de arriba: Logo y Mensaje de Bienvenida */}
            <Box sx={{ mb: 6 }}>
              <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                {/* Logo de la empresa */}
                <Box sx={{ width: '65%', m: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <LogoProcure sx={{ width: '100%', height: 'auto' }} theme={theme}/>
                </Box>

                {/* Título */}
                <TypographyStyled sx={{ mt: 5, mb: 5 }} variant='h7'>
                  ¿Olvidaste tu contraseña? 🔒
                </TypographyStyled>
              </Box>

              {/* Mensaje explicatorio */}
              <Typography variant='body2' sx={{ textAlign: 'center' }}>
                  Ingresa tu mail y recibirás un correo para reestablecerla.
                </Typography>
            </Box>

            {/* Formulario de parámetros de Login: e-mail y Contraseña */}
            <form noValidate autoComplete='off' onSubmit={handleSubmit}>

              {/* e-mail de usuario */}
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

              {/* Botón para reestablecer contraseña */}
              <Button fullWidth size='large' type='submit' variant='contained' sx={{ mt: 5.25, mb: 5.25 }}>
                Reestablecer contraseña
              </Button>

              {/* Link para volver a la página de Login */}
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
