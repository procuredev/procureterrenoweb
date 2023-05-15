// ** React Imports
import { useState, useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Hooks
import { useFirebase } from 'src/context/useFirebaseAuth'

// ** MUI Components
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import TextField from '@mui/material/TextField'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'


const UserProfile = () => {

  // ** Hooks
  const router = useRouter()
  const { authUser } = useFirebase()

  const [editable, setEditable] = useState(false)
  const [values, setValues] = useState({})

  const ProfilePicture = styled('img')(({ theme }) => ({
    objectFit: 'cover',
    objectPosition: 'center',
    width: 120,
    height: 120,
    borderRadius: theme.shape.borderRadius,
    border: `5px solid ${theme.palette.common.white}`,
    [theme.breakpoints.down('md')]: {
      marginBottom: theme.spacing(4)
    }
  }))

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={4}>
          <Card>

            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                justifyContent: { xs: 'center', md: 'flex-start' }
              }}
            >
              <ProfilePicture src={authUser.pfp ? authUser.pfp : 'https://t4.ftcdn.net/jpg/04/08/24/43/360_F_408244382_Ex6k7k8XYzTbiXLNJgIL8gssebpLLBZQ.jpg'} alt='profile-picture' />
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  ml: { xs: 0, md: 6 },
                  alignItems: 'flex-end',
                  flexWrap: ['wrap', 'nowrap'],
                  justifyContent: ['center', 'space-between']
                }}
              >
                <Box sx={{ mb: [6, 0], display: 'flex', flexDirection: 'column', alignItems: ['center', 'flex-start'] }}>

                  <Typography variant='h5' sx={{ mb:0, fontSize: '1.375rem' }}>{authUser.displayName}</Typography>
                  <Typography variant='h7' sx={{ mb:4, fontWeight: 600 }} >Puesto</Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: ['center', 'flex-start']
                    }}
                  >
                    {authUser.company && <Box sx={{ mr: 4, display: 'flex', alignItems: 'center', '& svg': { mr: 1, color: 'text.secondary' } }}>
                      <Icon icon='mdi:domain' />
                      <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>{authUser.company}</Typography>
                    </Box>}
                    {authUser.plant && <Box sx={{ display: 'flex', alignItems: 'center', '& svg': { mr: 1, color: 'text.secondary' } }}>
                      <Icon icon='mdi:map-marker-outline' />
                      <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>{authUser.plant}</Typography>
                    </Box>}
                  </Box>
                </Box>
              </Box>
            </CardContent>




          </Card>
        </Grid>
        <Grid item xs={8}>
          <Card>
            <CardHeader title='Mis datos' />
            <CardContent>
            {editable ? <TextField
            onChange={e => setValues({ ...values, title: e.target.value })}
            label="Título"
            id="title-input"
            defaultValue='texto'
            size="small"
            sx={{ mt: 5, mb: 5, mr: 2 }}
          /> :
          <>
            <Typography sx={{ mb: 0}} component="div">texto</Typography>
            <Typography sx={{ mb: 2.5 }} component="div">texto</Typography>
          </>
          }
            </CardContent>

          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default UserProfile
