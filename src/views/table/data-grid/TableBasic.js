import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useFirebase } from 'src/context/useFirebase'
import dictionary from 'src/@core/components/dictionary/index'
import { unixToDate } from 'src/@core/components/unixToDate'

// ** MUI Imports
import Fade from '@mui/material/Fade'
import Tooltip from '@mui/material/Tooltip'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import Select from '@mui/material/Select'
import CustomChip from 'src/@core/components/mui/chip'
import { Typography, IconButton } from '@mui/material'
import { Button } from '@mui/material'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { DataGridPro, esES } from '@mui/x-data-grid-pro'
import OpenInNewOutlined from '@mui/icons-material/OpenInNewOutlined'
import { Container } from '@mui/system'
import AlertDialog from 'src/@core/components/dialog-warning'
import { FullScreenDialog } from 'src/@core/components/dialog-fullsize'
import { Check, Clear, Edit } from '@mui/icons-material'

const TableBasic = ({ rows, role, roleData }) => {
  const [open, setOpen] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)
  const [doc, setDoc] = useState('')
  const [approve, setApprove] = useState(true)
  const [loading, setLoading] = useState(true)
  const { updateDocs, authUser } = useFirebase()
  const isResizing = useRef(-1)
  const separatorRef = useRef(null)

  useEffect(() => {
    if (rows) {
      setLoading(false)
    }
  }, [rows])

  const findCurrentDoc = rows => {
    return rows.find(row => row.id === doc.id)
  }

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
    updateDocs(doc.id, approve, authUser)
    setOpenAlert(false)
  }

  const handleCloseAlert = () => {
    setOpenAlert(false)
  }

  const permissions = (row, role) => {
    if (!row) return

    const hasPrevState = row.state === role - 1
    const createdBySupervisor = row.userRole === 7

    const isContopEmergency =
      role === 3 &&
      row.contop === authUser.displayName &&
      row.state === 8 &&
      row.emergencyApprovedByContop === false &&
      createdBySupervisor
    const isMyRequest = authUser.uid === row.uid
    const isOwnReturned = isMyRequest && row.state === 1
    const hasOTEnd = row.ot && row.end

    const dictionary = {
      1: {
        approve: row.state <= 6,
        edit: row.state <= 6,
        reject: row.state <= 6
      },
      2: {
        approve: isOwnReturned,
        edit: isOwnReturned || ([2, 6].includes(row.state) && isMyRequest),
        reject: isMyRequest && row.state <= 6
      },
      3: {
        approve: hasPrevState || isOwnReturned || isContopEmergency,
        edit:
          (isOwnReturned || hasPrevState || row.state === 6 || (isMyRequest && row.state === 3)) &&
          !createdBySupervisor,
        reject: row.state <= 6 && !createdBySupervisor
      },
      4: {
        approve: hasPrevState,
        edit: [3, 6].includes(row.state),
        reject: row.state <= 6
      },
      5: {
        approve: hasOTEnd && [3, 4].includes(row.state),
        edit: [3, 4, 6].includes(row.state),
        reject: [3, 4, 6].includes(row.state)
      },
      6: {
        approve: hasPrevState,
        edit: hasPrevState,
        reject: [5, 6].includes(row.state)
      },
      7: {
        approve: false,
        edit: false,
        reject: false
      },
      8: {
        approve: hasPrevState,
        edit: false,
        reject: false
      },
      9: {
        approve: false,
        edit: false,
        reject: false
      },
      10: {
        approve: false,
        edit: false,
        reject: false
      }
    }

    return dictionary[role]
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

  const DEFAULT_MIN_WIDTH_CELL = 70
  const DEFAULT_MAX_WIDTH_CELL = 800

  const adjustWidthColumn = (index, width) => {
    const minWidth = DEFAULT_MIN_WIDTH_CELL
    const maxWidth = DEFAULT_MAX_WIDTH_CELL

    let newWidth = width > maxWidth ? maxWidth : width < minWidth ? minWidth : width

    // Selecciona todos los elementos con colindex=2
    const columnElements = document.querySelectorAll(`[aria-colindex="${index}"]`)

    // Itera sobre los elementos y ajusta su estilo
    columnElements.forEach(element => {
      element.style.maxWidth = 'none'
      element.style.minWidth = 'none'
      element.style.width = newWidth + 'px'
    })
  }

  const handleMiDivClick = event => {
    separatorRef.current = event.srcElement.parentElement

    const index = event.srcElement.parentNode.parentElement.attributes[3]
      ? event.srcElement.parentNode.parentElement.attributes[3].nodeValue
      : 0
    separatorRef.current = event.srcElement.parentElement
    isResizing.current = index
    setCursorDocument(true)
  }

  const handleMouseMove = event => {
    if (isResizing.current >= 0) {
      const width = event.clientX - separatorRef.current.getBoundingClientRect().left
      adjustWidthColumn(isResizing.current, width)
    }
  }

  const handleMouseUp = event => {
    isResizing.current = -1
    separatorRef.current = null
    setCursorDocument(false)
  }

  const setCursorDocument = isResizing => {
    document.body.style.cursor = isResizing ? 'col-resize' : 'auto'
  }

  useEffect(() => {
    if (!loading) {
      // Selecciona todos los divs con la clase 'MuiDataGrid-columnSeparator' y agrega event listeners
      const miDivs = document.querySelectorAll('.MuiDataGrid-columnSeparator')

      if (miDivs) {
        miDivs.forEach(div => {
          div.addEventListener('mousedown', handleMiDivClick)
        })
      }
    }

    return () => {
      const miDivs = document.querySelectorAll('.MuiDataGrid-columnSeparator')
      miDivs.forEach(div => {
        div.removeEventListener('click', handleMiDivClick)
      })
    }
  }, [loading])

  useEffect(() => {
    // loadColumnInfoLocalStorage();
    document.onmousemove = handleMouseMove
    document.onmouseup = handleMouseUp

    return () => {
      document.onmousemove = null
      document.onmouseup = null
    }
  }, [])

  const columns = [
    {
      field: 'title',
      headerName: 'Solicitud',
      renderCell: params => {
        const { row } = params

        return (
          <Tooltip
            title={row.title}
            placement='bottom-end'
            key={row.title}
            leaveTouchDelay={0}
            TransitionComponent={Fade}
            TransitionProps={{ timeout: 0 }}
          >
            <Box sx={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
              <IconButton onClick={() => handleClickOpen(row)}>
                <OpenInNewOutlined sx={{ fontSize: 18 }} />
              </IconButton>
              <Typography
                sx={{
                  textDecoration: 'none',
                  transition: 'text-decoration 0.2s',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
                variant='string'
              >
                {row.title}
              </Typography>
            </Box>
          </Tooltip>
        )
      }
    },
    {
      field: 'state',
      headerName: 'Estado',
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
      field: 'date',
      headerName: 'Creación',
      renderCell: params => {
        const { row } = params

        return <div>{unixToDate(row.date.seconds)[0]}</div>
      }
    },
    {
      field: 'start',
      headerName: 'Inicio',
      renderCell: params => {
        const { row } = params

        return <div>{unixToDate(row.start.seconds)[0]}</div>
      }
    },
    {
      field: 'end',
      headerName: 'Entrega',
      renderCell: params => {
        const { row } = params

        return <div>{(row.end && unixToDate(row.end.seconds)[0]) || 'Pendiente'}</div>
      }
    },
    {
      field: 'supervisorShift',
      headerName: 'Turno',
      renderCell: params => {
        const { row } = params

        return <div>{row.state >= 6 ? row.supervisorShift || 'No definido' : 'Por confirmar'}</div>
      }
    },
    {
      field: 'ot',
      headerName: 'OT',
      renderCell: params => {
        const { row } = params

        return <div>{row.ot || 'N/A'}</div>
      }
    },
    {
      field: 'user',
      headerName: 'Autor'
    },
    {
      minWidth: md ? 190 : 100,
      field: 'actions',
      headerName: 'Acciones',
      renderCell: params => {
        const { row } = params
        const permissionsData = permissions(row, role)
        const canApprove = permissionsData.approve
        const canEdit = permissionsData.edit
        const canReject = permissionsData.reject

        const approveWithChanges = role === 5 && row.state <= 4 && !canApprove
        const isRevisado = row.state > role
        const flexDirection = md ? 'row' : 'column'

        const renderButtons = (
          <Container sx={{ display: 'flex', flexDirection: { flexDirection } }}>
            {canApprove && (
              <Button
                onClick={() => handleClickOpenAlert(row, true)}
                variant='contained'
                color='success'
                sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
              >
                <Check sx={{ fontSize: 18 }} />
              </Button>
            )}
            {canEdit && (
              <Button
                onClick={() => handleClickOpen(row)}
                variant='contained'
                color={approveWithChanges ? 'success' : 'secondary'}
                sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
              >
                {approveWithChanges ? <Check sx={{ fontSize: 18 }} /> : <Edit sx={{ fontSize: 18 }} />}
              </Button>
            )}
            {canReject && (
              <Button
                onClick={() => handleClickOpenAlert(row, false)}
                variant='contained'
                color='error'
                sx={{ margin: '5px', maxWidth: '25px', maxHeight: '25px', minWidth: '25px', minHeight: '25px' }}
              >
                <Clear sx={{ fontSize: 18 }} />
              </Button>
            )}
          </Container>
        )

        return (
          <>
            {(canApprove || canEdit || canReject) && row.state !== 0 ? (
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
            ) : isRevisado ? (
              'Revisado'
            ) : row.state === 0 ? (
              'Rechazado'
            ) : (
              'Pendiente de revisión'
            )}
          </>
        )
      }
    }
  ]

  return (
    <Card>
      <Box sx={{ height: 500 }}>
        <DataGridPro
          resizeable
          initialState={{
            sorting: {
              sortModel: [{ field: 'date', sort: 'desc' }]
            }
          }}
          hideFooterSelectedRowCount
          rows={rows}
          columns={columns}
          columnVisibilityModel={{
            ot: md,
            user: md,
            end: xl && [1, 5, 6, 7, 8, 9, 10].includes(role),
            supervisorShift: [1, 5, 6, 7, 8, 9, 10].includes(role),
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
        {open && (
          <FullScreenDialog
            open={Boolean(findCurrentDoc(rows), role)}
            handleClose={handleClose}
            doc={findCurrentDoc(rows)}
            roleData={roleData}
            editButtonVisible={permissions(findCurrentDoc(rows), role)?.edit || false}
            canComment={authUser.role === 7}
          />
        )}
      </Box>
    </Card>
  )
}

export default TableBasic
