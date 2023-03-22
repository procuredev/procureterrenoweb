// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

const CardStatsVertical = props => {
  // ** Props
  const { title, color, icon, stats, chipText, trendNumber, trend = 'positive' } = props

  return (
    <Card>
      <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 6, width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <CustomAvatar skin='light' variant='rounded' color={color}>
            {icon}
          </CustomAvatar>
        </Box>
        <Typography variant='h6' sx={{ mb: 1 }}>
          {stats}
        </Typography>
        <Typography variant='body2' sx={{ mb: 5 }}>
          {title}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default CardStatsVertical
