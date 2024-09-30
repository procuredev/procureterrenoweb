// ** MUI Imports
import Grid from '@mui/material/Grid'

import 'moment/locale/es'


// ** Styled Component

// ** Demo Components Imports
import FormLayoutsDocViewer from 'src/views/pages/forms/form-layouts/FormLayoutsDocViewer'

const DocViewer = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(4)} !important` }}>
        <FormLayoutsDocViewer />
      </Grid>
    </Grid>
  )
}

DocViewer.acl = {
  subject: 'firma'
}

export default DocViewer
