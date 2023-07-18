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


const rows = [
  {
    id: 1,
    plant: 'Laguna Seca 1',
    name: 'Jordan Stevenson',
    avatarSrc: '/images/avatars/1.png'
  },
  {
    id: 2,
    plant: 'Puerto Coloso',
    name: 'Robert Crawford',
    avatarSrc: '/images/avatars/3.png',
  },
  {
    id: 3,
    plant: 'Chancado y Correas',
    name: 'Lydia Reese',
    avatarSrc: '/images/avatars/2.png'
  },
  {
    id: 4,
    plant: 'Instalaciones Catodo',
    name: 'Richard Sims',
    avatarSrc: '/images/avatars/5.png'
  },
  {
    id: 5,
    plant: 'Laguna Seca 2',
    name: 'Lucile Young',
    avatarSrc: '/images/avatars/4.png'
  },
  {
    id: 6,
    plant: 'Puerto Coloso',
    name: 'Francis Frank',
    avatarSrc: '/images/avatars/7.png',
  },
  {
    id: 7,
    plant: 'Los Colorados',
    name: 'Paul Calavera',
    avatarSrc: '/images/avatars/8.png'
  },
  {
    id: 8,
    plant: 'Laguna Seca 1',
    name: 'Priscila Castellanos',
    avatarSrc: '/images/avatars/4.png'
  },
  {
    id: 9,
    plant: 'Puerto Coloso',
    name: 'Alvaro Jimenez',
    avatarSrc: '/images/avatars/7.png',
  },
  {
    id: 10,
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
      <CustomAvatar skin='light' sx={{ mr: 3, width: 34, height: 34, fontSize: '.8rem' }}>
        {getInitials(row.name ? row.name : 'John Doe')}
      </CustomAvatar>
    )
  }
}

const columns = [
  {
    flex: 0.25,
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
    flex: 0.2,
    minWidth: 130,
    field: 'plant',
    headerName: 'Planta',
    renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>{row.plant}</Typography>
      </Box>
    )
  }
]

const Top10UsersWihitMostDocs = () => {
  return (

    <Card>
      <CardHeader
      sx={{ pb: 3.25 }}
      title='Top 10 usuarios con más solicitudes'
      titleTypographyProps={{ variant: 'h6' }}>

      </CardHeader>
      <CardContent>
      <DataGrid autoHeight hideFooter rows={rows} columns={columns} disableSelectionOnClick pagination={undefined} />
      </CardContent>

    </Card>
  )
}

export default Top10UsersWihitMostDocs
