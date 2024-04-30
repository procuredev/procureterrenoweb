// ** React Imports
import React, { useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

import { getWeek } from 'date-fns'

// ** Custom Components Imports

// ** Demo Components Imports
import TableCargaDeHoras from 'src/views/table/data-grid/TableCargaDeHoras'

const DataGridCargaDeHoras = () => {
  const [value, setValue] = useState('1')
  const [weekHours, setWeekHours] = useState([])
  const [otFetch, setOtFetch] = useState([])
  const [roleData, setRoleData] = useState({ name: 'admin' })

  //const { useSnapshot, authUser, getDomainData } = useFirebase()
  const { authUser, fetchWeekHoursByType, fetchSolicitudes } = useFirebase()
  const data = useSnapshot(true, authUser)

  useEffect(() => {
    const loadWeekHours = async () => {
      const now = new Date()
      const weekNumber = getWeek(now, { weekStartsOn: 2 }) // 2 representa el martes
      const weekId = `${now.getFullYear()}-${weekNumber}`

      const hoursData = await fetchWeekHoursByType(weekId, authUser.uid)
      if (!hoursData.error) {
        setWeekHours(hoursData)
      } else {
        console.log(hoursData.error)
      }
    }

    const loadSolicitudes = async () => {
      const solicitudes = await fetchSolicitudes(authUser)
      setOtFetch(solicitudes)
    }

    if (authUser.uid) {
      // Asegúrate de ejecutar esto solo si authUser.uid está disponible
      loadWeekHours()
      loadSolicitudes()
    }
  }, [authUser])

  console.log('weekHours: ', weekHours)

  useEffect(() => {
    const role = async () => {
      if (authUser) {
        const role = await getDomainData('roles', authUser.role.toString())
        setRoleData(role)
      }
    }

    role()
  }, [])

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const tabContent =
    authUser.role === 1 || authUser.role === 5 || authUser.role === 6 || authUser.role === 10
      ? [
          {
            data: data.filter(doc => doc.state >= 6 && doc.state < 10),
            label: 'Todos los levantamientos'
          },
          {
            data: data.filter(doc => doc.state === 6),
            label: 'Agendados'
          },
          {
            data: data.filter(doc => doc.state === 7),
            label: 'En Proceso'
          },
          {
            data: data.filter(doc => doc.state === 8),
            label: 'Terminados'
          }
        ]
      : [
          {
            data: data.filter(doc => doc.state >= 6 && doc.state < 10 && doc.supervisorShift === authUser.shift[0]),
            label: 'Todos los levantamientos'
          },
          {
            data: data.filter(doc => doc.state === 6 && doc.supervisorShift === authUser.shift[0]),
            label: 'Por Revisar'
          },
          {
            data: data.filter(doc => doc.state === 7 && doc.supervisorShift === authUser.shift[0]),
            label: 'En Proceso'
          },
          {
            data: data.filter(doc => doc.state === 8 && doc.supervisorShift === authUser.shift[0]),
            label: 'Terminados'
          }
        ]

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        {
          // <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          //   <TabList onChange={handleChange} aria-label='lab API tabs example'>
          //     {tabContent.map((element, index) => (
          //       <Tab label={element.label} value={`${index + 1}`} key={index} />
          //     ))}
          //   </TabList>
          // </Box>
        }
        {tabContent.map((element, index) => (
          <Grid item xs={12} key={index}>
            <TabPanel key={index} value={`${index + 1}`}>
              <TableCargaDeHoras rows={weekHours} role={authUser.role} otOptions={otFetch} />
            </TabPanel>
          </Grid>
        ))}
      </TabContext>
    </Box>
  )

  /*  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        <TableCargaDeHoras rows={weekHours} role={authUser.role} otOptions={otFetch} />
      </TabContext>
    </Box>
  ) */
}

export default DataGridCargaDeHoras
