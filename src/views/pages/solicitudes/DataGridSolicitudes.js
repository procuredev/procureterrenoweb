// ** React Imports
import { useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

// ** MUI Imports
import Tooltip from '@mui/material/Tooltip'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

// ** Custom Components Imports
import FilterComponent from 'src/@core/components/filter-component'
import TableBasic from 'src/views/table/data-grid/TableBasic'
import generateFilterConfig from 'src/@core/components/filter-configs/filterConfigs'
import filterByLabel from 'src/@core/components/custom-filters/customFilters'

const DataGrid = () => {
  const [values, setValues] = useState({})
  const [tabValue, setTabValue] = useState('1')
  const [filterConfig, setFilterConfig] = useState({})
  const [roleData, setRoleData] = useState({ name: 'admin' })
  const { useSnapshot, authUser, getRoleData } = useFirebase()
  const data = useSnapshot(true)

  // Objeto de configuración de filtros
  useEffect(() => {
    setFilterConfig(generateFilterConfig(authUser))
  }, [authUser])

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

  // Function to app filters to the data rows
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
