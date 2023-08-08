// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebaseAuth'

// ** MUI Imports
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

// ** Custom Components Imports
import FilterComponent from 'src/@core/components/filter-component'

// ** Demo Components Imports
import TableBasic from 'src/views/table/data-grid/TableBasic'

const DataGrid = () => {
  const [values, setValues] = useState({})
  const [tabValue, setTabValue] = useState('1')
  const [roleData, setRoleData] = useState({ name: 'admin' })
  const { useSnapshot, authUser, getRoleData } = useFirebase()
  const data = useSnapshot(true)
  const moment = require('moment')

  const otherWeek = date => {
    let dateFormatted = new Date(date * 1000)
    let week = moment(dateFormatted).isoWeek()

    return week % 2 == 0
  }

  // Objeto de configuración de filtros
  const [filterConfig, setFilterConfig] = useState({
    all: {
      label: 'Todas las solicitudes',
      canSee: [1, 2, 3, 4, 5],
      type: 'General', // Ejemplo de números permitidos para ver este filtro
      filterFunction: doc => true // Mostrar todos los documentos
    },
    pendingApproval: {
      label: 'Por aprobar',
      canSee: [2, 3, 5], // Ejemplo de números permitidos para ver este filtro
      type: 'Estado',
      filterFunction: authUser.role === 5 ? doc => doc.state === 3 || 4 : doc => doc.state === authUser.role - 1
    },
    approved: {
      label: 'Aprobadas',
      canSee: [1, 2, 3], // Ejemplo de números permitidos para ver este filtro
      type: 'Estado',
      filterFunction: doc => doc.state >= 6 && doc.state < 10
    },
    rejected: {
      label: 'Rechazadas',
      canSee: [3, 4, 5], // Ejemplo de números permitidos para ver este filtro
      type: 'Estado',
      filterFunction: doc => doc.state === 10
    },
    inReviewByMEL: {
      label: 'En revisión por MEL',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'Estado',
      filterFunction: doc => doc.state === 2
    },
    inReviewByProcure: {
      label: 'En revisión por Procure',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'Estado',
      filterFunction: doc => doc.state === 5
    },
    approvedByMEL: {
      label: 'Aprobadas por MEL',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'Estado',
      filterFunction: doc => doc.state === 4
    },
    approvedByProcure: {
      label: 'Aprobadas por Procure',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'Estado',
      filterFunction: doc => doc.state >= 6 && doc.state < 10
    },
    myRequests: {
      label: 'Mis solicitudes',
      canSee: [1, 2, 3],
      type: 'Autor',
      filterFunction: doc => doc.uid === authUser.uid
    },
    withOT: {
      label: 'Tiene OT',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'OT',
      filterFunction: doc => doc.hasOwnProperty('ot')
    },
    withoutOT: {
      label: 'Sin OT',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'OT',
      filterFunction: doc => !doc.hasOwnProperty('ot')
    },
    shiftA: {
      label: 'Turno P',
      canSee: [1, 2, 3, 4, 5, 6, 9],
      type: 'Turno',
      filterFunction: doc => otherWeek(doc.start.seconds)
    },
    shiftB: {
      label: 'Turno Q',
      canSee: [1, 2, 3, 4, 5, 6, 9],
      type: 'Turno',
      filterFunction: doc => !otherWeek(doc.start.seconds)
    },
    myWeek: {
      label: 'Aprobadas por Procure en mi semana',
      type: 'General',
      canSee: [1, 7],
      filterFunction: doc => otherWeek(doc.start.seconds)
    }
  })

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  // Function to handle changes when a filter is selected from Autocomplete or Select
  const handleFilterChange = (key, value) => {
    setValues(prevValues => ({
      ...prevValues,
      [key]: value
    }))
  }

  const tabContent = authUser
    ? [
        {
          data: data,
          label: 'Todas las solicitudes',
          info: 'Todas las solicitudes'
        },
        {
          data: data.filter(authUser.role === 5 ? doc => doc.state === 3 || 4 : doc => doc.state === authUser.role - 1),
          label: 'Por aprobar',
          info: 'Solicitudes pendientes de mi aprobación'
        },
        {
          data: data.filter(doc => doc.state >= 6 && doc.state < 10),
          label: 'Aprobadas',
          info: 'Solicitudes aprobadas por Procure'
        },
        {
          data: data.filter(doc => doc.state === 10),
          label: 'Rechazadas',
          info: 'Solicitudes rechazadas'
        }
      ]
    : []

  useEffect(() => {
    const role = async () => {
      if (authUser) {
        const role = await getRoleData(authUser.role.toString())
        setRoleData(role)
      }
    }

    role()
  }, [])

 // Adds data-based filters
  const filterByLabel = (label, translation) => {
    const allOptions = [...new Set(data.flatMap(obj => obj[label]))]

    const filteredOptions = allOptions.reduce((result, element) => {
      result[element] = {
        label: `${element}`,
        type: `${translation}`,
        canSee: [1, 2, 5, 6, 7, 9],
        filterFunction: doc => doc[label] === element
      }

      return result
    }, {})

    return filteredOptions
  }

  const filterByPlant = () => filterByLabel('plant', 'Planta')
  const filterByJobType = () => filterByLabel('objective', 'Objetivo')

  useEffect(() => {
    let jobType = filterByJobType()
    let plant = filterByPlant()
    setFilterConfig(prevConfig => ({
      ...prevConfig,
      ...jobType,
      ...plant
    }))
  }, [data])

  // Function to apply filters to the data rows
  const applyFilters = (data, activeFilters) => {
    return data.filter(row => {
      return Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true // Skip if the filter is not selected

        return filterConfig[value].filterFunction(row)
      })
    })
  }

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <FilterComponent
        authUser={authUser}
        filterConfig={filterConfig}
        activeFilters={values}
        handleFilterChange={handleFilterChange}
        handleClearFilters={setValues} // Usar setValues para limpiar los filtros
      />
      <TabContext value={tabValue}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleTabChange} aria-label='lab API tabs example'>
            {tabContent.map((element, index) => (
              <Tab
                label={
                  <Tooltip arrow title={element.info} placement='top-end' key={element.label}>
                    <span>{element.label}</span>
                  </Tooltip>
                }
                value={`${index + 1}`}
                key={index}
              />
            ))}
          </TabList>
        </Box>
        {tabContent.map((element, index) => (
          <Grid item xs={12} key={index}>
            <TabPanel key={index} value={`${index + 1}`}>
              <TableBasic rows={applyFilters(element.data, values)} roleData={roleData} role={authUser.role} />
            </TabPanel>
          </Grid>
        ))}
      </TabContext>
    </Box>
  )
}

export default DataGrid
