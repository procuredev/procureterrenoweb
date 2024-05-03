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
        setWeekHours(hoursData)
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
        id: result.id
      }
      setWeekHours(prev => [...prev, newData])
    }
    setDialogOpen(false)
  }

  const handleUpdateHours = async () => {
    const updates = Object.entries(changes).map(([docID, dayChanges]) => ({
      docID,
      updates: Object.entries(dayChanges).map(([day, hoursWorked]) => ({
        day: parseInt(day),
        hoursWorked: parseInt(hoursWorked)
      }))
    }))

    const now = new Date()
    const weekNumber = getWeek(now, { weekStartsOn: 1 })
    const weekId = `${now.getFullYear()}-${weekNumber}`

    const result = await updateWeekHoursByType(weekId, authUser.uid, updates)
    console.log(result)
  }

  const handleChangesDetected = change => {
    const { id, field, value } = change
    setChanges(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  console.log('Object.keys(changes): ', Object.keys(changes))

  return (
    <Box sx={{ width: '100%' }}>
      <Button onClick={() => setDialogOpen(true)}>Agregar Nueva Fila</Button>
      <Button onClick={handleUpdateHours} disabled={Object.keys(changes).length === 0}>
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
