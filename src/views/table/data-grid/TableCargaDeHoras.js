import React, { useEffect, useState } from 'react'
import { DataGridPremium, GRID_AGGREGATION_FUNCTIONS } from '@mui/x-data-grid-premium'
import { startOfWeek, addDays, format, isToday, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { Box, Button } from '@mui/material'
import { Unstable_NumberInput as NumberInput } from '@mui/base/Unstable_NumberInput' // Importa el componente NumberInput

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

  const NumericInputCell = ({ value, onCommit, rowId, field, dayDocId, rowData, dayTimestamp }) => {
    return (
      <NumberInput
        value={value || 0}
        onChange={(event, val) => {
          // Maneja la lógica del dayDocId
          if (dayDocId) {
            onCommit(rowId, field, val, rowData, dayTimestamp, dayDocId)
          } else {
            onCommit(rowId, field, val, rowData, dayTimestamp)
          }
        }}
        style={{ width: '100%' }}
        min={0}
        max={12}
        step={1}
      />
    )
  }

  const calculateTotalHours = (rows, dayKey) => {
    return rows.reduce((total, row) => total + (Number(row[dayKey]) || 0), 0)
  }

  const columns = [
    {
      field: 'otNumber',
      headerName: 'OT',
      width: 130,
      renderCell: params => (params.row.hoursType === 'OT' ? params.row.otNumber : params.row.hoursType)
    },
    {
      field: 'otType',
      headerName: 'Tipo',
      width: 130,
      renderCell: params => (params.row.hoursType === 'OT' ? params.row.otType : params.row.hoursType)
    },
    {
      field: 'plant',
      headerName: 'Planta',
      width: 130,
      renderCell: params => params.row.plant || ''
    },
    ...Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(startOfWeek(new Date(), { weekStartsOn: 2 }), index)
      const dayKey = format(day, 'eeee', { locale: es }).toLowerCase()
      const dayTimestamp = new Date(day).setHours(0, 0, 0, 0)
      const formattedDayKey = dayKey.charAt(0).toUpperCase() + dayKey.slice(1)

      return {
        field: dayKey,
        headerName: `${format(day, 'eee', { locale: es })} ${format(day, 'd')}`,
        width: 130,
        editable: authUser.role === 1 || isToday(day) || isPast(day),
        type: 'number',
        aggregable: true,
        valueGetter: params => params.row[dayKey] || 0,
        renderCell: params => (
          <NumericInputCell
            value={params.row[dayKey] !== undefined ? params.row[dayKey] : 0}
            onCommit={handleCellEditCommit}
            rowId={params.row.rowId}
            field={dayKey}
            dayDocId={params.row[`${dayKey}DocId`]}
            rowData={params.row} // Asegura que pase todo el objeto de la fila
            dayTimestamp={dayTimestamp}
          />
        )
      }
    }),
    {
      field: 'totalRowHours',
      headerName: 'Total Horas',
      width: 130,
      // renderFooter: () => (
      //   <Box textAlign='center'>{rows.reduce((acc, row) => acc + (row.totalRowHours || 0), 0)} hrs</Box>
      // ),
      renderCell: params => <span>{params.row.totalRowHours || 0}</span>
    }
  ]

  const initialAggregationModel = columns.reduce((acc, col) => {
    if (col.aggregable) acc[col.field] = 'sum'

    return acc
  }, {})

  const [aggregationModel, setAggregationModel] = useState(initialAggregationModel)

  useEffect(() => {
    setAggregationModel({ ...initialAggregationModel })
  }, [rows])

  console.log('aggregationModel: ', aggregationModel)

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
        rows={rows}
        columns={columns}
        pageSize={5}
        checkboxSelection
        selectionModel={state.selectedRow ? [state.selectedRow] : []}
        onSelectionModelChange={handleSelectionChange}
        disableMultipleSelection
        disableSelectionOnClick
        onCellEditCommit={handleCellEditCommit}
        getRowId={row => row.rowId}
        aggregationFunctions={{
          ...GRID_AGGREGATION_FUNCTIONS,
          sumAggregation: {
            apply: ({ values }) => values.reduce((sum, value) => sum + (value || 0), 0),
            columnTypes: ['number'],
            label: 'Sum'
          }
        }}
        aggregationModel={aggregationModel}
        onAggregationModelChange={newModel => setAggregationModel(newModel)}
      />
    </Box>
  )
}

export default TableCargaDeHoras
