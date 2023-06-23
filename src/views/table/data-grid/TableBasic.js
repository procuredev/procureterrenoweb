import * as React from 'react'
import { useState, useEffect } from 'react'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useFirebase } from 'src/context/useFirebaseAuth'
import dictionary from 'src/@core/components/dictionary/index'
import { unixToDate } from 'src/@core/components/unixToDate'

// ** MUI Imports
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import Select from '@mui/material/Select'
import CustomChip from 'src/@core/components/mui/chip'
import { Typography, IconButton } from '@mui/material'
import { Button } from '@mui/material'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { DataGrid } from '@mui/x-data-grid'
import CardHeader from '@mui/material/CardHeader'
import { DateRangePicker } from '@mui/lab'
import { date } from 'yup/lib/locale'
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined'
import { Container } from '@mui/system'
import AlertDialog from 'src/@core/components/dialog-warning'
import { FullScreenDialog } from 'src/@core/components/dialog-fullsize'
import { ArrowDropDown, Check, Clear, Edit } from '@mui/icons-material'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'

const TableBasic = ({ rows, role, roleData }) => {
  const [options, setOptions] = useState('')
  const [open, setOpen] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [doc, setDoc] = useState('')
  const [approve, setApprove] = useState(true)
  const { reviewDocs, authUser } = useFirebase()

  const handleClickOpen = doc => {
    setDoc(doc)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleClickOpenAlert = (doc, isApproved) => {
    setDoc(doc)
    setOpenAlert(true)
    setApprove(isApproved)
  }

  const writeCallback = () => {
    reviewDocs(doc.id, approve)
    setOpenAlert(false)
  }

  const handleCloseAlert = () => {
    setOpenAlert(false)
  }

  const theme = useTheme()
  const sm = useMediaQuery(theme.breakpoints.up('sm'))
  const md = useMediaQuery(theme.breakpoints.up('md'))
  const xl = useMediaQuery(theme.breakpoints.up('xl'))

  useEffect(() => {
    // Busca el documento actualizado en rows
    const updatedDoc = rows.find(row => row.id === doc.id)

    // Actualiza el estado de doc con el documento actualizado
    if (updatedDoc) {
      setDoc(updatedDoc)
    }
  }, [rows])

  const columns = [
    {
      field: 'title',
      headerName: 'Solicitud',
      flex: 0.8,
      minWidth: 220,
      renderCell: params => {
        const { row } = params

        return (
          <Box sx={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => handleClickOpen(row)}>
              <OpenInNewOutlined sx={{ fontSize: 18 }} />
            </IconButton>

            <Typography variant='string'>{row.title}</Typography>
          </Box>
        )
      }
    },
    {
      field: 'state',
      headerName: 'Estado',
      minWidth: 120,
      flex: 0.4,
      renderCell: params => {
        const { row } = params
        let state = row.state && typeof row.state === 'number' ? row.state : 100

        return (
          <CustomChip
            size='small'
            color={dictionary[state].color}
            label={dictionary[state].title}
            sx={{ '& .MuiChip-label': { textTransform: 'capitalize' } }}
          />
        )
      }
    },
    {
      field: 'date',
      headerName: 'Creación',
      flex: 0.4,
      minWidth: 90,
      renderCell: params => {
        const { row } = params

        return <div>{unixToDate(row.date.seconds)[0]}</div>
      }
    },
    {
      field: 'start',
      headerName: 'Inicio',
      flex: 0.4,
      minWidth: 90,
      renderCell: params => {
        const { row } = params

        return <div>{unixToDate(row.start.seconds)[0]}</div>
      }
    },
    {
      field: 'end',
      headerName: 'Entrega',
      flex: 0.4,
      minWidth: 90,
      renderCell: params => {
        const { row } = params

        return <div>{(row.end && unixToDate(row.end.seconds)[0]) || 'Pendiente'}</div>
      }
    },
    {
      field: 'ot',
      headerName: 'OT',
      flex: 0.3,
      minWidth: 50,
      renderCell: params => {
        const { row } = params

        return <div>{row.ot || 'N/A'}</div>
      }
    },
    {
      field: 'user',
      headerName: 'Autor',
      flex: 0.6,
      minWidth: 120
    },
    {
      flex: 0.3,
      minWidth: md ? 190 : 100,
      field: 'actions',
      headerName: 'Acciones',
      renderCell: params => {
        const { row } = params

        return (
          <>
            {md ? (
              row.state === role - 1 ? (
                <>
                  <Button
                    onClick={() => handleClickOpenAlert(row, true)}
                    variant='contained'
                    color='success'
                    sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                  >
                    <Check sx={{ fontSize: 18 }} />
                  </Button>
                  <Button
                    onClick={() => handleClickOpen(row)}
                    variant='contained'
                    color='secondary'
                    sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                  >
                    <Edit sx={{ fontSize: 18 }} />
                  </Button>
                  <Button
                    onClick={() => handleClickOpenAlert(row, false)}
                    variant='contained'
                    color='error'
                    sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                  >
                    <Clear sx={{ fontSize: 18 }} />
                  </Button>
                </>
              ) : (
                'Revisado'
              )
            ) : row.state === role - 1 ? (
              <>
                <Select
                  labelId='demo-simple-select-label'
                  id='demo-simple-select'
                  size='small'
                  IconComponent={() => <MoreHorizIcon />}
                  sx={{
                    '& .MuiSvgIcon-root': { position: 'absolute', margin: '20%', pointerEvents: 'none !important' },
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '& .MuiSelect-select': { backgroundColor: theme.palette.customColors.tableHeaderBg },
                    '& .MuiList-root': { display: 'flex', flexDirection: 'column' }
                  }}
                >
                  <Container sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Button
                      onClick={() => handleClickOpenAlert(row, true)}
                      variant='contained'
                      color='success'
                      sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                    >
                      <Check sx={{ fontSize: 18 }} />
                    </Button>
                    <Button
                      onClick={() => handleClickOpen(row)}
                      variant='contained'
                      color='secondary'
                      sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                    >
                      <Edit sx={{ fontSize: 18 }} />
                    </Button>
                    <Button
                      onClick={() => handleClickOpenAlert(row, false)}
                      variant='contained'
                      color='error'
                      sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                    >
                      <Clear sx={{ fontSize: 18 }} />
                    </Button>
                  </Container>
                </Select>
              </>
            ) : (
              'Revisado'
            )}
          </>
        )
      }
    }
  ]

  return (
    <Card>
      <Box sx={{ height: 500 }}>
        <DataGrid
          hideFooterSelectedRowCount
          rows={rows}
          columns={columns}
          columnVisibilityModel={{
            ot: md,
            user: md,
            end: xl,
            actions: roleData.canApprove
          }}
        />
        <AlertDialog
          open={openAlert}
          handleClose={handleCloseAlert}
          callback={writeCallback}
          approves={approve}
        ></AlertDialog>
        {open && <FullScreenDialog open={open} handleClose={handleClose} doc={doc} roleData={roleData} />}
      </Box>
    </Card>
  )
}

export default TableBasic
