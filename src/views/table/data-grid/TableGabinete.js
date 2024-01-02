import * as React from 'react'
import { useState, useEffect } from 'react'

import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { DataGridPro, esES } from '@mui/x-data-grid-pro'
import { Container } from '@mui/system'
import { Upload, CheckCircleOutline, CancelOutlined, ChevronRight, OpenInNew, AutorenewOutlined } from '@mui/icons-material'
import {
  Button,
  Select,
  Box,
  Card,
  Tooltip,
  Typography,
  Link,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent
} from '@mui/material'

import { useFirebase } from 'src/context/useFirebase'
import { unixToDate } from 'src/@core/components/unixToDate'
import AlertDialogGabinete from 'src/@core/components/dialog-warning-gabinete'
import { UploadBlueprintsDialog } from 'src/@core/components/dialog-uploadBlueprints'

// TODO: Move to firebase-functions
import { getStorage, ref, list } from 'firebase/storage'

const TableGabinete = ({ rows, role, roleData, petitionId, petition, setBlueprintGenerated, apiRef }) => {
  const [openUploadDialog, setOpenUploadDialog] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [doc, setDoc] = useState({})
  const [proyectistas, setProyectistas] = useState([])
  const [loadingProyectistas, setLoadingProyectistas] = useState(true)
  const [approve, setApprove] = useState(true)
  const { authUser, getUserData, updateBlueprint } = useFirebase()
  const [currentRow, setCurrentRow] = useState(null)
  const [fileNames, setFileNames] = useState({})
  const [remarksState, setRemarksState] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [error, setError] = useState('')

  const [hours, setHours] = useState({
    start: null,
    end: null,
    total: '',
    hours: 0,
    minutes: 0
  })

  const defaultSortingModel = [{ field: 'date', sort: 'desc' }]

  const handleOpenUploadDialog = doc => {
    setCurrentRow(doc.id)
    setDoc(doc)
    setOpenUploadDialog(true)
    setOpenDialog(true)
  }

  const handleCloseUploadDialog = () => {
    setOpenUploadDialog(false)
  }

  const handleClickOpenAlert = (doc, isApproved) => {
    setDoc(doc)
    setOpenAlert(true)
    setApprove(isApproved)
  }

  const writeCallback = async () => {
    const remarks = remarksState.length > 0 ? remarksState : false

    authUser.role === 8
      ? await updateBlueprint(petitionId, doc, approve, authUser, false, hours.total, hours.investedHours)
          .then(() => {
            setOpenAlert(false), setBlueprintGenerated(true), setHours('')
          })
          .catch(err => console.error(err), setOpenAlert(false))
      : authUser.role === 9
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
          (row.revision.charCodeAt(0) >= 65 || row.revision.charCodeAt(0) >= 48) &&
          (row.sentByDesigner === true || row.sentBySupervisor === true) &&
          row.approvedByContractAdmin === false &&
          row.approvedByDocumentaryControl === false &&
           row.approvedBySupervisor === false,
        reject:
          role === 6 &&
          row.revision !== 'iniciado' &&
          (row.revision.charCodeAt(0) >= 65 || row.revision.charCodeAt(0) >= 48) &&
          (row.sentByDesigner === true || row.sentBySupervisor === true) &&
          row.approvedByContractAdmin === false &&
          row.approvedByDocumentaryControl === false &&
           row.approvedBySupervisor === false
      },
      7: {
        approve:
          (role === 7 &&
          row.revision !== 'iniciado' &&
          (row.revision.charCodeAt(0) >= 65 || row.revision.charCodeAt(0) >= 48) &&
          row.sentByDesigner === true &&
          row.approvedBySupervisor === false &&
          row.approvedByDocumentaryControl === false &&
           row.approvedByContractAdmin === false) || ( role === 7 && isMyBlueprint && hasRequiredFields && row.sentBySupervisor === false && !row.blueprintCompleted),
        reject:
          role === 7 &&
          row.revision !== 'iniciado' &&
          (row.revision.charCodeAt(0) >= 65 || row.revision.charCodeAt(0) >= 48) &&
          row.sentByDesigner === true &&
          row.approvedBySupervisor === false &&
          row.approvedByDocumentaryControl === false && row.approvedByContractAdmin === false
      },
      8: {
        approve:
          role === 8 && isMyBlueprint && hasRequiredFields && row.sentByDesigner === false && !row.blueprintCompleted,
        reject: false
      },
      9: {
        approve:
          row.revision === 'iniciado'
            ? role === 9 && (row.sentByDesigner === true || row.sentBySupervisor === true)
            : role === 9 &&
              (row.sentByDesigner === true || row.sentBySupervisor === true) &&
              (row.approvedByContractAdmin === true || row.approvedBySupervisor === true),
        reject:
          row.revision === 'iniciado'
            ? role === 9 && (row.sentByDesigner === true || row.sentBySupervisor === true)
            : role === 9 &&
            (row.sentByDesigner === true || row.sentBySupervisor === true) &&
              (row.approvedByContractAdmin === true || row.approvedBySupervisor === true)
      }
    }

    return dictionary[role]
  }

  const statusMap = {
    Enviado: row =>
    row.sentByDesigner || row.sentBySupervisor || (row.sentByDesigner && (row.approvedByContractAdmin || row.approvedBySupervisor)),
    'Enviado a cliente': row =>
    row.sentByDesigner && row.approvedByDocumentaryControl && (row.revision.charCodeAt(0) >= 66 || row.revision.charCodeAt(0) >= 48),
    'Reanudado, send next': row => row.resumeBlueprint && !row.approvedByClient && !row.sentByDesigner,
    Aprobado: row => (row.approvedByClient && row.approvedByDocumentaryControl || row.zeroReviewCompleted),
    'Aprobado con comentarios': row => row.approvedByClient && row.approvedByDocumentaryControl && row.remarks,
    'Rechazado con Observaciones': row => !row.sentByDesigner && row.approvedByDocumentaryControl && !row.approvedByClient && row.remarks,
    'Aprobado, send Next': row => (row.approvedByDocumentaryControl && !row.sentByDesigner),
    Iniciado: row => !row.sentTime,
    Rechazado: row =>
      !row.sentByDesigner &&
      (!row.approvedByDocumentaryControl || row.approvedByContractAdmin || row.approvedBySupervisor),
  }

  const renderStatus = row => {
    for (const status in statusMap) {
      if (statusMap[status](row)) {
        return status
      }
    }

    return 'Aprobado1'
  }

  const renderButton = (row, approve, color, IconComponent, resume= false) => {
    const handleClick = () => handleClickOpenAlert(row, approve)

    return (
      <Button
        onClick={handleClick}
        variant='contained'
        color={color}
        sx={{ margin: '2px', maxWidth: '25px', maxHeight:'25px', minWidth: resume ? '120px' : '25px', minHeight: '25px' }}
      >
        <IconComponent sx={{ fontSize: 18 }} />
        {resume ? <Typography sx={{ textOverflow: 'clip' }} > Reanudar</Typography> : ''}
      </Button>
    )
  }

  const renderButtons = (row, flexDirection, canApprove, canReject, canResume  = false) => {
    return (
      <Container sx={{ display: 'flex', flexDirection: { flexDirection } }}>
        {canApprove && renderButton(row, true, 'success', CheckCircleOutline)}
        {canReject && renderButton(row, false, 'error', CancelOutlined)}
        {canResume && renderButton(row, true, 'info', AutorenewOutlined, true)}
      </Container>
    )
  }

  const checkRoleAndApproval = (role, row) => {
    if (row.revisions && row.revisions.length > 0) {
      const sortedRevisions = [...row.revisions].sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastRevision = sortedRevisions[0];

      if ('lastTransmittal' in lastRevision) {
        return (
          role === 9 &&
          row.approvedByDocumentaryControl &&
          (row.sentByDesigner === true || row.sentBySupervisor === true) &&
          (row.revision.charCodeAt(0) >= 66 || row.revision.charCodeAt(0) >= 48) && !row.blueprintCompleted
        )
      }
    }

  }

  const checkRoleAndGenerateTransmittal = (role, row) => {
    if (row.revisions && row.revisions.length > 0) {
      const sortedRevisions = [...row.revisions].sort((a, b) => new Date(b.date) - new Date(a.date));
      const lastRevision = sortedRevisions[0];

      // Caso 1: 'row' no tiene 'lastTransmittal' y se cumplen las demás condiciones
      if (!row.lastTransmittal && role === 9 && row.approvedByDocumentaryControl && row.sentByDesigner && (row.revision.charCodeAt(0) >= 66 || row.revision.charCodeAt(0) >= 48) && !row.zeroReviewCompleted) {
        return true;
      }

      // Caso 2: 'lastRevision' no tiene 'lastTransmittal' y se cumplen las demás condiciones
      if (!('lastTransmittal' in lastRevision) && role === 9 && row.approvedByDocumentaryControl && row.sentByDesigner && (row.revision.charCodeAt(0) >= 66 || row.revision.charCodeAt(0) >= 48) && !row.zeroReviewCompleted) {
        return true;
      }

    }

    return false;
  }

  const checkRoleAndResume = (role, row) => {
    return (
      role === 9 &&
      row.approvedByDocumentaryControl &&
      row.approvedByClient &&
      row.revision.charCodeAt(0) >= 48 &&
      row.blueprintCompleted === true
    )
  }

  useEffect(() => {
    if (hours.start && hours.end) {
      const workStartHour = 8 // Hora de inicio de la jornada laboral
      const workEndHour = 20 // Hora de finalización de la jornada laboral
      const millisecondsPerHour = 60 * 60 * 1000 // Milisegundos por hora

      let startDate = hours.start.clone()
      let endDate = hours.end.clone()

      // Asegurarse de que las fechas estén dentro de las horas de trabajo
      if (startDate.hour() < workStartHour) {
        startDate.hour(workStartHour).minute(0).second(0).millisecond(0)
      }
      if (endDate.hour() > workEndHour) {
        endDate.hour(workEndHour).minute(0).second(0).millisecond(0)
      } else if (endDate.hour() < workStartHour) {
        endDate.subtract(1, 'day').hour(workEndHour).minute(0).second(0).millisecond(0)
      }

      let totalHoursWithinWorkingDays = 0
      let totalMinutes = 0

      while (startDate.isBefore(endDate)) {
        const currentDayEnd = startDate.clone().hour(workEndHour)

        if (currentDayEnd.isAfter(endDate)) {
          const durationMillis = endDate.diff(startDate)
          totalHoursWithinWorkingDays += Math.floor(durationMillis / millisecondsPerHour)
          totalMinutes += Math.floor((durationMillis % millisecondsPerHour) / (60 * 1000))
        } else {
          const durationMillis = currentDayEnd.diff(startDate)
          totalHoursWithinWorkingDays += Math.floor(durationMillis / millisecondsPerHour)
        }

        startDate.add(1, 'day').hour(workStartHour)
      }

      if (totalMinutes >= 60) {
        totalHoursWithinWorkingDays += Math.floor(totalMinutes / 60)
        totalMinutes %= 60
      }

      if (totalHoursWithinWorkingDays === 0 && totalMinutes === 0) {
        setError('La hora de término debe ser superior a la hora de inicio.')

        return
      } else {
        setError(null) // Para limpiar cualquier error previo.
      }

      const startDateAsDate = hours.start.toDate();
      const endDateAsDate = hours.end.toDate();

      setHours(prevHours => ({
        ...prevHours,
        total: `${totalHoursWithinWorkingDays} horas ${totalMinutes} minutos`,
        investedHours: {
          hours: totalHoursWithinWorkingDays,
          minutes: totalMinutes,
          selectedStartDate: startDateAsDate,
          selectedEndDate: endDateAsDate
        },
      }))
    }
  }, [hours.start, hours.end])

  useEffect(() => {
    // Primera parte: obtener los nombres de los planos
    rows.map(async row => {
      const blueprintName = await getBlueprintName(row.id)
      setFileNames(prevNames => ({ ...prevNames, [row.id]: blueprintName }))
    })

    // Segunda parte: manejar la apertura del diálogo de carga
    if (openUploadDialog) {
      const filterRow = rows.find(rows => rows.id === currentRow)
      setDoc(filterRow)
      setOpenUploadDialog(true)
    }
  }, [rows, openUploadDialog, currentRow])

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

  const getFileName = (content, index) => {
    // Divide la URL en segmentos separados por '%2F'
    const urlSegments = content.split('%2F')

    // Obtiene el último segmento, que debería ser el nombre del archivo
    const encodedFileName = urlSegments[urlSegments.length - 1]

    // Divide el nombre del archivo en segmentos separados por '?'
    const fileNameSegments = encodedFileName.split('?')

    // Obtiene el primer segmento, que debería ser el nombre del archivo
    const fileName = decodeURIComponent(fileNameSegments[0])

    return fileName
  }

  const RevisionComponent = ({ row, field }) => {
    return (
      currentRow === row.id && (
        <Box sx={{ overflow: 'hidden' }}>
          {row.revisions.map(revision => {
            let fieldContent = revision[field] || 'Sin Datos'

            if (field === 'date' || field === 'sentTime') {
              fieldContent = unixToDate(revision[field].seconds)
            }

            if (field === 'storageBlueprints' || field === 'storageHlcDocuments') {
              if (fieldContent) {
                return (
                  <Typography sx={{ mt: 4, overflow: 'hidden', width: 'max-content' }} key={revision.id}>

                    <Link
                          href={fieldContent}
                          target='_blank'
                          rel='noreferrer'
                          color='inherit'
                          underline='always'
                          textOverflow='ellipsis'
                        >
                          {getFileName(fieldContent)}
                        </Link>

                  </Typography>
                )
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
      flex: 0.4,
      minWidth: 120,
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
                  onClick={() => {
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
                    {row.id || 'Sin código Procure'}
                  </Typography>
                  <Typography variant='caption'>{row.clientCode || 'Sin código MEL'}</Typography>
                  {row.id === currentRow && row.revisions.length === 0 && (
                    <Typography sx={{ mt: 1 }}>Sin eventos en historial</Typography>
                  )}
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
      flex: 0.2,
      renderCell: params => {
        const { row } = params

        return (
          <Box sx={{overflow:'hidden'}}>
            <Typography noWrap sx={{ textOverflow: 'clip' }}>
              {row.revision || 'N/A'}
            </Typography>
            <RevisionComponent row={row} field={'newRevision'} />
          </Box>
        )
      }
    },
    {
      field: 'userName',
      headerName: 'CREADO POR',
      flex: 0.25,
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
      field: 'lastTransmittal',
      headerName: 'Ultimo Transmittal',
      flex: 0.25,
      renderCell: params => {
        const { row } = params

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography noWrap sx={{ textOverflow: 'clip' }}>
              {row.lastTransmittal || 'N/A'}
            </Typography>
            <RevisionComponent row={row} field={'lastTransmittal'} />
          </Box>
        )
      }
    },
    {
      field: 'description',
      headerName: 'DESCRIPCIÓN',
      flex: 0.35,
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
                {row.description || 'Sin descripción'}
              </Typography>
            </Box>
            <RevisionComponent row={row} field={'description'} />
          </Box>
        )
      }
    },
    {
      field: 'files',
      headerName: 'ENTREGABLE',
      flex: 0.5,
      renderCell: params => {
        const { row } = params

        return (
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignContent: 'center',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Box display='inline-flex' sx={{ justifyContent: 'space-between', width: 'max-content' }}>
              {row.storageBlueprints ? (
                row.storageBlueprints.map((content, index) => (
                  <Typography key={index} noWrap sx={{ my: 'auto', textOverflow: 'clip', width: 'inherit' }}>
                    <Link
                      color='inherit'
                      key={index}
                      href={content}
                      target='_blank'
                      rel='noreferrer'
                      variant='body1'
                      noWrap
                    >
                      {getFileName(content, index)}
                    </Link>
                  </Typography>
                ))
              ) : (
                <Typography noWrap sx={{ overflow: 'hidden', my: 'auto', textOverflow: 'clip' }}>
                  Sin entregable
                </Typography>
              )}

              <IconButton
                sx={{ my: 'auto', ml: 2, p: 0 }}
                onClick={
                  row.userId === authUser.uid || authUser.role === 7 || authUser.role === 9
                    ? () => handleOpenUploadDialog(row)
                    : null
                }
              >
                {row.storageBlueprints ? null : <Upload />}
              </IconButton>
            </Box>
            <RevisionComponent row={row} field={'storageBlueprints'} />
          </Box>
        )
      }
    },
    {
      field: 'storageHlcDocuments',
      headerName: 'HLC',
      flex: 0.5,
      renderCell: params => {
        const { row } = params

        return (
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignContent: 'center',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Box display='inline-flex' sx={{ justifyContent: 'space-between', width: 'max-content' }}>
              {row.storageHlcDocuments ? (
                row.storageHlcDocuments.map((content, index) => (
                  <Typography key={index} noWrap sx={{ my: 'auto', textOverflow: 'clip', width: 'inherit' }}>
                    <Link
                      color='inherit'
                      key={index}
                      href={content}
                      target='_blank'
                      rel='noreferrer'
                      variant='body1'
                      noWrap
                    >
                      {getFileName(content, index)}
                    </Link>
                  </Typography>
                ))
              ) : (
                <Typography noWrap sx={{ overflow: 'hidden', my: 'auto', textOverflow: 'clip' }}>
                  Sin Hoja de Cálculo
                </Typography>
              )}

              <IconButton
                sx={{ my: 'auto', ml: 2, p: 0 }}
                onClick={
                  row.userId === authUser.uid || authUser.role === 7 || authUser.role === 9
                    ? () => handleOpenUploadDialog(row)
                    : null
                }
              >
                {row.storageHlcDocuments ? null : <Upload />}
              </IconButton>
            </Box>
            <RevisionComponent row={row} field={'storageHlcDocuments'} />
          </Box>
        )
      }
    },
    {
      field: 'date',
      headerName: 'Inicio',
      flex: 0.2,
      renderCell: params => {
        const { row } = params

        return (
          <Box sx={{
            width: '100%',
            overflow: 'hidden'
          }}>
            <Typography noWrap sx={{ textOverflow: 'clip' }}>
              {unixToDate(row.date.seconds)[0]}
            </Typography>
            <RevisionComponent row={row} field={'date'} />
          </Box>
        )
      }
    },
    {
      field: 'remarks',
      headerName: 'Observaciones',
      flex: 0.3,
      renderCell: params => {
        const { row } = params
        const permissionsData = permissions(row, role, authUser)
        const canApprove = permissionsData?.approve
        const canReject = permissionsData?.reject

        const flexDirection = md ? 'row' : 'column'

        const buttons = renderButtons(row, flexDirection, canApprove, canReject)

        return (
          <>
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
                alignContent: 'center',
                flexDirection: 'column',
                overflow: 'hidden'
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
              ) : (
                <Typography>
                {renderStatus(row)}
                </Typography>
              )}
              <RevisionComponent row={row} field={'remarks'} />
            </Box>
          </>
        )
      }
    },
    {
      field: 'clientApprove',
      headerName: 'Cliente',
      flex: 0.3,
      minWidth: 80,
      renderCell: params => {
        const { row } = params

        const canApprove = (row) => checkRoleAndApproval(authUser.role, row)
        const canReject = (row) => checkRoleAndApproval(authUser.role, row)
        const canGenerateBlueprint = (row) => checkRoleAndGenerateTransmittal(authUser.role, row)
        const canResume = (row) => checkRoleAndResume(authUser.role, row)

        const flexDirection = md ? 'row' : 'column'

        const buttons = renderButtons(row, flexDirection, canApprove(row), canReject(row), canResume(row))

        return (
          <>
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                justifyContent: 'space-between',
                alignContent: 'center',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {canApprove(row) || canReject(row) ? (
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
              ) : canGenerateBlueprint(row) ? 'Generar Transmittal' : canResume(row) ? (
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
  ]

  return (
    <Card sx={{ height: 'inherit' }}>
      <DataGridPro
        sx={{
          height: '100%',
          maxHeight: '1000px',
          width: '100%',
          '& .MuiDataGrid-cell--withRenderer': {
            alignItems: 'baseline'
          },
          '& .MuiDataGrid-virtualScroller': {
            minHeight: '200px'
          }
        }}
        apiRef={apiRef}
        checkboxSelection={authUser.role === 9}
        isRowSelectable={params =>
          (params.row.revision.charCodeAt(0) >= 66 || params.row.revision.charCodeAt(0) >= 48) && params.row.approvedByDocumentaryControl === true
        }
        rows={rows}
        columns={columns}
        columnVisibilityModel={{
          clientApprove: authUser.role === 9,
          storageHlcDocuments: authUser.role === 9
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

      <Dialog sx={{ '& .MuiPaper-root': { maxWidth: '1000px', width: '100%' } }} open={openDialog}>
        <DialogContent>
          <UploadBlueprintsDialog
            handleClose={handleCloseUploadDialog}
            doc={doc}
            roleData={roleData}
            petitionId={petitionId}
            setBlueprintGenerated={setBlueprintGenerated}
            currentRow={currentRow}
            petition={petition}
            checkRoleAndApproval={checkRoleAndApproval}
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
