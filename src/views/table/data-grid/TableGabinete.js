import * as React from 'react'
import { useState, useEffect } from 'react'

import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { DataGrid, esES } from '@mui/x-data-grid'
import { Container } from '@mui/system'
import {
  Edit,
  Upload,
  AttachFile,
  CheckCircleOutline,
  CancelOutlined,
  ExpandMore,
  ChevronRight,
  OpenInNew
} from '@mui/icons-material'
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
  const [remarksState, setRemarksState] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [error, setError] = useState('')

  const [hours, setHours] = useState({
    start: null,
    end: null,
    total: '',
    hours: 0,
    minutes: 0,
  })

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
    const remarks = remarksState.length > 0 ? remarksState : false

    authUser.role === 8 ? await updateBlueprint(petitionId, doc, approve, authUser, false, hours.total)
    .then(() => {
      setOpenAlert(false), setBlueprintGenerated(true), setHours('')
    })
    .catch(err => console.error(err), setOpenAlert(false)) :
    authUser.role === 9
      ? await updateBlueprint(petitionId, doc, approve, authUser, remarks)
          .then(() => {
            setOpenAlert(false), setBlueprintGenerated(true), setRemarksState('')
          })
          .catch(err => console.error(err), setOpenAlert(false))
      : await updateBlueprint(petitionId, doc, approve, authUser, remarks)
          .then(() => {
            setOpenAlert(false), setBlueprintGenerated(true), setRemarksState('')
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
      6: {
        approve:
          role === 6 &&
          row.revision !== 'iniciado' &&
          row.revision.charCodeAt(0) >= 65 &&
          row.sentByDesigner === true &&
          row.approvedByContractAdmin === false,
        reject:
          role === 6 &&
          row.revision !== 'iniciado' &&
          row.revision.charCodeAt(0) >= 65 &&
          row.sentByDesigner === true &&
          row.approvedByContractAdmin === false
      },
      7: {
        approve:
          role === 7 &&
          row.revision !== 'iniciado' &&
          row.revision.charCodeAt(0) >= 65 &&
          row.sentByDesigner === true &&
          row.approvedBySupervisor === false &&
          row.approvedByDocumentaryControl === false,
        reject:
          role === 7 &&
          row.revision !== 'iniciado' &&
          row.revision.charCodeAt(0) >= 65 &&
          row.sentByDesigner === true &&
          row.approvedBySupervisor === false &&
          row.approvedByDocumentaryControl === false
      },
      8: {
        approve:
          role === 8 && isMyBlueprint && hasRequiredFields && row.sentByDesigner === false && row.revision !== '0',
        reject: false
      },
      9: {
        approve:
          row.revision === 'iniciado'
            ? role === 9 && row.sentByDesigner === true
            : role === 9 &&
              row.sentByDesigner === true &&
              (row.approvedByContractAdmin === true || row.approvedBySupervisor === true),
        reject:
          row.revision === 'iniciado'
            ? role === 9 && row.sentByDesigner === true
            : role === 9 &&
              row.sentByDesigner === true &&
              (row.approvedByContractAdmin === true || row.approvedBySupervisor === true)
      }
    }

    return dictionary[role]
  }

  const statusMap = {
    'Aprobado con comentarios': row => row.approvedByClient && row.sentByDesigner && row.remarks,
    'Aprobado': row => (row.approvedByClient && row.sentByDesigner) || row.revision === '0',
    'Enviado': row => row.sentByDesigner || (row.sentByDesigner && (row.approvedByContractAdmin || row.approvedBySupervisor)),
    'Rechazado con Observaciones': row => !row.sentByDesigner && !row.approvedByDocumentaryControl && row.remarks,
    'Rechazado': row => !row.sentByDesigner && (!row.approvedByDocumentaryControl || row.approvedByContractAdmin || row.approvedBySupervisor),
    'Revisión 0': row => row.canUpdateTo0,
  };

  const renderStatus = (row) => {
    for (const status in statusMap) {
      if (statusMap[status](row)) {
        return status;
      }
    }

    return 'No enviado';
  }

  const renderButton = (row, approve, color, IconComponent) => {
    const handleClick = () => handleClickOpenAlert(row, approve);

    return (
      <Button
        onClick={handleClick}
        variant='contained'
        color={color}
        sx={{ margin: '2px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
      >
        <IconComponent sx={{ fontSize: 18 }} />
      </Button>
    );
  }

  const renderButtons = (row, flexDirection, canApprove, canReject, canUpdate = false ) => {
    return (
      <Container sx={{ display: 'flex', flexDirection: { flexDirection } }}>
        {canApprove && renderButton(row, true, 'success', CheckCircleOutline)}
        {canReject && renderButton(row, false, 'error', CancelOutlined)}
        {canUpdate && renderButton(row, true, 'warning', CheckCircleOutline)}
      </Container>
    );
  }

  const checkRoleAndApproval = (role, row) => {
    return role === 9 && row.approvedByDocumentaryControl && row.sentByDesigner && row.revision.charCodeAt(0) >= 66 && !row.approvedByClient;
  }

  const checkRoleAndUpdate = (role, row) => {
    return role === 9 && row.approvedByDocumentaryControl && row.approvedByClient && row.revision.charCodeAt(0) >= 66 && row.canUpdateTo0 === false;
  }

  useEffect(() => {
    if (hours.start && hours.end) {
      const workStartHour = 8; // Hora de inicio de la jornada laboral
      const workEndHour = 20; // Hora de finalización de la jornada laboral
      const millisecondsPerHour = 60 * 60 * 1000; // Milisegundos por hora

      let startDate = hours.start.clone();
      let endDate = hours.end.clone();

      // Asegurarse de que las fechas estén dentro de las horas de trabajo
      if (startDate.hour() < workStartHour) {
        startDate.hour(workStartHour).minute(0).second(0).millisecond(0);
      }
      if (endDate.hour() > workEndHour) {
        endDate.hour(workEndHour).minute(0).second(0).millisecond(0);
      } else if (endDate.hour() < workStartHour) {
        endDate.subtract(1, 'day').hour(workEndHour).minute(0).second(0).millisecond(0);
      }

      let totalHoursWithinWorkingDays = 0;
      let totalMinutes = 0;

      while (startDate.isBefore(endDate)) {
        const currentDayEnd = startDate.clone().hour(workEndHour);

        if (currentDayEnd.isAfter(endDate)) {
          const durationMillis = endDate.diff(startDate);
          totalHoursWithinWorkingDays += Math.floor(durationMillis / millisecondsPerHour);
          totalMinutes += Math.floor((durationMillis % millisecondsPerHour) / (60 * 1000));
        } else {
          const durationMillis = currentDayEnd.diff(startDate);
          totalHoursWithinWorkingDays += Math.floor(durationMillis / millisecondsPerHour);
        }

        startDate.add(1, 'day').hour(workStartHour);
      }

      if (totalMinutes >= 60) {
        totalHoursWithinWorkingDays += Math.floor(totalMinutes / 60);
        totalMinutes %= 60;
      }

      if (totalHoursWithinWorkingDays === 0 && totalMinutes === 0) {
        setError('La hora de término debe ser superior a la hora de inicio.');

        return;
      } else {
        setError(null); // Para limpiar cualquier error previo.
      }

      setHours(prevHours => ({
        ...prevHours,
        total: `${totalHoursWithinWorkingDays} horas ${totalMinutes} minutos`,
        hours: totalHoursWithinWorkingDays,
        minutes: totalMinutes,
      }));
    }
  }, [hours.start, hours.end]);

  useEffect(() => {
    // Primera parte: obtener los nombres de los planos
    rows.map(async row => {
      const blueprintName = await getBlueprintName(row.id);
      setFileNames(prevNames => ({ ...prevNames, [row.id]: blueprintName }));
    });

    // Segunda parte: manejar la apertura del diálogo de carga
    if (openUploadDialog) {
      const filterRow = rows.find(rows => rows.id === currentRow);
      setDoc(filterRow);
      setOpenUploadDialog(true);
    }
  }, [rows, openUploadDialog, currentRow]);

  const theme = useTheme()
  const md = useMediaQuery(theme.breakpoints.up('md'))

  useEffect(() => {
    const fetchProyectistas = async () => {
      const resProyectistas = await getUserData('getUserProyectistas', null, authUser)
      setProyectistas(resProyectistas)
      setLoadingProyectistas(false)
    }

    fetchProyectistas()
  }, [authUser.shift])


  const RevisionComponent = ({ row, field }) => {
    return (
      currentRow === row.id && (
        <Box sx={{ overflow: 'hidden' }}>
          {revisions.map(revision => {
            let fieldContent = revision[field] || 'aaa'

            if (field === 'date' || field === 'sentTime') {
              fieldContent = unixToDate(revision[field].seconds)
            }

            if (field === 'storageBlueprints') {

              if (fieldContent) {
                return fieldContent.map((content, index) => {
                  // Divide la URL en segmentos separados por '%2F'
                  const urlSegments = content.split('%2F');

                  // Obtiene el último segmento, que debería ser el nombre del archivo
                  const encodedFileName = urlSegments[urlSegments.length - 1];

                  // Divide el nombre del archivo en segmentos separados por '?'
                  const fileNameSegments = encodedFileName.split('?');

                  // Obtiene el primer segmento, que debería ser el nombre del archivo
                  const fileName = decodeURIComponent(fileNameSegments[0]);

                  return (
                    <Link
                      href={content}
                      target='_blank'
                      rel='noreferrer'
                      variant='body1'
                      noWrap
                      sx={{
                        mt: 4,
                        textOverflow: 'clip',
                        cursor: 'pointer',
                        display: 'flex',
                        marginBlockStart: '1em',
                        marginBlockEnd: '1em',
                        marginInlineStart: 0,
                        marginInlineEnd: 0
                      }}
                      key={index}
                      color='inherit'
                      underline='always'
                    >
                      <Box sx={{ display: 'inline-flex', justifyContent: 'space-between', width: '100%' }}>
                        {fileName}
                        <AttachFile sx={{ ml: 1 }} />
                      </Box>
                    </Link>
                  )
                });
              }
            }

            if (field === 'date') {
              return (
                <Typography noWrap sx={{ mt: 4, textOverflow: 'clip' }} key={revision.id}>
                  {fieldContent[0] || 'Sin Datos'}
                </Typography>
              )
            }

            return (
              <Typography noWrap sx={{ mt: 4, textOverflow: 'clip' }} key={revision.id}>
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
      flex:0.3,
      headerName: 'Código Procure / MEL',
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
                  <OpenInNew />
                </IconButton>
                <IconButton
                  sx={{ p: 0 }}
                  id={row.id}
                  onClick={e => {
                    setCurrentRow(prev => (prev === row.id ? false : e.target.parentElement?.id))
                  }}
                >
                  <ChevronRight sx={{ transform: currentRow === row.id ? 'rotate(90deg)' : '' }} />
                </IconButton>
                <Box>
                <Typography
                  noWrap
                  sx={{
                    textOverflow: 'clip',
                    textDecoration: 'none',
                    transition: 'text-decoration 0.2s',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {row.id}
                </Typography>
                <Typography variant='caption'>{row.clientCode}</Typography>
                </Box>
              </Box>
            </Tooltip>
          </>
        )
      }
    },
    {
      field: 'revision',
      headerName: 'REVISION',
      renderCell: params => {
        const { row } = params

        return (
          <div>
            <Typography noWrap sx={{ textOverflow: 'clip' }}>
              {row.revision || 'N/A'}
            </Typography>
            <RevisionComponent row={row} field={'newRevision'} />
          </div>
        )
      }
    },
    {
      field: 'userName',
      headerName: 'CREADO POR',
      flex:0.1,
      renderCell: params => {
        const { row } = params

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography noWrap sx={{ textOverflow: 'clip' }}>
              {row.userName || 'N/A'}
            </Typography>
            <RevisionComponent row={row} field={'userName'} />
          </Box>
        )
      }
    },
    {
      field: 'description',
      headerName: 'DESCRIPCIÓN',
      flex:0.1,
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
            <Box display='inline-flex' sx={{ justifyContent: 'space-between' }}>
              <Typography noWrap sx={{ overflow: 'hidden', my: 'auto', textOverflow: 'clip' }}>
                {row.description || 'Sin descripción'}
              </Typography>
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
      flex:0.2,
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
            <Box display='inline-flex' sx={{ justifyContent: 'space-between' }}>
              <Typography noWrap sx={{ overflow: 'hidden', my: 'auto', textOverflow: 'clip' }}>
                {row.storageBlueprints ? fileNames[row.id] : 'Sin entregable'}
              </Typography>
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
      renderCell: params => {
        const { row } = params

        return (
          <div>
            <Typography noWrap sx={{ textOverflow: 'clip' }}>
              {unixToDate(row.date.seconds)[0]}
            </Typography>
            <RevisionComponent row={row} field={'date'} />
          </div>
        )
      }
    },
    {
      field: 'remarks',
      headerName: 'Observaciones',
      flex:0.15,
      renderCell: params => {
        const { row } = params
        const permissionsData = permissions(row, role, authUser)
        const canApprove = permissionsData.approve
        const canReject = permissionsData.reject

        const flexDirection = md ? 'row' : 'column'

        const buttons = renderButtons(row, flexDirection, canApprove, canReject );

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
                    buttons
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
                      {buttons}
                    </Select>
                  )
                ) : renderStatus(row)
              }
              <RevisionComponent row={row} field={'remarks'} />
            </Box>
          </>
        )
      }
    },
    authUser.role === 9
      ? {
          field: 'clientAprove',
          headerName: 'Cliente',

          renderCell: params => {
            const { row } = params

            const canApprove = checkRoleAndApproval(authUser.role, row);
            const canReject = checkRoleAndApproval(authUser.role, row);
            const canUpdate = checkRoleAndUpdate(authUser.role, row);

            const flexDirection = md ? 'row' : 'column'

            const buttons = renderButtons(row, flexDirection, canApprove, canReject, canUpdate);

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
                      buttons
                    ) : (
                      <Select
                        labelId='demo-simple-select-label'
                        id='demo-simple-select'
                        size='small'
                        IconComponent={() => <MoreHorizIcon />}
                        sx={{
                          '& .MuiSvgIcon-root': {
                            position: 'absolute',
                            margin: '20%',
                            pointerEvents: 'none !important'
                          },
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                          '& .MuiSelect-select': { backgroundColor: theme.palette.customColors.tableHeaderBg },
                          '& .MuiList-root': { display: 'flex', flexDirection: 'column' }
                        }}
                      >
                        {buttons}
                      </Select>
                    )
                  ) : canUpdate ? (
                    md ? (
                      buttons
                    ) : (
                      <Select
                        labelId='demo-simple-select-label'
                        id='demo-simple-select'
                        size='small'
                        IconComponent={() => <MoreHorizIcon />}
                        sx={{
                          '& .MuiSvgIcon-root': {
                            position: 'absolute',
                            margin: '20%',
                            pointerEvents: 'none !important'
                          },
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                          '& .MuiSelect-select': { backgroundColor: theme.palette.customColors.tableHeaderBg },
                          '& .MuiList-root': { display: 'flex', flexDirection: 'column' }
                        }}
                      >
                        {buttons}
                      </Select>
                    )
                  ) : (
                    ''
                  )}
                </Box>
              </>
            )
          }
        }
      : ''
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
        getRowHeight={row => (row.id === currentRow ? 'auto' : 'auto')}
      />
      <AlertDialogGabinete
        open={openAlert}
        handleClose={handleCloseAlert}
        callback={writeCallback}
        approves={approve}
        authUser={authUser}
        setRemarksState={setRemarksState}
        blueprint={doc}
        hours={hours}
        setHours={setHours}
        error={error}
        setError={setError}
      ></AlertDialogGabinete>

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
      <Dialog sx={{ '& .MuiPaper-root': { maxWidth: '1000px', width: '100%' } }} open={openDialog}>
        <DialogContent>
          <UploadBlueprintsDialog
            handleClose={handleCloseUploadDialog}
            doc={doc}
            roleData={roleData}
            petitionId={petitionId}
            setBlueprintGenerated={setBlueprintGenerated}
            currentRow={currentRow}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default TableGabinete
