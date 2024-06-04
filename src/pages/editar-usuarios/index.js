// ** MUI Imports
import Grid from '@mui/material/Grid'
import DataGrid from 'src/views/pages/users/DataGridEditUsers'

const EditUsers = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(4)} !important` }}>
        <DataGrid />
      </Grid>
    </Grid>
  )
}

EditUsers.acl = {
  subject: 'editar-usuarios'
}

export default EditUsers
