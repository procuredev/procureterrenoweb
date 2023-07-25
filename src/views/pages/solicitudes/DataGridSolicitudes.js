// ** React Imports
import { Fragment, useState, useEffect } from 'react'

// ** Hooks
import { useFirebase } from 'src/context/useFirebaseAuth'

// ** MUI Imports
import Autocomplete from '@mui/material/Autocomplete'
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

  const { useSnapshot, authUser, getRoleData } = useFirebase()
  const data = useSnapshot(true)

  const moment = require('moment')

  useEffect(() => {
    const role = async () => {
      if (authUser) {
        const role = await getRoleData(authUser.role.toString())
        setRoleData(role)
      }
    }

    role()
  }, [])

  const handleChange = (event, newValue) => {
    setValue(newValue)
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

  // Objeto de configuración de filtros
  const filterConfig = {
    all: {
      label: 'Todas las solicitudes',
      canSee: [1, 2, 3, 4, 5], // Ejemplo de números permitidos para ver este filtro
      filterFunction: (doc) => true, // Mostrar todos los documentos
    },
    pendingApproval: {
      label: 'Por aprobar',
      canSee: [2, 3], // Ejemplo de números permitidos para ver este filtro
      filterFunction: (doc) => doc.state === authUser.role - 1,
    },
    approved: {
      label: 'Aprobadas',
      canSee: [1, 2, 3], // Ejemplo de números permitidos para ver este filtro
      filterFunction: (doc) => doc.state >= 6 && doc.state < 10,
    },
    rejected: {
      label: 'Rechazadas',
      canSee: [3, 4, 5], // Ejemplo de números permitidos para ver este filtro
      filterFunction: (doc) => doc.state === 10,
    },
    inReviewByMEL: {
      label: 'En revisión por MEL',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      filterFunction: (doc) => doc.state === 2,
    },
    inReviewByProcure: {
      label: 'En revisión por Procure',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      filterFunction: (doc) => doc.state === 5,
    },
    approvedByMEL: {
      label: 'Aprobadas por MEL',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      filterFunction: (doc) => doc.state === 3
    },
    approvedByProcure: {
      label: 'Aprobadas por Procure',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      filterFunction: (doc) => doc.state >= 6 && doc.state < 10
    },
    myRejected: {
      label: 'Mis solicitudes rechazadas',
      canSee: [1, 2, 3],
      filterFunction: (doc) => doc.state === 10 && doc.uid === authUser.uid
    },
    allRejected: {
      label: 'Todas las rechazadas',
      canSee: [1, 4, 5, 6, 7, 9],
      filterFunction: (doc) => doc.state === 10
    },
    requestedByMe: {
      label: 'Mis solicitudes',
      canSee: [1, 2, 3],
      filterFunction: (doc) => doc.uid === authUser.uid
    },
    withOT: {
      label: 'Tiene OT',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      filterFunction: (doc) => doc.hasOwnProperty('ot')
    },
    withoutOT: {
      label: 'Sin OT',
      canSee: [1, 2, 3, 4, 5, 6, 7, 9],
      filterFunction: (doc) => !doc.hasOwnProperty('ot'),
    },
    shiftA: {
      label: 'Turno P',
      canSee: [1, 3, 4, 5, 6, 9],
      filterFunction: (doc) => otherWeek(doc.start.seconds),
    },
    shiftB: {
      label: 'Turno Q',
      canSee: [1, 3, 4, 5, 6, 9],
      filterFunction: (doc) => !otherWeek(doc.start.seconds)
    },
    approvedByProcureInMyWeek: {
      data: data.filter(doc => doc.state >= 6 && doc.state < 10 && otherWeek(doc.start.seconds)),
      label: 'Aprobadas por Procure en mi semana',
      canSee: [1, 7]
    },
    ...filterByJobType(),
    ...filterByPlant()
  };

  // Obtener las claves de filtro desde el objeto de configuración
  const filterKeys = Object.keys(filterConfig);

   // Estado para mantener la clave de filtro activo actualmente
  const [activeFilterKey, setActiveFilterKey] = useState(filterKeys[0]);

  const handleAutoChange = (event, value) => {
    if (value) {
      setActiveFilterKey(value[0]);
      setInputValue(value[1].label);
    }
  };

  const tabContent = authUser
    ? [
        {
          data: data,
          label: 'Todas las solicitudes',
          info: 'Todas las solicitudes'
        },
        {
          data: data.filter(doc => doc.state === authUser.role - 1),
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

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <PageHeader
        title={
          <Typography variant='h5'>
            <Link href='https://mui.com/x/react-data-grid/' target='_blank'>
              Solicitudes
            </Link>
          </Typography>
        }
      />
      <Autocomplete
              fullWidth
              clearOnBlur
              options={Object.entries(filterConfig).filter(([key, { canSee }]) => {
                return canSee.includes(authUser.role)
              })}
              getOptionLabel={([key, { data, label }]) => (label ? label : '')}
              renderInput={params => <TextField {...params} placeholder='Filtrar por...' />}
              value={[activeFilterKey, filterConfig[activeFilterKey]]}
              inputValue={inputValue}
              isOptionEqualToValue={(option, value) => option[0] === value}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === 'input') {
                  setInputValue(newInputValue)
                } else if (reason === 'clear') {
                  setInputValue('')
                  setActiveFilterKey('all')
                }
              }}
              onChange={handleAutoChange}
            />
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
              <TableBasic rows={element.data.filter(filterConfig[activeFilterKey].filterFunction)} roleData={roleData} role={authUser.role} />
            </TabPanel>
          </Grid>
        ))}
      </TabContext>
    </Box>
  )
}

export default DataGrid
