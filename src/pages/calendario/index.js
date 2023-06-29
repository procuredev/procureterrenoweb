// ** MUI Imports
import Box from '@mui/material/Box'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import useMediaQuery from '@mui/material/useMediaQuery'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Close from '@mui/icons-material/Close'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

const moment = require('moment')

// ** Hooks
import { useSettings } from 'src/@core/hooks/useSettings'
import { useFirebase } from 'src/context/useFirebaseAuth'
import { useTheme } from '@mui/material/styles'
import useBgColor from 'src/@core/hooks/useBgColor'

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

// ** Icon Imports
import Icon from 'src/@core/components/icon'
import { FullScreenDialog } from 'src/@core/components/dialog-fullsize'

const AppCalendar = () => {
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

  const [roleData, setRoleData] = useState({ name: 'admin' })
  const [open, setOpen] = useState(false)
  const [doc, setDoc] = useState(initialEvent)
  const [filter, setFilter] = useState('all')
  const [inputValue, setInputValue] = useState('')
  const [checkbox, setCheckbox] = useState(false)
  const [dayDialogOpen, setDayDialogOpen] = useState(false)
  const [blockResult, setBlockResult] = useState(null);


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

  const handleChange = (event, value) => {
    if (value) {
      setFilter(value[0])
      setInputValue(event.target.innerText)
    }
  }

  // ** Hooks
  const { settings } = useSettings()

  // ** Vars
  const leftSidebarWidth = 260
  const addEventSidebarWidth = 400
  const { skin, direction } = settings
  const mdAbove = useMediaQuery(theme => theme.breakpoints.up('md'))
  const { authUser, useSnapshot, getRoleData, blockDay } = useFirebase()
  const data = useSnapshot()
  const theme = useTheme()

  useEffect(() => {
    const role = async () => {
      if (authUser) {
        const role = await getRoleData(authUser.role.toString())
        setRoleData(role)
      }
    }

    role()
  }, [])

  const setColor = doc => {
    let color
    switch (doc.type) {
      case undefined:
        color = theme.palette.secondary.main
        break
      case 'shutdown':
        color = theme.palette.error.main
        break
      case 'outage':
        color = theme.palette.warning.main
        break
      case 'normal':
      default:
        color = theme.palette.primary.main
        break
    }

    return color
  }

  const eventTitle = doc => {
    let title = doc.ot ? `OT ${doc.ot} - ${doc.title}` : doc.title

    return title
  }

  const otherWeek = date => {
    let dateFormatted = new Date(date * 1000)
    let week = moment(dateFormatted).isoWeek()

    return week % 2 == 0
  }

  const filterByLabel = label => {
    const allOptions = [...new Set(data.flatMap(obj => obj[label]))]

    const filteredOptions = allOptions.reduce((result, element) => {
      result[element] = {
        data: data.filter(doc => doc[label] === element),
        label: `${element}`,
        canSee: [1, 5, 6, 7, 9]
      }
      result['rejected' + element] = {
        data: data.filter(doc => doc[label] === element && doc.state === 10),
        label: `Rechazadas ${element}`,
        canSee: [1, 5, 6, 7, 9]
      }

      return result
    }, {})

    return filteredOptions
  }

  const filterByPlant = () => {
    return filterByLabel('plant')
  }

  const filterByJobType = () => {
    return filterByLabel('objective')
  }

  const content =
    data && authUser
      ? {
          all: {
            data: data,
            label: 'Todas las solicitudes',
            canSee: [1, 2, 3, 4, 5, 6, 7, 8, 9]
          },
          pendingApprovalByMe: {
            data: data.filter(doc => doc.state === authUser.role - 1),
            label: 'Pendientes de mi aprobación',
            canSee: [1, 2, 3, 5, 6]
          },
          inReviewByMEL: {
            data: data.filter(doc => doc.state === 2),
            label: 'En revisión por MEL',
            canSee: [1, 2, 3, 4, 5, 6, 7, 9]
          },
          inReviewByProcure: {
            data: data.filter(doc => doc.state === 5),
            label: 'En revisión por Procure',
            canSee: [1, 2, 3, 4, 5, 6, 7, 9]
          },
          approvedByMEL: {
            data: data.filter(doc => doc.state === 3),
            label: 'Aprobadas por MEL',
            canSee: [1, 2, 3, 4, 5, 6, 7, 9]
          },
          approvedByProcure: {
            data: data.filter(doc => doc.state >= 6 && doc.state < 10),
            label: 'Aprobadas por Procure',
            canSee: [1, 2, 3, 4, 5, 6, 7, 9]
          },
          myRejected: {
            data: data.filter(doc => doc.state === 10 && doc.uid === authUser.uid),
            label: 'Mis solicitudes rechazadas',
            canSee: [1, 2, 3]
          },
          allRejected: {
            data: data.filter(doc => doc.state === 10),
            label: 'Todas las rechazadas',
            canSee: [1, 4, 5, 6, 7, 9]
          },
          requestedByMe: {
            data: data.filter(doc => doc.uid === authUser.uid),
            label: 'Mis solicitudes',
            canSee: [1, 2, 3]
          },
          withOT: {
            data: data.filter(doc => doc.hasOwnProperty('ot')),
            label: 'Tiene OT',
            canSee: [1, 2, 3, 4, 5, 6, 7, 9]
          },
          withoutOT: {
            data: data.filter(doc => !doc.hasOwnProperty('ot')),
            label: 'Sin OT',
            canSee: [1, 2, 3, 4, 5, 6, 7, 9]
          },
          shiftA: {
            data: data.filter(doc => otherWeek(doc.start.seconds)),
            label: 'Turno P',
            canSee: [1, 3, 4, 5, 6, 9]
          },
          shiftB: {
            data: data.filter(doc => !otherWeek(doc.start.seconds)),
            label: 'Turno Q',
            canSee: [1, 3, 4, 5, 6, 9]
          },

          //Pendiente revisar semana según usuario
          approvedByProcureInMyWeek: {
            data: data.filter(doc => doc.state >= 6 && doc.state < 10 && otherWeek(doc.start.seconds)),
            label: 'Aprobadas por Procure en mi semana',
            canSee: [1, 7]
          },
          ...filterByJobType(),
          ...filterByPlant()
        }
      : {}

  const calendarOptions = {
    events: content[filter].data.map(a => ({
      title: eventTitle(a),
      start: a.start.seconds * 1000,
      allDay: true,
      id: a.id,
      description: a.description,
      backgroundColor: setColor(a),
      borderColor: 'transparent'
    })),
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
    eventDisplay: 'block',
    customButtons: {
      showFilters: {
        text: 'Filtros',
        click: function () {
          setCheckbox(state => !state)
        }
      }
    },
    firstDay: 1,
    dayCellClassNames: function (date) {
      const week = moment(date.date).isoWeek()
      let color = week % 2 == 0 && !date.isToday && 'week'

      return color
    },
    fixedWeekCount: false,
    dateClick: function (info) {
      /* const result = blockDay(info.date);
      setConsultationResult(result); */
      setDayDialogOpen(true)
    }
  }

  return (
    <>
      {checkbox && (
        <Box
          sx={{
            mb: 5,
            px: 5,

            flexGrow: 1,
            borderRadius: 1,
            backgroundColor: 'background.paper',
            boxShadow: skin === 'bordered' ? 0 : 6,
            ...(skin === 'bordered' && { border: theme => `1px solid ${theme.palette.divider}` })
          }}
        >
          <FormControl
            fullWidth
            sx={{ mb: 5, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}
          >
            <FormLabel id='autocomplete-label' sx={{ mb: 3, pt: 3 }}>
              Filtros
            </FormLabel>
            <IconButton
              onClick={() => setCheckbox(prev => !prev)}
              color='primary'
              component='button'
              sx={{ justifyContent: 'flex-end', width: 'min-content' }}
            >
              <Close />
            </IconButton>
            <Autocomplete
              fullWidth
              clearOnBlur
              options={Object.entries(content).filter(([key, { canSee }]) => {
                return canSee.includes(authUser.role)
              })}
              getOptionLabel={([key, { data, label }]) => (label ? label : '')}
              renderInput={params => <TextField {...params} placeholder='Filtrar por...' />}
              value={filter}
              inputValue={inputValue}
              isOptionEqualToValue={(option, value) => option[0] === value}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === 'input') {
                  setInputValue(newInputValue)
                } else if (reason === 'clear') {
                  setInputValue('')
                  setFilter('all')
                }
              }}
              onChange={handleChange}
            />
          </FormControl>
        </Box>
      )}

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
            <Dialog open={dayDialogOpen}>
            <DialogTitle id='alert-dialog-title'>Bloquear día</DialogTitle>
            <DialogContent>
              <DialogContentText id='alert-dialog-description'>
                ¿Estás segur@ de que quieres bloquear/desbloquear esta fecha?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setDayDialogOpen(false)}>No</Button>
              <Button autoFocus>Sí</Button>
            </DialogActions>
          </Dialog>

          )}
        </Box>
      </CalendarWrapper>
    </>
  )
}

export default AppCalendar
