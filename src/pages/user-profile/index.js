// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import Select from '@mui/material/Select'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Divider from '@mui/material/Divider'
import { styled } from '@mui/material/styles'
import Checkbox from '@mui/material/Checkbox'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'
import CardHeader from '@mui/material/CardHeader'
import FormControl from '@mui/material/FormControl'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Avatar from 'src/@core/components/mui/avatar'


// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Hooks Imports
import { useFirebase } from 'src/context/useFirebaseAuth';

const ImgStyled = styled('img')(({ theme }) => ({
  width: 120,
  height: 120,
  marginRight: theme.spacing(5),
  borderRadius: theme.shape.borderRadius,
}));

const ButtonStyled = styled(Button)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    textAlign: 'center',
  },
}));

const ResetButtonStyled = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(0),
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    marginLeft: 0,
    textAlign: 'center',
    marginTop: theme.spacing(4),
  },
}));

const TabAccount = () => {
  // ** Hooks
  const { authUser, updateUserProfile, updateUserPhone } = useFirebase();

  // ** State
  const [inputValue, setInputValue] = useState('')
  const [formData, setFormData] = useState(authUser.phone === 'No definido' ? '' : `${authUser.phone[0] || ''} ${authUser.phone.slice(1, 5) || ''} ${authUser.phone.slice(5, 9) || ''}`)
  const [imgSrc, setImgSrc] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [imgChange, setImgChange] = useState(false)

  useEffect(() => {
    if (authUser.urlFoto && authUser.urlFoto !== '') {
      setImgSrc(authUser.urlFoto);
    } else {
      setImgSrc('')
    }
  }, [])

  const handleInputImageChange = (archivo) => {

    setImgChange(true)

    const file = archivo.target.files[0];
    const reader = new FileReader();

    const readImage = new Promise((resolve, reject) => {
      reader.onloadend = () => {
        if (reader.result !== null) {
          resolve(reader.result);
        } else {
          reject('Error al leer la imagen')
        }
      };

      reader.readAsDataURL(file);
    });

    readImage
      .then(async (result) => {
        // Extraer el tipo MIME de la cadena de datos URL
        const mimeType = result.split(';')[0].split(':')[1]

        const validatePhoto = () => {
          if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg') || mimeType.includes('image/png') || mimeType.includes('image/webp') || mimeType.includes('image/gif') || mimeType.includes('image/bmp') || mimeType.includes('image/tiff') || mimeType.includes('image/svg')) {
            return true
          } else {
            return false
          }
        }

        if (await validatePhoto()) {
          setImgSrc(result)
          setInputValue(result)
        } else {
          setAlertMessage('Solo puede seleccionar archivos de imágen permitidos: jpeg, jpg, png, webp, gif, bmp, tiff o svg.')
        }


      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleInputImageReset = () => {
    setInputValue('')
    setImgSrc(authUser.urlFoto)
  }

  //Función que maneja el botón para remover la foto de perfil
  const handleRemoveImage = async () => {
    setImgChange(true)
    setInputValue('')
    if (imgSrc){
      setImgSrc('')
    }
  }

  const AvatarFromName = () => {
    let avatarContent
    let name
    if (!authUser.displayName) {
      name = 'N N'
    }

    if (imgSrc !== '' && imgSrc !== 'No definido') {
      avatarContent = (
        <Avatar
          src={imgSrc}
          alt={authUser.displayName}
          sx={{
            width: 180,
            height: 180,
            borderRadius: '10%',
            objectFit: 'contain',
            fontSize: '72px', // Tamaño de la fuente ajustado
          }}
        />
      );
    } else {
      // No hay `photo` proporcionada, usar avatar con iniciales del nombre
      const currentName = authUser.displayName ?? name

      const initials = currentName
        .split(' ')
        .map((word) => word.charAt(0))
        .join('');

      avatarContent = (
        <Avatar
          sx={{
            width: 200,
            height: 200,
            borderRadius: '10%',
            objectFit: 'contain',
            bgcolor: 'primary.main',
            fontSize: '65px', // Tamaño de la fuente ajustado
          }}
        >
          {initials}
        </Avatar>
      );
    }

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        {avatarContent}
      </Box>
    )

  };


  // Función que se encarga de visualizar de forma correcta el teléfono que se ingrese
  const handleFormChange = (event) => {
    const { name, value } = event.target

    let newValue = value
    if (name === 'phone') {
      // Eliminar caracteres que no sean números
      newValue = newValue.replace(/[^0-9]/g, '')

      // Limitar a 9 dígitos
      newValue = newValue.slice(0, 9)

      // Agregar espacios en blanco después del primer dígito y después del quinto dígito
      newValue = `${newValue.slice(0, 1)} ${newValue.slice(1, 5)} ${newValue.slice(5, 9)}`

      newValue = newValue.trim()
    }
    setFormData(newValue)
  }



  // Función que maneja lo que pasa al hacer click en 'GUARDAR CAMBIOS'
  const handleSubmit = async () => {
    const trimmedPhone = formData.replace(/\s/g, '')

    // Antes de iniciar las comprobaciones de validación
    setErrorMessage('')

    const phoneValidator = async() => {
      if (trimmedPhone.length !== 9) {
        if (trimmedPhone.length == 0) {
          setErrorMessage('Debe ingresar un número de teléfono.')

          return false
        } else {
          setErrorMessage('El teléfono debe tener exactamente 9 dígitos.')

          return false
        }
      } else {
        return true
      }
    }

    // Si validator retorna true, significa que no existe un error al ingresar el teléfono
    if (await phoneValidator() && trimmedPhone !== authUser.phone && !imgChange) {
      await updateUserPhone(authUser.uid, trimmedPhone)
      setAlertMessage('Número de teléfono actualizado con éxito')
    } else if (await phoneValidator() && trimmedPhone == authUser.phone && imgChange) {
      await updateUserProfile(inputValue)
      setAlertMessage('Foto de perfil actualizada con con éxito')
    } else if (await phoneValidator() && trimmedPhone !== authUser.phone && imgChange) {
      await updateUserPhone(authUser.uid, trimmedPhone)
      await updateUserProfile(inputValue)
      setAlertMessage('Foto de perfil y teléfono actualizados con éxito')
    }
  };

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Dialog
          sx={{ '.MuiDialog-paper': { minWidth: '20%' } }}
          open={alertMessage !== ''}
          maxWidth={false}
        >
          <DialogTitle sx={{ ml: 2, mt: 4 }} id='alert-dialog-title'>
            Atención
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ m: 2 }} id='alert-dialog-description'>
              {alertMessage}
            </DialogContentText>
            <DialogActions>
              <Button size='small' onClick={() => setAlertMessage('')}>
                OK
              </Button>
            </DialogActions>
          </DialogContent>
        </Dialog>
        <Card>
          <form>
          <CardContent sx={{ pt: 4 }}>
            <Grid container spacing={6}>
              <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <CardHeader title={authUser.displayName ?? 'Por definir'} />
                <AvatarFromName/>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ display: 'flex', flexDirection: 'column', gap: {xs: 0, sm: 2, md: 2, lg: 2}, mt: {xs: 2, sm: 26, md: 26, lg: 26} }}>
                <ButtonStyled component='label' variant='contained' htmlFor='account-settings-upload-image'>
                  Subir nueva foto
                  <input
                    hidden
                    type='file'
                    accept='image/jpeg, image/jpg, image/png, image/webp, image/gif, image/bmp, image/tiff, image/svg'
                    onChange={handleInputImageChange}
                    id='account-settings-upload-image'
                  />
                </ButtonStyled>
                <ResetButtonStyled color='primary' variant='outlined' onClick={handleInputImageReset}>
                  Restablecer
                </ResetButtonStyled>
                <ResetButtonStyled color='primary' variant='outlined' onClick={handleRemoveImage}>
                  Borrar foto
                </ResetButtonStyled>
              </Grid>
            </Grid>
          </CardContent>
            <Divider />
            <CardContent>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    disabled
                    type='email'
                    id='outlined-disabled'
                    label='Email'
                    value={authUser.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label='Teléfono'
                    name='phone'
                    type='tel'
                    placeholder='Teléfono'
                    onChange={handleFormChange}
                    value={formData}
                    InputProps={{ startAdornment: <InputAdornment position='start'>(+56)</InputAdornment> }}
                    error={errorMessage !== ''}
                    helperText={errorMessage}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth disabled id='outlined-disabled' label='Empresa' value={authUser.company} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth disabled id='outlined-disabled' label='Turno' value={authUser.shift} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth disabled id='outlined-disabled' label='Contraturno' value={authUser.opshift} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    disabled
                    id='outlined-disabled'
                    label='Contract Operator'
                    value={authUser.opshift}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant='contained' sx={{ mr: 3 }} onClick={handleSubmit}>
                    Guardar cambios
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </form>
        </Card>
      </Grid>
    </Grid>
  );
};

TabAccount.acl = {
  subject: 'user-profile',
};

export default TabAccount;
