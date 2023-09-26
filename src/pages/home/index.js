// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Icon from 'src/@core/components/icon'
import Box from '@mui/material/Box'

// ** Custom Component Import
import ObjetivesByDay from 'src/views/dashboard/ObjetivesByDay'
import ObjetivesByMonth from 'src/views/dashboard/objetivesByMonth'
import ChartBarsDocsByPlants from 'src/views/dashboard/ChartBarsDocsByPlants'
import ChartBarsObjetivesByPlants from 'src/views/dashboard/ChartBarsObjetivesByPlants'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Demo Components Imports
import ChartDonutObjetivesLast30days from 'src/views/charts/apex-charts/ChartDonutObjetivesLast30days'
import ChartDonutDocsLast30days from 'src/views/charts/apex-charts/ChartDonutDocsLast30days'
import Top10UsersWihitMostDocs from 'src/views/dashboard/ecommerce/Top10UsersWihitMostDocs'
import TopPositionCharts from 'src/views/dashboard/ecommerce/TopPositionCharts'

// ** Hooks
import { useFirebase } from 'src/context/useFirebase'

const Home = () => {
  // ** Hooks
  const { consultDocs, consultObjetives, getUsersWithSolicitudes } = useFirebase()

  const [allDocs, setAllDocs] = useState(null);
  const [docsByPlants, setDocsByPlants] = useState(null);
  const [docsByState, setDocsByState] = useState([0, 0, 0]);
  const [allObjetives, setAllObjetives] = useState(null);
  const [objetivesOfActualWeek, setObjetivesOfActualWeek] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [objetivesOfLastSixMonths, setObjetivesOfLastSixMonths] = useState([0, 0, 0, 0, 0, 0])
  const [monthsOfLastSixMonths, setMonthssOfLastSixMonths] = useState(['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'])
  const [objetivesByPlants, setObjetivesByPlants] = useState([0, 0, 0, 0, 0, 0]);
  const [objetivesByState, setObjetivesByState] = useState([0, 0, 0]);
  const [top10, setTop10] = useState([])
  const [loading, setLoading] = useState(true)

  const plants = [
    'Planta Concentradora Los Colorados',
    'Planta Concentradora Laguna Seca | Línea 1',
    'Planta Concentradora Laguna Seca | Línea 2',
    'Chancado y Correas',
    'Puerto Coloso',
    'Instalaciones Cátodo'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const   [
          allDocsCount,
          allObjCount,
          weekObj,
          lastSixMonthsObjetives,
          byStateDocs,
          byStateObj,
          byPlantsDocs,
          byPlantsObj,
          resTop10
        ] = await Promise.all([
          consultDocs('all'),
          consultObjetives('all'),
          consultObjetives('week'),
          consultObjetives('lastSixMonths'),
          consultDocs('byState'),
          consultObjetives('byState'),
          consultDocs('byPlants'),
          consultObjetives('byPlants'),
          getUsersWithSolicitudes()
        ])

        /* const monthArray = lastSixMonthsObjetives.map(item => item.month)
        const cantArray = lastSixMonthsObjetives.map(item => item.cant) */
        const [monthArray, cantArray] = lastSixMonthsObjetives.reduce((acc, item) => {
          acc[0].push(item.month);
          acc[1].push(item.cant);

          return acc;
      }, [[], []]);

        setAllDocs(allDocsCount)
        setAllObjetives(allObjCount);
        setObjetivesOfActualWeek(weekObj);
        setObjetivesOfLastSixMonths(lastSixMonthsObjetives);
        setObjetivesOfLastSixMonths(cantArray)
        setMonthssOfLastSixMonths(monthArray)
        setObjetivesByPlants(byPlantsObj);
        setDocsByPlants(byPlantsDocs);
        setDocsByState(byStateDocs);
        setObjetivesByState(byStateObj);
        setTop10(resTop10)
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData()
  }, [loading])

  return (
    <Grid container spacing={6} alignItems='stretch' className='match-height' sx={{ display: 'flex' }}>

      <Grid item xs={12} md={12}>
        <Card>
          <CardHeader sx={{ pb: 3.25 }} title='Resumen Estadístico' titleTypographyProps={{ variant: 'h6' }} />
          <CardContent>
            <Grid container spacing={6}>
              <Grid  item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CustomAvatar skin='light' variant='rounded' color='primary' sx={{ mr: 4 }}>
                    <Icon icon='mdi:text-box-outline' />
                  </CustomAvatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                      {allDocs}
                    </Typography>
                    <Typography variant='caption'>Solicitudes</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CustomAvatar skin='light' variant='rounded' color='warning' sx={{ mr: 4 }}>
                    <Icon icon='mdi:progress-upload' />
                  </CustomAvatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                      {allObjetives}
                    </Typography>
                    <Typography variant='caption'>Levantamientos</Typography>
                  </Box>
                </Box>
              </Grid>
              {/* <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CustomAvatar skin='light' variant='rounded' color='info' sx={{ mr: 4 }}>
                    <Icon icon='mdi:tooltip-edit-outline' />
                  </CustomAvatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                      8.458
                    </Typography>
                    <Typography variant='caption'> Trabajos de Gabinete</Typography>
                  </Box>
                </Box>
              </Grid> */}
            </Grid>
          </CardContent>
        </Card>
      </Grid>


      <Grid item xs={12} sm={6} md={6}>
        <ObjetivesByDay objetivesOfActualWeek={objetivesOfActualWeek} />
      </Grid>

      <Grid item xs={12} sm={6} md={6}>
        <ObjetivesByMonth objetivesOfLastSixMonths={objetivesOfLastSixMonths} monthsOfLastSixMonths={monthsOfLastSixMonths} />
      </Grid>

      <Grid item xs={12} md={6}>
        <ChartDonutDocsLast30days docsByState={docsByState} loading={loading} />
      </Grid>

      <Grid item xs={12} md={6}>
        <ChartDonutObjetivesLast30days objetivesByState={objetivesByState} loading={loading}/>
      </Grid>
      <Grid item xs={12} sm={6}>
        <ChartBarsDocsByPlants docsByPlants={docsByPlants} loading={loading}/>
      </Grid>

      <Grid item xs={12} sm={6} md={6}>
        <ChartBarsObjetivesByPlants objetivesByPlants={objetivesByPlants} />
      </Grid>

      <Grid item xs={12} sm={12} md={12}>
        <Top10UsersWihitMostDocs top10={top10} />
      </Grid>
    </Grid>
  )
}

Home.acl = {
  subject: 'home'
}

export default Home
