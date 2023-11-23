import * as React from 'react'
import { useState, useEffect } from 'react'

import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { DataGrid, esES } from '@mui/x-data-grid'
import { Container } from '@mui/system'
import { Edit, Upload, AttachFile, CheckCircleOutline, CancelOutlined, ExpandMore, ChevronRight, OpenInNew } from '@mui/icons-material'
import {
  Button,
  Select,
  Box,
  Card,
  Tooltip,
  TextField,
  Typography,
  Link,
  IconButton,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent
} from '@mui/material'

import { useFirebase } from 'src/context/useFirebase'
import { unixToDate } from 'src/@core/components/unixToDate'
import AlertDialogGabinete from 'src/@core/components/dialog-warning-gabinete'
import { FullScreenDialog } from 'src/@core/components/dialog-fullsize'
import { DialogAssignProject } from 'src/@core/components/dialog-assignProject'
import { DialogClientCodeGenerator } from 'src/@core/components/dialog-clientCodeGenerator'
import { UploadBlueprintsDialog } from 'src/@core/components/dialog-uploadBlueprints'

// TODO: Move to firebase-functions
import { getStorage, ref, list } from 'firebase/storage'

const TableGabinete = ({ rows, role, roleData, petitionId, petition, setBlueprintGenerated }) => {
  const [open, setOpen] = useState(false)
  const [openUploadDialog, setOpenUploadDialog] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [doc, setDoc] = useState({})
  const [proyectistas, setProyectistas] = useState([])
  const [loadingProyectistas, setLoadingProyectistas] = useState(true)
  const [approve, setApprove] = useState(true)
  const { authUser, getUserData, updateBlueprint, addDescription, useEvents } = useFirebase()
  const [currentRow, setCurrentRow] = useState(null)
  const [generateClientCode, setGenerateClientCode] = useState(false)
  const [fileNames, setFileNames] = useState({})
  const [devolutionRemarks, setDevolutionRemarks] = useState('')
  const [openDialog, setOpenDialog] = useState(false)

  const defaultSortingModel = [{ field: 'date', sort: 'desc' }]

  const revisions = useEvents(petitionId, authUser, `blueprints/${currentRow}/revisions`)


  const handleOpenUploadDialog = doc => {
    setCurrentRow(doc.id)
    setDoc(doc)
    setOpenUploadDialog(true)
    setOpenDialog(true)
  }

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false)
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

  const writeCallback = async () => {
    const devolution = devolutionRemarks.length > 0 ? devolutionRemarks : false
    authUser.role === 9
      ? await updateBlueprint(petitionId, doc, approve, authUser, devolution)
      .then(() => {
        setOpenAlert(false), setBlueprintGenerated(true), setDevolutionRemarks('')
      })
      .catch(err => console.error(err), setOpenAlert(false))
      : await updateBlueprint(petitionId, doc, approve, authUser, devolution)
          .then(() => {
            setOpenAlert(false), setBlueprintGenerated(true), setDevolutionRemarks('')
          })
          .catch(err => console.error(err), setOpenAlert(false))
  }

  const handleCloseAlert = () => {
    setOpenAlert(false)
  }

  const storage = getStorage()

  const getBlueprintName = async id => {
    const blueprintRef = ref(storage, `/uploadedBlueprints/${id}/blueprints`)
    try {
      const res = await list(blueprintRef)

      return res?.items[0]?.name || 'No disponible'
    } catch (err) {
      console.error(err)

      return 'Error al obtener el nombre del entregable'
    }
  }

  function permissions(row, role, authUser) {
    if (!row) {
      return undefined
    }

    const isMyBlueprint = row.userId === authUser.uid

    const hasRequiredFields =
      row.description && row.clientCode && row.storageBlueprints && row.storageBlueprints.length >= 1

    const dictionary = {
      1: {
        approve: false,
        reject: false
      },
      2: {
        approve: false,
        reject: false
      },
      3: {
        approve: false,
        reject: false
      },
      4: {
        approve: role === 6 && ['B', 'C'].includes(row.revision) && row.approvedByContractAdmin === true && row.revision === 'B',
        reject: role === 6 && ['B', 'C'].includes(row.revision) && row.approvedByContractAdmin === true && row.revision === 'B'
      },
      5: {
        approve: false,
        reject: false
      },
      6: {
        approve: role === 6 && ['A', 'B', 'C', 'D'].includes(row.revision) && row.sentByDesigner === true && row.approvedByContractAdmin === false,
        reject: role === 6 && ['A', 'B', 'C', 'D'].includes(row.revision) && row.sentByDesigner === true && row.approvedByContractAdmin === false
      },
      7: {
        approve: role === 7 && ['A', 'B', 'C', 'D'].includes(row.revision) && row.sentByDesigner === true && row.approvedBySupervisor === false && row.approvedByDocumentaryControl === false,
        reject: role === 7 && ['A', 'B', 'C', 'D'].includes(row.revision) && row.sentByDesigner === true && row.approvedBySupervisor === false && row.approvedByDocumentaryControl === false
      },
      8: {
        approve: role === 8 && isMyBlueprint && hasRequiredFields && row.sentByDesigner === false,
        reject: false
      },
      9: {
        approve: row.revision === 'iniciado' ? role === 9 && row.sentByDesigner === true : role === 9 && row.sentByDesigner === true && (row.approvedByContractAdmin === true || row.approvedBySupervisor === true),
        reject: row.revision === 'iniciado' ? role === 9 && row.sentByDesigner === true : role === 9 && row.sentByDesigner === true && (row.approvedByContractAdmin === true || row.approvedBySupervisor === true)
      }
    }

    return dictionary[role]
  }

  useEffect(() => {
    rows.map(async row => {
      const blueprintName = await getBlueprintName(row.id)
      setFileNames(prevNames => ({ ...prevNames, [row.id]: blueprintName }))
    })
  }, [rows])

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
    if (openUploadDialog) {
      const filterRow = rows.find(rows => rows.id === currentRow)
      setDoc(filterRow)
      setOpenUploadDialog(true)
    }
  }, [rows])

  const RevisionComponent = ({ row, field }) => {
    return (
      currentRow === row.id && (
        <Box sx={{ overflow: 'hidden' }}>
          {revisions.map(revision => {

            let fieldContent = revision[field] || 'aaa'

            if (field === 'date' || field === 'sentTime') {
              fieldContent = unixToDate(revision[field].seconds)[0]
            }

            if (field === 'storageBlueprints') {

              if (fieldContent) {
                return (
                  <Link
                  href={fieldContent}
                  target="_blank"
                  rel="noreferrer"
                  variant='body1'
                  noWrap
                  sx={{mt:4, textOverflow:'clip', cursor: 'pointer', display: 'flex',
                  marginBlockStart: '1em',
                  marginBlockEnd: '1em',
                  marginInlineStart: 0,
                  marginInlineEnd: 0,
                  }}
                  key={revision.id}
                  color='inherit'
                  underline='always'>
                  <Box sx={{display:'inline-flex', justifyContent:'space-between', width:'100%'}}>
                  Archivo
                  <AttachFile sx={{ml:1}}/>
                    </Box>
                  </Link>
                )
              }
            }

            return (
              <Typography noWrap sx={{mt:4, textOverflow:'clip'}} key={revision.id}>
                {fieldContent || 'Sin Datos'}
              </Typography>
            )
          })}
        </Box>
      )
    )
  }

  const columns = [
    {
      field: 'title',
      headerName: 'Código Procure',
      flex: 0.32,
      minWidth: 120,
      renderCell: params => {
        const { row } = params

        return (
          <>
            <Tooltip
              title={row.id}
              placement='bottom-end'
              key={row.id}
              leaveTouchDelay={0}
              //TransitionComponent={Fade}
              TransitionProps={{ timeout: 0 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', overflow: 'hidden', width: 'inherit' }}>
              <IconButton
                  sx={{ p: 0 }}
                  id={row.id}
                  onClick={e => {
                    handleOpenUploadDialog(row)
                  }}
                >
                <OpenInNew/>
                </IconButton>
                <IconButton
                  sx={{ p: 0 }}
                  id={row.id}
                  onClick={e => {
                    setCurrentRow(prev => (prev === row.id ? false : e.target.parentElement.id))
                  }}
                >
                <ChevronRight sx={{transform: currentRow === row.id ? 'rotate(90deg)' : ''}}/>
                </IconButton>
                <Typography
                  noWrap
                  sx={{
                    textOverflow:'clip',
                    textDecoration: 'none',
                    transition: 'text-decoration 0.2s',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {row.id}
                </Typography>
              </Box>
            </Tooltip>
          </>
        )
      }
    },
    {
      field: 'clientCode',
      headerName: 'Código MEL',
      flex: 0.5,
      minWidth: 120,
      renderCell: params => {
        const { row } = params

        if (row.clientCode) {
          return (
            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              <Typography noWrap sx={{ overflow: 'hidden', textOverflow:'clip'}}>{row.clientCode || 'Sin descripción'}</Typography>
            </Box>
          )
        } else {
          return (
            <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              <Edit
                fontSize='small'
                sx={{ ml: 2 }}
                onClick={() => {
                  setGenerateClientCode(true)
                  setCurrentRow(row.id)
                }}
              ></Edit>
            </Box>
          )
        }
      }
    },
    {
      field: 'revision',
      headerName: 'REVISION',
      flex: 0.1,
      minWidth: 120,
      renderCell: params => {
        const { row } = params

        return (
          <div>
            <Typography noWrap sx={{textOverflow:'clip'}}>{row.revision || 'N/A'}</Typography>
            <RevisionComponent row={row} field={'newRevision'} />
          </div>
        )
      }
    },
    {
      field: 'userName',
      headerName: 'CREADO POR',
      minWidth: 120,
      flex: 0.2,
      renderCell: params => {
        const { row } = params

        return (
          <Box sx={{overflow: 'hidden'}}>
            <Typography noWrap sx={{textOverflow:'clip'}}>{row.userName || 'N/A'}</Typography>
            <RevisionComponent row={row} field={'userName'} />
          </Box>
        )
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

        return (
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignContent: 'center',
              flexDirection: 'column'
            }}
          >
            <Box display='inline-flex' sx={{justifyContent:'space-between'}}>
              <Typography noWrap sx={{ overflow: 'hidden', my: 'auto',textOverflow:'clip' }}>{row.description || 'Sin descripción'}</Typography>
              <IconButton
                sx={{ ml: 2, p: 0 }}
                onClick={() => {
                  handleOpenUploadDialog(row)
                  setCurrentRow(row.id)
                }}
              >
                <Edit />
              </IconButton>
            </Box>
            <RevisionComponent row={row} field={'description'} />
          </Box>
        )
      }
    },
    {
      field: 'start',
      headerName: 'ENTREGABLE',
      flex: 0.3,
      minWidth: 120,
      renderCell: params => {
        const { row } = params

        return (
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignContent: 'center',
              flexDirection: 'column'
            }}
          >
            <Box display='inline-flex' sx={{justifyContent:'space-between'}}>
              <Typography noWrap sx={{ overflow: 'hidden', my: 'auto', textOverflow:'clip'}}>{row.storageBlueprints ? fileNames[row.id] : 'Sin entregable'}</Typography>
              <IconButton
                sx={{ my: 'auto', ml: 2, p: 0 }}
                onClick={
                  row.userId === authUser.uid || authUser.role === 7 || authUser.role === 9
                    ? () => handleOpenUploadDialog(row)
                    : null
                }
              >
                {row.storageBlueprints ? <AttachFile /> : <Upload />}
              </IconButton>
            </Box>
            <RevisionComponent row={row} field={'storageBlueprints'} />
          </Box>
        )
      }
    },
    {
      field: 'date',
      headerName: 'Inicio',
      flex: 0.1,
      minWidth: 120,
      renderCell: params => {
        const { row } = params

        return (
          <div>
            <Typography noWrap sx={{textOverflow:'clip'}}>{unixToDate(row.date.seconds)[0]}</Typography>
            <RevisionComponent row={row} field={'date'} />
          </div>
        )
      }
    },
    {
      field: 'remarks',
      headerName: 'Observaciones',
      flex: 0.1,
      minWidth: 120,
      renderCell: params => {
        const { row } = params
        const permissionsData = permissions(row, role, authUser)
        const canApprove = permissionsData.approve
        const canReject = permissionsData.reject

        const flexDirection = md ? 'row' : 'column'

        const renderButtons = (
          <Container sx={{ display: 'flex', flexDirection: { flexDirection } }}>
            {canApprove && (
              <Button
                onClick={() => handleClickOpenAlert(row, true)}
                variant='contained'
                color='success'
                sx={{ margin: '2px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
              >
                <CheckCircleOutline sx={{ fontSize: 18 }} />
              </Button>
            )}
            {canReject && (
              <Button
                onClick={() => handleClickOpenAlert(row, false)}
                variant='contained'
                color='error'
                sx={{ margin: '2px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
              >
                <CancelOutlined sx={{ fontSize: 18 }} />
              </Button>
            )}
          </Container>
        )

        return (
          <>
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignContent: 'center',
              flexDirection: 'column'
            }}
          >
            {canApprove || canReject ? (
              md ? (
                renderButtons
              ) : (
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
                  {renderButtons}
                </Select>
              )
            ) : row.sentByDesigner === true || row.sentByDesigner === true && (row.approvedByContractAdmin === true || row.approvedBySupervisor === true) ? (
              'Enviado'
            ) : row.sentByDesigner === false && (row.approvedByContractAdmin === true || row.approvedBySupervisor === true) ||
            row.revision !== 'iniciado' && row.sentByDesigner === false && row.approvedByDocumentaryControl === false? (
              'Rechazado'
            )
            : row.approvedByClient === true || row.revision === '0' ? 'Aprobado' : (
              'No enviado'
            )}
            <RevisionComponent row={row} field={'devolutionRemarks'} />

          </Box>

          </>
        )
      }
    }, authUser.role === 9 ? {
      field: 'clientAprove',
      headerName: 'Cliente',
      flex: 0.1,
      minWidth: 120,

      renderCell: params => {
        const { row } = params
        const canApprove = role === 9 && row.approvedByDocumentaryControl && row.sentByDesigner && row.revision.charCodeAt(0) >= 66
        const canReject = role === 9 && row.approvedByDocumentaryControl && row.sentByDesigner && row.revision.charCodeAt(0) >= 66

        const flexDirection = md ? 'row' : 'column'

        const renderButtons = (
          <Container sx={{ display: 'flex', flexDirection: { flexDirection } }}>
            {canApprove && (
              <Button
                onClick={() => handleClickOpenAlert(row, true)}
                variant='contained'
                color='success'
                sx={{ margin: '2px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
              >
                <CheckCircleOutline sx={{ fontSize: 18 }} />
              </Button>
            )}
            {canReject && (
              <Button
                onClick={() => handleClickOpenAlert(row, false)}
                variant='contained'
                color='error'
                sx={{ margin: '2px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
              >
                <CancelOutlined sx={{ fontSize: 18 }} />
              </Button>
            )}
          </Container>
        )

        return (
          <>
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignContent: 'center',
              flexDirection: 'column'
            }}
          >
            {canApprove || canReject ? (
              md ? (
                renderButtons
              ) : (
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
                  {renderButtons}
                </Select>
              )
            ) : ''}

          </Box>

          </>
        )

      }
    } : ''
  ]

  return (
    <Card sx={{ height: 'inherit' }}>
      <DataGrid
        sx={{
          height: '100%',
          width: '100%',
          '& .MuiDataGrid-cell--withRenderer': {
            alignItems: 'baseline'
          }
        }}
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
        getRowHeight={row => (row.id === currentRow ? 'auto' : 60.44)}
      />
      <AlertDialogGabinete
        open={openAlert}
        handleClose={handleCloseAlert}
        callback={writeCallback}
        approves={approve}
        authUser={authUser}
        setDevolutionRemarks = {setDevolutionRemarks}
        devolutionRemarks={devolutionRemarks}
      ></AlertDialogGabinete>
      {loadingProyectistas ? (
        <p>Loading...</p>
      ) : (
        <DialogAssignProject open={open} handleClose={handleClose} doc={doc} proyectistas={proyectistas} />
      )}
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
        <Dialog
        sx={{ '& .MuiPaper-root': { maxWidth: '1000px', width:'100%' } }}
        open={openDialog}>
          <DialogContent>
          <UploadBlueprintsDialog
          handleClose={handleCloseUploadDialog}
          doc={doc}
          roleData={roleData}
          petitionId={petitionId}
          setBlueprintGenerated={setBlueprintGenerated}
          currentRow={currentRow}
        />
          </DialogContent >
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
    </Card>
  )
}

export default TableGabinete
