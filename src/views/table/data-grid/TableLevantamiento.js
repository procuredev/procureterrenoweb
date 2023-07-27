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
import { DataGrid, esES } from '@mui/x-data-grid'
import CardHeader from '@mui/material/CardHeader'
import { DateRangePicker } from '@mui/lab'
import { date } from 'yup/lib/locale'
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined'
import { Container } from '@mui/system'
import AlertDialog from 'src/@core/components/dialog-warning'
import { FullScreenDialog } from 'src/@core/components/dialog-fullsize'
import { DialogDoneProject } from 'src/@core/components/dialog-doneProject'

import { DialogAssignProject } from 'src/@core/components/dialog-assignProject'
import { ArrowDropDown, Check, Clear, Edit } from '@mui/icons-material'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

import EngineeringIcon from '@mui/icons-material/Engineering'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import TableSpanning from 'src/views/table/mui/TableSpanning'

const TableLevantamiento = ({ rows, role, roleData }) => {
  const [options, setOptions] = useState('')
  const [open, setOpen] = useState(false)
  const [openEvents, setOpenEvents] = useState(false)
  const [openDone, setOpenDone] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [doc, setDoc] = useState({})
  const [proyectistas, setProyectistas] = useState([])
  const [loadingProyectistas, setLoadingProyectistas] = useState(true)
  const [approve, setApprove] = useState(true)
  const { reviewDocs, authUser, getUserProyectistas } = useFirebase()

  const handleClickOpen = doc => {
    console.log(doc)

    setDoc(doc)
    setOpen(true)
  }

  const handleClickOpenEvents = doc => {
    console.log(doc)

    setDoc(doc)
    setOpenEvents(true)
  }

  const handleClickOpenDone = doc => {
    console.log(doc)

    setDoc(doc)
    setOpenDone(true)
  }

  const handleCloseEvents = () => {
    setOpenEvents(false)
  }

  const handleCloseDone = () => {
    setOpenDone(false)
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

  //const resultProyectistas = getUserProyectistas(authUser.shift)

  useEffect(() => {
    // Busca el documento actualizado en rows
    const updatedDoc = rows.find(row => row.id === doc.id)

    // Actualiza el estado de doc con el documento actualizado
    if (updatedDoc) {
      setDoc(updatedDoc)
    }
  }, [rows])

  useEffect(() => {
    const fetchProyectistas = async () => {
      const resProyectistas = await getUserProyectistas(authUser.shift)
      setProyectistas(resProyectistas)
      setLoadingProyectistas(false)
    }

    fetchProyectistas()

    /* const resProyectistas = getUserProyectistas(authUser.shift)
    setProyectistas(resProyectistas) */
  }, [authUser.shift])

  const columns = [
    {
      field: 'title',
      headerName: 'Solicitud',
      flex: 0.3,
      minWidth: 220,
      renderCell: params => {
        const { row } = params

        return (
          <Box sx={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => handleClickOpenEvents(row)}>
              <OpenInNewOutlined sx={{ fontSize: 18 }} />
            </IconButton>

            <Typography variant='string'>{row.title}</Typography>
          </Box>
        )
      }
    },
    {
      field: 'ot',
      headerName: 'OT',
      flex: 0.1,
      minWidth: 100,
      renderCell: params => {
        const { row } = params

        return <div>{row.ot || 'N/A'}</div>
      }
    },
    {
      field: 'state',
      headerName: 'Estado',
      minWidth: 200,
      flex: 0.1,
      renderCell: params => {
        const { row } = params
        let state = (row.state || row.state === 0) && typeof row.state === 'number' ? row.state : 100

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
      field: 'plant',
      headerName: 'Planta',
      flex: 0.3,
      minWidth: 200,
      renderCell: params => {
        const { row } = params

        return <div>{row.plant || 'N/A'}</div>
      }
    },
    {
      field: 'start',
      headerName: 'Inicio',
      flex: 0.1,
      minWidth: 90,
      renderCell: params => {
        const { row } = params

        return <div>{unixToDate(row.start.seconds)[0]}</div>
      }
    },
    {
      field: 'end',
      headerName: 'Fin',
      flex: 0.1,
      minWidth: 90,
      renderCell: params => {
        const { row } = params

        return <div>{(row.end && unixToDate(row.end.seconds)[0]) || 'Pendiente'}</div>
      }
    },
    {
      field: 'user',
      headerName: 'Asignar',
      flex: 0.1,
      minWidth: md ? 90 : 80,
      renderCell: params => {
        const { row } = params

        return (
          <>
            {md ? (
              row.state === 6 ? (
                <>
                  <Button
                    onClick={role === 7 ? () => handleClickOpen(row) : null}
                    variant='contained'
                    color='secondary'
                    sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                  >
                    <EngineeringIcon sx={{ fontSize: 18 }} />
                  </Button>
                </>
              ) : row.state === 7 ? (
                'Asignado'
              ) : (
                'Terminado'
              )
            ) : row.state === 6 ? (
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
                      onClick={role === 7 ? () => handleClickOpen(row) : null}
                      variant='contained'
                      color='secondary'
                      sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                    >
                      <EngineeringIcon sx={{ fontSize: 18 }} />
                    </Button>
                  </Container>
                </Select>
              </>
            ) : row.state === 7 ? (
              'Asignado'
            ) : (
              'Terminado'
            )}
          </>
        )
      }
    },
    {
      flex: 0.1,
      minWidth: md ? 110 : 80,
      field: 'actions',
      headerName: 'Terminar',
      renderCell: params => {
        const { row } = params

        return (
          <>
            {md ? (
              row.state === 7 ? (
                <>
                  <Button
                    onClick={role === 7 ? () => handleClickOpenDone(row) : null}
                    variant='contained'
                    color='success'
                    sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                  >
                    <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                  </Button>
                </>
              ) : row.state === 6 ? (
                'Sin asignar'
              ) : (
                'Terminado'
              )
            ) : row.state === 7 ? (
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
                      onClick={role === 7 ? () => handleClickOpenDone(row) : null}
                      variant='contained'
                      color='success'
                      sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                    >
                      <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                    </Button>
                  </Container>
                </Select>
              </>
            ) : row.state === 6 ? (
              'Sin asignar'
            ) : (
              'Terminado'
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
            end: md,

            actions: roleData.canApprove
          }}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        />
        <AlertDialog
          open={openAlert}
          handleClose={handleCloseAlert}
          callback={writeCallback}
          approves={approve}
        ></AlertDialog>
        {loadingProyectistas ? (
          <p>Loading...</p>
        ) : (
          <DialogAssignProject open={open} handleClose={handleClose} doc={doc} proyectistas={proyectistas} />
        )}
        {openEvents && (
          <FullScreenDialog
            open={openEvents}
            handleClose={handleCloseEvents}
            doc={doc}
            roleData={roleData}
            editButtonVisible={false}
          />
        )}
        {openDone && <DialogDoneProject open={openDone} handleClose={handleCloseDone} doc={doc} roleData={roleData} />}
      </Box>
    </Card>
  )
}

export default TableLevantamiento
