// ** React Imports
import { useEffect, useState } from 'react'

// ** Next Import
import { useRouter } from 'next/router'

// ** Hooks Import
import { useFirebase } from 'src/context/useFirebase'
import { Dialog, DialogContent, DialogTitle, Typography } from '@mui/material'

const AuthGuard = props => {
  const { children, fallback } = props
  const { authUser, loading, deleteCurrentUser, isCreatingProfile } = useFirebase()
  const [seconds, setSeconds] = useState(5)
  
  const router = useRouter()
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(seconds => seconds - 1)
    }, 1000)

    return () => clearInterval(timer) // This will clear the interval when the component unmounts
  }, [])

  useEffect(
    () => {
      if (!router.isReady) {
        return
      }

      // constante que almacena la ruta la ruta a cual se pretente ingresar
      const thisRoute = router.asPath

      // Si hay un usuario logueado
      if (authUser) {
        if (authUser?.completedProfile !== undefined && authUser.completedProfile === false && !isCreatingProfile) {
          router.replace('/completar-perfil')
        } else {
          // Y si este usuario intenta ingresar al login, forgot-password o '/'
          if (thisRoute == '/login/' || thisRoute == '/forgot-password/' || thisRoute == '/') {
            // Será redirigido al home
            router.replace('/home')
          }
        }
      } else if (!authUser && !thisRoute.includes('documentos')) {
        // Si no hay alguien conectado, siempre será redirigido al login
        router.replace('/login')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.route, authUser, isCreatingProfile]
  )

  if ((loading || !authUser) && router.asPath !== '/nuevo-usuario/') {
    return fallback
  }
  if (!authUser.registered) {
    setTimeout(() => {
      deleteCurrentUser()
    }, 5000)

    return (
      <>
        <Dialog open={true}>
          <DialogTitle>Usuario no registrado</DialogTitle>
          <DialogContent sx={{ mb: 3 }}>
            No estás registrado en Prosite. Contacta al administrador de la plataforma para crear tu cuenta. Serás
            redirigido al login en {seconds} segundos.
          </DialogContent>
        </Dialog>
        {children}
      </>
    )
  }

  return <>{children}</>
}

export default AuthGuard
