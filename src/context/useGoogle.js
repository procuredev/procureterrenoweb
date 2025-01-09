import { createContext, useContext, useEffect, useState } from 'react'

// ** Crea contexto
export const GoogleContext = createContext()

// ** Importamos el hook `useGoogleAuth`
import { useGoogleAuth } from 'src/@core/hooks/useGoogleAuth'

import { useFirebase } from 'src/context/useFirebase'

const GoogleContextProvider = props => {

  // ** Llamamos al hook `useGoogleAuth` para manejar la autenticación de Google
  const { authUser } = useFirebase()

  // ** Llamamos al hook `useGoogleAuth` para manejar la autenticación de Google
  const { handleGoogleDriveAuthorization } = useGoogleAuth()

  console.log(authUser)

  // Autorización de Google Drive
  if (authUser && [1, 5, 6, 7, 8, 9].includes(authUser.role)) {
    try {
      handleGoogleDriveAuthorization()
    } catch (error) {
      console.error('Error al conectarse con Google:', error)
    }
  }

  const value = {
    handleGoogleDriveAuthorization
  }

  return <GoogleContext.Provider value={value}>{props.children}</GoogleContext.Provider>
}

export default GoogleContextProvider

// ** Custom hook para acceder a estas funciones
export const useGoogle = () => useContext(GoogleContext)
