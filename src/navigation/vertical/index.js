const navigation = () => {
  return [
    {
      title: 'Home',
      path: '/home',
      icon: 'mdi:home-outline',
    },
    {
      title: 'Mapa',
      path: '/mapa',
      icon: 'mdi:map-outline',
    },
    {
      title: 'Calendario',
      path: '/calendario',
      icon: 'mdi:calendar-month-outline',
    },
    {
      path: '/solicitudes',
      title: 'Solicitudes',
      icon: 'mdi:file-document-multiple-outline',
    },
    {
      title: 'Nueva Solicitud',
      path: '/nueva-solicitud',
      icon: 'mdi:email-outline',
    },
  ]
}

export default navigation
