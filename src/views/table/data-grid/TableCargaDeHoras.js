import React, { useState, useEffect } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { TextField, Typography, Box } from '@mui/material'

const TableCargaDeHoras = ({ rows, onChangesDetected }) => {
  const [data, setData] = useState(rows)

  useEffect(() => {
    const initializedRows = rows.map(row => ({
      ...row,
      hoursPerWeek: {
        ...row.hoursPerWeek,
        totalHoursPerWeek: row.hoursPerWeek.totalHoursPerWeek
      }
    }))
    const sortedRows = initializedRows.sort((a, b) => a.created - b.created)

    setData(sortedRows)
  }, [rows])

  const handleCellEditCommit = params => {
    const { id, field, value } = params

    const newValue = parseInt(value) || 0

    const newData = data.map(row => {
      if (row.id === id) {
        if (!row.hoursPerWeek) {
          row.hoursPerWeek = { totalHoursPerWeek: 0, week: {} }
        }
        if (!row.hoursPerWeek.week[field]) {
          row.hoursPerWeek.week[field] = { totalHoursPerDay: 0, logs: {} }
        }

        // Actualiza el día específico y recalcula el total de horas de la semana.
        row.hoursPerWeek.week[field].totalHoursPerDay = newValue
        row.hoursPerWeek.totalHoursPerWeek = Object.values(row.hoursPerWeek.week).reduce(
          (total, day) => total + (day.totalHoursPerDay || 0),
          0
        )

        // Notifica el cambio para el manejo global
        onChangesDetected({ id, field, value: newValue, totalHoursPerWeek: row.hoursPerWeek.totalHoursPerWeek })

        return { ...row }
      }

      return row
    })

    setData(newData)
  }

  const columns = [
    {
      field: 'ot',
      headerName: 'OT',
      width: 130,
      renderCell: params => {
        const { row } = params
        let otNumber = row.inputHoursType === 'OT' ? row.otNumber : row.inputHoursType

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography>{otNumber}</Typography>
          </Box>
        )
      }
    },
    {
      field: 'type',
      headerName: 'Tipo',
      width: 190,
      renderCell: params => {
        const { row } = params

        const tipo =
          row.inputHoursType === 'OT' ? (row.isGabinete === true ? 'Gabinete' : 'Levantamiento') : row.inputHoursType

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography>{tipo}</Typography>
          </Box>
        )
      }
    },
    {
      field: 'plant',
      headerName: 'Planta',
      width: 280,
      renderCell: params => {
        const { row } = params

        return (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography>{row.plant}</Typography>
          </Box>
        )
      }
    },
    {
      field: 'martes',
      headerName: 'Martes',
      width: 130,
      editable: true,
      renderCell: params => {
        const { row } = params

        return (
          <TextField
            fullWidth
            value={row.hoursPerWeek?.week.martes?.totalHoursPerDay || 0}
            onChange={e => handleCellEditCommit({ id: params.id, field: 'martes', value: e.target.value })}
            inputProps={{ type: 'number', min: 0, max: 12 }}
          />
        )
      }
    },
    {
      field: 'miercoles',
      headerName: 'Miercoles',
      width: 130,
      editable: true,
      renderCell: params => {
        const { row } = params

        return (
          <TextField
            fullWidth
            value={row.hoursPerWeek?.week.miercoles?.totalHoursPerDay || 0}
            onChange={e => handleCellEditCommit({ id: params.id, field: 'miercoles', value: e.target.value })}
            inputProps={{ type: 'number', min: 0, max: 12 }}
          />
        )
      }
    },
    {
      field: 'jueves',
      headerName: 'Jueves',
      width: 130,
      editable: true,
      renderCell: params => {
        const { row } = params

        return (
          <TextField
            fullWidth
            value={row.hoursPerWeek?.week.jueves?.totalHoursPerDay || 0}
            onChange={e => handleCellEditCommit({ id: params.id, field: 'jueves', value: e.target.value })}
            inputProps={{ type: 'number', min: 0, max: 12 }}
          />
        )
      }
    },
    {
      field: 'viernes',
      headerName: 'Viernes',
      width: 130,
      editable: true,
      renderCell: params => {
        const { row } = params

        return (
          <TextField
            fullWidth
            value={row.hoursPerWeek?.week.viernes?.totalHoursPerDay || 0}
            onChange={e => handleCellEditCommit({ id: params.id, field: 'viernes', value: e.target.value })}
            inputProps={{ type: 'number', min: 0, max: 12 }}
          />
        )
      }
    },
    {
      field: 'sabado',
      headerName: 'Sabado',
      width: 130,
      editable: true,
      renderCell: params => {
        const { row } = params

        return (
          <TextField
            fullWidth
            value={row.hoursPerWeek?.week.sabado?.totalHoursPerDay || 0}
            onChange={e => handleCellEditCommit({ id: params.id, field: 'sabado', value: e.target.value })}
            inputProps={{ type: 'number', min: 0, max: 12 }}
          />
        )
      }
    },
    {
      field: 'domingo',
      headerName: 'Domingo',
      width: 130,
      editable: true,
      renderCell: params => {
        const { row } = params

        return (
          <TextField
            fullWidth
            value={row.hoursPerWeek?.week.domingo?.totalHoursPerDay || 0}
            onChange={e => handleCellEditCommit({ id: params.id, field: 'domingo', value: e.target.value })}
            inputProps={{ type: 'number', min: 0, max: 12 }}
          />
        )
      }
    },
    {
      field: 'lunes',
      headerName: 'Lunes',
      width: 130,
      editable: true,
      renderCell: params => {
        const { row } = params

        return (
          <TextField
            fullWidth
            value={row.hoursPerWeek?.week.lunes?.totalHoursPerDay || '0'}
            onChange={e => handleCellEditCommit({ id: params.id, field: 'lunes', value: e.target.value })}
            inputProps={{ type: 'number', min: 0, max: 12 }}
          />
        )
      }
    },
    {
      field: 'totalWeekHours',
      headerName: 'Total de horas por semana',
      width: 190,
      renderCell: params => {
        const { row } = params

        return <Typography>{row?.hoursPerWeek?.totalHoursPerWeek}</Typography>
      }
    }
  ]

  return (
    <div style={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={data}
        columns={columns}
        getRowId={row => row.id}
        onCellEditCommit={handleCellEditCommit}
        pageSize={5}
      />
    </div>
  )
}

export default TableCargaDeHoras
