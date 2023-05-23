// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Import
import Alert from '@mui/material/Alert'

// ** Spinner Import
import Spinner from 'src/@core/components/spinner'

// ** Next Import
import { useRouter } from 'next/router'

import { useFirebase } from 'src/context/useFirebaseAuth'

const WindowWrapper = ({ children }) => {
  // ** State
  const [windowReadyFlag, setWindowReadyFlag] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const router = useRouter()
  const { authUser, loading } = useFirebase()

  useEffect(
    () => {
      if (typeof window !== 'undefined') {
        setWindowReadyFlag(true)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.route]
  )

  // ** Redirige al login si no hay user
  useEffect(() => {
    if (!authUser && !loading) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, loading, router.route]);

  // ** Permite mostrar contenido si existe user o si va a entrar (login o forgotpass)
  useEffect(() => {
    if (windowReadyFlag && !loading && (authUser || router.asPath === '/login/' || router.asPath === '/forgot-password/'  )) {
      setShowContent(true) // Actualiza el estado para mostrar el contenido
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowReadyFlag, authUser, loading, router.route])

  return (
    <>
      {showContent ? ( // Renderiza condicionalmente el contenido
        <>
          <Alert severity="success">Navegando como: {authUser ? authUser.role : 'No definido'}</Alert>
          {children}
        </>
      ) : (
        <Spinner />
      )}
    </>
  )
}

export default WindowWrapper
