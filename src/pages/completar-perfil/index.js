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
import { CircularProgress } from '@mui/material'

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


const ProfileCompletion = () => {

  const [errorMessage, setErrorMessage] = useState('')
  const [errors, setErrors] = useState({});
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false)

  const [values, setValues] = useState({
    rut: '',
    phone: '',
    opshift: [{ name: '', email: '', phone: '' }]
  });

  // ** Hooks

  const theme = useTheme()
  const { settings } = useSettings()

  // ** Vars
  const { skin } = settings
  const { authUser, updateUserData } = useFirebase()

  const formatPhone = (phone) => {
    // Eliminar cualquier caracter que no sea un número
    let numbers = phone.replace(/[^0-9]/g, '');

    // Asegurarse de que solo toma los primeros 9 dígitos
    numbers = numbers.substring(0, 9);

    // Formatear con espacios
    return `${numbers.slice(0, 1)} ${numbers.slice(1, 5)} ${numbers.slice(5, 9)}`;
  }

  const handleChange = prop => (event, data) => {
    let newValue = event.target.value;

    if (prop === 'phone' && authUser.phone === 'No definido') {
      // Formateo del teléfono
      newValue = formatPhone(newValue);

      // Validación del teléfono (debe tener exactamente 9 dígitos)
      if (newValue.replace(/\s/g, '').length !== 9) {
        setErrors(prevErrors => ({ ...prevErrors, phone: 'El teléfono debe tener 9 dígitos' }));
      } else {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors.phone;

          return newErrors;
        });
      }
    }

  if (prop === 'rut' && authUser.rut === 'No definido') {
    // Formateo del RUT
    newValue = event.target.value.replace(/[^0-9kK]/g, '');
    newValue = `${newValue.length > 7 ? newValue.slice(-9, -7) + '.' : ''}${newValue.length > 4 ? newValue.slice(-7, -4) + '.' : ''}${newValue.length >= 2 ? newValue.slice(-4, -1) + '-' : ''}${newValue[newValue.length - 1] || ''}`;
    newValue = newValue.trim();

    // Validación del RUT
    if (newValue && !/^(\d{1,3}\.){2}\d{3}-[\dkK]$/.test(newValue)) {
      setErrors(prevErrors => ({ ...prevErrors, rut: 'Formato de RUT inválido' }));
    } else {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors.rut;

        return newErrors;
      });
    }
  }

  // Actualizar el valor
  setValues(prevValues => ({ ...prevValues, [prop]: newValue }));
  }

  const onSubmit = async () => {
    event.preventDefault()
    try {
      setIsUploading(true) // Se activa el Spinner

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

      // Actualiza opshift
      let opshiftFormatted
      if (authUser.opshift === 'No definido'){
        opshiftFormatted = values.opshift
      } else {
        opshiftFormatted = authUser.opshift
      }

      // Crear un nuevo objeto con los valores formateados
      const updatedValues = {
        ...values,
        phone: phoneFormatted,
        rut: rutFormatted,
        opshift: opshiftFormatted
        // Asegúrate de incluir opshift si es necesario
      };

      // Actualiza todos los campos en una sola llamada
      await updateUserData(authUser.uid, updatedValues).then(() => {
        return updateUserData(authUser.uid, { completedProfile: true });
      }).then(() => {
        setIsUploading(false)
      }).then(() => {
        console.log('Usuario actualizado con éxito y perfil completado.');
        // Refrescar la página
        window.location.reload();
      })
      .catch((error) => {
        // Manejo de errores
        console.error('Error al actualizar:', error);
      });

    } catch (error) {
      setIsUploading(false),
      console.error('Error al actualizar:', error);
    }
  }

const validateEmail = (email) => {

  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

  return re.test(String(email).toLowerCase());
}

