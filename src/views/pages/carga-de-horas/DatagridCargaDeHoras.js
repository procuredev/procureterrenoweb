// ** React Imports
import React, { useReducer, useEffect, useState } from 'react'
import { getWeek, startOfWeek, endOfWeek, addWeeks, format, addDays, isSameWeek, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import { Box, Button, Typography, FormControl, Autocomplete, TextField, CircularProgress } from '@mui/material'
import { Switch } from '@mui/base/Switch'

// ** Custom Components Imports
import TableCargaDeHoras from 'src/views/table/data-grid/TableCargaDeHoras.js'
import DialogCreateHours from 'src/@core/components/DialogCreateHours/index.js'
import ConfirmDeleteDialog from 'src/@core/components/dialog-confirmDeleteRowHH/index.js'
import WarningDialog from 'src/@core/components/dialog-warningSaveChanges/index.js'
import MaxHoursDialog from 'src/@core/components/dialog-excessDailyHours/index.js'

const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 2 })

const initialState = {
  currentWeekStart: currentWeekStart,
  currentWeekEnd: endOfWeek(new Date(), { weekStartsOn: 2 }),
  currentWeekNumber: getWeek(currentWeekStart),
  weekHours: [],
  changes: [],
  showWarningDialog: false,
  showMaxHoursDialog: false,
  previousSwitchState: null,
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
  },
  toggleValue: false,
  selectedUser: null,
  userList: []
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

      const currentWeekStart = newStart

      return {
        ...state,
        currentWeekStart: currentWeekStart,
        currentWeekEnd: endOfWeek(newStart, { weekStartsOn: 2 }),
        currentWeekNumber: getWeek(currentWeekStart),
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
    case 'CHANGE_WEEK':
      return { ...state, currentWeekStart: addWeeks(state.currentWeekStart, action.payload) }
    case 'SET_TOGGLE_VALUE':
      return { ...state, toggleValue: action.payload }
    case 'SET_SELECTED_USER':
      return { ...state, selectedUser: action.payload }
    case 'SET_USER_LIST':
      return { ...state, userList: action.payload }
    case 'TOGGLE_WARNING_DIALOG':
      return { ...state, showWarningDialog: action.payload }
    case 'TOGGLE_MAXHOURS_DIALOG':
      return { ...state, showMaxHoursDialog: action.payload }
    case 'SET_PREVIOUS_SWITCH_STATE':
      return { ...state, previousSwitchState: action.payload }
    default:
      return state
  }
}

