import { useContext } from 'react'

// ** Hooks Import
import { FirebaseContext } from 'src/context/useFirebase'

const Navigation = () => {
  // ** Hooks
  const firebase = useContext(FirebaseContext)
  const role = firebase.authUser ? firebase.authUser.role : 'none'

  // Array que contiene las características del menú navegador
  const menuItems = [
    {
      title: 'Home',
      path: '/home',
      icon: 'mdi:home-outline',
      subject: 'home',
      authorizedRoles: [1, 2, 3, 4, 5, 6, 7, 8, 10]
    },
    {
      title: 'Nueva Solicitud',
      path: '/nueva-solicitud',
      icon: 'mdi:email-outline',
      subject: 'nueva-solicitud',
      authorizedRoles: [1, 2, 3, 7]
    },
    {
      path: '/solicitudes',
      title: 'Solicitudes',
      icon: 'mdi:file-document-multiple-outline',
      subject: 'solicitudes',
      authorizedRoles: [1, 2, 3, 4, 5, 6, 7]
    },
    {
      title: 'Calendario',
      path: '/calendario',
      icon: 'mdi:calendar-month-outline',
      subject: 'calendario',
      authorizedRoles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    {
      title: 'Supervisor',
      icon: 'mdi:account-hard-hat',
      children: [
        {
          path: '/levantamientos',
          title: 'Levantamientos',
          subject: 'levantamientos'
        }
      ],

      authorizedRoles: [1, 7]
    },
    {
      title: 'Documentos',
      path: '/documentos',
      icon: 'mdi:file-document-outline',
      subject: 'documentos',
      authorizedRoles: [1]
    },
    {
      title: 'Mapa',
      path: '/mapa',
      icon: 'mdi:map-outline',
      subject: 'mapa',
      authorizedRoles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    {
      title: 'Nuestro Equipo',
      path: '/nuestro-equipo',
      icon: 'mdi:account-group',
      subject: 'nuestro-equipo',
      authorizedRoles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    {
      title: 'Administración',
      icon: 'mdi:shield-account-outline',
      children: [
        {
          title: 'Nuevo Usuario',
          path: '/nuevo-usuario',
          subject: 'nuevo-usuario'
        }
      ],
      authorizedRoles: [1]
    }
  ]

  // Función para filtrar los enlaces del menú según el rol del usuario
  const filteredMenuItems = menuItems.filter(item => {
    // Si los roles autorizados incluyen el rol del usuario actual, se mostrará para ese rol
    return item.authorizedRoles.includes(role)
  })

  return filteredMenuItems
}

export default Navigation
