// ** React Imports
import { useState, Fragment } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Context
import { useFirebase } from 'src/context/useFirebaseAuth'

// ** Styled Components
const BadgeContentSpan = styled('span')(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
}))

const UserDropdown = props => {
  // ** Props
  const { settings } = props

  // ** States
  const [anchorEl, setAnchorEl] = useState(null)

  // ** Hooks
  const router = useRouter()
  const { auth, authUser, signOut } = useFirebase()

  // ** Vars
  const { direction } = settings

  const handleDropdownOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleDropdownClose = url => {
    if (url) {
      router.push(url)
    }
    setAnchorEl(null)
  }

  const styles = {
    py: 2,
    px: 4,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    color: 'text.primary',
    textDecoration: 'none',
    '& svg': {
      mr: 2,
      fontSize: '1.375rem',
      color: 'text.primary'
    }
  }

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setTimeout(() => {
          handleDropdownClose('/login');
        }, 500); // Retraso de 500 milisegundos antes de redireccionar
      })
      .catch(error => {
        console.log(error);
      });
  };

  // Se inicializan las variables que serán usadas en el menú desplegable
  let userName // variable que almacena el nombre del usuario conectado
  let userEmail // variable que almacena el e-mail del usuario conectado
  let userRole // variable que almacena el rol del usuario conectado

  // Si no hay un usuario conectado
  if (!authUser){
    // Las variables serán definidas como 'not logged' para evitar problemas de renderizado
    userName = 'not logged'
    userEmail = 'not logged'
    userRole = 'not Logged'
  } else {
    // Pero si hay un usuario conectado, se definirán las variables
    userName = authUser.displayName
    userEmail = authUser.email

    // Condicional que renderizará en rol como un string según el rol del usuario conectado
    if (authUser.role == 1) {
      userRole = 'Admin'
    } else if (authUser.role == 2){
      userRole = 'Solicitante'
    } else if (authUser.role == 3){
      userRole = 'Contract Operator'
    } else if (authUser.role == 4){
      userRole = 'Contract Owner'
    } else if (authUser.role == 5){
      userRole = 'Planificador'
    } else if (authUser.role == 6){
      userRole = 'Administrador de Contrato'
    } else if (authUser.role == 7){
      userRole = 'Supervisor'
    } else if (authUser.role == 8){
      userRole = 'Proyectista'
    } else if (authUser.role == 9){
      userRole = 'Control Documental'
    } else if (authUser.role == 10){
      userRole = 'Gerencia'
    }
  }

  // Se inicializa variable que almacenará el ícono con la foto del usuario conectado
  let urlFoto

  // Si hay un usuario conectado
  if(authUser) {
    // Y si este usuario tiene una foto disponible en la base de datos
    if (authUser.urlFoto) {
      // Se visualizará esa foto
      urlFoto = authUser.urlFoto
    } else {
      // Si no tiene una foto disponible en la base de datos, se visualizará un ícono estándar
      urlFoto = 'https://t4.ftcdn.net/jpg/04/08/24/43/360_F_408244382_Ex6k7k8XYzTbiXLNJgIL8gssebpLLBZQ.jpg'
    }
  }



    /* authUser === null
      ? 'https://t4.ftcdn.net/jpg/04/08/24/43/360_F_408244382_Ex6k7k8XYzTbiXLNJgIL8gssebpLLBZQ.jpg'
      : authUser.urlFoto */

  return (
    <Fragment>
      <Badge
        overlap='circular'
        onClick={handleDropdownOpen}
        sx={{ ml: 2, cursor: 'pointer' }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
      >
        <Avatar alt='Profile picture' onClick={handleDropdownOpen} sx={{ width: 40, height: 40 }} src={urlFoto} />
      </Badge>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleDropdownClose()}
        sx={{ '& .MuiMenu-paper': { mt: 4 } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: direction === 'ltr' ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: direction === 'ltr' ? 'right' : 'left' }}
      >
        <Box sx={{ pt: 2, pb: 3, px: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', ml: 3, alignItems: 'flex-start', flexDirection: 'column' }}>
              <Typography sx={{ fontWeight: 600 }}>{userName}</Typography>
              <Typography variant='body2' sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                {userEmail}
              </Typography>
              <Typography variant='body2' sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                {userRole}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ mt: '0 !important' }} />
        <MenuItem sx={{ p: 0 }} onClick={() => handleDropdownClose('/user-profile')}>
          <Box sx={styles}>
            <Icon icon='mdi:account-outline' />
            Mi Perfil
          </Box>
        </MenuItem>
        <MenuItem
          onClick={() => handleLogout()}
          sx={{ py: 2, '& svg': { mr: 2, fontSize: '1.375rem', color: 'text.primary' } }}
        >
          <Icon icon='mdi:logout-variant' />
          Salir
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

export default UserDropdown
