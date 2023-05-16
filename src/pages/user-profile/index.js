// ** React Imports
import { useState } from 'react'

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
  const { authUser } = useFirebase()
  const initialImg = authUser.pfp || 'https://t4.ftcdn.net/jpg/04/08/24/43/360_F_408244382_Ex6k7k8XYzTbiXLNJgIL8gssebpLLBZQ.jpg'

  // ** State
  const [inputValue, setInputValue] = useState('')
  const [formData, setFormData] = useState(authUser.phone)
  const [imgSrc, setImgSrc] = useState(initialImg)


  const handleInputImageChange = file => {
    const reader = new FileReader()
    const { files } = file.target
    if (files && files.length !== 0) {
      reader.onload = () => setImgSrc(reader.result)
      reader.readAsDataURL(files[0])
      if (reader.result !== null) {
        setInputValue(reader.result)
      }
    }
  }

  const handleInputImageReset = () => {
    setInputValue('')
    setImgSrc(initialImg)
  }

  const handleFormChange = (value) => {
    setFormData(value)
  }

  const handleSubmit = () => {
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
                      value={inputValue}
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
                    id="outlined-disabled"
                    label='Email'
                    value={authUser.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type='tel'
                    label='Teléfono'
                    value={formData}
                    placeholder='9 1234 5678'
                    onChange={e => handleFormChange(e.target.value)}
                    inputProps={{ maxLength: 12 }}
                    InputProps={{ startAdornment: <InputAdornment position='start'>(+56)</InputAdornment>}}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    disabled
                    id="outlined-disabled"
                    label='Empresa'
                    value={authUser.company}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    disabled
                    id="outlined-disabled"
                    label='Turno'
                    value={authUser.shift}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    disabled
                    id="outlined-disabled"
                    label='Contraturno'
                    value={authUser.opshift}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    disabled
                    id="outlined-disabled"
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
