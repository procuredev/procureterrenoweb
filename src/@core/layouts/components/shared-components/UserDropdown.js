// ** React Imports
import { useState, Fragment, useEffect } from 'react'

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
import { useFirebase } from 'src/context/useFirebase'

const UserDropdown = props => {
  // ** Props
  const { settings } = props

  // ** States
  const [anchorEl, setAnchorEl] = useState(null)
  const [userName, setUserName] = useState('')

  // ** Hooks
  const router = useRouter()
  const { auth, authUser, signOut, domainRoles } = useFirebase()

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
          handleDropdownClose('/login')
        }, 500) // Retraso de 500 milisegundos antes de redireccionar
      })
      .catch(error => {
        console.log(error)
      })
  }

  // Se inicializan las variables que serán usadas en el menú desplegable
  let userEmail // variable que almacena el e-mail del usuario conectado
  let userRole // variable que almacena el rol del usuario conectado

  // Si no hay un usuario conectado
  if (!authUser) {
    // Las variables serán definidas como 'not logged' para evitar problemas de renderizado
    userEmail = 'not logged'
    userRole = 'not Logged'
  } else {
    // Pero si hay un usuario conectado, se definirán las variables

    userEmail = authUser.email

    if (domainRoles){
      const role = domainRoles[authUser.role]
      if (role){
        userRole = role.name
      }
    }
  }

  useEffect(() => {
    if (authUser && authUser.displayName === 'No definido') {
      setUserName('Por definir')
    } else if (authUser && !authUser.displayName) {
      setUserName('Por definir')
    } else if (authUser && authUser.displayName && authUser.displayName !== '') {
      setUserName(authUser.displayName)
    } else {
      setUserName('Por definir')
    }
  }, [authUser])

  const renderUserAvatar = () => {
    let avatarContent
    let name
    if (!authUser || !authUser.displayName) {
      name = 'Por definir'
    }

    if (authUser && authUser.urlFoto !== '' && authUser.urlFoto !== 'No definido') {
      avatarContent = (
        <Avatar
          src={authUser.urlFoto}
          alt={authUser.displayName}
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            objectFit: 'contain',
            fontSize: '15px' // Tamaño de la fuente ajustado
          }}
        />
      )
    } else {
      // No hay `photo` proporcionada, usar avatar con iniciales del nombre
      const currentName = authUser ? authUser.displayName : 'Por definir'

      const initials = currentName
        .toUpperCase()
        .split(' ')
        .map(word => word.charAt(0))
        .join('')

      avatarContent = (
        <Avatar
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            objectFit: 'contain',
            bgcolor: 'primary.main',
            fontSize: '15px' // Tamaño de la fuente ajustado
          }}
        >
          {initials}
        </Avatar>
      )
    }

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>{avatarContent}</Box>
    )
  }

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
        {renderUserAvatar()}
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
