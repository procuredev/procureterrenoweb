// ** MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Icon from 'src/@core/components/icon'
import Link from '@mui/material/Link'
import Box from '@mui/material/Box'


// ** Custom Component Import
import CardStatisticsVertical from 'src/@core/components/card-statistics/card-stats-vertical'
import ProfileCard from 'src/views/dashboard/ProfileCard'
import DocsByDay from 'src/views/dashboard/DocsByDay'
import ObjetivesByMonth from 'src/views/dashboard/objetivesByMonth'
import ChartBarsDocsByPlants from 'src/views/dashboard/ChartBarsDocsByPlants'
import ChartBarsObjetivesByPlants from 'src/views/dashboard/ChartBarsObjetivesByPlants'
import ShowMap from 'src/views/dashboard/ShowMap'
import DocStates from 'src/views/dashboard/DocStates'
import PageHeader from 'src/@core/components/page-header'
import CustomAvatar from 'src/@core/components/mui/avatar'
import OptionsMenu from 'src/@core/components/option-menu'


// ** Demo Components Imports
import ChartDonutObjetivesLast30days from 'src/views/charts/apex-charts/ChartDonutObjetivesLast30days'
import ChartDonutDocsLast30days from 'src/views/charts/apex-charts/ChartDonutDocsLast30days'
import Top10UsersWihitMostDocs from 'src/views/dashboard/ecommerce/Top10UsersWihitMostDocs'
import TopPositionCharts from 'src/views/dashboard/ecommerce/TopPositionCharts'




const Home = () => {
  return (
    <Grid container spacing={6} alignItems="stretch" className='match-height' sx={{display:'flex'}}>
      {/* <PageHeader
            title={
              <Typography variant='h5'>
                <Link href='https://github.com/apexcharts/react-apexcharts' target='_blank'>
                  React ApexCharts
                </Link>
              </Typography>
            }
            subtitle={<Typography variant='body2'>React Component for ApexCharts</Typography>}
          /> */}
      <Grid item xs={12} md={12}>
        <Card>
          <CardHeader
            sx={{ pb: 3.25 }}
            title='Resumen Estadístico'
            titleTypographyProps={{ variant: 'h6' }}


          />
          <CardContent>
            <Grid container spacing={6}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CustomAvatar skin='light' variant='rounded' color='primary' sx={{ mr: 4 }}>
                    <Icon icon='mdi:text-box-outline' />
                  </CustomAvatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    2.450
                    </Typography>
                    <Typography variant='caption'>Solicitudes</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CustomAvatar skin='light' variant='rounded' color='warning' sx={{ mr: 4 }}>
                    <Icon icon='mdi:progress-upload' />
                  </CustomAvatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    2.250
                    </Typography>
                    <Typography variant='caption'>Levantamientos</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CustomAvatar skin='light' variant='rounded' color='info' sx={{ mr: 4 }}>
                    <Icon icon='mdi:tooltip-edit-outline' />
                  </CustomAvatar>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    8.458
                    </Typography>
                    <Typography variant='caption'>Gabinete</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

     {/*  <Grid item height='auto' xs={12} sm={4}>
        <ProfileCard />
      </Grid>
      <Grid item xs={12} sm={4}>
        <DocsByDay />
      </Grid>
      <Grid item xs={12} sm={4}>
        <DocStates />
      </Grid>
      <Grid item xs={12} sm={6}>
        <ShowMap />
      </Grid>
      <Grid item xs={12} sm={6}>
      <CardStatisticsVertical
                stats='18 solicitudes'
                color='success'
                title='Total de solicitudes activas'
                icon={<Icon icon='mdi:file-document-multiple-outline' />}
              />
      </Grid> */}

      <Grid item xs={12} sm={6}>
        <DocsByDay />
      </Grid>



      <Grid item xs={12} sm={6}>
        <ObjetivesByMonth />
      </Grid>

      <Grid item xs={12} md={6}>
        <ChartDonutDocsLast30days />
      </Grid>

      <Grid item xs={12} md={6}>
        <ChartDonutObjetivesLast30days />
      </Grid>
      <Grid item xs={12} sm={6}>
        <ChartBarsDocsByPlants />
      </Grid>

      <Grid item xs={12} md={6}>
        <ChartBarsObjetivesByPlants />
      </Grid>

      <Grid item xs={12} md={12}>
        <Top10UsersWihitMostDocs />
      </Grid>


    </Grid>
  )
}

Home.acl = {
  subject: 'home'
}

export default Home
