// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'
import OptionsMenu from 'src/@core/components/option-menu'
import ReactApexcharts from 'src/@core/components/react-apexcharts'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

// ** Hooks
import { useFirebase } from 'src/context/useFirebaseAuth'

const ObjetivesByDay = () => {
   // ** Hooks
   const {
    consultObjetivesOfActualWeek
  } = useFirebase()
  const theme = useTheme()

  const [objetivesOfActualWeek, setObjetivesOfActualWeek] = useState([0,0,0,0,0,0,0])

  useEffect(() => {
      const fetchData = async () => {
        const objOfActualWeek = await consultObjetivesOfActualWeek();
        setObjetivesOfActualWeek(objOfActualWeek);
      };

    fetchData();
  }, [])


  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        distributed: true,
        columnWidth: '51%',
        endingShape: 'rounded',
        startingShape: 'rounded'
      }
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: [
      hexToRGBA(theme.palette.primary.main, 1),
      hexToRGBA(theme.palette.primary.main, 1),
      hexToRGBA(theme.palette.primary.main, 1),
      hexToRGBA(theme.palette.primary.main, 1),
      hexToRGBA(theme.palette.primary.main, 1),
      hexToRGBA(theme.palette.primary.main, 1),
      hexToRGBA(theme.palette.primary.main, 1)
    ],
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    xaxis: {
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
      labels: {
        style: { colors: theme.palette.text.disabled }
      }
    },
    yaxis: { show: false },
    grid: {
      show: false,
      padding: {
        top: -30,
        left: -7,
        right: -4
      }
    }
  }

  const totalDocuments = objetivesOfActualWeek.reduce((total, count) => total + count, 0);
  const totalSemanal = `Total semanal: ${totalDocuments}`



  return (
    <Card>
      <CardHeader
        title='Levantamientos por día'
        subheader={totalSemanal}
        subheaderTypographyProps={{ sx: { lineHeight: 1.429 } }}
        titleTypographyProps={{ sx: { letterSpacing: '0.15px' } }}
      />
      <CardContent sx={{ pt: { xs: `${theme.spacing(6)} !important`, md: `${theme.spacing(0)} !important` } }}>
        <ReactApexcharts type='bar' height={120} options={options} series={[{ data: objetivesOfActualWeek }]} />
      </CardContent>
    </Card>
  )
}

export default ObjetivesByDay