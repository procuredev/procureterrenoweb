// ** React Imports
import React, { useReducer, useEffect, useCallback } from 'react'
import { getWeek, startOfWeek, endOfWeek, addWeeks, format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

// ** Custom Components Imports
import TableCargaDeHoras from 'src/views/table/data-grid/TableCargaDeHoras.js'
import DialogCreateHours from 'src/@core/components/DialogCreateHours/index.js'

const initialState = {
  currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 2 }),
  currentWeekEnd: endOfWeek(new Date(), { weekStartsOn: 2 }),
  weekHours: [],
  changes: [],
  otOptions: [],
  existingOTs: [],
  dialogOpen: false
}

function reducer(state, action) {
  switch (action.type) {
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

  const handleCellEditCommit = (rowId, field, newValue, rowData, dayTimestamp, dayDocId) => {
    console.log('Edit committed', { rowId, field, newValue, dayDocId })
    // Encuentra el índice de la fila modificada
    const rowIndex = state.weekHours.findIndex(row => row.rowId === rowId)
    if (rowIndex === -1) return // Si no se encuentra la fila, no hagas nada

    // Crea una nueva fila con el cambio aplicado
    const updatedRow = {
      ...state.weekHours[rowIndex],
      [field]: newValue,
      [`${field}DocId`]: dayDocId // Actualiza el ID del documento si es necesario
    }

    // Crea un nuevo array de 'weekHours' con la fila actualizada
    const updatedWeekHours = [...state.weekHours.slice(0, rowIndex), updatedRow, ...state.weekHours.slice(rowIndex + 1)]

    // Actualiza el estado de 'weekHours' y 'changes'
    dispatch({ type: 'SET_WEEK_HOURS', payload: updatedWeekHours })

    // Prepara el cambio con datos adicionales dependiendo si isNew es true
    const change = {
      rowId: rowId,
      field: field,
      newValue: newValue,
      isNew: !dayDocId, // Determina si es una nueva creación
      day: dayTimestamp,
      userRole: authUser.role,
      userShift: authUser.shift,
      plant: rowData.plant,
      hoursType: rowData.hoursType
    }

    if (rowData.hoursType === 'OT') {
      change.costCenter = rowData.costCenter
      change.otType = rowData.otType
      change.otNumber = rowData.otNumber
      change.otID = rowData.otID
    }

    // Agregar o actualizar el registro en el array de cambios
    const existingChangeIndex = state.changes.findIndex(change => change.rowId === rowId && change.field === field)

    if (existingChangeIndex >= 0) {
      const newChanges = [...state.changes]
      newChanges[existingChangeIndex] = change
      dispatch({ type: 'SET_CHANGES', payload: newChanges })
    } else {
      dispatch({ type: 'ADD_CHANGE', payload: change })
    }
  }

  const handleUpdateTable = async () => {
    const creations = state.changes.filter(change => change.isNew)
    const updates = state.changes.filter(change => !change.isNew)

    const loadWeekData = async () => {
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
      const creationResult = await createWeekHoursByType(authUser.uid, creations)
      console.log('Creation result:', creationResult)
    }
    if (updates.length > 0) {
      await Promise.all(updates.map(change => updateWeekHoursByType(change)))
    }
    await Promise.all(updates.map(change => updateWeekHoursByType(change)))

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
      ...initializeWeekDays(newRow)
    }
    dispatch({ type: 'SET_WEEK_HOURS', payload: [...state.weekHours, initializedRow] })
  }

  const prepareWeekHoursData = data => {
    // Inicializa un objeto para almacenar las filas agrupadas por rowId
    const rowsById = data.reduce((acc, doc) => {
      // Crea una nueva entrada si no existe
      if (!acc[doc.rowId]) {
        acc[doc.rowId] = {
          rowId: doc.rowId, // MUI DataGrid necesita un identificador único por fila
          plant: doc.plant,
          hoursType: doc.hoursType,
          lunes: 0, // Inicializa todos los días a 0
          martes: 0,
          miércoles: 0,
          jueves: 0,
          viernes: 0,
          sábado: 0,
          domingo: 0,
          // Inicializa los docIds para cada día
          lunesDocId: null,
          martesDocId: null,
          miércolesDocId: null,
          juevesDocId: null,
          viernesDocId: null,
          sábadoDocId: null,
          domingoDocId: null,
          ...(doc.hoursType === 'OT'
            ? {
                otNumber: doc.ot.number || '',
                otType: doc.ot.type || '',
                otID: doc.ot.id || ''
              }
            : {})
        }
      }
      // Asigna las horas y el ID del documento para el día específico
      acc[doc.rowId][doc.column] = doc.hours
      acc[doc.rowId][`${doc.column}DocId`] = doc.id

      return acc
    }, {})

    // Convierte el objeto de filas en un array para su uso en DataGrid
    return Object.values(rowsById)
  }
  console.log('state: ', state)

  return (
    <Box sx={{ width: '100%' }}>
      <Button onClick={() => dispatch({ type: 'TOGGLE_DIALOG' })}>Crear Fila</Button>
      <Button variant='contained' color='primary' onClick={handleUpdateTable} disabled={state.changes.length === 0}>
        Actualizar Tabla
      </Button>
      <Button onClick={() => dispatch({ type: 'CHANGE_WEEK', payload: -1 })}>Semana Anterior</Button>
      <Button onClick={() => dispatch({ type: 'CHANGE_WEEK', payload: 1 })}>Semana Siguiente</Button>
      <TableCargaDeHoras rows={state.weekHours} handleCellEditCommit={handleCellEditCommit} authUser={authUser} />
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
