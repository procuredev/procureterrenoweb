import React, { useState, useEffect } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { TextField, Typography, Box } from '@mui/material'

const TableCargaDeHoras = ({ rows, onChangesDetected }) => {
  const [data, setData] = useState(rows)

  useEffect(() => {
    setData(rows)
  }, [rows])

  const handleCellEditCommit = params => {
    const { id, field, value } = params

    const newValue = parseInt(value)

    const newData = data.map(row => {
      if (row.id === id) {
        const dayIndex = parseInt(field)
        const oldDayValue = row.hoursPerWeek.week[dayIndex]?.totalHoursDay || 0

        if (newValue !== oldDayValue) {
          const updatedWeek = [...row.hoursPerWeek.week]
          updatedWeek[dayIndex] = { ...updatedWeek[dayIndex], totalHoursDay: newValue }

          onChangesDetected({ id, [field]: newValue })

          return { ...row, hoursPerWeek: { ...row.hoursPerWeek, week: updatedWeek } }
        }
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
            value={row.hoursPerWeek?.week[0]?.totalHoursDay || '0'}
            onChange={e => handleCellEditCommit({ id: params.id, field: 0, value: e.target.value })}
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
            value={row.hoursPerWeek?.week[1]?.totalHoursDay || '0'}
            onChange={e => handleCellEditCommit({ id: params.id, field: 1, value: e.target.value })}
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
            value={row.hoursPerWeek?.week[2]?.totalHoursDay || '0'}
            onChange={e => handleCellEditCommit({ id: params.id, field: 2, value: e.target.value })}
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
            value={row.hoursPerWeek?.week[3]?.totalHoursDay || '0'}
            onChange={e => handleCellEditCommit({ id: params.id, field: 3, value: e.target.value })}
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
            value={row.hoursPerWeek?.week[4]?.totalHoursDay || '0'}
            onChange={e => handleCellEditCommit({ id: params.id, field: 4, value: e.target.value })}
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
            value={row.hoursPerWeek?.week[5]?.totalHoursDay || '0'}
            onChange={e => handleCellEditCommit({ id: params.id, field: 5, value: e.target.value })}
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
            value={row.hoursPerWeek?.week[6]?.totalHoursDay || '0'}
            onChange={e => handleCellEditCommit({ id: params.id, field: 6, value: e.target.value })}
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
        const total = Object.keys(params.row)
          .filter(key => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(key))
          .reduce((acc, day) => acc + (Number(params.row[day]) || 0), 0)

        return <div>{total}</div>
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
