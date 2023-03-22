// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import { CardMedia } from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'
import Link from '@mui/material/Link'
import Router, { useRouter } from 'next/router'

// Styled Grid component
const StyledGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    order: -1,
    display: 'flex',
    justifyContent: 'center'
  }
}))

const ShowMap = () => {
  // ** Hook
  const theme = useTheme()
  const router = useRouter()
  
  return (
    <Card sx={{ position: 'relative' }}>
      <CardContent>
          <Grid item>
            <Typography variant='h5' sx={{ mb: 4.5 }}>
             ¿No sabes en qué area te encuentras? 📍
            </Typography>
            <Typography variant='body2' sx={{ mb: 4.5 }}>
              Puedes consultar el mapa <Link onClick={()=>router.replace('/mapa/')}>aquí.</Link>
            </Typography>

          </Grid>
      </CardContent>
    </Card>
  )
}

export default ShowMap
