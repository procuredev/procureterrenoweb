import * as React from 'react'
import { useState, useEffect } from 'react'
import { makeStyles } from '@mui/styles'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import {
  GridToolbar,
  DataGridPremium,
  esES,
  useGridApiRef,
  useKeepGroupedColumnsHidden
} from '@mui/x-data-grid-premium'

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
  DialogContent,
  Checkbox
} from '@mui/material'
import KeyboardArrowDownSharpIcon from '@mui/icons-material/KeyboardArrowDownSharp'
import KeyboardArrowRightSharpIcon from '@mui/icons-material/KeyboardArrowRightSharp'
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
  const [expandedRows, setExpandedRows] = useState(new Set())

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

  const theme = useTheme()
  const sm = useMediaQuery(theme.breakpoints.up('sm'))
  const md = useMediaQuery(theme.breakpoints.up('md'))
  const xl = useMediaQuery(theme.breakpoints.up('xl'))

  const smDown = useMediaQuery(theme.breakpoints.down('sm'))
  const mdDown = useMediaQuery(theme.breakpoints.down('md'))
  const lgDown = useMediaQuery(theme.breakpoints.down('lg'))
  const xlDown = useMediaQuery(theme.breakpoints.down('xl'))

  const useStyles = makeStyles({
    root: {
      '& .MuiDataGrid-columnHeaderTitle': {
        fontSize: xlDown ? '0.5rem' : '0.8rem' // Cambia esto al tamaño de fuente que desees
      }
    }
  })

  const classes = useStyles()

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
            (row.revision?.charCodeAt(0) >= 65 || row.revision?.charCodeAt(0) >= 48) &&
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
          (row.revision?.charCodeAt(0) >= 65 || row.revision?.charCodeAt(0) >= 48) &&
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

  const renderButton = (row, approve, color, IconComponent, disabled, resume = false) => {
    const handleClick = () => handleClickOpenAlert(row, approve)

    return (
      <Button
        onClick={handleClick}
        variant='contained'
        disabled={disabled}
        color={color}
        sx={{
          padding: '0rem!important',
          margin: '0.15rem!important',
          maxWidth: '25px',
          maxHeight: '25px',
          minWidth: resume && !xlDown ? '120px' : resume ? '80px' : '40px',
          minHeight: '25px'
        }}
      >
        <IconComponent sx={{ fontSize: 18, fontSize: xlDown ? '0.8rem' : '1rem' }} />
        {resume ? (
          <Typography sx={{ textOverflow: 'clip', fontSize: xlDown ? '0.7rem' : '1rem' }}> Reanudar</Typography>
        ) : (
          ''
        )}
      </Button>
    )
  }

  const renderButtons = (row, flexDirection, canApprove, canReject, disabled, canResume = false) => {
    return (
      <Container
        sx={{ display: 'flex', flexDirection: { flexDirection }, padding: '0rem!important', margin: '0rem!important' }}
      >
        {canApprove && renderButton(row, true, 'success', CheckCircleOutline)}
        {canReject && renderButton(row, false, 'error', CancelOutlined)}
        {canResume && renderButton(row, true, 'info', AutorenewOutlined, disabled, true)}
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

  useEffect(() => {
    const fetchProyectistas = async () => {
      const resProyectistas = await getUserData('getUserProyectistas', null, authUser)
      setProyectistas(resProyectistas)
      setLoadingProyectistas(false)
    }

    fetchProyectistas()
  }, [authUser.shift])

  const getFileName = (content, index) => {
    if (typeof content === 'string') {
      const urlSegments = content.split('%2F')
      const encodedFileName = urlSegments[urlSegments.length - 1]
      const fileNameSegments = encodedFileName.split('?')
      const fileName = decodeURIComponent(fileNameSegments[0])

      return fileName
    } else {
      // Si content no es una cadena, devuelve un valor por defecto o maneja el caso como consideres necesario.
      return ''
    }
  }

  const transformDataForGrouping = rows => {
    return rows
      .map(item => {
        // Transforma las revisiones en subfilas
        const revisionsTransformed = item.revisions.map((rev, index) => ({
          ...rev,
          id: `${item.id}-rev-${index}`, // ID único para cada revisión
          parentId: item.id, // ID de la fila principal
          isRevision: true // Marca las revisiones para renderizado especial
        }))

        return [item, ...revisionsTransformed] // Combina fila principal con sus revisiones
      })
      .flat()
  }

  // En el cuerpo del componente TableGabinete
  const transformedRows = transformDataForGrouping(rows)

  console.log('transformedRows :', transformedRows)

  const handleToggleRow = rowId => {
    setExpandedRows(prevExpandedRows => {
      const newExpandedRows = new Set(prevExpandedRows)
      if (newExpandedRows.has(rowId)) {
        newExpandedRows.delete(rowId)
      } else {
        newExpandedRows.add(rowId)
      }

      return newExpandedRows
    })
  }

  console.log('expandedRows :', expandedRows)

  const filteredRows = transformedRows.filter(row => {
    return !row.isRevision || expandedRows.has(row.parentId)
  })

  const columns = [
    {
      field: 'id',
      //flex: role === 9 && !xlDown ? 0.07 : role !== 9 && !xlDown ? 0.11 : role !== 9 ? 0.15 : 1,
      minWidth: role === 9 && !xlDown ? 350 : role !== 9 && !xlDown ? 355 : role !== 9 ? 290 : 282,
      headerName: 'Código Procure / MEL',

      renderCell: params => {
        const { row } = params

        const isGroupedRow = !params.row.treeDataGroupingField

        const isExpanded = expandedRows.has(params.row.id)
        console.log('isExpanded :', isExpanded)

        const toggleIcon = isGroupedRow ? (
          isExpanded ? (
            <KeyboardArrowDownSharpIcon onClick={() => handleToggleRow(params.row.id)} />
          ) : (
            <KeyboardArrowRightSharpIcon onClick={() => handleToggleRow(params.row.id)} />
          )
        ) : (
          false
        )
        if (row.isRevision && expandedRows.has(params.row.parentId)) {
          return ''
        } else if (!row.isRevision && !expandedRows.has(params.row.parentId)) {
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
                  {toggleIcon}
                  <IconButton
                    sx={{ p: 0 }}
                    id={row.id}
                    onClick={() => {
                      handleOpenUploadDialog(row)
                    }}
                  >
                    <OpenInNew sx={{ fontSize: xlDown ? '1rem' : '1.2rem' }} />
                  </IconButton>

                  <Box>
                    <Typography
                      noWrap
                      sx={{
                        textOverflow: 'clip',
                        fontSize: xlDown ? '0.8rem' : '1rem',
                        textDecoration: 'none',
                        transition: 'text-decoration 0.2s',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {row.id || 'Sin código Procure'}
                    </Typography>
                    <Typography variant='caption' sx={{ fontSize: xlDown ? '0.6rem' : '0.8rem' }}>
                      {row.clientCode || 'Sin código MEL'}
                    </Typography>
                    {row.id === currentRow && row.revisions.length === 0 && (
                      <Typography sx={{ mt: 1, fontSize: xlDown ? '0.8rem' : '1rem' }}>
                        Sin eventos en historial
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Tooltip>
            </>
          )
        } else {
          return null
        }
      }
    },
    {
      field: 'revision',
      headerName: 'REVISION',
      //flex: role === 9 && !xlDown ? 0.07 : role !== 9 && !xlDown ? 0.11 : role !== 9 ? 0.15 : 0.2,
      minWidth: role === 9 && !xlDown ? 20 : role !== 9 && !xlDown ? 20 : role !== 9 ? 20 : 20,
      renderCell: params => {
        const { row } = params

        let revisionContent

        if (row.isRevision && expandedRows.has(params.row.parentId)) {
          // Para las filas de revisión, muestra la descripción de la revisión
          revisionContent = row.newRevision

          return (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography noWrap sx={{ textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}>
                {revisionContent || 'N/A'}
              </Typography>
            </Box>
          )
        } else if (!row.isRevision && !expandedRows.has(params.row.parentId)) {
          // Para las filas principales, muestra la descripción general
          revisionContent = row.revision

          return (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography noWrap sx={{ textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}>
                {revisionContent || 'N/A'}
              </Typography>
            </Box>
          )
        } else {
          return null
        }
      }
    },
    {
      field: 'userName',
      headerName: 'CREADO POR',
      //flex: role === 9 && !xlDown ? 0.07 : role !== 9 && !xlDown ? 0.11 : role !== 9 ? 0.15 : 0.1,
      minWidth: role === 9 && !xlDown ? 190 : role !== 9 && !xlDown ? 190 : role !== 9 ? 155 : 160,
      renderCell: params => {
        const { row } = params

        let userNameContent

        if (row.isRevision && expandedRows.has(params.row.parentId)) {
          // Para las filas de revisión, muestra la descripción de la revisión
          userNameContent = row.userName

          return (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography noWrap sx={{ textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}>
                {userNameContent || 'N/A'}
              </Typography>
            </Box>
          )
        } else if (!row.isRevision && !expandedRows.has(params.row.parentId)) {
          // Para las filas principales, muestra la descripción general
          userNameContent = row.userName

          return (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography noWrap sx={{ textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}>
                {userNameContent || 'N/A'}
              </Typography>
            </Box>
          )
        } else {
          return null
        }
      }
    },
    {
      field: 'lastTransmittal',
      headerName: 'Ultimo Transmittal',
      //flex: role === 9 && !xlDown ? 0.07 : role !== 9 && !xlDown ? 0.11 : role !== 9 ? 0.15 : 0.1,
      minWidth: role === 9 && !xlDown ? 180 : role !== 9 && !xlDown ? 70 : role !== 9 ? 120 : 160,
      renderCell: params => {
        const { row } = params

        let lastTransmittalContent

        if (row.isRevision && expandedRows.has(params.row.parentId)) {
          // Para las filas de revisión, muestra la descripción de la revisión
          lastTransmittalContent = row.lastTransmittal

          return (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography noWrap sx={{ textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}>
                {lastTransmittalContent || ''}
              </Typography>
            </Box>
          )
        } else if (!row.isRevision && !expandedRows.has(params.row.parentId)) {
          // Para las filas principales, muestra la descripción general
          lastTransmittalContent = row.lastTransmittal

          return (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography noWrap sx={{ textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}>
                {lastTransmittalContent || ''}
              </Typography>
            </Box>
          )
        } else {
          return null
        }
      }
    },
    {
      field: 'description',
      headerName: 'DESCRIPCIÓN',
      //flex: role === 9 && !xlDown ? 0.07 : role !== 9 && !xlDown ? 0.11 : role !== 9 ? 0.15 : 0.5,
      minWidth: role === 9 && !xlDown ? 200 : role !== 9 && !xlDown ? 200 : role !== 9 ? 170 : 190,
      renderCell: params => {
        const { row } = params

        let descriptionContent

        if (row.isRevision && expandedRows.has(params.row.parentId)) {
          // Para las filas de revisión, muestra la descripción de la revisión
          descriptionContent = row.description

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
                <Typography
                  noWrap
                  sx={{ overflow: 'hidden', my: 'auto', textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}
                >
                  {descriptionContent || 'Sin descripción'}
                </Typography>
              </Box>
            </Box>
          )
        } else if (!row.isRevision && !expandedRows.has(params.row.parentId)) {
          // Para las filas principales, muestra la descripción general
          descriptionContent = row.description

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
                <Typography
                  noWrap
                  sx={{ overflow: 'hidden', my: 'auto', textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}
                >
                  {descriptionContent || 'Sin descripción'}
                </Typography>
              </Box>
            </Box>
          )
        } else {
          return null
        }
      }
    },
    {
      field: 'files',
      headerName: 'ENTREGABLE',
      //flex: role === 9 && !xlDown ? 0.07 : role !== 9 && !xlDown ? 0.11 : role !== 9 ? 0.15 : 1,
      minWidth: role === 9 && !xlDown ? 450 : role !== 9 && !xlDown ? 445 : role !== 9 ? 365 : 365,
      renderCell: params => {
        const { row } = params

        if (row.isRevision && expandedRows.has(params.row.parentId)) {
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
                <Typography>
                  <Link
                    color='inherit'
                    href={row.storageBlueprints}
                    target='_blank'
                    rel='noreferrer'
                    variant='body1'
                    noWrap
                    sx={{ fontSize: xlDown ? '0.8rem' : '1rem' }}
                  >
                    {getFileName(row.storageBlueprints)}
                  </Link>
                </Typography>
              </Box>
            </Box>
          )
        } else if (!row.isRevision && !expandedRows.has(params.row.parentId)) {
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
                {row.storageBlueprints && Array.isArray(row.storageBlueprints) ? (
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
                        sx={{ fontSize: xlDown ? '0.8rem' : '1rem' }}
                      >
                        {getFileName(content, index)}
                      </Link>
                    </Typography>
                  ))
                ) : (
                  <Typography
                    noWrap
                    sx={{ overflow: 'hidden', my: 'auto', textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}
                  >
                    Sin entregable
                  </Typography>
                )}

                <IconButton
                  sx={{
                    my: 'auto',
                    ml: 2,
                    p: 0
                  }}
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
                  {row.storageBlueprints ? null : (
                    <Upload
                      sx={{
                        fontSize: xlDown ? '1rem' : '1.2rem',
                        color:
                          authUser.uid === row.userId && (!row.sentBySupervisor || !row.sentByDesigner)
                            ? theme.palette.success
                            : theme.palette.grey[500]
                      }}
                    />
                  )}
                </IconButton>
              </Box>
            </Box>
          )
        } else {
          return null
        }
      }
    },
    {
      field: 'storageHlcDocuments',
      headerName: 'HLC',
      //flex: role === 9 && !xlDown ? 0.07 : role !== 9 && !xlDown ? 0.11 : role !== 9 ? 0.15 : 0.1,
      minWidth: role === 9 && !xlDown ? 120 : role !== 9 && !xlDown ? 70 : role !== 9 ? 120 : 120,
      renderCell: params => {
        const { row } = params

        if (row.isRevision && expandedRows.has(params.row.parentId)) {
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
                <Typography>
                  <Link
                    color='inherit'
                    href={row.storageBlueprints}
                    target='_blank'
                    rel='noreferrer'
                    variant='body1'
                    noWrap
                    sx={{ fontSize: xlDown ? '0.8rem' : '1rem' }}
                  >
                    {getFileName(row.storageHlcDocuments)}
                  </Link>
                </Typography>
              </Box>
            </Box>
          )
        } else if (!row.isRevision && !expandedRows.has(params.row.parentId)) {
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
                {row.storageHlcDocuments && Array.isArray(row.storageHlcDocuments) ? (
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
                        sx={{ fontSize: xlDown ? '0.8rem' : '1rem' }}
                      >
                        {getFileName(content, index)}
                      </Link>
                    </Typography>
                  ))
                ) : (
                  <Typography
                    noWrap
                    sx={{ overflow: 'hidden', my: 'auto', textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}
                  >
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
        } else {
          return null
        }
      }
    },
    {
      field: 'date',
      headerName: 'Inicio',
      //flex: role === 9 && !xlDown ? 0.07 : role !== 9 && !xlDown ? 0.11 : role !== 9 ? 0.15 : 0.1,
      minWidth: role === 9 && !xlDown ? 120 : role !== 9 && !xlDown ? 120 : role !== 9 ? 100 : 120,
      renderCell: params => {
        if (params.row.date && typeof params.row.date === 'object' && 'seconds' in params.row.date) {
          const { row } = params

          let dateContent

          if (row.isRevision && expandedRows.has(params.row.parentId)) {
            // Asegúrate de que seconds es un número.
            const seconds = Number(row.date.seconds)
            if (!isNaN(seconds)) {
              const date = new Date(seconds * 1000)
              const formattedDate = date.toISOString().split('T')[0].split('-').reverse().join('/')
              dateContent = formattedDate
            } else {
              // Maneja el caso donde seconds no es un número.
              dateContent = 'Fecha inválida'
            }

            return (
              <Box
                sx={{
                  width: '100%',
                  overflow: 'hidden'
                }}
              >
                <Typography noWrap sx={{ textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}>
                  {dateContent}
                </Typography>
              </Box>
            )
          } else if (!row.isRevision && !expandedRows.has(params.row.parentId)) {
            // Para las filas principales, muestra la descripción general
            // Asegúrate de que row.date.seconds es un número.
            const seconds = Number(row.date?.seconds)
            if (!isNaN(seconds)) {
              const date = new Date(seconds * 1000)
              const formattedDate = date.toISOString().split('T')[0].split('-').reverse().join('/')
              dateContent = formattedDate
            } else {
              // Maneja el caso donde seconds no es un número.
              dateContent = 'Fecha inválida'
            }

            return (
              <Box
                sx={{
                  width: '100%',
                  overflow: 'hidden'
                }}
              >
                <Typography noWrap sx={{ textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}>
                  {dateContent}
                </Typography>
              </Box>
            )
          } else {
            return null
          }
        }
      }
    },
    {
      field: 'remarks',
      headerName: 'Observaciones',
      //flex: role === 9 && !xlDown ? 0.07 : role !== 9 && !xlDown ? 0.11 : role !== 9 ? 0.15 : 0.1,
      minWidth: role === 9 && !xlDown ? 195 : role !== 9 && !xlDown ? 195 : role !== 9 ? 165 : 180,
      renderCell: params => {
        const { row } = params
        const permissionsData = permissions(row, role, authUser)
        const canApprove = permissionsData?.approve
        const canReject = permissionsData?.reject

        const flexDirection = md ? 'row' : 'column'

        const buttons = renderButtons(row, flexDirection, canApprove, canReject)

        if (row.isRevision && expandedRows.has(params.row.parentId)) {
          // Renderiza la descripción para una fila de revisión
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
              <Box display='inline-flex' sx={{ justifyContent: 'space-between' }}>
                <Typography
                  noWrap
                  sx={{ overflow: 'hidden', my: 'auto', textOverflow: 'clip', fontSize: xlDown ? '0.8rem' : '1rem' }}
                >
                  {row.remarks || 'Sin Observasión'}
                </Typography>
              </Box>
            </Box>
          )
        } else if (!row.isRevision && !expandedRows.has(params.row.parentId)) {
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
                  <Typography sx={{ fontSize: xlDown ? '0.8rem' : '1rem' }}>{renderStatus(row)}</Typography>
                )}
              </Box>
            </>
          )
        } else {
          return null
        }
      }
    },
    {
      field: 'clientApprove',
      headerName: 'Cliente',
      //flex: role === 9 && !xlDown ? 0.07 : role !== 9 && !xlDown ? 0.11 : role !== 9 ? 0.15 : 0.1,
      minWidth: role === 9 && !xlDown ? 160 : role !== 9 && !xlDown ? 70 : role !== 9 ? 120 : 120,
      renderCell: params => {
        const { row, currentPetition } = params

        const canApprove = checkRoleAndApproval(authUser.role, row)
        const canReject = checkRoleAndApproval(authUser.role, row)
        const canGenerateBlueprint = checkRoleAndGenerateTransmittal(authUser.role, row)
        const canResume = checkRoleAndResume(authUser.role, row)

        const flexDirection = md ? 'row' : 'column'

        const disabled = petition?.otFinished

        const buttons = renderButtons(row, flexDirection, canApprove, canReject, disabled, canResume)

        if (row.isRevision && expandedRows.has(params.row.parentId)) {
          return ''
        } else if (!row.isRevision && !expandedRows.has(params.row.parentId)) {
          return (
            <Box sx={{ padding: '0rem!important', margin: '0rem!important' }}>
              <Box
                sx={{
                  display: 'flex',
                  width: '100%',
                  padding: '0rem!important',
                  margin: '0rem!important',
                  justifyContent: 'space-between',
                  alignContent: 'right',
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
            </Box>
          )
        } else {
          return null
        }
      }
    }
  ]

  return (
    <Card sx={{ height: 'inherit' }}>
      <DataGridPremium
        sx={{
          height: '100%',
          maxHeight: !xlDown ? '700px' : '400px',
          width: '100%',
          '& .MuiDataGrid-cell--withRenderer': {
            alignItems: 'baseline'
          },
          '& .MuiDataGrid-virtualScroller': {
            minHeight: '200px'
          }
        }}
        classes={{ root: classes.root }}
        slotProps={{
          baseCheckbox: {
            sx: {
              '& .MuiSvgIcon-root': {
                color: theme.palette.primary.main,
                opacity: 0.7,
                fontSize: xlDown ? '1rem' : '1.2rem',
                padding: '0rem',
                margin: '0rem'
              },
              '& .MuiCheckbox-root': {
                // Asegúrate de no aplicar estilos que podrían ocultar el checkbox si es necesario
              }
            }
          }
        }}
        apiRef={apiRef}
        checkboxSelection={authUser.role === 9}
        isRowSelectable={params => {
          if (params.row.revision && typeof params.row.revision === 'string') {
            return (
              (params.row.revision.charCodeAt(0) >= 66 || params.row.revision.charCodeAt(0) >= 48) &&
              params.row.approvedByDocumentaryControl === true
            )
          }

          return false // o alguna otra lógica por defecto si 'revision' no está disponible
        }}
        getRowId={row => row.id}
        getRowClassName={params => {
          // Aquí puedes verificar si la fila es una revisión y aplicar una clase condicional
          const row = apiRef.current.getRow(params.id)
          if (row && row.isRevision) {
            return 'no-checkbox' // Asume que tienes una clase CSS que oculta el checkbox
          }

          return ''
        }}
        rows={filteredRows}
        useGridApiRef
        columns={columns}
        columnVisibilityModel={{
          clientApprove: authUser.role === 9,
          storageHlcDocuments: authUser.role === 9,
          lastTransmittal: authUser.role === 9
        }}
        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
        sortingModel={defaultSortingModel}
        getRowHeight={row => (row.id === currentRow ? 'auto' : 'auto')}
        isRowExpanded={row => expandedRows.has(row.id)}
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
