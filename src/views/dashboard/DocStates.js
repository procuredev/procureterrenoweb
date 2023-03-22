// ** MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'
import { useContext } from 'react'

// ** Component Import
import ReactApexcharts from 'src/@core/components/react-apexcharts'


const DocStates = () => {
  // ** Hook
  const theme = useTheme()

  const donutColors = {
    series1: hexToRGBA(theme.palette.primary.main, 0.2),
    series2: hexToRGBA(theme.palette.primary.main, 0.4),
    series3: hexToRGBA(theme.palette.primary.main, 0.6),
    series4: hexToRGBA(theme.palette.primary.main, 0.8),
    series5: hexToRGBA(theme.palette.primary.main, 1),
  }

  const options = {
    stroke: { width: 0 },
    labels: ['En revisión', 'Aprobado', 'Rechazado', 'Otro'],
    colors: [donutColors.series1, donutColors.series5, donutColors.series3, donutColors.series2],
    dataLabels: {
      enabled: false,
      formatter: val => `${parseInt(val, 10)}%`
    },
    legend: {
      position: 'bottom',
      markers: { offsetX: -3 },
      labels: { colors: theme.palette.text.secondary },
      itemMargin: {
        vertical: 3,
        horizontal: 10
      }
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: false,
            name: {
              fontSize: '1.2rem'
            },
            value: {
              fontSize: '1.2rem',
              color: theme.palette.text.secondary,
              formatter: val => `${parseInt(val, 10)}`
            },
            total: {
              show: true,
              fontSize: '1.2rem',
              label: 'Operational',
              formatter: () => '31%',
              color: theme.palette.text.primary
            }
          }
        }
      }
    },
    responsive: [
      {
        breakpoint: 992,
        options: {
          chart: {
            height: 380
          },
          legend: {
            position: 'bottom'
          }
        }
      },
      {
        breakpoint: 576,
        options: {
          chart: {
            height: 320
          },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: false,
                  name: {
                    fontSize: '1rem'
                  },
                  value: {
                    fontSize: '1rem'
                  },
                  total: {
                    fontSize: '1rem'
                  }
                }
              }
            }
          }
        }
      }
    ]
  }

  return (
    <Card>
      <CardHeader
        title='Estado de las solicitudes'
        subheaderTypographyProps={{ sx: { color: theme => `${theme.palette.text.disabled} !important` } }}
      />
      <CardContent>
        <ReactApexcharts type='donut' height={170} options={options} series={[2, 18, 1, 1]} />
      </CardContent>
    </Card>
  )
}

export default DocStates
