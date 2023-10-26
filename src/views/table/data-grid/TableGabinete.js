import * as React from 'react'
import { useState, useEffect } from 'react'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useFirebase } from 'src/context/useFirebase'
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
import Tooltip from '@mui/material/Tooltip'
import { DataGrid, esES } from '@mui/x-data-grid'
import CardHeader from '@mui/material/CardHeader'
import { DateRangePicker } from '@mui/lab'
import { date } from 'yup/lib/locale'
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import { Container } from '@mui/system'
import AlertDialog from 'src/@core/components/dialog-warning'
import { FullScreenDialog } from 'src/@core/components/dialog-fullsize'
import TextField from '@mui/material/TextField'


import { DialogAssignProject } from 'src/@core/components/dialog-assignProject'
import { ArrowDropDown, Check, Clear, Edit } from '@mui/icons-material'

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

import EngineeringIcon from '@mui/icons-material/Engineering'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import TableSpanning from 'src/views/table/mui/TableSpanning'
import { UploadBlueprintsDialog } from 'src/@core/components/dialog-uploadBlueprints'

const TableGabinete = ({ rows, role, roleData, petitionId, setBlueprintGenerated }) => {
  const [options, setOptions] = useState('')
  const [open, setOpen] = useState(false)
  const [openEvents, setOpenEvents] = useState(false)
  const [openUploadDialog, setOpenUploadDialog] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [doc, setDoc] = useState({})
  const [proyectistas, setProyectistas] = useState([])
  const [loadingProyectistas, setLoadingProyectistas] = useState(true)
  const [approve, setApprove] = useState(true)
  const { updateDocs, authUser, getUserData, getUserProyectistas } = useFirebase()
  const [descriptions, setDescriptions] = useState({});
  const [currentRow, setCurrentRow] = useState(null);

  const defaultSortingModel = [{ field: 'date', sort: 'desc' }]

  const handleDescriptionChange = (id, value) => {
    setDescriptions(prev => ({ ...prev, [id]: value }));
  }

  const handleSubmit = (id) => {
    // Aquí debo implementar la lógica para actualizar el documento 'row' con el nuevo campo 'description'
    // Una vez hecho eso, poder resetear la descripción para ese 'id'
    setDescriptions(prev => {
        const newState = { ...prev };
        delete newState[id];

        return newState;
    });
  }

   const handleClickOpen = doc => {

    setDoc(doc)
    setOpen(true)
  }

  const handleOpenUploadDialog = doc => {
    setCurrentRow(doc.id)
    setDoc(doc)
    setOpenUploadDialog(true)
  }

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false)
  }

  const handleClickOpenEvents = doc => {

    setDoc(doc)
    setOpenEvents(true)
  }

  const handleCloseEvents = () => {
    setOpenEvents(false)
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
    updateDocs(doc.id, approve, authUser)
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
    const fetchProyectistas = async () => {
      const resProyectistas = await getUserData('getUserProyectistas', null, authUser)
      setProyectistas(resProyectistas)
      setLoadingProyectistas(false)
    }

    fetchProyectistas()
  }, [authUser.shift])

  useEffect(() => {
    if(currentRow){
      const filterRow = rows.find(rows => rows.id === currentRow)
      setDoc(filterRow)
      setOpenUploadDialog(true)
    }
  }, [rows])


  const columns = [
    {
      field: 'title',
      headerName: 'Solicitud',
      flex: 0.6,
      minWidth: 220,
      renderCell: params => {
        const { row } = params

        return (
          <Tooltip
            title={row.id}
            placement='bottom-end'
            key={row.id}
            leaveTouchDelay={0}
            //TransitionComponent={Fade}
            TransitionProps={{ timeout: 0 }}
          >
            <Box sx={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={() => handleClickOpenEvents(row)}>
                <OpenInNewOutlined sx={{ fontSize: 18 }} />
              </IconButton>

              <Typography sx={{
                  textDecoration: 'none',
                  transition: 'text-decoration 0.2s',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
                variant='string'>{row.id}
                </Typography>
            </Box>
          </Tooltip>

        )
      }
    },
    {
      field: 'revision',
      headerName: 'REVISION',
      flex: 0.2,
      minWidth: 120,
      renderCell: params => {
        const { row } = params

        return <div>{row.revision || 'N/A'}</div>
      }
    },
    {
      field: 'userName',
      headerName: 'CREADO POR',
      minWidth: 120,
      flex: 0.3,
      renderCell: params => {
        const { row } = params

        return <div>{row.userName || 'N/A'}</div>
      }
    },
    {
      field: 'description',
      headerName: 'DESCRIPCION',
      flex: 0.4,
      minWidth: 120,
      //editable: true,
      renderCell: params => {
        const { row } = params

        if (!row.description) {
          return (
            <TextField label='Describir' id='size-small' disabled={row.userId !== authUser.uid} value={descriptions[row.id] || ''} defaultValue={descriptions[row.id] || ''} onChange={(e) => handleDescriptionChange(row.id, e.target.value)} size='small' />

          );
        }

        return <div>{row.description || 'N/A'}</div>
      }
    },
    {
      field: 'start',
      headerName: 'CARGAR ENTREGABLE',
      flex: 0.1,
      minWidth: 150,
      renderCell: params => {
        const { row } = params

        return (
          <IconButton onClick={row.userId === authUser.uid ? () => handleOpenUploadDialog(row) : null}>
            <CloudUploadOutlinedIcon color={row.storageBlueprints ? 'primary' :'secondary'} sx={{ fontSize: 18 }} />
          </IconButton>
        )

      }
    },
    {
      field: 'date',
      headerName: 'Inicio',
      flex: 0.3,
      minWidth: 120,
      renderCell: params => {
        const { row } = params

        return <div>{unixToDate(row.date.seconds)[0]}</div>
      }
    },
    {
      field: 'end',
      headerName: 'Fin',
      flex: 0.1,
      minWidth: 90,
      renderCell: params => {
        const { row } = params

        if (descriptions[row.id]) {
          return (
              <button onClick={() => handleSubmit(rowData.id)}>
                  Actualizar
              </button>
          );
        }

        return <div>{'Pendiente'}</div>
      }
    },

    /* {
      field: 'assign',
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
      field: 'done',
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
    } */
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
            end: md,
            assign: md,
            done: md,

            actions: roleData.canApprove
          }}
          localeText={esES.components.MuiDataGrid.defaultProps.localeText}
          sortingModel={defaultSortingModel}
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
        {openUploadDialog && (
          <UploadBlueprintsDialog
            open={openUploadDialog}
            handleClose={handleCloseUploadDialog}
            doc={doc}
            roleData={roleData}
            petitionId={petitionId}
            setBlueprintGenerated={setBlueprintGenerated}
          />
        )}

      </Box>
    </Card>
  )
}

export default TableGabinete
