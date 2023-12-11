// ** React Imports
import { useState, useEffect } from 'react'

// ** Next Imports
import Link from 'next/link'
import { useRouter } from 'next/router'

// ** MUI Components
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import MuiFormControlLabel from '@mui/material/FormControlLabel'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'

// ** Third Party Imports
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'
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

// const schema = yup.object().shape({
//   email: yup.string().email('Ingresa un mail válido').required('Por favor, ingresa tu correo'),
//   password: yup
//     .string()
//     .min(6, 'La contraseña debe tener al menos 6 caracteres')
//     .required('Por favor, ingresa tu contraseña')
// })

const ProfileCompletion = () => {

  const initialOpshift = {
    name: '',
    email: '',
    phone: ''
  };

  const [errorMessage, setErrorMessage] = useState('')
  const [alertMessage, setAlertMessage] = useState('')

  const [values, setValues] = useState({
    rut: '',
    phone: '',
    opshift: [{ name: '', email: '', phone: '' }]
  });

  // const { control, handleSubmit, formState: { errors } } = useForm({
  //   resolver: yupResolver(schema),
  //   mode: 'onBlur'
  // });


  // ** Hooks

  const theme = useTheme()
  const { settings } = useSettings()

  // ** Vars
  const { skin } = settings
  const { authUser, updateUserData } = useFirebase()

  // useEffect(() => {
  //   let formattedPhone = '';
  //   let formattedRut = '';

  //   // Formatear el teléfono
  //   if (authUser.phone && authUser.phone !== '') {
  //     formattedPhone = authUser.phone.replace(/\s/g, '');
  //     formattedPhone = `${formattedPhone[0] || ''} ${formattedPhone.slice(1, 5) || ''} ${formattedPhone.slice(5, 10) || ''}`;
  //     formattedPhone = formattedPhone.trim();
  //   }

  //   // Formatear el RUT
  //   if (authUser.rut && authUser.rut !== '') {
  //     formattedRut = authUser.rut.replace(/[^0-9kK]/g, '');
  //     formattedRut = `${formattedRut.length > 7 ? formattedRut.slice(-9, -7) + '.' : ''}${formattedRut.length > 4 ? formattedRut.slice(-7, -4) + '.' : ''}${
  //         formattedRut.length >= 2 ? formattedRut.slice(-4, -1) + '-' : ''
  //     }${formattedRut[formattedRut.length - 1] || ''}`;
  //     formattedRut = formattedRut.trim();
  //   }

  //   setValues(prevValues => ({
  //     ...prevValues,
  //     phone: formattedPhone,
  //     rut: formattedRut
  //   }));

  // }, [authUser.rut, authUser.phone]);

  const handleChange = prop => (event, data) => {
    let newValue
    switch (prop) {
      case 'phone':
        newValue = event.target.value.replace(/[^0-9]/g, '')
        newValue = `${newValue[0] || ''} ${newValue.slice(1, 5) || ''} ${newValue.slice(5, 10) || ''}`
        newValue = newValue.trim()
        break
      case 'rut':
        // Eliminar cualquier caracter que no sea un número o letra k
        let cv = event.target.value.replace(/[^0-9kK]/g, '')

        // Formatea RUT
        newValue = `${cv.length > 7 ? cv.slice(-9, -7) + '.' : ''}${cv.length > 4 ? cv.slice(-7, -4) + '.' : ''}${
          cv.length >= 2 ? cv.slice(-4, -1) + '-' : ''
        }${cv[cv.length - 1] || ''}`
        newValue = newValue.trim()
        break

      default:
        newValue = event.target.value
        break
    }

    setValues(prevValues => ({ ...prevValues, [prop]: newValue }))
  }

  const onSubmit = async () => {
    event.preventDefault()
    try {
      // Eliminar espacios del teléfono
      let phoneFormatted
      if (authUser.phone === 'No definido'){
        phoneFormatted = values.phone.replace(/\s/g, '');
      } else {
        phoneFormatted = authUser.phone
      }

      // Eliminar puntos y guión del RUT
      let rutFormatted
      if (authUser.rut === 'No definido'){
        rutFormatted = values.rut.replace(/[\.\-]/g, '');
      } else {
        rutFormatted = authUser.rut
      }

      // Crear un nuevo objeto con los valores formateados
      const updatedValues = {
        ...values,
        phone: phoneFormatted,
        rut: rutFormatted,
        // Asegúrate de incluir opshift si es necesario
      };

      // Actualiza todos los campos en una sola llamada
      await updateUserData(authUser.uid, updatedValues).then(() => {
        return updateUserData(authUser.uid, { completedProfile: true });
      }).then(() => {
        console.log('Usuario actualizado con éxito y perfil completado.');
      })
      .catch((error) => {
        // Manejo de errores
        console.error('Error al actualizar:', error);
      });

    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  }



  // const addOpshift = () => {
  //   setValues({
  //     ...values,
  //     opshift: [...values.opshift, initialOpshift]
  //   });
  // };

  const handleOpshift = (e, index, field) => {
    const newOpshift = values.opshift.map((opshiftNumber, i) => {
      if (i === index) {
        return { ...opshiftNumber, [field]: e.target.value }
      }

      return opshiftNumber
    });



    setValues({ ...values, opshift: newOpshift })
  };

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
              <TypographyStyled
                variant='h7'
                sx={{ m: 2 }}
              >{`Estimado ${authUser.displayName} ¡Bienvenid@ a ${themeConfig.templateName}! Antes de poder ingresar deberá completar la información faltante.`}</TypographyStyled>

              <Box sx={{ m: 2 }}>
                {errorMessage ? (
                  <Alert severity='error' onClose={() => setErrorMessage('')}>
                    <AlertTitle>Error</AlertTitle>
                    {errorMessage}
                  </Alert>
                ):''}
              </Box>
            </Box>

            <form onSubmit={onSubmit}>
              {/* RUT */}
              { authUser.rut === 'No definido' && (
                <TextField
                  fullWidth sx={{ mb: 4 }}
                  type='tel'
                  label='RUT'
                  placeholder='RUT'
                  onChange={handleChange('rut')}
                  value={values.rut}
                  inputProps={{ maxLength: 12 }}
                />
              )}

              {/* Teléfono */}
              { authUser.phone === 'No definido' && (
                <TextField
                  fullWidth sx={{ mb: 4 }}
                  label='Teléfono'
                  type='tel'
                  placeholder='Teléfono'
                  onChange={handleChange('phone')}
                  value={values.phone}
                  inputProps={{ maxLength: 11 }}
                  InputProps={{ startAdornment: <InputAdornment position='start'>(+56)</InputAdornment> }}
                />
              )}

              {/* Contraturno */}
              {
                values.opshift.map((thisValue, index) => (
                  <div key={index}>
                    <Typography variant="subtitle1" gutterBottom>
                      Contraturno {index + 1}
                    </Typography>
                    <TextField
                      fullWidth sx={{ mb: 4 }}
                      label="Nombre del Contraturno"
                      value={thisValue.name}
                      onChange={(e) => handleOpshift(e, index, 'name')}
                    />
                    <TextField
                      fullWidth sx={{ mb: 4 }}
                      label="Email del Contraturno"
                      value={thisValue.email}
                      onChange={(e) => handleOpshift(e, index, 'email')}
                    />
                    <TextField
                      fullWidth sx={{ mb: 4 }}
                      label="Teléfono del Contraturno"
                      value={thisValue.phone}
                      onChange={(e) => handleOpshift(e, index, 'phone')}
                      inputProps={{ maxLength: 9 }}
                      InputProps={{ startAdornment: <InputAdornment position='start'>(+56)</InputAdornment> }}
                    />
                  </div>
                ))
              }
              <Button onClick={() => {
                setValues(prevValues => ({
                  ...prevValues,
                  opshift: [...prevValues.opshift, { name: '', email: '', phone: '' }]
                }));
              }}>
                Agregar Contraturno
              </Button>
              <Button fullWidth size='large' type='submit' variant='contained' sx={{ mb: 5, my: 5 }}>
                Actualizar mi perfil
              </Button>
            </form>
          </BoxWrapper>
        </Paper>
      </RightWrapper>
    </Box>
  )
}

ProfileCompletion.getLayout = page => <BlankLayout>{page}</BlankLayout>
ProfileCompletion.guestGuard = false

export default ProfileCompletion
