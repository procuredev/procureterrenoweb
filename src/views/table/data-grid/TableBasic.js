import * as React from 'react';

// ** MUI Imports
import { Typography } from '@mui/material';
import { Button } from '@mui/material';
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { DataGrid } from '@mui/x-data-grid'
import CardHeader from '@mui/material/CardHeader'
import { DateRangePicker } from '@mui/lab';
import { date } from 'yup/lib/locale';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { Container } from '@mui/system';


const columns = [
  {
    field: 'title',
    headerName: 'Solicitud',
    flex: 1,
    editable: true,
    renderCell: params => {
      const { row } = params

      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography noWrap variant='string'>
              {row.title}
            </Typography>
          <OpenInNewOutlined />
        </Box>
      )
    }
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
    field: 'start',
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
