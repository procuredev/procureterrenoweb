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
import PageHeader from 'src/@core/components/page-header'

// ** Demo Components Imports
import TableBasic from 'src/views/table/data-grid/TableBasic'
import TableFilter from 'src/views/table/data-grid/TableFilter'
import TableColumns from 'src/views/table/data-grid/TableColumns'
import TableEditable from 'src/views/table/data-grid/TableEditable'
import TableBasicSort from 'src/views/table/data-grid/TableBasicSort'
import TableSelection from 'src/views/table/data-grid/TableSelection'
import TableServerSide from 'src/views/table/data-grid/TableServerSide'

const DataGrid = () => {
  const [value, setValue] = useState('1')
  const [inputValue, setInputValue] = useState('')
  const [roleData, setRoleData] = useState({ name: 'admin' })
  const [values, setValues] = useState({})

  const { useSnapshot, authUser, getRoleData } = useFirebase()
  const data = useSnapshot(true)

  const moment = require('moment')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  // Function to handle changes when a filter is selected from Autocomplete or Select
  const handleFilterChange = (key, value) => {
    setValues(prevValues => ({
      ...prevValues,
      [key]: value
    }))
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
        type: `${label}`,
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

  // Objeto de configuración de filtros
  const filterConfig = {
    all: {
      label: 'Todas las solicitudes',
      canSee: [1, 2, 3, 4, 5],
      type: 'General', // Ejemplo de números permitidos para ver este filtro
      filterFunction: doc => true // Mostrar todos los documentos
    },
    pendingApproval: {
      label: 'Por aprobar',
      canSee: [2, 3, 5], // Ejemplo de números permitidos para ver este filtro
      type: 'State',
      filterFunction: authUser.role === 5 ? doc => doc.state === 3 || 4 : doc => doc.state === authUser.role - 1
    },
    approved: {
      label: 'Aprobadas',
      canSee: [1, 2, 3], // Ejemplo de números permitidos para ver este filtro
      type: 'State',
      filterFunction: doc => doc.state >= 6 && doc.state < 10
    },
    rejected: {
      label: 'Rechazadas',
      canSee: [3, 4, 5], // Ejemplo de números permitidos para ver este filtro
      type: 'State',
      filterFunction: doc => doc.state === 10
    },
    inReviewByMEL: {
      label: 'En revisión por MEL',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'State',
      filterFunction: doc => doc.state === 2
    },
    inReviewByProcure: {
      label: 'En revisión por Procure',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'State',
      filterFunction: doc => doc.state === 5
    },
    approvedByMEL: {
      label: 'Aprobadas por MEL',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'State',
      filterFunction: doc => doc.state === 4
    },
    approvedByProcure: {
      label: 'Aprobadas por Procure',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      type: 'State',
      filterFunction: doc => doc.state >= 6 && doc.state < 10
    },
    myRequests: {
      label: 'Mis solicitudes',
      canSee: [1, 2, 3],
      type: 'Author',
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
      canSee: [1, 3, 4, 5, 6, 9],
      type: 'Shift',
      filterFunction: doc => otherWeek(doc.start.seconds)
    },
    shiftB: {
      label: 'Turno Q',
      canSee: [1, 3, 4, 5, 6, 9],
      type: 'Shift',
      filterFunction: doc => !otherWeek(doc.start.seconds)
    },
    myWeek: {
      label: 'Aprobadas por Procure en mi semana',
      type: 'General',
      canSee: [1, 7],
      filterFunction: doc => otherWeek(doc.start.seconds)
    },
    ...filterByJobType(),
    ...filterByPlant()
  }

  // Obtener las claves de filtro desde el objeto de configuración
  const filterKeys = Object.keys(filterConfig)

  // Estado para mantener la clave de filtro activo actualmente
  const [activeFilterKey, setActiveFilterKey] = useState(filterKeys[0])

  const handleClearFilters = () => {
    setActiveFilterKey(filterKeys[0])
    setInputValue('')
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

  // Obtener todas las opciones únicas de "type" en el objeto filterConfig
  const filterTypes = [...new Set(Object.values(filterConfig).map(item => item.type))]

  // Función para filtrar las opciones según el tipo seleccionado
  const getFilterOptionsByType = type => {
    return Object.entries(filterConfig).filter(([key, { canSee, type: filterType }]) => {
      return canSee.includes(authUser.role) && filterType === type
    })
  }

  useEffect(() => {
    const role = async () => {
      if (authUser) {
        const role = await getRoleData(authUser.role.toString())
        setRoleData(role)
      }
    }

    role()
  }, [])

  useEffect(() => {
    // Function to set initial values based on filterKeys
    const initializeValues = () => {
      const initialValues = {}

      filterTypes.forEach(key => {
        initialValues[key] = ''
      })

      setValues(initialValues)
    }

    initializeValues()
  }, [])

  // Function to apply filters to the data rows
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
      <PageHeader
        title={
          <Typography variant='h5'  sx={{ mb:5 }}>
            <Link href='https://mui.com/x/react-data-grid/' target='_blank'>
              Solicitudes
            </Link>
          </Typography>
        }
      />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={10}>
          <Grid container spacing={2}>
            {filterTypes.map(type => (
              <Grid item xs={6} sm={4} md={3} key={type}>
                <FormControl sx={{ width: '100%' }}>
                  <Fragment key={type}>
                    <InputLabel id={`select-label-${type}`}>{`${type}`}</InputLabel>
                    <Select
                      labelId={`select-label-${type}`}
                      label={`${type}`}
                      value={values[type]}
                      onChange={e => handleFilterChange(type, e.target.value)} // Pass the selected value to handleFilterChange
                    >
                      <MenuItem value=''>{`${type}`}</MenuItem>
                      {getFilterOptionsByType(type).map(([key, { label }]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </Fragment>
                </FormControl>
              </Grid>
            ))}
            <Grid item xs={12} sm={2}>
              <Button
                variant='outlined'
                onClick={handleClearFilters}
                sx={{ width: '100%', display: { xs: 'block', sm: 'none' } }}
              >
                Limpiar filtros
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} sm={2}>
          {/* This button will be hidden on small screens */}
          <Button
            variant='outlined'
            onClick={handleClearFilters}
            sx={{ width: '100%', display: { xs: 'none', sm: 'block' } }}
          >
            Limpiar filtros
          </Button>
        </Grid>
      </Grid>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label='lab API tabs example'>
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
