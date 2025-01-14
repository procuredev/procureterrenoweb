import { createContext, useContext, useEffect, useState, useRef } from 'react'

// ** Crea contexto
export const GoogleContext = createContext()

// ** Importamos el hook `useGoogleAuth`
import {
  signInToGoogle,
  refreshAccessTokenIfExpired
} from 'src/context/google-drive-functions/useGoogleAuth'

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

  const tokensValidity = useRef(null) // Referencia para manejar la validez de los Tokens de Google.
  const { authUser } = useFirebase() // Hook para obtener el usuario autenticado

  // Efecto que manejar la autenticación/refresco de las credenciales de Google.
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        // ** Si existe un usuario conectado, maneja la conexión a Google.
        if (authUser && authUser.company === "Procure") {
          if (!googleTokens) {
            // Inicia el proceso de autenticación con Google
            await signInToGoogle()
          } else {
            // Si existen los tokens, revisa su validez periódicamente
            tokensValidity.current = setInterval(async () => {
              await refreshAccessTokenIfExpired(googleTokens)
            }, 1 * 60 * 1000) // Cada 1 minuto
          }
        } else {
          // ** Limpia el intervalo si el usuario no está conectado
          if (tokensValidity.current) {
            clearInterval(tokensValidity.current)
            tokensValidity.current = null
          }
        }
      } catch (error) {
        console.error('Error durante la autenticación con Google:', error)
      }
    }

    // Se ejecuta la función checkGoogleConnectión luego de 1 segundo de montado el componente.
    // Se deja 1 segundo para evitar inconsistensión de usuario desconectado.
    const timeout = setTimeout(checkGoogleConnection, 1000)

    // Limpieza para evitar efectos secundarios.
    return () => {
      clearTimeout(timeout)
      if (tokensValidity.current) {
        clearInterval(tokensValidity.current)
        tokensValidity.current = null
      }
    }
  }, [authUser, googleTokens])

  useEffect(() => {
    console.log('AuthUser:', authUser)
  }, [authUser])

  useEffect(() => {
    console.log('Google Tokens:', googleTokens)
  }, [googleTokens])

  const value = {
    signInToGoogle
  }

  return <GoogleContext.Provider value={value}>{props.children}</GoogleContext.Provider>
}

export default GoogleContextProvider

// ** Custom hook para acceder al contexto
export const useGoogle = () => useContext(GoogleContext)
