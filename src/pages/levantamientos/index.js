// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import DataGridLevantamientos from 'src/views/pages/solicitudes/DataGridLevantamientos'

// ** Styled Component

// ** Demo Components Imports
import FormLayoutSolicitud from 'src/views/pages/forms/form-layouts/FormLayoutsSolicitud'
import LayoutSolicitudes from 'src/views/pages/solicitudes/DataGridSolicitudes'

const Levantamientos = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(4)} !important` }}>
        <DataGridLevantamientos />
      </Grid>
    </Grid>
  )
}

Levantamientos.acl = {
  subject: 'levantamientos'
}

export default Levantamientos
