import React, { useState, useEffect } from 'react'
import {
  DataGridPremium,
  useGridApiRef,
  GRID_AGGREGATION_FUNCTIONS,
  GridAggregationFunction
} from '@mui/x-data-grid-premium'
import { startOfWeek, addDays, format, isToday, isPast, subDays, isSameWeek, isSameDay, isFuture } from 'date-fns'
import { es } from 'date-fns/locale'
import { Box, Button, Typography } from '@mui/material'
import NumberInputBasic from 'src/@core/components/custom-number_input/index'
import { Unstable_NumberInput as NumberInput } from '@mui/base/Unstable_NumberInput'

const TableCargaDeHoras = ({
  rows,
  handleCellEditCommit,
  authUser,
  dailyTotals,
  handleSelectionChange,
  selectedRow,
  handleDeleteRow,
  state
}) => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 2 })
  const apiRef = useGridApiRef()

  const validationRegex = /^[0-9]*$/

  const NumericInputCell = ({ value, onCommit, rowId, field, dayDocId, rowData, dayTimestamp }) => {
    const maxInput = 12 - (dailyTotals[field] - (value || 0))

    const handleInputChange = (e, val) => {
      console.log(`${e.type} event: the new value is ${val}`)
      if (!validationRegex.test(val)) {
        return
      }
      const newValue = Math.min(parseInt(val, 10) || 0, maxInput)
      const args = [rowId, field, newValue, rowData, dayTimestamp]
      if (dayDocId) {
        args.push(dayDocId)
      }
      onCommit(...args)
    }

    return (
      <NumberInput
        // type='number'
        value={value}
        onChange={(e, val, onCommit) => handleInputChange(e, val, onCommit)}
        onInput={e => {
          const input = e.target
          const inputValue = input.value
          console.log(`the input value is: ${e.target.value}`)
          if (!validationRegex.test(inputValue)) {
            input.value = inputValue.replace(/[^0-9]/g, '')
          }
        }}
        style={{ width: '100%' }}
        min={0}
        max={maxInput}
        disabled={!isEditable(dayTimestamp)}
      />
    )
  }

  const isEditable = dayTimestamp => {
    const today = new Date()
    const yesterday = subDays(today, 1)
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 2 })
    const endOfCurrentWeek = addDays(startOfCurrentWeek, 6)
    const weekOfDay = startOfWeek(dayTimestamp, { weekStartsOn: 2 })
    //const isCurrentWeek = isSameWeek(today, weekOfDay, { weekStartsOn: 2 })

    const isCurrentWeek = dayTimestamp >= startOfCurrentWeek && dayTimestamp <= endOfCurrentWeek

    if (authUser.role === 5 || authUser.role === 10) {
      // Usuarios con roles 5 o 10 pueden editar días actuales y pasados, pero no futuros
      return dayTimestamp <= today
    } else {
      return isCurrentWeek && (isToday(dayTimestamp) || isSameDay(dayTimestamp, yesterday))
    }
  }

  const sumAggregation = {
    apply: ({ values, column }) => {
      console.log(`Applying aggregation for column: ${column.field}`)
      if (column.field in state.dailyTotals) {
        console.log(`Using dailyTotals for ${column.field}: ${state.dailyTotals[column.field]}`)

        return state.dailyTotals[column.field]
      }
      console.log(`Calculating sum for ${column.field}`)

      return values.reduce((sum, value) => sum + (value || 0), 0)
    },
    columnTypes: ['number'],
    label: 'Sum'
  }

  const columns = [
    {
      field: 'otNumber',
      headerName: 'OT',
      sortable: false,
      width: 130,
      renderCell: params => (params.row.hoursType === 'OT' ? params.row.otNumber : params.row.hoursType)
    },
    {
      field: 'otType',
      headerName: 'Tipo',
      sortable: false,
      width: 130,
      renderCell: params => (params.row.hoursType === 'OT' ? params.row.otType : params.row.hoursType)
    },
    {
      field: 'plant',
      headerName: 'Planta',
      sortable: false,
      width: 130,
      renderCell: params => params.row.plant || ''
    },
    ...Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(state.currentWeekStart, index)
      const dayKey = format(day, 'eeee', { locale: es }).toLowerCase()
      const dayTimestamp = new Date(day).setHours(0, 0, 0, 0)

      return {
        field: dayKey,
        headerName: `${format(day, 'eee', { locale: es })} ${format(day, 'd')}`,
        width: 130,
        sortable: false,
        renderFooter: () => <Box textAlign='center'>{state.dailyTotals[dayKey]} hrs</Box>,
        editable: isEditable(dayTimestamp),
        aggregable: true,
        aggregationFunction: 'sumAggregation',
        valueFormatter: ({ value }) => value || 0,
        type: 'number',
        renderCell: params =>
          params.row.isTotalRow ? (
            <Box>
              <Typography /* sx={{ color: 'red' }} */>{params.row[dayKey]}</Typography>
            </Box>
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
      width: 130,
      renderFooter: () => (
        <Box textAlign='center'>{rows.reduce((acc, row) => acc + (row.totalRowHours || 0), 0)} hrs</Box>
      ),
      renderCell: params => <span>{params.row.totalRowHours || 0}</span>
    }
  ]

  const initialAggregationModel = columns.reduce((acc, col) => {
    if (col.aggregable) {
      //*acc[col.field] = 'sum'
      // Forzar el valor inicial de dailyTotals en el modelo de agregación
      state.dailyTotals[col.field] = state.dailyTotals[col.field] || 0
    }

    return acc
  }, {})

  const [aggregationModel, setAggregationModel] = useState(initialAggregationModel)

  useEffect(() => {
    setAggregationModel({ ...initialAggregationModel })
  }, [rows])

  const aggregatedRow = {
    rowId: 'totalRow',
    otNumber: 'Total',
    otType: '',
    plant: '',
    isTotalRow: true,
    totalRowHours: rows.reduce((acc, row) => acc + (row.totalRowHours || 0), 0),
    ...state.dailyTotals
  }

  const getRowClassName = params => (params.row.isTotalRow ? 'total-row' : '')
  const isRowSelectable = params => !params.row.isTotalRow

  return (
    <Box style={{ height: 400, width: '100%' }}>
      {/* <Button
        variant='contained'
        color='primary'
        onClick={handleDeleteRow}
        disabled={!selectedRow} // El botón está desactivado si no hay fila seleccionada
      >
        Eliminar Fila
      </Button> */}
      <DataGridPremium
        apiRef={apiRef}
        sx={{
          height: 600,
          '& .total-row': {
            display: 'flex',
            justifyContent: 'flex-end'
          }
        }}
        rows={[...rows, aggregatedRow]}
        columns={columns}
        pageSize={5}
        checkboxSelection
        rowSelectionModel={state.selectedRow ? [state.selectedRow] : []}
        onRowSelectionModelChange={handleSelectionChange}
        disableMultipleRowSelection
        disableRowSelectionOnClick
        onCellEditCommit={handleCellEditCommit}
        getRowId={row => row.rowId}
        aggregationFunctions={{
          ...GRID_AGGREGATION_FUNCTIONS,
          sumAggregation
        }}
        aggregationModel={aggregationModel}
        onAggregationModelChange={newModel => setAggregationModel(newModel)}
        getRowClassName={getRowClassName}
        isRowSelectable={isRowSelectable}
      />
      <style>
        {`
          .total-row .MuiDataGrid-checkboxInput {
            display: none;
          }
          .total-row {

          }
        `}
      </style>
    </Box>
  )
}

export default TableCargaDeHoras
