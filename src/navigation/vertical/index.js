const navigation = () => {
  return [
    {
      title: 'Home',
      path: '/home',
      icon: 'mdi:home-outline',
    },
    {
      title: 'Nueva Solicitud',
      path: '/nueva-solicitud',
      icon: 'mdi:email-outline',
    },
    {
      path: '/acl',
      title: 'Access Control',
      icon: 'mdi:shield-outline',
    }
  ]
}

export default navigation
