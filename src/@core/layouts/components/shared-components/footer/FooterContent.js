// ** MUI Imports
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'

const FooterContent = () => {

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
      <Typography sx={{ mr: 2 }}>
        {`© ${new Date().getFullYear()} | `}
        <Link target='_blank' href='https://www.procure.cl/'>
          Procure
        </Link>
      </Typography>
    </Box>
  )
}

export default FooterContent
