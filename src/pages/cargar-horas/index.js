// ** MUI Imports
import Grid from '@mui/material/Grid'
import DataGridCargarHoras from 'src/views/pages/cargar-horas/DataGridCargarHoras'

// ** Styled Component

const CargarHoras = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(4)} !important` }}>
        <DataGridCargarHoras />
      </Grid>
    </Grid>
  )
}

CargarHoras.acl = {
  subject: 'cargar-horas'
}

export default CargarHoras
