// ** React Imports
import { useEffect } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Hooks Import
import { useFirebase } from 'src/context/useFirebaseAuth'

const AuthGuard = props => {
  const { children, fallback } = props
  const { authUser, loading } = useFirebase()
  const router = useRouter()
  useEffect(
    () => {
      if (!router.isReady) {
        return
      }

      // constante que almacena la ruta la ruta a cual se pretente ingresar
      const thisRoute = router.asPath

      // Si hay un usuario logueado
      if (authUser){
        // Y si este usuario intenta ingresar al login, forgot-password o '/'
        if (thisRoute == '/login/' || thisRoute == '/forgot-password/' || thisRoute == '/') {
          // Será redirigido al home
          router.replace('/home')
        }
      } else if (!authUser) {
        // Si no hay alguien conectado, siempre será redirigido al login
        router.replace('/login')
      }

    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.route, authUser]
  )

  if (loading || !authUser) {
    return fallback
  }

  return <>{children}</>
}

export default AuthGuard
