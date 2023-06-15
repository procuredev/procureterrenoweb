// ** MUI Imports
import Box from '@mui/material/Box'
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import useMediaQuery from '@mui/material/useMediaQuery'
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

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

  const [roleData, setRoleData] = useState({name:'admin'});
  const [open, setOpen] = useState(false)
  const [doc, setDoc] = useState(initialEvent)
  const [filter, setFilter] = useState("all")
  const [checkbox, setCheckbox] = useState(false)

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

  const handleChange = (event) => {
    setFilter(event.target.value);
  };

  // ** Hooks
  const { settings } = useSettings()

  // ** Vars
  const leftSidebarWidth = 260
  const addEventSidebarWidth = 400
  const { skin, direction } = settings
  const mdAbove = useMediaQuery(theme => theme.breakpoints.up('md'))
  const {authUser, useSnapshot, getRoleData} = useFirebase()
  const data = useSnapshot()
  const theme = useTheme()

  console.log(theme.palette)

  useEffect(() => {
    const role = async () => {
      if (authUser) {
        const role = await getRoleData(authUser.role.toString())
        setRoleData(role)
      }
    }

    role();
  }, []);


  const setColor = (doc) => {
    let color
    switch (doc.type) {
      case undefined:
        color = theme.palette.secondary.main;
        break;
      case "shutdown":
        color = theme.palette.error.main;
        break;
      case "outage":
        color = theme.palette.warning.main;
        break;
      case "normal":
      default:
        color = theme.palette.primary.main;
        break;
    }

    return color
  }

  const eventTitle = (doc) => {
    let title = doc.ot ? `OT ${doc.ot} - ${doc.title}` : doc.title

    return title
  }

  const content = data && authUser ? {
    all:{
      data: data,
    },
    pending:{
      data: data.filter(doc => doc.state === authUser.role - 1),
    },
    approved:{
      data: data.filter(doc => doc.state >= 5 && doc.state < 10),
    },
    rejected:{
      data: data.filter(doc => doc.state === 10),
      label: 'Rechazadas'
    },
  } : {}

  console.log(content.all.data)

  const calendarOptions = {
    events: content[filter].data.map(a => ({
      title: eventTitle(a),
      start: a.start.seconds * 1000,
      allDay: true,
      id: a.id,
      description: a.description,
      backgroundColor: setColor(a),
      borderColor: 'transparent' })),
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
          setCheckbox(state=>!state)
        }
      }
    },
    firstDay: 1,
    dayCellClassNames: function(date) {
    const week = moment(date.date).isoWeek()
    let color = ( week % 2 == 0 && !date.isToday ) && 'week'

    return color
  },
  fixedWeekCount:false

}

  return (
    <>
    {checkbox && <Box sx={{
        mb:5,
        px: 5,
        pt: 3.75,
        flexGrow: 1,
        borderRadius: 1,
        backgroundColor: 'background.paper',
        boxShadow: skin === 'bordered' ? 0 : 6,
        ...(skin === 'bordered' && { border: theme => `1px solid ${theme.palette.divider}` })
      }}>
     <FormControl>
      <FormLabel id="demo-radio-buttons-group-label">Filtros</FormLabel>
      <RadioGroup
        row
        aria-labelledby="demo-radio-buttons-group-label"
        defaultValue="all"
        name="radio-buttons-group"
        onChange={handleChange}
      >
        <FormControlLabel value="all" control={<Radio />} label="Todas las solicitudes" />
        <FormControlLabel value="pending" control={<Radio />} label="Pendientes" />
        <FormControlLabel value="approved" control={<Radio />} label="Aprobadas" />
      </RadioGroup>
    </FormControl>
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
          {open && <FullScreenDialog
          open={open}
          handleClose={handleClose}
          doc={doc}
          roleData={roleData} />}
        </Box>
      </CalendarWrapper>
    </>
  )
}

export default AppCalendar
