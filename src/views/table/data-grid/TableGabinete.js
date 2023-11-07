import * as React from 'react'
import { useState, useEffect } from 'react'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useFirebase } from 'src/context/useFirebase'
import { unixToDate } from 'src/@core/components/unixToDate'

// ** MUI Imports
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import Select from '@mui/material/Select'
import { Typography, IconButton, Dialog, DialogTitle, DialogActions, DialogContent} from '@mui/material'
import { Button } from '@mui/material'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Tooltip from '@mui/material/Tooltip'
import { DataGrid, esES } from '@mui/x-data-grid'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { Container } from '@mui/system'
import AlertDialogGabinete from 'src/@core/components/dialog-warning-gabinete'
import { FullScreenDialog } from 'src/@core/components/dialog-fullsize'
import TextField from '@mui/material/TextField'


import { DialogAssignProject } from 'src/@core/components/dialog-assignProject'
import { DialogClientCodeGenerator } from 'src/@core/components/dialog-clientCodeGenerator'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

import { UploadBlueprintsDialog } from 'src/@core/components/dialog-uploadBlueprints'
import Edit from '@mui/icons-material/Edit'

const TableGabinete = ({ rows, role, roleData, petitionId, petition, setBlueprintGenerated }) => {
  const [open, setOpen] = useState(false)
  const [openEvents, setOpenEvents] = useState(false)
  const [openUploadDialog, setOpenUploadDialog] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [doc, setDoc] = useState({})
  const [proyectistas, setProyectistas] = useState([])
  const [loadingProyectistas, setLoadingProyectistas] = useState(true)
  const [approve, setApprove] = useState(true)
  const { authUser, getUserData, updateBlueprint, addDescription } = useFirebase()
  const [currentRow, setCurrentRow] = useState(null);
  const [newDescription, setNewDescription] = useState(false)
  const [generateClientCode, setGenerateClientCode] = useState(false)

  const defaultSortingModel = [{ field: 'date', sort: 'desc' }]

  const handleDescriptionChange = (value) => {
    setNewDescription(value)
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

  const handleCloseClientCodeGenerator = () => {
    setGenerateClientCode(false)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleClickOpenAlert = (doc, isApproved) => {
    setDoc(doc)
    setOpenAlert(true)
    setApprove(isApproved)
  }

  const submitDescription = async () => {
    await addDescription(petitionId, currentRow, newDescription)
    .then(()=>setNewDescription(false))
    .catch((err)=>console.error(err))
  }

  const writeCallback = async () => {
    authUser.role === 9 ? await updateBlueprint(petitionId, doc, null, approve, authUser) :
    await updateBlueprint(petitionId, doc, newDescription, approve, authUser)
    .then(
    setOpenAlert(false),
    setNewDescription(false),
    setBlueprintGenerated(true)
    )
    .catch(err =>
    console.error(err),
    setOpenAlert(false),
    setNewDescription(false),)
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
    if(openUploadDialog){
      const filterRow = rows.find(rows => rows.id === currentRow)
      setDoc(filterRow)
      setOpenUploadDialog(true)
    }
  }, [rows])


  const columns = [
    {
      field: 'title',
      headerName: 'Código Procure',
      flex: 0.3,
      minWidth: 120,
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
      field: 'clientCode',
      headerName: 'Código MEL',
      flex: 0.4,
      minWidth: 120,
      renderCell: params => {
        const { row } = params

        if (row.clientCode) {
          return <Box sx={{display:'flex', width:'100%',justifyContent: 'space-between'}}>
          <Typography sx={{overflow:'hidden'}}>
          {row.clientCode || 'Sin descripción'}
          </Typography>
          </Box>
        } else {
          return <Box sx={{display:'flex', width:'100%',justifyContent: 'space-between'}}>
          <Edit fontSize='small' sx={{ml:2}} onClick={()=>{setGenerateClientCode(true); setCurrentRow(row.id)}}></Edit>
          </Box>
        }


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
      flex: 0.2,
      renderCell: params => {
        const { row } = params

        return <div>{row.userName || 'N/A'}</div>
      }
    },
    {
      field: 'description',
      headerName: 'DESCRIPCIÓN',
      flex: 0.4,
      minWidth: 120,
      //editable: true,
      renderCell: params => {
        const { row } = params
        let description = row.description || true

        return <Box sx={{display:'flex', width:'100%',justifyContent: 'space-between'}}>
          <Typography sx={{overflow:'hidden'}}>
          {row.description || 'Sin descripción'}
          </Typography>
          <Edit fontSize='small' sx={{ml:2}} onClick={()=>{setNewDescription(description); setCurrentRow(row.id)}}></Edit>
          </Box>
      }
    },
    {
      field: 'start',
      headerName: 'ENTREGABLE',
      flex: 0.2,
      minWidth: 120,
      renderCell: params => {
        const { row } = params

        return (
          <IconButton onClick={row.userId === authUser.uid || (authUser.role === 7 || authUser.role === 9) ? () => handleOpenUploadDialog(row) : null}>
            <CloudUploadOutlinedIcon color={row.storageBlueprints ? 'primary' :'secondary'} sx={{ fontSize: 18 }} />
          </IconButton>
        )

      }
    },
    {
      field: 'date',
      headerName: 'Inicio',
      flex: 0.2,
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
      minWidth: 150,
      renderCell: params => {
        const { row } = params

        return (
          <>
            {md ? (
             (authUser.role === 9 || authUser.role === 7) || row.userId === authUser.uid && (row.storageBlueprints && row.storageBlueprints.length >= 1) ? (
                <>
                  <Button
                    onClick={ () => handleClickOpenAlert(row, true) }
                    variant='contained'
                    color='success'
                    sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                  >
                    <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                  </Button>
                  {authUser.role === 9 || authUser.role === 7 ?
                  <Button
                    onClick={ () => handleClickOpenAlert(row, false) }
                    variant='contained'
                    color='error'
                    sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                  >
                    <CancelOutlinedIcon sx={{ fontSize: 18 }} />
                  </Button>
                  : null}
                </>
              ) : row.sendByDesigner === true ? (
                'Enviado'
              ) : (
                'Pendiente'
              )
            ) : (authUser.role === 9 || authUser.role === 7) || row.userId === authUser.uid && (descriptions[row.id] && descriptions[row.id].length > 6)&& (row.storageBlueprints && row.storageBlueprints.length >= 1) ? (
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
                      onClick={ () => handleClickOpenAlert(row, true) }
                      variant='contained'
                      color='success'
                      sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                    >
                      <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                    </Button>
                    {authUser.role === 9 || authUser.role === 7 ?
                      <Button
                        onClick={ () => handleClickOpenAlert(row, false) }
                        variant='contained'
                        color='error'
                        sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
                      >
                        <CancelOutlinedIcon sx={{ fontSize: 18 }} />
                      </Button>
                      : null}
                  </Container>
                </Select>
              </>
            ) : row.sendByDesigner === true ? (
              'Enviado'
            ) : (
              'Pendiente'
            )}
          </>
        )
      }
    },
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
        <AlertDialogGabinete
          open={openAlert}
          handleClose={handleCloseAlert}
          callback={writeCallback}
          approves={approve}
        ></AlertDialogGabinete>
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
        {newDescription && (
          <Dialog
            sx={{ '.MuiDialog-paper': { width: '100%' } }}
            open={!!newDescription}
            onClose={()=>setNewDescription(false)}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title'>{'Descripción'}</DialogTitle>
            <DialogContent>

                <TextField
                  sx={{ width: '100%', mt:3 }}
                  id='outlined-multiline-static'
                  label='Descripción'
                  multiline
                  value={typeof newDescription === 'string' ? newDescription : ''}
                  onChange={(e)=>handleDescriptionChange(e.target.value)}
                  rows={4}
                />

            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setNewDescription(false)}>Cancelar</Button>
              <Button onClick={()=>submitDescription()}>Enviar</Button>
            </DialogActions>
          </Dialog>)
        }
        {generateClientCode && (
        <DialogClientCodeGenerator
          open={generateClientCode}
          handleClose={handleCloseClientCodeGenerator}
          petition={petition}
          blueprint={currentRow}
          roleData={roleData}
          setBlueprintGenerated={setBlueprintGenerated}
        />
      )}
      </Box>
    </Card>
  )
}

export default TableGabinete
