// ** React Imports
import { useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Hooks Import
import { useFirebase } from 'src/context/useFirebase'

const GuestGuard = props => {
  const { children, fallback } = props
  const { authUser, loading } = useFirebase()
  const router = useRouter()
  useEffect(() => {
    if (!router.isReady) {
      return
    }

    // constante que almacena la ruta la ruta a cual se pretente ingresar
    const thisRoute = router.asPath

    // Si no hay alguien logueado
    if (!authUser) {
      // Y si la ruta a la cual se pretende ingresar es login o forgot password
      if (thisRoute == '/login/' || thisRoute == '/forgot-password/') {
        // Se permite el ingreso a la ruta
        router.replace(thisRoute)
      } else {
        // Si la ruta es otra distinta a login o forgot password, será redirigido al login
        router.replace('/login')
      }
    } else if (authUser) {
      // Si hay alguien logueado
      // Y si la ruta a la cual se pretende ingresar es login, forgot password o '/'
      if (thisRoute == '/login/' || thisRoute == '/forgot-password/' || thisRoute == '/') {
        // El usuario será redirigido al home
        router.replace('/home')
      } else {
        // Si la ruta es otra distinta a login, forgot-passsword o '/', se permitirá el acceso a esa página
        router.replace(thisRoute)
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.route, authUser])

  if (loading || (!loading && authUser)) {
    return fallback
  }

  return <>{children}</>
}

export default GuestGuard
