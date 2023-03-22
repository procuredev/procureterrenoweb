// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import { styled, useTheme } from '@mui/material/styles'
import { Height } from '@mui/icons-material'

// Styled Grid component
const StyledGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    order: -1,
    display: 'flex',
    justifyContent: 'center'
  }
}))

const ProfileCard = () => {
  // ** Hook
  const theme = useTheme()

  return (
    <Card sx={{ position: 'relative',height:'auto'}}>
      <CardContent>
          <Grid item>
            <Typography variant='h5' sx={{ mb: 6 }}>
             Hola,{' '}
              <Box component='span' sx={{ fontWeight: 'bold', mb:4.5 }}>
                admin
              </Box>
              ! 👋
            </Typography>
            <Typography variant='body2' sx={{ mb: 7 }}>
              Explora las distintas vistas o revisa la actividad reciente aquí.
            </Typography>
            <Button href='/solicitudes' variant='contained'>Ver Solicitudes</Button>
          </Grid>
      </CardContent>
    </Card>
  )
}

export default ProfileCard
