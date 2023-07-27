// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Component Import
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const donutColors = {
  series1: '#fdd835',
  series2: '#00d4bd',
  series3: '#826bf8',
  series4: '#40CDFA',
  series5: '#ffa1a1'
}

// ** Hooks
import { useFirebase } from 'src/context/useFirebaseAuth'

const ChartDonutObjetivesLast30days = () => {
  // ** Hook
  const {
    consultAllObjetivesByState
  } = useFirebase()
  const theme = useTheme()

  const [objByState, setObjByState] = useState([0,0,0])
  const [loading, setLoading] = useState(true); // Agregamos un estado para indicar si estamos cargando los datos

  useEffect(() => {
      const fetchData = async () => {
        const resObjByStates = await consultAllObjetivesByState();
        setObjByState(resObjByStates);
        setLoading(false); // Cuando los datos se han cargado, actualizamos el estado a false
      };

    fetchData();
  }, [loading])

  const totalObjetives = objByState.reduce((total, count) => total + count, 0);
  const total = `Total: ${totalObjetives}`

  const options = {
    stroke: { width: 0 },
    labels: ['agendados', 'en ejecución',  'terminados'],
    colors: [donutColors.series3, donutColors.series1, donutColors.series2],
    dataLabels: { enabled: true, formatter: function (val, opt) { return opt.w.config.series[opt.seriesIndex]} },
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
            show: true,
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
              label: 'Total',

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
                  show: true,
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
        title='Levantamientos últimos 30 días'

        //subheader='Spending on various categories'
        subheaderTypographyProps={{ sx: { color: theme => `${theme.palette.text.disabled} !important` } }}
      />
      <CardContent>
        {loading? <p>Cargando datos...</p> : <ReactApexcharts type='donut' height={400} options={options} series={objByState} />}

      </CardContent>
    </Card>
  )
}

export default ChartDonutObjetivesLast30days
