// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import DataGridSolicitudes from 'src/views/pages/solicitudes/DataGridSolicitudes'

// ** Styled Component

// ** Demo Components Imports
import FormLayoutSolicitud from 'src/views/pages/forms/form-layouts/FormLayoutsSolicitud'
import LayoutSolicitudes from 'src/views/pages/solicitudes/DataGridSolicitudes'

const NuevaSolicitud = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(4)} !important` }}>
        <DataGridSolicitudes />
      </Grid>
    </Grid>
  )
}

/*
NuevaSolicitud.acl = {
  action: 'manage',
  subject: 'nueva-solicitud'
}
*/

export default NuevaSolicitud