const validatePhone = (phone) => {

  const re = /^[0-9]{9}$/; // Asume que esperas 9 dígitos

  return re.test(phone);
}

  const handleOpshift = (e, index, field) => {
    const newOpshift = values.opshift.map((opshiftItem, i) => {
      if (i === index) {
          let newValue = e.target.value;

          // Aplicar el formateo para el campo de teléfono
          if (field === 'phone') {
              newValue = formatPhone(newValue);

              // Validar si el teléfono tiene 9 dígitos
              if (newValue.replace(/\s/g, '').length !== 9) {
                  setErrors(prevErrors => ({
                      ...prevErrors,
                      [`opshift_${index}_phone`]: 'Teléfono no válido'
                  }));
              } else {
                  setErrors(prevErrors => {
                      const updatedErrors = { ...prevErrors };
                      delete updatedErrors[`opshift_${index}_phone`];

                      return updatedErrors;
                  });
              }
          }

          // Validar email
          if (field === 'email' && !validateEmail(newValue)) {
              setErrors(prevErrors => ({
                  ...prevErrors,
                  [`opshift_${index}_email`]: 'Email no válido'
              }));
          } else if (field === 'email') {
              setErrors(prevErrors => {
                  const updatedErrors = { ...prevErrors };
                  delete updatedErrors[`opshift_${index}_email`];

                  return updatedErrors;
              });
          }

          return { ...opshiftItem, [field]: newValue };
      }

      return opshiftItem;
  });

  setValues({ ...values, opshift: newOpshift });
  };

  useEffect(() => {
    const errorsPresent = Object.keys(errors).length > 0;

    // Verifica si los campos disponibles están vacíos
    const fieldsEmpty = (
      (authUser.rut === 'No definido' && !values.rut) ||
      (authUser.phone === 'No definido' && !values.phone) ||
      (authUser.opshift === 'No definido' && values.opshift.some(op => !op.name || !op.email || !op.phone))
    );

    setIsButtonDisabled(errorsPresent || fieldsEmpty);
  }, [errors, values.rut, values.phone, values.opshift, authUser.rut, authUser.phone, authUser.opshift]);

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
                  error={!!errors.rut}
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
                  error={!!errors.phone}
                  inputProps={{ maxLength: 11 }}
                  InputProps={{ startAdornment: <InputAdornment position='start'>(+56)</InputAdornment> }}
                />
              )}

              {/* Contraturno */}
              {console.log(authUser.opshift)}
              { authUser.opshift === 'No definido' && (
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
                      label='Email del contraturno'
                      placeholder='e-mail del contraturno'
                      onChange={(e) => handleOpshift(e, index, 'email')}
                      value={thisValue.email}
                      error={errors[`opshift_${index}_email`]}
                    />
                    <TextField
                      fullWidth sx={{ mb: 4 }}
                      label='Teléfono del contraturno'
                      type='tel'
                      placeholder='Teléfono del contraturno'
                      onChange={(e) => handleOpshift(e, index, 'phone')}
                      value={thisValue.phone}
                      error={errors[`opshift_${index}_phone`]}
                      inputProps={{ maxLength: 11 }}
                      InputProps={{ startAdornment: <InputAdornment position='start'>(+56)</InputAdornment> }}
                    />
                  </div>
                ))
              )}
              { authUser.opshift === 'No definido' && (
                <Button onClick={() => {
                  setValues(prevValues => ({
                    ...prevValues,
                    opshift: [...prevValues.opshift, { name: '', email: '', phone: '' }]
                  }));
                }}>
                  Agregar Contraturno
                </Button>
              )}
              <Button fullWidth size='large' type='submit' variant='contained' sx={{ mb: 5, my: 5 }} disabled={isButtonDisabled}>
                Actualizar mi perfil
              </Button>
              {isUploading && (
                <Dialog
                  sx={{ '.MuiDialog-paper': { minWidth: '20%' } }}
                  open={isUploading}
                  closeAfterTransition={true}
                  maxWidth={false}
                >
                  <DialogTitle sx={{ mt: 2, textAlign: 'center' }} id='spinner-dialog-title'>
                    Actualizando Perfil
                  </DialogTitle>
                  <DialogContent sx={{ textAlign: 'center' }}>
                    <CircularProgress size={40} />
                  </DialogContent>
                </Dialog>
              )}
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
