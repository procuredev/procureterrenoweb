// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Select from '@mui/material/Select'
import Dialog from '@mui/material/Dialog'
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

// ** Icon Imports
import Icon from 'src/@core/components/icon'

import { useFirebase } from 'src/context/useFirebaseAuth'

//const { updateUserProfile } = useFirebase()

//import { updateUserProfile } from '../../context/useFirebaseAuth'

const ImgStyled = styled('img')(({ theme }) => ({
  width: 120,
  height: 120,
  marginRight: theme.spacing(5),
  borderRadius: theme.shape.borderRadius
}))

const ButtonStyled = styled(Button)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    textAlign: 'center'
  }
}))

const ResetButtonStyled = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    marginLeft: 0,
    textAlign: 'center',
    marginTop: theme.spacing(4)
  }
}))

const TabAccount = () => {
  // ** Hooks
  const { authUser, updateUserProfile, updateUserPhone } = useFirebase()

  const initialImg =
    authUser && authUser.pfp
      ? authUser.pfp
      : 'https://t4.ftcdn.net/jpg/04/08/24/43/360_F_408244382_Ex6k7k8XYzTbiXLNJgIL8gssebpLLBZQ.jpg'

  // ** State
  const [inputValue, setInputValue] = useState('')
  const [formData, setFormData] = useState(authUser.phone==='No definido' ? '' : authUser.phone)
  const [imgSrc, setImgSrc] = useState(initialImg)

  useEffect(() => {
    console.log(inputValue, 'inputValue')
    console.log(imgSrc, 'imgSrc')
  }, [inputValue, imgSrc])

  const handleInputImageChange = archivo => {
    const file = archivo.target.files[0]
    const reader = new FileReader()

    const readImage = new Promise((resolve, reject) => {
      reader.onloadend = () => {
        if (reader.result !== null) {
          resolve(reader.result)
        } else {
          reject('Error al leer la imagen')
        }
      }

      reader.readAsDataURL(file)
    })

    readImage
      .then(result => {
        setImgSrc(result)
        setInputValue(result)
      })
      .catch(error => {
        console.error(error)
      })
  }

  const handleInputImageReset = () => {
    setInputValue('')
    setImgSrc(initialImg)
  }

  const handleFormChange = target => {
    let value = target.value
    if (target.name = 'phone') {
      value = value.replace(/[^0-9]/g, '')
      value = `${value[0]||''} ${value.slice(1, 5)||''} ${value.slice(5, 10)||''}`
      value = value.trim()
    }
    setFormData(value)
  }

  const handleSubmit = () => {
    // e.preventDefault()
    /* console.log(formData, 'formData')
    console.log(inputValue, 'inputValue') */
    if (formData !== authUser.phone) {
      updateUserPhone(authUser.uid, formData.replace(/\s/g, ""))
    }
    if (inputValue !== '') {
      updateUserProfile(inputValue)
    }

    console.log('Manejar subida de foto y cambio de teléfono')
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Mi Perfil' />
          <form>
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ImgStyled src={imgSrc} alt='Profile Pic' sx={{ objectFit: 'cover', objectPosition: 'center' }} />
                <div>
                  <CardHeader title={authUser.displayName} sx={{ p: 1, pb: 2 }} />
                  <ButtonStyled component='label' variant='contained' htmlFor='account-settings-upload-image'>
                    Subir nueva foto
                    <input
                      hidden
                      type='file'
                      accept='image/png, image/jpeg'
                      onChange={handleInputImageChange}
                      id='account-settings-upload-image'
                    />
                  </ButtonStyled>
                  <ResetButtonStyled color='secondary' variant='outlined' onClick={handleInputImageReset}>
                    Restablecer
                  </ResetButtonStyled>
                  <Typography sx={{ mt: 5, color: 'text.disabled' }}>Sólo archivos PNG o JPG.</Typography>
                </div>
              </Box>
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
                    name='phone'
                    type='tel'
                    label='Teléfono'
                    value={formData}
                    placeholder='9 1234 5678'
                    onChange={e => handleFormChange(e.target)}
                    inputProps={{ maxLength: 12 }}
                    InputProps={{ startAdornment: <InputAdornment position='start'>(+56)</InputAdornment> }}
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
                  <Button variant='contained' sx={{ mr: 3 }} onClick={() => handleSubmit()}>
                    Guardar cambios
                  </Button>
                  <Button type='reset' variant='outlined' color='secondary' onClick={() => setFormData(initialData)}>
                    Restablecer
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </form>
        </Card>
      </Grid>
    </Grid>
  )
}

export default TabAccount
