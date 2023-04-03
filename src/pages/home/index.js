// ** MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Icon from 'src/@core/components/icon'


// ** Custom Component Import
import CardStatisticsVertical from 'src/@core/components/card-statistics/card-stats-vertical'
import ProfileCard from 'src/views/dashboard/ProfileCard'
import DocsByDay from 'src/views/dashboard/DocsByDay'
import ShowMap from 'src/views/dashboard/ShowMap'
import DocStates from 'src/views/dashboard/DocStates'


const Home = () => {
  return (
    <Grid container spacing={6} alignItems="stretch" className='match-height' sx={{display:'flex'}}>
      <Grid item height='auto' xs={12} sm={4}>
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
      </Grid>
    </Grid>
  )
}

export default Home
