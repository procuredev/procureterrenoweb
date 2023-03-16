import * as React from 'react';
import { useState } from 'react';

// ** MUI Imports
import { Typography, IconButton } from '@mui/material';
import { Button } from '@mui/material';
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { DataGrid } from '@mui/x-data-grid'
import CardHeader from '@mui/material/CardHeader'
import { DateRangePicker } from '@mui/lab';
import { date } from 'yup/lib/locale';
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined';
import { Container } from '@mui/system';
import {FullScreenDialog} from 'src/@core/components/dialog-fullsize';

const TableBasic = (rows) => {
  const [open, setOpen] = useState(false)
  const [doc, setDoc] = useState('')

//set id as state: done
//find id in data aka rows
//render only id data

  const handleClickOpen = (id) => {
    setOpen(true)
    setDoc(id)
  };

  const handleClose = () => {
    setOpen(false);
  };

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
                <IconButton onClick={()=>handleClickOpen(row)}>
                <OpenInNewOutlined sx={{ fontSize: 18 }}/>
                </IconButton>


              <Typography noWrap variant='string'>
                {row.title}
              </Typography>

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

  return (
    <Card>
      <Box sx={{ height: 500 }}>
        <DataGrid rows={rows.rows} columns={columns} />
        <FullScreenDialog open={open} handleClose={handleClose} doc={doc} />
      </Box>
    </Card>
  )
}

export default TableBasic
