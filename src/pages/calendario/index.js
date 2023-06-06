// ** MUI Imports
import Box from '@mui/material/Box'
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import useMediaQuery from '@mui/material/useMediaQuery'

const moment = require('moment');

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
import { date } from 'yup'
import { light } from '@mui/material/styles/createPalette';

// ** CalendarColors
const calendarsColor = {
  Personal: 'error',
  Business: 'primary',
  Family: 'warning',
  Holiday: 'success',
  ETC: 'info'
}

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
  const [open, setOpen] = useState(false)
  const [doc, setDoc] = useState(initialEvent)
  const [filters, setFilters] = useState(false)

  const handleModalToggle = (clickedEvent) => {
    let document = data.find(doc => doc.id === clickedEvent.id)
    setDoc(document)
    setOpen(true)

    //setModalOpen(!modalOpen)
  }

  const handleClose = () => {
    setOpen(false)
    setDoc(initialEvent)
  }

  // ** Hooks
  const { settings } = useSettings()

  // ** Vars
  const leftSidebarWidth = 260
  const addEventSidebarWidth = 400
  const { skin, direction } = settings
  const mdAbove = useMediaQuery(theme => theme.breakpoints.up('md'))
  const data = useFirebase().useSnapshot()
  const theme = useTheme()

  console.log(theme.palette)

  const setColor = (doc) => {
    const week = moment.unix(doc.start.seconds).isoWeek()
    const hasOT = doc.ot ? 'dark' : 'light'
    const color = week % 2 == 0 ? theme.palette.primary[hasOT] : theme.palette.secondary[hasOT]

    return color
  }

  const calendarOptions = {

    events: data.map(a => ({ title: a.title, start: a.start.seconds * 1000, allDay: true, id: a.id, description: a.description, backgroundColor: setColor(a), borderColor: 'transparent' })),
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      start: 'sidebarToggle, prev, next, title, showFilters,',
      end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
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
      week: 'semana',
      day: 'día',
      list: 'lista'
    },
    eventDisplay: 'block',
    customButtons: {
      showFilters: {
        text: 'Filtros',
        click: function () {
          setFilters(state=>!state)
        }
      }
    },
  }


  return (
    <>
    {filters && <Box sx={{
        mb:5,
        px: 5,
        pt: 3.75,
        flexGrow: 1,
        borderRadius: 1,
        backgroundColor: 'background.paper',
        boxShadow: skin === 'bordered' ? 0 : 6,
        ...(skin === 'bordered' && { border: theme => `1px solid ${theme.palette.divider}` })
      }}>
       <FormGroup>
  <FormControlLabel control={<Checkbox defaultChecked />} label="Label" />
  <FormControlLabel required control={<Checkbox />} label="Required" />
  <FormControlLabel disabled control={<Checkbox />} label="Disabled" />
</FormGroup>
      </Box>}

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
            backgroundColor: 'background.paper',

            //si tiene barra en el lado derecho, para que los bordes no sean redondos
            /* ...(mdAbove ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } : {}) */

          }}
        >
          <FullCalendar {...calendarOptions} />
          {open && <FullScreenDialog open={open} handleClose={handleClose} doc={doc} />}
        </Box>
      </CalendarWrapper>
    </>
  )
}

export default AppCalendar
