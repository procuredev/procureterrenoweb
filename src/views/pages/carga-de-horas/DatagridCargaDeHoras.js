// ** React Imports
import React, { useReducer, useEffect, useCallback } from 'react'
import { getWeek, startOfWeek, endOfWeek, addWeeks, format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import { Box, Button, Typography } from '@mui/material'
// ** Custom Components Imports
import TableCargaDeHoras from 'src/views/table/data-grid/TableCargaDeHoras.js'
import DialogCreateHours from 'src/@core/components/DialogCreateHours/index.js'

const initialState = {
  currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 2 }),
  currentWeekEnd: endOfWeek(new Date(), { weekStartsOn: 2 }),
  currentWeekNumber: getWeek(new Date(), { weekStartsOn: 2 }),
  weekHours: [],
  changes: [],
  otOptions: [],
  existingOTs: [],
  dialogOpen: false,
  selectedRow: null,
  dailyTotals: {
    martes: 0,
    miércoles: 0,
    jueves: 0,
    viernes: 0,
    sábado: 0,
    domingo: 0,
    lunes: 0
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SELECTED_ROW':
      return { ...state, selectedRow: action.payload }
    case 'CHANGE_WEEK':
      const newStart = addWeeks(state.currentWeekStart, action.payload)

      const resetDailyTotals = {
        martes: 0,
        miércoles: 0,
        jueves: 0,
        viernes: 0,
        sábado: 0,
        domingo: 0,
        lunes: 0
      }

      return {
        ...state,
        currentWeekStart: newStart,
        currentWeekEnd: endOfWeek(newStart, { weekStartsOn: 2 }),
        currentWeekNumber: getWeek(newStart, { weekStartsOn: 2 }),
        dailyTotals: resetDailyTotals
      }
    case 'UPDATE_DAILY_TOTALS':
      return {
        ...state,
        dailyTotals: { ...state.dailyTotals, ...action.payload }
      }
    case 'SET_CHANGES':
      return { ...state, changes: action.payload }
    case 'SET_WEEK_HOURS':
      return { ...state, weekHours: action.payload }
    case 'ADD_CHANGE':
      return { ...state, changes: [...state.changes, action.payload] }
    case 'CLEAR_CHANGES':
      return { ...state, changes: [] }
    case 'TOGGLE_DIALOG':
      return { ...state, dialogOpen: !state.dialogOpen }
    case 'SET_OT_OPTIONS':
      return { ...state, otOptions: action.payload }
    case 'CHANGE_WEEK':
      return { ...state, currentWeekStart: addWeeks(state.currentWeekStart, action.payload) }
    default:
      return state
  }
}

