// ** MUI Imports
import Grid from '@mui/material/Grid'
import DataGridCargaDeHoras from 'src/views/pages/carga-de-horas/'

// ** Styled Component

const CargaDeHoras = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(4)} !important` }}>
        <DataGridCargaDeHoras />
      </Grid>
    </Grid>
  )
}

CargaDeHoras.acl = {
  subject: 'carga-de-horas'
}

export default CargaDeHoras
