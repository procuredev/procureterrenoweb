// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Hooks
import { useAuth } from 'src/context/FirebaseContext'


// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from 'src/@core/components/page-header'

// ** Demo Components Imports
import TableBasic from 'src/views/table/data-grid/TableBasic'
import TableFilter from 'src/views/table/data-grid/TableFilter'
import TableColumns from 'src/views/table/data-grid/TableColumns'
import TableEditable from 'src/views/table/data-grid/TableEditable'
import TableBasicSort from 'src/views/table/data-grid/TableBasicSort'
import TableSelection from 'src/views/table/data-grid/TableSelection'
import TableServerSide from 'src/views/table/data-grid/TableServerSide'

const DataGrid = () => {

  const auth = useAuth()
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetch() {
      const allDocs = await auth.getDocuments()
      console.log(allDocs)
      setData(allDocs)

      return allDocs
    }
    fetch();
  }, []);



  return (
    <Grid container spacing={6}>
      <PageHeader
        title={
          <Typography variant='h5'>
            <Link href='https://mui.com/x/react-data-grid/' target='_blank'>
              Solicitudes
            </Link>
          </Typography>
        }
        subtitle={
          <Typography variant='body2'>Todas las solicitudes
          </Typography>
        }
      />
      <Grid item xs={12}>
        <TableBasic rows={data} />
      </Grid>
    </Grid>
  )
}

export default DataGrid

