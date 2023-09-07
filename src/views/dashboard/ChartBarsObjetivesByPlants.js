// ** MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

const ChartBarsObjetivesByPlants = ({ objetivesByPlants }) => {
  // ** Hook
  const theme = useTheme()

  const plants = [
    'Los Colorados',
    'Laguna Seca 1',
    'Laguna Seca 2',
    'Chancado y Correas',
    'Puerto Coloso',
    'Instalacones Cátodo'
  ]
  const resObjByPlants2 = objetivesByPlants.map((el, index) => ({ x: plants[index], y: el }))

  const options = {
    tooltip: {
      x: {
        formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
          //const value = series[seriesIndex][dataPointIndex];
          const plants = [
            'Los Colorados',
            'Laguna Seca 1',
            'Laguna Seca 2',
            'Chancado y Correas',
            'Puerto Coloso',
            'Instalacones Cátodo'
          ]

          return plants[dataPointIndex]
        }
      }
    },
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
    series: [
      {
        data: resObjByPlants2
      }
    ],
    xaxis: {
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories: ['LC', 'LS1', 'LS2', 'ChC', 'PC', 'IC'],
      labels: {
        style: {
          colors: theme.palette.text.disabled
        }
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

  return (
    <Card>
      <CardHeader
        title='Levantamientos por Planta'
        subheaderTypographyProps={{ sx: { lineHeight: 1.429 } }}
        titleTypographyProps={{ sx: { letterSpacing: '0.15px' } }}
      />
      <CardContent sx={{ pt: { xs: `${theme.spacing(6)} !important`, md: `${theme.spacing(0)} !important` } }}>
        <ReactApexcharts
          type='bar'
          height={120}
          options={options}
          series={[{ name: 'Levantamientos', data: objetivesByPlants }]}
        />
      </CardContent>
    </Card>
  )
}

export default ChartBarsObjetivesByPlants
