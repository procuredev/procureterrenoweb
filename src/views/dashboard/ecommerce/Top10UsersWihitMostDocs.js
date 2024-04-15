// ** MUI Imports
import Box from '@mui/material/Box'
import { Card, CardHeader, CardContent } from '@mui/material'
import Typography from '@mui/material/Typography'
import { DataGrid } from '@mui/x-data-grid'

// ** Custom Components
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

const renderUserAvatar = row => {
  if (row.avatarSrc) {
    return <CustomAvatar src={row.avatarSrc} sx={{ mr: 3, width: 34, height: 34 }} />
  } else {
    return (
      <CustomAvatar
        skin='light'
        sx={{
          mr: 3,
          width: 34,
          height: 34,
          objectFit: 'contain',
          bgcolor: 'primary.main',
          color: 'white',
          fontSize: '.8rem'
        }}
      >
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
    headerName: 'Usuario',
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
        <Typography sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
          {Array.isArray(row.plant) ? row.plant.join(', ') : row.plant}
        </Typography>
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

const Top10UsersWihitMostDocs = ({ top10 }) => {

  return (
    <Card>
      <CardHeader
        sx={{ pb: 3.25 }}
        title='Top 10 usuarios con más solicitudes'
        titleTypographyProps={{ variant: 'h6' }}
      ></CardHeader>
      <CardContent>
        <DataGrid autoHeight hideFooter rows={top10} columns={columns} disableSelectionOnClick pagination={undefined} />
      </CardContent>
    </Card>
  )
}

export default Top10UsersWihitMostDocs
