import { Box, Button, FormControl, Typography } from '@mui/material'
import { DataGridPremium, useGridApiRef } from '@mui/x-data-grid-premium'
import { addDays, format, isSameDay, isToday, startOfWeek, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useEffect, useRef, useState } from 'react'
import NumberInputBasic from 'src/@core/components/custom-number_input/index'
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
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 2 })
  const apiRef = useGridApiRef()

  const NumericInputCell = ({ value, onCommit, rowId, field, dayDocId, rowData, dayTimestamp }) => {
    const [inputValue, setInputValue] = useState(value || 0)
    const inputRef = useRef(inputValue)

    const maxInput = 12 - (dailyTotals[field] - (value || 0))
    const safeValue = value !== undefined && !isNaN(value) ? parseFloat(value) : 0

    useEffect(() => {
      inputRef.current = inputValue
    }, [inputValue])

    const handleChange = val => {
      // Verificar que val sea un número
      const numericValue = parseFloat(val)
      if (!isNaN(numericValue)) {
        const newVal = Math.min(numericValue, maxInput)
        const args = [rowId, field, newVal, rowData, dayTimestamp]
        if (dayDocId) {
          args.push(dayDocId)
        }
        onCommit(...args)
      }
    }

    const handleBlur = event => {
      console.log('handleBlur inputValue (from event):', event)
      const newVal = parseFloat(event.target.value)
      if (!isNaN(newVal)) {
        const newValue = Math.min(newVal, maxInput)
        const args = [rowId, field, newValue, rowData, dayTimestamp]
        if (dayDocId) {
          args.push(dayDocId)
        } else {
          console.log('Sin dayDocId')
        }

        onCommit(...args)
      } else {
        console.log('NoNoNo')
      }
    }

    return (
      <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
        <NumberInputBasic
          value={safeValue}
          handleChange={handleChange}
          onBlur={handleBlur}
          min={0}
          max={maxInput}
          disabled={!isEditable(dayTimestamp, rowData)}
        />
      </FormControl>
    )
  }

  const isEditable = (dayTimestamp, rowData) => {
    const today = new Date()
    const yesterday = subDays(today, 1)
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 2 })
    const endOfCurrentWeek = addDays(startOfCurrentWeek, 6)
    const weekOfDay = startOfWeek(dayTimestamp, { weekStartsOn: 2 })
    const isCurrentWeek = dayTimestamp >= startOfCurrentWeek && dayTimestamp <= endOfCurrentWeek

    if (authUser.role === 1 || authUser.role === 5 || authUser.role === 10) {
      // Usuarios con roles 1, 5 o 10 pueden editar cualquier día, sin restricción
      return true
    } else {
      // Usuarios con otros roles pueden editar días posteriores al actual solo si son vacaciones
      if (rowData.hoursType === 'Vacaciones' && dayTimestamp > today) {
        return true
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
      const dayTimestamp = new Date(day).setHours(0, 0, 0, 0)

      return {
        field: dayKey,
        headerName: `${format(day, 'eee', { locale: es })} ${format(day, 'd')}`,
        minWidth: 130,
        width: 130,
        maxWidth: 130,
        sortable: false,
        editable: params => isEditable(dayTimestamp, params.row),
        aggregable: true,
        valueFormatter: ({ value }) => value || 0,
        headerAlign: 'left',
        getCellClassName: params => (params.row.isTotalRow ? 'MuiDataGrid-cell--textLeft' : ''),
        align: 'left',
        renderCell: params =>
          params.row.isTotalRow ? (
            <Typography ml={4}>{params.row[dayKey]}</Typography>
          ) : (
            <NumericInputCell
              value={params.row[dayKey] !== undefined ? params.row[dayKey] : 0}
              onCommit={handleCellEditCommit}
              rowId={params.row.rowId}
              field={dayKey}
              dayDocId={params.row[`${dayKey}DocId`]}
              rowData={params.row}
              dayTimestamp={dayTimestamp}
            />
          )
      }
    }),
    {
      field: 'totalRowHours',
      headerName: 'Total Horas',
      sortable: false,
      width: totalRowHoursLocalWidth ? totalRowHoursLocalWidth : 130,
      renderFooter: () => (
        <Box textAlign='center'>{rows.reduce((acc, row) => acc + (row.totalRowHours || 0), 0)} hrs</Box>
      ),
      renderCell: params => {
        localStorage.setItem('totalRowHoursCargaDeHorasWidthColumn', params.colDef.computedWidth)

        return <span>{params.row.totalRowHours || 0}</span>
      }
    }
  ]

  const rowsWithStringId = rows.map(row => ({ ...row, rowId: String(row.rowId) }))

  const aggregatedRow = {
    rowId: 'totalRow',
    otNumber: 'Total',
    otType: '',
    plant: '',
    isTotalRow: true,
    totalRowHours: rows.reduce((acc, row) => acc + (row.totalRowHours || 0), 0),
    ...Object.keys(state.dailyTotals).reduce((acc, key) => {
      acc[key] = state.dailyTotals[key] || 0

      return acc
    }, {})
  }

  const fusionRows = [...rowsWithStringId, aggregatedRow]

  const validatedRows = fusionRows.map(row => ({
    ...row,
    rowId: row.rowId || 'invalid-row-id',
    totalRowHours: row.totalRowHours || 0,
    hoursType: row.hoursType || ''
  }))

  const sortByRowId = (a, b) => {
    if (a.rowId < b.rowId) return -1
    if (a.rowId > b.rowId) return 1

    return 0
  }

  const getRowClassName = params => (params.row.isTotalRow ? 'total-row' : '')
  const isRowSelectable = params => !params.row.isTotalRow

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
        rows={validatedRows.sort(sortByRowId)}
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
        getRowId={row => row.rowId}
        getRowClassName={getRowClassName}
        isRowSelectable={isRowSelectable}
        disableColumnMenu={true}
        hideFooter={true}
      />
      <AssignPlantDialog
        open={assignDialogOpen}
        onClose={handleCloseAssignPlantDialog}
        userId={authUser.uid}
        dayDocIds={selectedDayDocIds}
        onAssign={handleAssignPlant}
        row={currentRow}
      />
      <style>
        {`
          .total-row .MuiDataGrid-checkboxInput {
            display: none;
          }
          .MuiDataGrid-cell--textLeft {
            text-align: left !important;
          }
        `}
      </style>
    </Box>
  )
}

export default TableCargaDeHoras
