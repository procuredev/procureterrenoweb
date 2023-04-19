// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebaseAuth'
import { Firebase, db } from 'src/configs/firebase'
import { query, collection, onSnapshot } from 'firebase/firestore'

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

import { useSnapshot } from 'src/hooks/useSnapshot'

const DataGrid = () => {

  const auth = useFirebase()
  const data = useSnapshot()


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

