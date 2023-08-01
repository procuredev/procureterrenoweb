// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import {Card, CardHeader, CardContent} from '@mui/material'
import Typography from '@mui/material/Typography'
import { DataGrid } from '@mui/x-data-grid'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

// ** Hooks
import { useFirebase } from 'src/context/useFirebaseAuth'

const rows = [
  {
    id: 1,
    plant: 'Laguna Seca 1',
    docs: 32,
    name: 'Jordan Stevenson',
    avatarSrc: '/images/avatars/1.png'
  },
  {
    id: 2,
    docs: 25,
    plant: 'Puerto Coloso',
    name: 'Robert Crawford',
    avatarSrc: '/images/avatars/3.png',
  },
  {
    id: 3,
    docs: 8,
    plant: 'Chancado y Correas',
    name: 'Lydia Reese',
    avatarSrc: '/images/avatars/2.png'
  },
  {
    id: 4,
    docs: 16,
    plant: 'Instalaciones Catodo',
    name: 'Richard Sims',
    avatarSrc: '/images/avatars/5.png'
  },
  {
    id: 5,
    docs: 23,
    plant: 'Laguna Seca 2',
    name: 'Lucile Young',
    avatarSrc: '/images/avatars/4.png'
  },
  {
    id: 6,
    docs: 4,
    plant: 'Puerto Coloso',
    name: 'Francis Frank',
    avatarSrc: '/images/avatars/7.png',
  },
  {
    id: 7,
    docs: 22,
    plant: 'Los Colorados',
    name: 'Paul Calavera',
    avatarSrc: '/images/avatars/8.png'
  },
  {
    id: 8,
    docs: 1,
    plant: 'Laguna Seca 1',
    name: 'Priscila Castellanos',
    avatarSrc: '/images/avatars/4.png'
  },
  {
    id: 9,
    docs: 18,
    plant: 'Puerto Coloso',
    name: 'Alvaro Jimenez',
    avatarSrc: '/images/avatars/7.png',
  },
  {
    id: 10,
    docs: 9,
    plant: 'Los Colorados',
    name: 'José Lira',
    avatarSrc: '/images/avatars/8.png'
  }
]

const renderUserAvatar = row => {
  if (row.avatarSrc) {
    return <CustomAvatar src={row.avatarSrc} sx={{ mr: 3, width: 34, height: 34 }} />
  } else {


    return (


      <CustomAvatar skin='light' sx={{ mr: 3, width: 34, height: 34, objectFit: 'contain', bgcolor: 'primary.main', color: 'white', fontSize: '.8rem' }}>
        {getInitials(row.name ? row.name : 'John Doe')}
      </CustomAvatar>

    )
  }
}

const columns = [
  {
    flex: 0.2,
    field: 'name',
    minWidth: 200,
    headerName: 'User',
    renderCell: ({ row }) => {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {renderUserAvatar(row)}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='subtitle2' sx={{ color: 'text.primary' }}>
              {row.name}
            </Typography>
          </Box>
        </Box>
      )
    }
  },
  {
    flex: 0.35,
    minWidth: 130,
    field: 'plant',
    headerName: 'Planta',
    renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>{Array.isArray(row.plant) ? row.plant.join(", ") : row.plant}</Typography>
      </Box>
    )
  },
  {
    flex: 0.05,
    minWidth: 130,
    field: 'docs',
    headerName: 'Solicitudes',
    renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>{row.docs}</Typography>
      </Box>
    )
  }
]

const Top10UsersWihitMostDocs = () => {

  // ** Hook
  const {
    getUsersWithSolicitudes
  } = useFirebase()

  const [top10, setTop10] = useState([])

  useEffect(() => {
      const fetchData = async () => {
        const resTop10 = await getUsersWithSolicitudes();
        setTop10(resTop10);
      };

    fetchData();
  }, [])


  return (

    <Card>
      <CardHeader
      sx={{ pb: 3.25 }}
      title='Top 10 usuarios con más solicitudes'
      titleTypographyProps={{ variant: 'h6' }}>

      </CardHeader>
      <CardContent>
      <DataGrid autoHeight hideFooter rows={top10} columns={columns} disableSelectionOnClick pagination={undefined} />
      </CardContent>

    </Card>
  )
}

export default Top10UsersWihitMostDocs
