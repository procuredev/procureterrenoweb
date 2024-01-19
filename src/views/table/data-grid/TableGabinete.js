import * as React from 'react'
import { useState, useEffect } from 'react'

import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { GridToolbar, DataGridPremium, esES } from '@mui/x-data-grid-premium'

import { Container } from '@mui/system'
import { Upload, CheckCircleOutline, CancelOutlined, OpenInNew, AutorenewOutlined } from '@mui/icons-material'
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

  const [drawingTimeSelected, setDrawingTimeSelected] = useState({
    start: null,
    end: null,
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
      ? await updateBlueprint(petitionId, doc, approve, authUser, false, drawingTimeSelected.investedHours)
          .then(() => {
            setOpenAlert(false), setBlueprintGenerated(true), setDrawingTimeSelected('')
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
            setOpenAlert(false), setBlueprintGenerated(true), setRemarksState(''), setDrawingTimeSelected('')
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
            row.approvedByContractAdmin === false) ||
          (role === 7 &&
            isMyBlueprint &&
            hasRequiredFields &&
            row.sentBySupervisor === false &&
            !row.blueprintCompleted),
        reject:
          role === 7 &&
          row.revision !== 'iniciado' &&
          (row.revision.charCodeAt(0) >= 65 || row.revision.charCodeAt(0) >= 48) &&
          row.sentByDesigner === true &&
          row.approvedBySupervisor === false &&
          row.approvedByDocumentaryControl === false &&
          row.approvedByContractAdmin === false
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
      row.sentByDesigner ||
      row.sentBySupervisor ||
      (row.sentByDesigner && (row.approvedByContractAdmin || row.approvedBySupervisor)),
    'Enviado a cliente': row =>
      row.sentByDesigner &&
      row.approvedByDocumentaryControl &&
      (row.revision.charCodeAt(0) >= 66 || row.revision.charCodeAt(0) >= 48),
    'Reanudado, send next': row => row.resumeBlueprint && !row.approvedByClient && !row.sentByDesigner,
    Aprobado: row => (row.approvedByClient && row.approvedByDocumentaryControl) || row.zeroReviewCompleted,
    'Aprobado con comentarios': row => row.approvedByClient && row.approvedByDocumentaryControl && row.remarks,
    'Rechazado con Observaciones': row =>
      !row.sentByDesigner && row.approvedByDocumentaryControl && !row.approvedByClient && row.remarks,
    'Aprobado, send Next': row => row.approvedByDocumentaryControl && !row.sentByDesigner && row.revision === 'A',
    Iniciado: row => !row.sentTime,
    Rechazado: row =>
      (!row.sentByDesigner &&
        (!row.approvedByDocumentaryControl || row.approvedByContractAdmin || row.approvedBySupervisor)) ||
      (row.approvedByDocumentaryControl &&
        !row.sentByDesigner &&
        (row.revision.charCodeAt(0) >= 66 || row.revision.charCodeAt(0) >= 48))
  }

  const renderStatus = row => {
    for (const status in statusMap) {
      if (statusMap[status](row)) {
        return status
      }
    }

    return 'Aprobado1'
  }

  const renderButton = (row, approve, color, IconComponent, resume = false) => {
    const handleClick = () => handleClickOpenAlert(row, approve)

    return (
      <Button
        onClick={handleClick}
        variant='contained'
        color={color}
        sx={{
          margin: '2px',
          maxWidth: '25px',
          maxHeight: '25px',
          minWidth: resume ? '120px' : '25px',
          minHeight: '25px'
        }}
      >
        <IconComponent sx={{ fontSize: 18 }} />
        {resume ? <Typography sx={{ textOverflow: 'clip' }}> Reanudar</Typography> : ''}
      </Button>
    )
  }

  const renderButtons = (row, flexDirection, canApprove, canReject, canResume = false) => {
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
      const sortedRevisions = [...row.revisions].sort((a, b) => new Date(b.date) - new Date(a.date))
      const lastRevision = sortedRevisions[0]

      if (
        'lastTransmittal' in lastRevision &&
        role === 9 &&
        row.approvedByDocumentaryControl &&
        (row.sentByDesigner === true || row.sentBySupervisor === true) &&
        (row.revision.charCodeAt(0) >= 66 || row.revision.charCodeAt(0) >= 48) &&
        !row.blueprintCompleted
      ) {
        return true
      }
    }

    return false
  }

  const checkRoleAndGenerateTransmittal = (role, row) => {
    if (row.revisions && row.revisions.length > 0) {
      const sortedRevisions = [...row.revisions].sort((a, b) => new Date(b.date) - new Date(a.date))
      const lastRevision = sortedRevisions[0]

      // Caso 1: 'row' no tiene 'lastTransmittal' y se cumplen las demás condiciones
      if (
        !row.lastTransmittal &&
        role === 9 &&
        row.approvedByDocumentaryControl &&
        (row.sentByDesigner === true || row.sentBySupervisor === true) &&
        (row.revision.charCodeAt(0) >= 66 || row.revision.charCodeAt(0) >= 48) &&
        !row.blueprintCompleted
      ) {
        return true
      }

      // Caso 2: 'lastRevision' no tiene 'lastTransmittal' y se cumplen las demás condiciones
      if (
        !('lastTransmittal' in lastRevision) &&
        role === 9 &&
        row.approvedByDocumentaryControl &&
        (row.sentByDesigner === true || row.sentBySupervisor === true) &&
        (row.revision.charCodeAt(0) >= 66 || row.revision.charCodeAt(0) >= 48) &&
        !row.blueprintCompleted
      ) {
        return true
      }
    }

    return false
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
    if (drawingTimeSelected.start && drawingTimeSelected.end) {
      const workStartHour = 8 // Hora de inicio de la jornada laboral
      const workEndHour = 20 // Hora de finalización de la jornada laboral
      const millisecondsPerHour = 60 * 60 * 1000 // Milisegundos por hora

      let startDate = drawingTimeSelected.start.clone()
      let endDate = drawingTimeSelected.end.clone()

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

      const startDateAsDate = drawingTimeSelected.start.toDate()
      const endDateAsDate = drawingTimeSelected.end.toDate()

      setDrawingTimeSelected(prevHours => ({
        ...prevHours,
        investedHours: {
          hours: totalHoursWithinWorkingDays,
          minutes: totalMinutes,
          selectedStartDate: startDateAsDate,
          selectedEndDate: endDateAsDate
        }
      }))
    }
  }, [drawingTimeSelected.start, drawingTimeSelected.end])

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

  const RevisionComponent = ({ row, authUser }) => {
    return row.revisions.map((revision, index) => {
      const date = new Date(revision.date.seconds * 1000)
      const formattedDate = date.toISOString().split('T')[0].split('-').reverse().join('/')

      return (
        <Box
          key={index}
          sx={{
            display: 'inline-flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            width: '100%',
            alignContent: 'center',
            overflow: 'hidden',
            backgroundColor: 'inherit',
            padding: 1,
            margin: 2,
            borderRadius: 1,
            gap: 5
          }}
        >
          {authUser.role === 9 && <Box sx={{ flex: 0.07, overflow: 'hidden', height: 20 }}></Box>}
          <Box sx={{ flex: role === 9 ? 0.16 : 0.35, overflow: 'hidden', height: 20 }}></Box>
          <Box sx={{ flex: role === 9 ? 0.05 : 0.07, overflow: 'hidden', height: 20 }}>
            <Typography>{revision.newRevision}</Typography>
          </Box>
          <Box sx={{ flex: role === 9 ? 0.1 : 0.17, overflow: 'hidden', height: 20 }}>
            <Typography>{revision.userName}</Typography>
          </Box>
          {authUser.role === 9 && (
            <Box sx={{ flex: role === 9 ? 0.12 : 0.25, overflow: 'hidden', height: 20 }}>
              <Typography>{revision.lastTransmittal}</Typography>
            </Box>
          )}
          <Box sx={{ flex: role === 9 ? 0.12 : 0.25, overflow: 'hidden', height: 20 }}>
            <Typography>{revision.description}</Typography>
          </Box>
          <Box sx={{ flex: role === 9 ? 0.15 : 0.44, overflow: 'hidden', height: 20 }}>
            <Typography>
              <Link
                color='inherit'
                key={index}
                href={revision.storageBlueprints}
                target='_blank'
                rel='noreferrer'
                variant='body1'
                noWrap
              >
                {getFileName(revision.storageBlueprints)}
              </Link>
            </Typography>
          </Box>
          {authUser.role === 9 && (
            <Box sx={{ flex: role === 9 ? 0.09 : 0.5, overflow: 'hidden', height: 20 }}>
              <Typography>
                {revision.storageHlcDocuments ? (
                  <Link
                    color='inherit'
                    key={index}
                    href={revision.storageHlcDocuments}
                    target='_blank'
                    rel='noreferrer'
                    variant='body1'
                    noWrap
                  >
                    {getFileName(revision.storageHlcDocuments)}
                  </Link>
                ) : (
                  ''
                )}
              </Typography>
            </Box>
          )}
          <Box sx={{ flex: role === 9 ? 0.09 : 0.1, overflow: 'hidden', height: 20 }}>
            <Typography>{formattedDate}</Typography>
          </Box>
          <Box sx={{ flex: role === 9 ? 0.12 : 0.18, overflow: 'hidden', height: 20 }}>
            <Typography>{revision.remarks}</Typography>
          </Box>
          {authUser.role === 9 && <Box sx={{ flex: role === 9 ? 0.06 : 0.3, overflow: 'hidden', height: 20 }}></Box>}
        </Box>
      )
    })
  }

  const columns = [
    {
      field: 'title',
      flex: role === 9 ? 0.15 : 0.35,
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
      flex: role === 9 ? 0.06 : 0.1,
      renderCell: params => {
        const { row } = params

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography noWrap sx={{ textOverflow: 'clip' }}>
              {row.revision || 'N/A'}
            </Typography>
          </Box>
        )
      }
    },
    {
      field: 'userName',
      headerName: 'CREADO POR',
      flex: role === 9 ? 0.1 : 0.2,
      renderCell: params => {
        const { row } = params

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography noWrap sx={{ textOverflow: 'clip' }}>
              {row.userName || 'N/A'}
            </Typography>
          </Box>
        )
      }
    },
    {
      field: 'lastTransmittal',
      headerName: 'Ultimo Transmittal',
      flex: role === 9 ? 0.12 : 0.25,
      renderCell: params => {
        const { row } = params

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography noWrap sx={{ textOverflow: 'clip' }}>
              {row.lastTransmittal || 'N/A'}
            </Typography>
          </Box>
        )
      }
    },
    {
      field: 'description',
      headerName: 'DESCRIPCIÓN',
      flex: role === 9 ? 0.12 : 0.3,
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
          </Box>
        )
      }
    },
    {
      field: 'files',
      headerName: 'ENTREGABLE',
      flex: role === 9 ? 0.15 : 0.5,
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
                  (authUser.uid === row.userId && !row.sentByDesigner) ||
                  ((authUser.role === 6 || authUser.role === 7) &&
                    row.sentByDesigner &&
                    !row.approvedByDocumentaryControl) ||
                  (authUser.role === 9 &&
                    (row.approvedBySupervisor ||
                      row.approvedByContractAdmin ||
                      (row.approvedByDocumentaryControl && row.sentByDesigner)))
                    ? //row.userId === authUser.uid || authUser.role === 7 || authUser.role === 9
                      () => handleOpenUploadDialog(row)
                    : null
                }
              >
                {row.storageBlueprints ? null : <Upload />}
              </IconButton>
            </Box>
          </Box>
        )
      }
    },
    {
      field: 'storageHlcDocuments',
      headerName: 'HLC',
      flex: role === 9 ? 0.09 : 0.5,
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
                  Sin HLC
                </Typography>
              )}

              <IconButton
                sx={{
                  my: 'auto',
                  ml: 2,
                  p: 0,
                  color:
                    authUser.role === 9 && row.approvedByDocumentaryControl && row.sentByDesigner
                      ? theme.palette.success
                      : theme.palette.grey[500]
                }}
                color='success'
                onClick={
                  authUser.role === 9 && row.approvedByDocumentaryControl && row.sentByDesigner
                    ? () => handleOpenUploadDialog(row)
                    : null
                }
              >
                {row.storageHlcDocuments ? null : <Upload />}
              </IconButton>
            </Box>
          </Box>
        )
      }
    },
    {
      field: 'date',
      headerName: 'Inicio',
      flex: role === 9 ? 0.09 : 0.15,
      renderCell: params => {
        const { row } = params

        const date = new Date(row.date.seconds * 1000)
        const formattedDate = date.toISOString().split('T')[0].split('-').reverse().join('/')

        return (
          <Box
            sx={{
              width: '100%',
              overflow: 'hidden'
            }}
          >
            <Typography noWrap sx={{ textOverflow: 'clip' }}>
              {formattedDate}
            </Typography>
          </Box>
        )
      }
    },
    {
      field: 'remarks',
      headerName: 'Observaciones',
      flex: role === 9 ? 0.1 : 0.2,
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
                <Typography>{renderStatus(row)}</Typography>
              )}
            </Box>
          </>
        )
      }
    },
    {
      field: 'clientApprove',
      headerName: 'Cliente',
      flex: role === 9 ? 0.1 : 0.3,
      minWidth: 80,
      renderCell: params => {
        const { row } = params

        const canApprove = checkRoleAndApproval(authUser.role, row)
        const canReject = checkRoleAndApproval(authUser.role, row)
        const canGenerateBlueprint = checkRoleAndGenerateTransmittal(authUser.role, row)
        const canResume = checkRoleAndResume(authUser.role, row)

        const flexDirection = md ? 'row' : 'column'

        const buttons = renderButtons(row, flexDirection, canApprove, canReject, canResume)

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
              ) : canGenerateBlueprint ? (
                'Generar Transmittal'
              ) : canResume ? (
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
      <DataGridPremium
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
        slotProps={{
          baseCheckbox: {
            sx: {
              '& .MuiSvgIcon-root': {
                color: theme.palette.primary.main,
                opacity: 0.7
              }
            }
          }
        }}
        apiRef={apiRef}
        checkboxSelection={authUser.role === 9}
        isRowSelectable={params =>
          (params.row.revision.charCodeAt(0) >= 66 || params.row.revision.charCodeAt(0) >= 48) &&
          params.row.approvedByDocumentaryControl === true
        }
        rows={rows}
        columns={columns}
        columnVisibilityModel={{
          clientApprove: authUser.role === 9,
          storageHlcDocuments: authUser.role === 9,
          lastTransmittal: authUser.role === 9
        }}
        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        sortingModel={defaultSortingModel}
        getRowHeight={row => (row.id === currentRow ? 'auto' : 'auto')}
        getDetailPanelContent={({ row }) => <RevisionComponent row={row} authUser={authUser} />}
      />
      <AlertDialogGabinete
        open={openAlert}
        handleClose={handleCloseAlert}
        callback={writeCallback}
        approves={approve}
        authUser={authUser}
        setRemarksState={setRemarksState}
        blueprint={doc && doc}
        drawingTimeSelected={drawingTimeSelected}
        setDrawingTimeSelected={setDrawingTimeSelected}
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
