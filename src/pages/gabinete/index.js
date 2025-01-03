// Hola

// ** MUI Imports
import Grid from '@mui/material/Grid'
import DataGridGabinete from 'src/views/pages/gabinete/DataGridGabinete'

// ** Styled Component

// ** Demo Components Imports

const Gabinete = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(4)} !important` }}>
        <DataGridGabinete />
      </Grid>
    </Grid>
  )
}

Gabinete.acl = {
  subject: 'gabinete'
}

export default Gabinete