const DataGridCargaDeHoras = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    fetchWeekHoursByType,
    createWeekHoursByType,
    updateWeekHoursByType,
    authUser,
    fetchUserList,
    updateWeekHoursWithPlant,
    deleteWeekHoursByType
  } = useFirebase()

  useEffect(() => {
    if (authUser) {
      dispatch({ type: 'CLEAR_CHANGES' }) // Limpia los cambios al cambiar de usuario
    }
  }, [authUser])

  useEffect(() => {
    const loadWeekData = async () => {
      dispatch({ type: 'UPDATE_DAILY_TOTALS', payload: resetDailyTotals })

      const userId = state.toggleValue === false ? authUser.uid : state.selectedUser.id
      const data = await fetchWeekHoursByType(userId, state.currentWeekStart, state.currentWeekEnd)
      if (!data.error) {
        const preparedData = prepareWeekHoursData(data).sort(sortByRowId)
        dispatch({ type: 'SET_WEEK_HOURS', payload: preparedData })
      } else {
        console.error(data.error)
        dispatch({ type: 'SET_WEEK_HOURS', payload: [] })
      }
    }
    if (authUser && (state.toggleValue === false || (state.toggleValue === true && state.selectedUser))) {
      loadWeekData()
    }
  }, [state.currentWeekStart, authUser, state.toggleValue, state.selectedUser, fetchWeekHoursByType])

  useEffect(() => {
    const loadUserList = async () => {
      const userList = await fetchUserList() // Llama a la función desde useFirebase
      dispatch({ type: 'SET_USER_LIST', payload: userList })
    }

    if (authUser && (authUser.role === 1 || authUser.role === 5 || authUser.role === 10)) {
      loadUserList()
    }
  }, [authUser, fetchUserList])

  useEffect(() => {
    if (state.toggleValue === false) {
      dispatch({ type: 'SET_SELECTED_USER', payload: null })
    }
  }, [state.toggleValue])

  const resetDailyTotals = {
    martes: 0,
    miércoles: 0,
    jueves: 0,
    viernes: 0,
    sábado: 0,
    domingo: 0,
    lunes: 0
  }

  const handleOpenConfirmDelete = () => {
    setConfirmDeleteOpen(true)
  }

  const handleCloseConfirmDelete = () => {
    setConfirmDeleteOpen(false)
  }

  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false)
    await handleDeleteRow()
  }

  // Funciones para manejar los botones de cambio de semana
  const handlePreviousWeek = () => {
    dispatch({ type: 'CHANGE_WEEK', payload: -1 })
    dispatch({ type: 'CLEAR_CHANGES' }) // Limpia los cambios al cambiar de semana
  }

  const handleNextWeek = () => {
    dispatch({ type: 'CHANGE_WEEK', payload: 1 })
    dispatch({ type: 'CLEAR_CHANGES' }) // Limpia los cambios al cambiar de semana
  }

  const handleSelectionChange = selectionModel => {
    if (selectionModel.length === 0) {
      dispatch({ type: 'SET_SELECTED_ROW', payload: null })
    } else {
      dispatch({ type: 'SET_SELECTED_ROW', payload: selectionModel[0] })
    }
  }

  const handleDeleteRow = async () => {
    if (state.selectedRow) {
      setLoading(true)
      const rowId = String(state.selectedRow)
      const rowToDelete = state.weekHours.find(row => row.rowId === rowId)
      if (rowToDelete) {
        const dayDocIds = Object.keys(rowToDelete)
          .filter(key => key.endsWith('DocId'))
          .map(key => rowToDelete[key])
        console.log('state.selectedUser:', state.selectedUser)
        const userId = state.toggleValue === false ? authUser.uid : state.selectedUser.id
        const result = await deleteWeekHoursByType(userId, dayDocIds)
        if (result.success) {
          // Filtrar weekHours para eliminar la fila seleccionada
          const newWeekHours = state.weekHours.filter(row => row.rowId !== rowId)
          dispatch({ type: 'SET_WEEK_HOURS', payload: newWeekHours })

          // Actualizar los totales diarios
          let newDailyTotals = { ...state.dailyTotals }
          Object.keys(rowToDelete).forEach(key => {
            if (key.endsWith('DocId')) return
            newDailyTotals[key] -= rowToDelete[key] || 0
          })
          dispatch({ type: 'UPDATE_DAILY_TOTALS', payload: newDailyTotals })

          // Elimina cualquier cambio asociado con la fila seleccionada
          const newChanges = state.changes.filter(change => change.rowId !== rowId)
          dispatch({ type: 'SET_CHANGES', payload: newChanges })

          // Resetea la selección
          dispatch({ type: 'SET_SELECTED_ROW', payload: null })
        } else {
          console.error(result.error)
        }
      }
      setLoading(false)
    }
  }

  const handleCellEditCommit = (rowId, field, newValue, rowData, dayTimestamp, dayDocId) => {
    console.log(
      `Edit commit from handleCellEditCommit in DataGridCargaDeHoras: rowId=${rowId}, field=${field}, newValue=${newValue}, dayDocId=${dayDocId}`
    )

    // Encuentra el índice de la fila modificada
    const rowIndex = state.weekHours.findIndex(row => row.rowId === rowId)
    if (rowIndex === -1) return

    const oldRowValue = state.weekHours[rowIndex][field] || 0
    let newRowValue = newValue
    const newTotalDayHours = state.dailyTotals[field] - oldRowValue + newRowValue

    if (newTotalDayHours > 12) {
      dispatch({ type: 'TOGGLE_MAXHOURS_DIALOG', payload: true })

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

    // Determina si la semana es par o impar desde el comienzo del año
    const weekNumber = getWeek(state.currentWeekStart, { weekStartsOn: 2 })
    const shift = weekNumber % 2 === 0 ? 'B' : 'A'

    // Prepara el cambio con datos adicionales dependiendo si isNew es true
    const change = {
      rowId,
      field,
      newValue,
      isNew: !dayDocId, // Determina si es una nueva creación
      day: dayTimestamp,
      userRole: state.toggleValue === false ? authUser.role : state.selectedUser.role,
      userShift: authUser.shift,
      shift: shift,
      hoursType: rowData.hoursType,
      ...(dayDocId && { dayDocId }),
      ...(rowData.plant && { plant: rowData.plant }),
      ...(rowData.costCenter && { costCenter: rowData.costCenter })
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
    setLoading(true)
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

      const userId = state.toggleValue === false ? authUser.uid : state.selectedUser.id
      const data = await fetchWeekHoursByType(userId, state.currentWeekStart, state.currentWeekEnd)
      if (!data.error) {
        const preparedData = prepareWeekHoursData(data)
        dispatch({ type: 'SET_WEEK_HOURS', payload: preparedData })
      } else {
        console.error(data.error)
        dispatch({ type: 'SET_WEEK_HOURS', payload: [] })
      }
    }

    if (creations.length > 0) {
      const user = state.toggleValue === false ? authUser : state.selectedUser
      const creationResult = await createWeekHoursByType(user, creations)
      console.log('Creation result:', creationResult)
    }
    if (updates.length > 0) {
      const userId = state.toggleValue === false ? authUser.uid : state.selectedUser.id
      const updatesResult = await updateWeekHoursByType(userId, updates)
      console.log('Updates result: ', updatesResult)
    }

    dispatch({ type: 'CLEAR_CHANGES' })
    loadWeekData() // Re-fetch the data
    setLoading(false)
  }

  const handleSwitchToggle = newSwitchState => {
    if (state.changes.length > 0) {
      dispatch({ type: 'TOGGLE_WARNING_DIALOG', payload: true })
      dispatch({ type: 'SET_PREVIOUS_SWITCH_STATE', payload: { newSwitchState } })
    } else {
      dispatch({ type: 'SET_TOGGLE_VALUE', payload: newSwitchState })
    }
  }

  // resetea state.changes al cambiar el switch
  const handleConfirmWarningDialog = () => {
    dispatch({ type: 'TOGGLE_WARNING_DIALOG', payload: false })
    dispatch({ type: 'CLEAR_CHANGES' })
    dispatch({ type: 'SET_TOGGLE_VALUE', payload: !state.toggleValue })
  }

  // Restaura el valor del switch al estado anterior basado en `state.previousSwitchState`
  const handleCloseWarningDialog = () => {
    dispatch({ type: 'TOGGLE_WARNING_DIALOG', payload: false })
  }

  const handleCloseMaxHoursDialog = () => {
    dispatch({ type: 'TOGGLE_MAXHOURS_DIALOG', payload: false })
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
          plant: doc.plant,
          costCenter: doc.costCenter,
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

  const isUserChangeAllowed = authUser.role === 1 || authUser.role === 5 || authUser.role === 10

  function checkIfSameWeek(dateToCheck) {
    const now = new Date()

    return isSameWeek(startOfWeek(now, { weekStartsOn: 2 }), startOfWeek(dateToCheck))
  }

  const checkIfVacationExists = weekHours => {
    return weekHours.some(row => row.hoursType === 'Vacaciones')
  }

  const isButtonDisabled =
    !isUserChangeAllowed && !checkIfSameWeek(state.currentWeekStart) && checkIfVacationExists(state.weekHours)

  const sortByRowId = (a, b) => {
    if (a.rowId < b.rowId) return -1
    if (a.rowId > b.rowId) return 1

    return 0
  }

  console.log('state.changes: ', state.changes)
  console.log('state: ', state)

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
      {isUserChangeAllowed && (
        <Box>
          <Switch checked={state.toggleValue === true} onChange={() => handleSwitchToggle(!state.toggleValue)} />{' '}
          <span>Seleccionar otro usuario</span>
          {state.toggleValue === true && (
            <FormControl fullWidth margin='normal'>
              <Autocomplete
                id='user-select-autocomplete'
                options={state.userList}
                getOptionLabel={option => option.name}
                value={state.selectedUser}
                onChange={(event, newValue) => {
                  dispatch({ type: 'SET_SELECTED_USER', payload: newValue })
                }}
                renderInput={params => <TextField {...params} label='Seleccionar Usuario' variant='outlined' />}
              />
            </FormControl>
          )}
        </Box>
      )}
      <Button onClick={() => dispatch({ type: 'TOGGLE_DIALOG' })} disabled={isButtonDisabled} sx={{ mr: 2 }}>
        Nuevo Ingreso
      </Button>
      <Button
        variant='contained'
        color='primary'
        onClick={handleUpdateTable}
        disabled={state.changes.length === 0}
        sx={{ mr: 2 }}
      >
        Guardar Datos
      </Button>
      <Button
        onClick={handleOpenConfirmDelete}
        disabled={!state.selectedRow}
        variant='contained'
        color='error'
        sx={{ mr: 2 }}
      >
        Eliminar Fila
      </Button>
      <Button onClick={handlePreviousWeek} sx={{ mr: 2 }}>
        Semana Anterior
      </Button>
      <Button onClick={handleNextWeek} sx={{ mr: 2 }}>
        Semana Siguiente
      </Button>
      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            zIndex: 10
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <TableCargaDeHoras
        rows={state.weekHours}
        handleCellEditCommit={handleCellEditCommit}
        authUser={authUser}
        dailyTotals={state.dailyTotals}
        handleSelectionChange={handleSelectionChange}
        selectedRow={state.selectedRow}
        handleDeleteRow={handleDeleteRow}
        state={state}
        updateWeekHoursWithPlant={updateWeekHoursWithPlant}
        reloadTable={handleUpdateTable}
      />
      {state.dialogOpen && (
        <DialogCreateHours
          open={state.dialogOpen}
          onClose={() => dispatch({ type: 'TOGGLE_DIALOG' })}
          onSubmit={handleCreateNewRow}
          authUser={authUser}
          rows={state.weekHours}
          weekStart={state.currentWeekStart}
        />
      )}
      <ConfirmDeleteDialog
        open={confirmDeleteOpen}
        onClose={handleCloseConfirmDelete}
        onConfirm={handleConfirmDelete}
      />
      <WarningDialog
        open={state.showWarningDialog}
        onClose={handleCloseWarningDialog}
        onConfirm={handleConfirmWarningDialog}
      />
      <MaxHoursDialog open={state.showMaxHoursDialog} onClose={handleCloseMaxHoursDialog} />
    </Box>
  )
}

export default DataGridCargaDeHoras
