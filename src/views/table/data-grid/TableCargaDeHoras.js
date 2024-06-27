import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { DataGridPremium, GRID_AGGREGATION_FUNCTIONS, useGridApiRef } from '@mui/x-data-grid-premium'
import { addDays, format, isSameDay, isToday, startOfWeek, subDays, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import AssignPlantDialog from 'src/@core/components/dialog-assignPlantToHH/index.js'
// import { Unstable_NumberInput as NumberInput } from '@mui/base/Unstable_NumberInput'

const TableCargaDeHoras = ({
  rows,
  handleCellEditCommit,
  authUser,
  dailyTotals,
  handleSelectionChange,
  selectedRow,
  handleDeleteRow,
  state,
  updateWeekHoursWithPlant,
  reloadTable,
  updateDailyTotals
}) => {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedDayDocIds, setSelectedDayDocIds] = useState([])
  const [currentRow, setCurrentRow] = useState({})
  const [warningDialogOpen, setWarningDialogOpen] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')
  const apiRef = useGridApiRef()

  const handleWarningDialogClose = () => {
    setWarningDialogOpen(false)
  }

  const isEditable = (dayTimestamp, rowData) => {
    const today = startOfDay(new Date())
    const yesterday = startOfDay(subDays(today, 1))
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 2 })
    const endOfCurrentWeek = endOfDay(addDays(startOfCurrentWeek, 6))
    const isCurrentWeek = dayTimestamp >= startOfCurrentWeek.getTime() && dayTimestamp <= endOfCurrentWeek.getTime()

    if (authUser.role === 1 || authUser.role === 5 || authUser.role === 10) {
      // Usuarios con roles 1, 5 o 10 pueden editar cualquier día, sin restricción
      return true
    } else {
      // Usuarios con otros roles pueden editar días posteriores al actual solo si son vacaciones
      if (rowData.hoursType === 'Vacaciones') {
        return isCurrentWeek || dayTimestamp > endOfCurrentWeek.getTime()
      }

      // Usuarios con otros roles solo pueden editar día actual o previo en la semana actual

      return isCurrentWeek && (isToday(dayTimestamp) || isSameDay(dayTimestamp, yesterday))
    }
  }

  const handleAssignPlantClick = row => {
    setSelectedDayDocIds(
      ['lunesDocId', 'martesDocId', 'miércolesDocId', 'juevesDocId', 'viernesDocId', 'sábadoDocId', 'domingoDocId']
        .map(dayKey => row[dayKey])
        .filter(docId => docId)
    )
    setCurrentRow(row)
    setAssignDialogOpen(true)
  }

  const handleCloseAssignPlantDialog = () => {
    setAssignDialogOpen(false)
    setCurrentRow({})
  }

  const handleAssignPlant = async (plant, costCenter) => {
    const userId = state.toggleValue === false ? authUser.uid : state.selectedUser.id

    const result = await updateWeekHoursWithPlant(userId, selectedDayDocIds, plant, costCenter)
    if (result.success) {
      console.log('Planta y centro de costos asignados exitosamente')
      reloadTable()
    } else {
      console.error('Error al asignar planta y centro de costos:', result.error)
    }
  }

  const otNumberLocalWidth = Number(localStorage.getItem('otNumberCargaDeHorasWidthColumn'))
  const otTypeLocalWidth = Number(localStorage.getItem('otTypeCargaDeHorasWidthColumn'))
  const plantLocalWidth = Number(localStorage.getItem('plantCargaDeHorasWidthColumn'))
  const costCenterLocalWidth = Number(localStorage.getItem('costCenterCargaDeHorasWidthColumn'))
  const totalRowHoursLocalWidth = Number(localStorage.getItem('totalRowHoursCargaDeHorasWidthColumn'))

  const columns = [
    {
      field: 'otNumber',
      headerName: 'OT',
      sortable: false,
      width: otNumberLocalWidth ? otNumberLocalWidth : 130,
      renderCell: params => {
        localStorage.setItem('otNumberCargaDeHorasWidthColumn', params.colDef.computedWidth)

        return params.row.hoursType === 'OT' ? params.row.otNumber : params.row.hoursType
      }
    },
    {
      field: 'otType',
      headerName: 'Tipo',
      sortable: false,
      width: otTypeLocalWidth ? otTypeLocalWidth : 130,
      renderCell: params => {
        localStorage.setItem('otTypeCargaDeHorasWidthColumn', params.colDef.computedWidth)

        return params.row.hoursType === 'OT' ? params.row.otType : params.row.hoursType
      }
    },
    {
      field: 'plant',
      headerName: 'Planta',
      sortable: false,
      width: plantLocalWidth ? plantLocalWidth : 320,
      renderCell: params => {
        localStorage.setItem('plantCargaDeHorasWidthColumn', params.colDef.computedWidth)

        if (
          (authUser.role === 1 || authUser.role === 5 || authUser.role === 10) &&
          (params.row.hoursType === 'Vacaciones' || params.row.hoursType === 'ISC')
        ) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {params.row.plant || ''}
              <Button onClick={() => handleAssignPlantClick(params.row)}>
                {params.row.plant ? 'Editar' : 'Asignar'}
              </Button>
            </div>
          )
        } else {
          return params.row.plant || ''
        }
      }
    },
    {
      field: 'costCenter',
      headerName: 'Centro de Costo',
      sortable: false,
      width: costCenterLocalWidth ? costCenterLocalWidth : 180,
      renderCell: params => {
        localStorage.setItem('costCenterCargaDeHorasWidthColumn', params.colDef.computedWidth)

        return params.row.costCenter
      }
    },
    ...Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(state.currentWeekStart, index)
      const dayKey = format(day, 'eeee', { locale: es }).toLowerCase()

      return {
        field: dayKey,
        headerName: `${format(day, 'eee', { locale: es })} ${format(day, 'd')}`,
        minWidth: 130,
        width: 130,
        maxWidth: 130,
        sortable: false,
        editable: true,
        aggregable: true,
        valueFormatter: ({ value }) => {
          return !isNaN(value) && value !== null ? value : ''
        },
        headerAlign: 'left',
        align: 'left',
        type: 'number',
        aggregationFunction: 'sumAggregation',
        cellClassName: params => {
          const day = addDays(state.currentWeekStart, index)
          const dayTimestamp = new Date(day).setHours(0, 0, 0, 0)
          if (params.rowNode.id !== 'auto-generated-group-footer-root') {
            return isEditable(dayTimestamp, params.row) ? 'editable-cellModification' : ''
          }
        }
      }
    }),
    {
      field: 'totalRowHours',
      headerName: 'Total Horas',
      sortable: false,
      align: 'left',
      width: totalRowHoursLocalWidth ? totalRowHoursLocalWidth : 130,
      aggregable: true,
      type: 'number',
      aggregationFunction: 'sumAggregation',
      value: params => params.row.totalRowHours
    }
  ]

  const handleKeyDown = event => {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete']
    const input = event.target

    if (allowedKeys.includes(event.key) || (event.key >= '0' && event.key <= '9')) {
      if (input && input.value?.length >= 2 && !allowedKeys.includes(event.key)) {
        event.preventDefault()
        setWarningMessage('El valor no puede tener más de 2 dígitos.')
        setWarningDialogOpen(true)
      }

      return
    }
    event.preventDefault()
    setWarningMessage('El valor debe ser un número.')
    setWarningDialogOpen(true)
  }

  const initialAggregationModel = columns.reduce((acc, col) => {
    if (col.aggregable) {
      acc[col.field] = 'sum'
    }

    return acc
  }, {})

  const [aggregationModel, setAggregationModel] = useState(initialAggregationModel)

  useEffect(() => {
    setAggregationModel({ ...initialAggregationModel })
  }, [rows])

  const sumAggregation = {
    apply: ({ values }) => {
      return values.reduce((sum, value) => sum + (value ?? 0), 0)
    },
    columnTypes: ['number'],
    label: 'Sum'
  }

  // Ordenar las filas por rowId
  const rowsWithStringId = rows.map(row => ({ ...row, rowId: String(row.rowId) }))

  const sortByRowId = (a, b) => {
    if (a.rowId < b.rowId) return -1
    if (a.rowId > b.rowId) return 1

    return 0
  }

  const sortedRows = rowsWithStringId.sort(sortByRowId)

  return (
    <Box style={{ height: 400, width: '100%' }}>
      <DataGridPremium
        apiRef={apiRef}
        sx={{
          height: 600,
          '& .MuiDataGrid-cell--textLeft': {
            align: 'left'
          }
        }}
        rows={sortedRows}
        columns={columns}
        columnVisibilityModel={{
          costCenter: authUser.role === 1 || authUser.role === 5 || authUser.role === 10
        }}
        pageSize={5}
        checkboxSelection
        rowSelectionModel={state.selectedRow ? [state.selectedRow] : []}
        onRowSelectionModelChange={handleSelectionChange}
        disableMultipleRowSelection
        disableRowSelectionOnClick
        onCellEditCommit={handleCellEditCommit}
        onCellEditStop={(params, event) => {
          console.log('Cell edit stopped: ', params)
        }}
        processRowUpdate={(newRow, oldRow) => {
          console.log('Row update:', newRow, oldRow)
          const field = Object.keys(newRow).find(key => newRow[key] !== oldRow[key])
          const dayIndex = ['martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo', 'lunes'].indexOf(field)
          const day = addDays(state.currentWeekStart, dayIndex)
          const dayTimestamp = new Date(day).setHours(0, 0, 0, 0)
          if (!isEditable(dayTimestamp, newRow)) {
            return oldRow
          }

          try {
            const field = Object.keys(newRow).find(key => newRow[key] !== oldRow[key])
            const newValue = parseFloat(newRow[field])

            if (newValue > 12 || newValue < 0) {
              setWarningMessage('El valor debe estar entre 0 y 12.')
              setWarningDialogOpen(true)

              return oldRow
            }

            if (isNaN(newValue)) {
              event.preventDefault()
            }

            // Recalcular totalRowHours
            const updatedTotalRowHours = Object.keys(newRow).reduce((acc, key) => {
              if (['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].includes(key)) {
                return acc + (parseFloat(newRow[key]) || 0)
              }

              return acc
            }, 0)

            // Actualizar newRow con el nuevo totalRowHours
            newRow.totalRowHours = updatedTotalRowHours

            if (!isNaN(newValue) && newValue >= 0 && newValue <= 12) {
              handleCellEditCommit(newRow.rowId, field, newValue, newRow, dayTimestamp, newRow[field + 'DocId'])
            }

            return newRow
          } catch (error) {
            console.error('Error during row update:', error)

            return oldRow
          }
        }}
        onProcessRowUpdateError={error => {
          console.error('Error in processRowUpdate:', error)
        }}
        getRowId={row => row.rowId}
        disableColumnMenu={true}
        hideFooter={true}
        aggregationFunctions={{
          ...GRID_AGGREGATION_FUNCTIONS,
          sumAggregation
        }}
        aggregationModel={aggregationModel}
        onCellClick={(params, event) => {
          const nonEditableFields = ['__check__', 'otNumber', 'otType', 'plant', 'costCenter', 'totalRowHours']
          if (params.rowNode.id !== 'auto-generated-group-footer-root' && !nonEditableFields.includes(params.field)) {
            const cellMode = apiRef.current.getCellMode(params.id, params.field)
            if (cellMode === 'view') {
              apiRef.current.startCellEditMode({
                id: params.id,
                field: params.field
              })
            }
          }
        }}
        onAggregationModelChange={newModel => setAggregationModel(newModel)}
        sortModel={[
          {
            field: 'rowId',
            sort: 'asc'
          }
        ]}
        componentsProps={{
          cell: {
            onKeyDown: handleKeyDown
          }
        }}
      />
      <AssignPlantDialog
        open={assignDialogOpen}
        onClose={handleCloseAssignPlantDialog}
        userId={authUser.uid}
        dayDocIds={selectedDayDocIds}
        onAssign={handleAssignPlant}
        row={currentRow}
      />
      <Dialog open={warningDialogOpen} onClose={handleWarningDialogClose}>
        <DialogTitle>Advertencia</DialogTitle>
        <DialogContent>{warningMessage}</DialogContent>
        <DialogActions>
          <Button onClick={handleWarningDialogClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <style>
        {`
          .MuiDataGrid-aggregationColumnHeaderLabel {
            display: none;
          }
          .MuiDataGrid-columnHeaderCheckbox {
            visibility: hidden;
          }
        `}
      </style>
    </Box>
  )
}

export default TableCargaDeHoras
