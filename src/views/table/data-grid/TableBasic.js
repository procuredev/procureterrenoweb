import * as React from 'react';

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { DataGrid } from '@mui/x-data-grid'
import CardHeader from '@mui/material/CardHeader'
import { DateRangePicker } from '@mui/lab';
import { date } from 'yup/lib/locale';


const columns = [
  {
    field: 'id',
    headerName: 'ID',
    flex: 0.5,
  },
  {
    field: 'title',
    headerName: 'Solicitud',
    flex: 1,
    editable: true,
  },
  {
    field: 'supervisor',
    headerName: 'Supervisor',
    flex: 1,
    editable: true,
  },
  {
    field: 'area',
    headerName: 'Area',
    flex: 0.4,
    editable: true,
  },
  {
    field: 'user',
    headerName: 'Autor',
    flex: 1,
    editable: true,
  },
  {
    field: 'requestedDate',
    headerName: 'Fecha',
    flex: 0.5,
    editable: true,
  }
];



const TableBasic = (rows) => {

  return (
    <Card>
      <Box sx={{ height: 500 }}>
        <DataGrid rows={rows.rows} columns={columns} />
      </Box>
    </Card>
  )
}

export default TableBasic