const DataGridCargaDeHoras = () => {
  const [state, dispatch] = useReducer(reducer, initialState)

  const {
    fetchWeekHoursByType,
    createWeekHoursByType,
    updateWeekHoursByType,
    fetchSolicitudes,
    loadWeekData,
    authUser
  } = useFirebase()

  useEffect(() => {
    const fetchOtOptions = async () => {
      const otData = await fetchSolicitudes(authUser)
      dispatch({ type: 'SET_OT_OPTIONS', payload: otData })
    }
    if (authUser) {
      fetchOtOptions()
    }
  }, [authUser])

  useEffect(() => {
    const loadWeekData = async () => {
      const resetDailyTotals = {
        martes: 0,
        miércoles: 0,
        jueves: 0,
        viernes: 0,
        sábado: 0,
        domingo: 0,
        lunes: 0
      }
      dispatch({ type: 'UPDATE_DAILY_TOTALS', payload: resetDailyTotals })

      const data = await fetchWeekHoursByType(authUser.uid, state.currentWeekStart, state.currentWeekEnd)
      if (!data.error) {
        const preparedData = prepareWeekHoursData(data)
        dispatch({ type: 'SET_WEEK_HOURS', payload: preparedData })
      } else {
        console.error(data.error)
        dispatch({ type: 'SET_WEEK_HOURS', payload: [] })
      }
    }
    loadWeekData()
  }, [state.currentWeekStart, authUser, fetchWeekHoursByType])

  // Funciones para manejar los botones de cambio de semana
  const handlePreviousWeek = () => {
    dispatch({ type: 'CHANGE_WEEK', payload: -1 })
  }

  const handleNextWeek = () => {
    dispatch({ type: 'CHANGE_WEEK', payload: 1 })
  }

  const handleSelectionChange = selectionModel => {
    if (selectionModel.length === 0) {
      dispatch({ type: 'SET_SELECTED_ROW', payload: null })
    } else {
      dispatch({ type: 'SET_SELECTED_ROW', payload: selectionModel[0] })
    }
  }

  const handleDeleteRow = () => {
    if (state.selectedRow) {
      const newWeekHours = state.weekHours.filter(row => row.rowId !== state.selectedRow)
      dispatch({ type: 'SET_WEEK_HOURS', payload: newWeekHours })
      dispatch({ type: 'SET_SELECTED_ROW', payload: null }) // Resetea la selección
    }
  }

  const handleCellEditCommit = (rowId, field, newValue, rowData, dayTimestamp, dayDocId) => {
    // Encuentra el índice de la fila modificada
    const rowIndex = state.weekHours.findIndex(row => row.rowId === rowId)
    if (rowIndex === -1) return

    const oldRowValue = state.weekHours[rowIndex][field] || 0
    const newRowValue = newValue
    const newTotalDayHours = state.dailyTotals[field] - oldRowValue + newRowValue

    if (newTotalDayHours > 12) {
      alert('No se pueden exceder 12 horas por día.')

      return
    }

    // Crea una nueva fila con el cambio aplicado
    const updatedRow = {
      ...state.weekHours[rowIndex],
      [field]: newValue,
      totalRowHours: state.weekHours[rowIndex].totalRowHours - oldRowValue + newRowValue,
      ...(state.weekHours[rowIndex].dayDocId && { [`${field}DocId`]: dayDocId }) // Actualiza el ID del documento si es necesario
    }

    // Actualiza los totales diarios
    let newDailyTotal = state.dailyTotals[field] - oldRowValue + newValue

    // Crea un nuevo array de 'weekHours' con la fila actualizada
    const updatedWeekHours = [...state.weekHours.slice(0, rowIndex), updatedRow, ...state.weekHours.slice(rowIndex + 1)]

    const updatedDailyTotals = { ...state.dailyTotals, [field]: newDailyTotal }

    // Actualiza el estado de 'weekHours' y 'changes'
    dispatch({ type: 'SET_WEEK_HOURS', payload: updatedWeekHours })
    dispatch({ type: 'UPDATE_DAILY_TOTALS', payload: updatedDailyTotals })

    // Prepara el cambio con datos adicionales dependiendo si isNew es true
    const change = {
      rowId,
      field,
      newValue,
      isNew: !dayDocId, // Determina si es una nueva creación
      day: dayTimestamp,
      userRole: authUser.role,
      userShift: authUser.shift,
      hoursType: rowData.hoursType,
      ...(dayDocId && { dayDocId }),
      ...(rowData.plant && { plant: rowData.plant })
    }

    if (rowData.hoursType === 'OT') {
      change.costCenter = rowData.costCenter
      change.otType = rowData.otType
      change.otNumber = rowData.otNumber
      change.otID = rowData.otID
    }

    // Agrega o actualiza el registro en el array de cambios
    const existingChangeIndex = state.changes.findIndex(change => change.rowId === rowId && change.field === field)

    if (existingChangeIndex >= 0) {
      state.changes[existingChangeIndex] = change
    } else {
      state.changes.push(change)
    }

    dispatch({ type: 'UPDATE_CHANGES', payload: state.changes })
  }

  const handleUpdateTable = async () => {
    const creations = state.changes.filter(change => change.isNew && !change.dayDocId)
    const updates = state.changes.filter(change => !change.isNew && change.dayDocId)

    const loadWeekData = async () => {
      const resetDailyTotals = {
        martes: 0,
        miércoles: 0,
        jueves: 0,
        viernes: 0,
        sábado: 0,
        domingo: 0,
        lunes: 0
      }
      dispatch({ type: 'UPDATE_DAILY_TOTALS', payload: resetDailyTotals })

      const data = await fetchWeekHoursByType(authUser.uid, state.currentWeekStart, state.currentWeekEnd)
      if (!data.error) {
        const preparedData = prepareWeekHoursData(data)
        dispatch({ type: 'SET_WEEK_HOURS', payload: preparedData })
      } else {
        console.error(data.error)
        dispatch({ type: 'SET_WEEK_HOURS', payload: [] })
      }
    }

    if (creations.length > 0) {
      const creationResult = await createWeekHoursByType(authUser, creations)
      console.log('Creation result:', creationResult)
    }
    if (updates.length > 0) {
      const updatesResult = await updateWeekHoursByType(authUser.uid, updates)
      console.log('Updates result: ', updatesResult)
    }

    dispatch({ type: 'CLEAR_CHANGES' })
    loadWeekData() // Re-fetch the data
  }

  // Función para inicializar los días de la semana para un nuevo registro
  const initializeWeekDays = newRow => {
    const days = {}
    for (let i = 0; i < 7; i++) {
      const day = format(addDays(state.currentWeekStart, i), 'eeee', { locale: es }).toLowerCase()
      days[day] = newRow[day] || 0
    }

    return days
  }

  // Ajuste del onSubmit para manejar correctamente la creación de la nueva fila
  const handleCreateNewRow = newRow => {
    const initializedRow = {
      ...newRow,
      totalRowHours: 0,
      ...initializeWeekDays(newRow)
    }
    dispatch({ type: 'SET_WEEK_HOURS', payload: [...state.weekHours, initializedRow] })
  }

  const prepareWeekHoursData = data => {
    let newDailyTotals = {
      martes: 0,
      miércoles: 0,
      jueves: 0,
      viernes: 0,
      sábado: 0,
      domingo: 0,
      lunes: 0
    }

    // Inicializa un objeto para almacenar las filas agrupadas por rowId
    const rowsById = data.reduce((acc, doc) => {
      // Crea una nueva entrada si no existe
      if (!acc[doc.rowId]) {
        acc[doc.rowId] = {
          rowId: doc.rowId,
          plant: doc.plant ? doc.plant : authUser.role === 5 || authUser.role === 10 ? <Button>Asignar</Button> : '',
          hoursType: doc.hoursType,
          totalRowHours: 0,
          lunes: 0, // Inicializa todos los días a 0
          martes: 0,
          miércoles: 0,
          jueves: 0,
          viernes: 0,
          sábado: 0,
          domingo: 0,
          ...(doc.hoursType === 'OT'
            ? {
                otNumber: doc.ot.number,
                otType: doc.ot.type,
                otID: doc.ot.id
              }
            : {})
        }
      }
      // Asigna las horas y el ID del documento para el día específico
      const day = doc.column && doc.column.toLowerCase()
      if (day && newDailyTotals.hasOwnProperty(day)) {
        const hoursToAdd = parseFloat(doc.hours) || 0
        acc[doc.rowId][day] = hoursToAdd
        acc[doc.rowId].totalRowHours += hoursToAdd
        newDailyTotals[doc.column] += hoursToAdd
      } else {
        console.error('Columna indefinida o no válida: ', doc.column)
      }
      if (doc.id) {
        acc[doc.rowId][`${doc.column}DocId`] = doc.id
      }

      return acc
    }, {})
    dispatch({ type: 'UPDATE_DAILY_TOTALS', payload: newDailyTotals })

    // Convierte el objeto de filas en un array para su uso en DataGrid
    return Object.values(rowsById)
  }

  console.log('state: ', state)
  console.log('state.dailyTotals: ', state.dailyTotals)

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant='h4' gutterBottom>
        Carga de Horas
      </Typography>
      <Typography variant='subtitle1'>
        {`${format(state.currentWeekStart, 'dd MMM', {
          locale: es
        })} - ${format(state.currentWeekEnd, 'dd MMM', { locale: es })}  (Semana ${state.currentWeekNumber})`}
      </Typography>
      <Button onClick={() => dispatch({ type: 'TOGGLE_DIALOG' })}>Crear Fila</Button>
      <Button variant='contained' color='primary' onClick={handleUpdateTable} disabled={state.changes.length === 0}>
        Actualizar Tabla
      </Button>
      <Button onClick={handleDeleteRow} disabled={!state.selectedRow} variant='contained' color='error'>
        Eliminar Fila
      </Button>
      <Button onClick={handlePreviousWeek}>Semana Anterior</Button>
      <Button onClick={handleNextWeek}>Semana Siguiente</Button>
      <TableCargaDeHoras
        rows={state.weekHours}
        handleCellEditCommit={handleCellEditCommit}
        authUser={authUser}
        dailyTotals={state.dailyTotals}
        handleSelectionChange={handleSelectionChange}
        selectedRow={state.selectedRow}
        handleDeleteRow={handleDeleteRow}
        state={state}
      />
      {state.dialogOpen && (
        <DialogCreateHours
          open={state.dialogOpen}
          onClose={() => dispatch({ type: 'TOGGLE_DIALOG' })}
          onSubmit={handleCreateNewRow}
          authUser={authUser}
          otOptions={state.otOptions}
          rows={state.weekHours}
        />
      )}
    </Box>
  )
}

export default DataGridCargaDeHoras
