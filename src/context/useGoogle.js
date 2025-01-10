import { createContext, useContext, useEffect, useState } from 'react'

// ** Crea contexto
export const GoogleContext = createContext()

// ** Importamos el hook `useGoogleAuth`
import {
  handleGoogleDriveAuthorization,
  refreshAccessToken
} from 'src/@core/hooks/useGoogleAuth'

import { useFirebase } from 'src/context/useFirebase'

const GoogleContextProvider = props => {

  const [googleTokens, setGoogleTokens] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const params = localStorage.getItem('oauth2-params')

      return params ? JSON.parse(params) : null
    } else {
      return null
    }
  })

  // ** Llamamos al hook `useGoogleAuth` para manejar la autenticación de Google
  const { authUser } = useFirebase()

  console.log(authUser)

  // Autorización de Google Drive
  if (authUser && authUser.company === "Procure") {
    try {
      handleGoogleDriveAuthorization()
    } catch (error) {
      console.error('Error al conectarse con Google:', error)
    }
  }

  useEffect(() => {
    console.log(googleTokens)
  },[googleTokens])

  if (authUser) {
    setInterval(refreshAccessToken, 1 * 60 * 1000)
  }

  const value = {
    handleGoogleDriveAuthorization
  }

  return <GoogleContext.Provider value={value}>{props.children}</GoogleContext.Provider>
}

export default GoogleContextProvider

// ** Custom hook para acceder a estas funciones
export const useGoogle = () => useContext(GoogleContext)
