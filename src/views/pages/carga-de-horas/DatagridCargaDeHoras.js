// ** React Imports
import React, { useState, useEffect } from 'react'
import { getWeek, startOfWeek, eachDayOfInterval, format } from 'date-fns'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

// ** Custom Components Imports
import TableCargaDeHoras from 'src/views/table/data-grid/TableCargaDeHoras'
import DialogCreateHours from 'src/@core/components/DialogCreateHours'

const DataGridCargaDeHoras = () => {
  const [weekHours, setWeekHours] = useState([])
  const [otFetch, setOtFetch] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [changes, setChanges] = useState({})

  const {
    authUser,
    fetchWeekHoursByType,
    fetchSolicitudes,
    createWeekHoursByType,
    updateWeekHoursByType
  } = useFirebase()

  useEffect(() => {
    const loadInitialData = async () => {
      const now = new Date()
      const weekNumber = getWeek(now, { weekStartsOn: 1 })
      const weekId = `${now.getFullYear()}-${weekNumber}`

      const hoursData = await fetchWeekHoursByType(weekId, authUser.uid)
      if (hoursData.error) {
        console.error(hoursData.error)
        setWeekHours([])
      } else {
        const sortedData = hoursData.sort((a, b) => a.created - b.created)

        setWeekHours(sortedData)
      }

      const solicitudes = await fetchSolicitudes(authUser)
      setOtFetch(solicitudes || [])
    }

    if (authUser && authUser.uid) {
      loadInitialData()
    }
  }, [authUser])

  const handleCreateHours = async newHourDetails => {
    const now = new Date()
    const weekNumber = getWeek(now, { weekStartsOn: 1 })
    const weekId = `${now.getFullYear()}-${weekNumber}`

    const result = await createWeekHoursByType(weekId, authUser, newHourDetails)
    if (result.success) {
      const newData = {
        ...newHourDetails,
        id: result.id,
        hoursPerWeek: {
          totalHoursPerWeek: 0,
          week: {
            martes: { totalHoursPerDay: 0, logs: {} },
            miercoles: { totalHoursPerDay: 0, logs: {} },
            jueves: { totalHoursPerDay: 0, logs: {} },
            viernes: { totalHoursPerDay: 0, logs: {} },
            sabado: { totalHoursPerDay: 0, logs: {} },
            domingo: { totalHoursPerDay: 0, logs: {} },
            lunes: { totalHoursPerDay: 0, logs: {} }
          }
        }
      }
      setWeekHours(prev => [...prev, newData])
    }
    setDialogOpen(false)
  }

  const handleUpdateHours = async () => {
    if (hasChanges) {
      const now = new Date()
      const weekNumber = getWeek(now, { weekStartsOn: 1 })
      const weekId = `${now.getFullYear()}-${weekNumber}`

      const updatesFormatted = Object.entries(changes).map(([docID, changes]) => ({
        docID,
        updates: Object.entries(changes)
          .filter(([key]) => key !== 'totalHoursPerWeek')
          .map(([day, hoursWorked]) => ({
            day,
            hoursWorked: hoursWorked
          })),
        totalHoursPerWeek: changes.totalHoursPerWeek
      }))

      const result = await updateWeekHoursByType(weekId, authUser.uid, updatesFormatted)
      if (result.success) {
        console.log('Actualización exitosa')
        setHasChanges(false) // Restablece el estado para deshabilitar el botón
      } else {
        console.error('Error en la actualización:', result.error)
      }
    }
  }

  const handleChangesDetected = change => {
    const { id, field, value, totalHoursPerWeek } = change

    if (!id) {
      console.error('ID is undefined', { id, value })

      return
    }

    if (!field) {
      console.error('Field is undefined', { field, value })

      return
    }

    const parsedValue = parseInt(value, 10)
    if (isNaN(parsedValue)) {
      console.error('Value is not a number', value)

      return
    }

    setChanges(prev => {
      const updatedChanges = { ...prev }

      if (!updatedChanges[id]) {
        updatedChanges[id] = {
          totalHoursPerWeek: totalHoursPerWeek
        }
      }

      // Asegura que el cambio registrado para el día específico se actualice correctamente.
      updatedChanges[id][field] = parsedValue
      updatedChanges[id].totalHoursPerWeek = totalHoursPerWeek

      return updatedChanges
    })

    setHasChanges(true)
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Button onClick={() => setDialogOpen(true)}>Agregar Nueva Fila</Button>
      <Button onClick={handleUpdateHours} disabled={!hasChanges}>
        Actualizar Tabla
      </Button>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TableCargaDeHoras
            rows={weekHours}
            updateWeekHoursByType={updateWeekHoursByType}
            onChangesDetected={handleChangesDetected}
          />
        </Grid>
      </Grid>
      {dialogOpen && (
        <DialogCreateHours
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleCreateHours}
          otOptions={otFetch}
          existingRows={weekHours}
          userParams={authUser}
        />
      )}
    </Box>
  )
}

export default DataGridCargaDeHoras
