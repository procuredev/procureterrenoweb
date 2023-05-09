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

  useEffect(() => {
    if (!authUser && !loading) {
      router.push('/login');
    }
  }, [authUser, loading]);

  if (windowReadyFlag) {
    return <>
    <Alert severity="success">Navegando como: {authUser ? authUser.role : 'No definido'}</Alert>
    {children}</>
  } else {
    return null
  }
}

export default WindowWrapper
