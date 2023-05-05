// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Import
import Alert from '@mui/material/Alert'

// ** Next Import
import { useRouter } from 'next/router'

import { useFirebase } from 'src/context/useFirebaseAuth'

const WindowWrapper = ({ children }) => {
  // ** State
  const [windowReadyFlag, setWindowReadyFlag] = useState(false)
  const router = useRouter()
  const { authUser } = useFirebase()

  useEffect(
    () => {
      if (typeof window !== 'undefined') {
        setWindowReadyFlag(true)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router.route]
  )

  useEffect(() => {
    if (!authUser) {
      router.push('/login');
    }
  }, [authUser]);

  console.log(children)

  if (windowReadyFlag) {
    return <>
    <Alert severity="success">Navegando como: {authUser ? authUser.role : 'Usuario no autenticado'}</Alert>
    {children}</>
  } else {
    return null
  }
}

export default WindowWrapper
