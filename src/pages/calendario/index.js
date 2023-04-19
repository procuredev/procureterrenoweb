// ** MUI Imports
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'

// ** Hooks
import { useSettings } from 'src/@core/hooks/useSettings'
import { useFirebase } from 'src/context/useFirebaseAuth'
import { useSnapshot } from 'src/hooks/useSnapshot'

// ** FullCalendar & App Components Imports
import Calendar from 'src/views/apps/calendar/Calendar'
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
import FullScreenDialog from 'src/@core/components/dialog-fullsize'
import { date } from 'yup'

// ** CalendarColors
const calendarsColor = {
  Personal: 'error',
  Business: 'primary',
  Family: 'warning',
  Holiday: 'success',
  ETC: 'info'
}

const AppCalendar = () => {


  let events = {
    events: [{
      id: 1,
      url: '',
      title: 'Design Review',
      start: '2023-01-01',
      end: '2023-01-02',
      allDay: false,
      extendedProps: {
        calendar: 'Business'
      }
    }]
  }

  // ** Hooks
  const { settings } = useSettings()

  // ** Vars
  const leftSidebarWidth = 260
  const addEventSidebarWidth = 400
  const { skin, direction } = settings
  const mdAbove = useMediaQuery(theme => theme.breakpoints.up('md'))


  const blankEvent = {
    title: '',
    start: '',
    end: '',
    allDay: false,
    url: '',
    extendedProps: {
      calendar: '',
      guests: [],
      location: '',
      description: ''
    }
  }

  const data = useSnapshot()

  // ** Refs
  const calendarRef = useRef()


  const calendarOptions = {
    //falta agregar todos los demás atributos, este evento es el que después queda como store.selectedevent

    events: data.map(a => ({ title: a.title, start: a.start.seconds * 1000, allDay: true, id: a.id, description: a.description })),
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      start: 'sidebarToggle, prev, next, title',
      end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    views: {
      week: {
        titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
      }
    }
  }


  return (

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

          ...(mdAbove ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } : {})

        }}
      >
        <FullCalendar {...calendarOptions} />
      </Box>
    </CalendarWrapper>
  )
}

export default AppCalendar
