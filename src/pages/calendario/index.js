// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

// ** Tooltip
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'

const moment = require('moment')

// ** Hooks
import { useSettings } from 'src/@core/hooks/useSettings'
import { useFirebase } from 'src/context/useFirebase'
import { useTheme } from '@mui/material/styles'

// ** FullCalendar & App Components Imports
import CalendarWrapper from 'src/@core/styles/libs/fullcalendar'

// ** React Import
import { useState, useEffect, useRef } from 'react'

// ** Full Calendar & it's Plugins
import FullCalendar from '@fullcalendar/react'
import listPlugin from '@fullcalendar/list'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

// ** Component Imports
import { FullScreenDialog } from 'src/@core/components/dialog-fullsize'
import FilterComponent from 'src/@core/components/filter-component'
import generateFilterConfig from 'src/@core/components/filter-configs/filterConfigs'
import filterByLabel from 'src/@core/components/custom-filters/customFilters'

const AppCalendar = () => {
  const calendarRef = useRef()

  const initialEvent = {
    title: 'title',
    state: 'state',
    description: 'desc',
    start: 'start',
    user: 'user',
    date: 'date',
    area: 'area',
    id: 'id'
  }

  // ** Hooks
  const { settings } = useSettings()

  // ** Vars
  const { skin, direction } = settings
  const { authUser, useSnapshot, getRoleData, consultBlockDayInDB, blockDayInDatabase } = useFirebase()
  const data = useSnapshot(false, authUser)
  const theme = useTheme()

  const [roleData, setRoleData] = useState({ name: 'admin' })
  const [open, setOpen] = useState(false)
  const [doc, setDoc] = useState(initialEvent)
  const [filterConfig, setFilterConfig] = useState({})
  const [filters, setFilters] = useState({})
  const [dayDialogOpen, setDayDialogOpen] = useState(false)
  const [blockResult, setBlockResult] = useState([])
  const [consultationResult, setConsultationResult] = useState('')
  const [blockReason, setBlockReason] = useState('')

  const handleModalToggle = clickedEvent => {
    let document = data.find(doc => doc.id === clickedEvent.id)
    setDoc(document)
    setOpen(true)

    //setModalOpen(!modalOpen)
  }

  const handleClose = () => {
    setOpen(false)
    setDoc(initialEvent)
  }

  // Objeto de configuración de filtros
  useEffect(() => {
    setFilterConfig(generateFilterConfig(authUser))
  }, [authUser])

  useEffect(() => {
    const role = async () => {
      if (authUser) {
        const role = await getRoleData(authUser.role.toString())
        setRoleData(role)
      }
    }

    role()
  }, [])

  const handleFilterChange = (key, value) => {
    setFilters(prevValues => ({
      ...prevValues,
      [key]: value
    }))
  }

  // Adds data-based filters
  const filterByPlant = () => filterByLabel('plant', 'Planta', data)
  const filterByJobType = () => filterByLabel('objective', 'Objetivo', data)

  useEffect(() => {
    let jobType = filterByJobType()
    let plant = filterByPlant()
    setFilterConfig(prevConfig => ({
      ...prevConfig,
      ...jobType,
      ...plant
    }))
  }, [data])

  const applyFilters = (events, activeFilters) => {
    return events.filter(event => {
      return Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true // Mantener si el filtro no está seleccionado

        return filterConfig[value].filterFunction(event)
      })
    })
  }

  const handleBlockReasonChange = event => {
    setBlockReason(event.target.value)
  }

  const handleBlockConfirmation = async () => {
    await blockDayInDatabase(dayDialogOpen, blockReason).then(console.log(calendarRef.current))
    setOpen(false)
    setDayDialogOpen(false)
    setBlockReason('')
    setDoc(initialEvent)
  }

  const setColor = doc => {
    let color
    switch (doc.type) {
      case undefined:
        color = theme.palette.secondary.main
        break
      case 'Shutdown':
        color = theme.palette.error.main
        break
      case 'Outage':
        color = theme.palette.warning.main
        break
      case 'Normal':
      default:
        color = theme.palette.primary.main
        break
    }

    return color
  }

  const eventResume = doc => {
    let ot = ''
    let n_request = ''
    let plant = ''
    let realTitle = ''

    if (doc.ot) {
      ot = doc.ot
    }

    if (doc.n_request) {
      n_request = doc.n_request
    }

    if (doc.title) {
      realTitle = doc.title
    }

    if (doc.plant) {
      plant = doc.plant
    }

    let title = doc.ot ? `OT ${doc.ot} - ${doc.title}` : doc.title

    return { resume: { realTitle: realTitle, ot: ot, n_request: n_request, plant: plant }, title: title }
  }

  const calendarOptions = {
    ref: calendarRef,
    events: applyFilters(data, filters).map(a => ({
      title: eventResume(a).title,
      start: a.start.seconds * 1000,
      allDay: true,
      id: a.id,
      description: a.description,
      backgroundColor: setColor(a),
      borderColor: 'transparent',
      resume: eventResume(a).resume
    })),
    eventDidMount: function (info) {
      tippy(info.el, {
        content: `
        OT Procure: ${info.event.extendedProps.resume.ot || 'No definida'}<br />
        N° Solicitud: ${info.event.extendedProps.resume.n_request}<br />
        Título: ${info.event.extendedProps.resume.realTitle}<br />
        Planta: ${info.event.extendedProps.resume.plant}<br />
      `,
        allowHTML: true,
        theme: 'light' // O el tema que desees
      })
    },
    eventWillUnmount: function (info) {
      if (info.el.tooltip) {
        info.el.tooltip.dispose()
      }
    },
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      start: 'sidebarToggle, prev, next, title, showFilters,',
      end: 'dayGridMonth,listMonth'
    },
    eventClick: ({ event: clickedEvent }) => {
      handleModalToggle(clickedEvent)
    },
    views: {
      week: {
        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
      }
    },
    locale: 'es',
    buttonText: {
      month: 'mes',
      list: 'lista'
    },
    height: 'auto',
    contentHeight: 'auto',
    eventDisplay: 'block',
    firstDay: 1,
    dayCellClassNames: function (date) {
      const foundObject = blockResult.find(obj => {
        const objTimestamp = new Date(obj.timestamp * 1000).getTime()
        const objDate = date.date.getTime()

        // Compara solo la parte de la fecha (día, mes y año)
        return objTimestamp === objDate
      })

      if (foundObject && foundObject.value.blocked) {
        return 'blocked' // Retorna 'week' si el día está bloqueado
      } else {
        const week = moment(date.date).isoWeek()
        let color = week % 2 == 0 && !date.isToday && 'week'

        return color
      }
    },
    fixedWeekCount: false,
    dateClick: async function (info) {
      const result = await consultBlockDayInDB(new Date(info.date).getTime() / 1000)
      setConsultationResult(result)
      setDayDialogOpen(info.date)
    },
    datesSet: async function (params) {
      const startDate = params.start
      const endDate = params.end

      const timestamps = []

      let currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const timestamp = Math.floor(currentDate.getTime() / 1000)
        timestamps.push(timestamp)
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Realizar todas las consultas de forma asíncrona
      const results = await Promise.all(
        timestamps.map(async timestamp => {
          const value = await consultBlockDayInDB(timestamp)

          return { timestamp, value }
        })
      )

      // Filtrar y agregar los resultados bloqueados al estado (evitando duplicados)
      const blockedResults = results.filter(result => result.value.blocked)

      // Verificar y agregar los resultados bloqueados al estado (evitando duplicados)
      setBlockResult(prevResults => {
        const existingTimestamps = prevResults.map(result => result.timestamp)
        const newResults = blockedResults.filter(result => !existingTimestamps.includes(result.timestamp))

        return [...prevResults, ...newResults]
      })
    }
  }

  return (
    <>
      <FilterComponent
        filterConfig={filterConfig}
        activeFilters={filters}
        handleFilterChange={handleFilterChange}
        handleClearFilters={setFilters}
        authUser={authUser}
      />

      <CalendarWrapper
        className='app-calendar'
        sx={{
          boxShadow: skin === 'bordered' ? 0 : 6,
          ...(skin === 'bordered' && { border: theme => `1px solid ${theme.palette.divider}` })
        }}
      >
        <Box
          sx={{
            px: 5,
            pt: 3.75,
            flexGrow: 1,
            borderRadius: 1,
            boxShadow: 'none',
            backgroundColor: 'background.paper'

            //si tiene barra en el lado derecho, para que los bordes no sean redondos
            /* ...(mdAbove ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } : {}) */
          }}
        >
          <FullCalendar {...calendarOptions} />
          {open && <FullScreenDialog open={open} handleClose={handleClose} doc={doc} roleData={roleData} />}
          {dayDialogOpen && (
            <Dialog sx={{ '.MuiPaper-root': { minWidth: '30%' } }} open={dayDialogOpen}>
              <DialogTitle id='alert-dialog-title'>Información</DialogTitle>
              <DialogContent>
                <DialogContentText id='alert-dialog-description'>{consultationResult.msj}</DialogContentText>
                {authUser.role === 5 && !consultationResult.blocked && (
                  <>
                    <DialogContentText id='alert-dialog-description'>
                      <p>Si quieres bloquear esta fecha, ingresa un motivo:</p>
                    </DialogContentText>
                    <TextField
                      autoFocus
                      margin='dense'
                      id='block-reason'
                      label='Motivo'
                      type='text'
                      fullWidth
                      value={blockReason}
                      onChange={handleBlockReasonChange}
                    />
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDayDialogOpen(false)}>Cerrar</Button>
                {authUser.role === 5 && (
                  <Button
                    autoFocus
                    onClick={handleBlockConfirmation}
                    disabled={!blockReason && !consultationResult.blocked}
                  >
                    {consultationResult.blocked ? 'Desbloquear' : 'Bloquear'}
                  </Button>
                )}
              </DialogActions>
            </Dialog>
          )}
        </Box>
      </CalendarWrapper>
    </>
  )
}

AppCalendar.acl = {
  subject: 'calendario'
}

export default AppCalendar
