// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Styled Component

// ** Demo Components Imports
import FormLayoutSolicitud from 'src/views/pages/forms/form-layouts/FormLayoutsSolicitud'


const NuevaSolicitud = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(4)} !important` }}>
        <FormLayoutSolicitud />
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
