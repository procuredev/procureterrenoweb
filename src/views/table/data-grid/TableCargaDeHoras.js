import React from 'react'
import { DataGridPremium } from '@mui/x-data-grid-premium'
import { startOfWeek, addDays, format, isToday, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { Box, Button } from '@mui/material'

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
    const maxInput = 12 - (dailyTotals[field] - (value || 0))

    return (
      <input
        type='number'
        value={value || 0}
        onChange={e => {
          // Llama al onCommit con los parámetros requeridos, pasando dayDocId solo si está presente
          const newValue = Math.min(parseInt(e.target.value, 10) || 0, maxInput)
          const args = [rowId, field, newValue, rowData, dayTimestamp]
          if (dayDocId) {
            args.push(dayDocId)
          }
          onCommit(...args) // Usa spread para pasar los argumentos
        }}
        style={{ width: '100%' }}
        min='0'
        max={maxInput}
      />
    )
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

      return {
        field: dayKey,
        headerName: `${format(day, 'eee', { locale: es })} ${format(day, 'd')}`,
        width: 130,
        renderFooter: () => <Box textAlign='center'>{state.dailyTotals[dayKey]} hrs</Box>,
        editable: authUser.role === 1 || isToday(day) || isPast(day),
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
        ),
        footer: `${dailyTotals[dayKey]} hrs`
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
      />
    </Box>
  )
}

export default TableCargaDeHoras
