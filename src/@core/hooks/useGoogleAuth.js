import { useState, useEffect } from 'react'
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material'

// Configuración de autenticación de Google para producción y desarrollo
const googleAuthConfigProduction = {
  CLIENT_ID: process.env.NEXT_PUBLIC_PROD_GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.NEXT_PUBLIC_PROD_GOOGLE_CLIENT_SECRET,
  REDIRECT_URI: 'https://www.prosite.cl/home' // URL de producción
}

const googleAuthConfigDevelopment = {
  CLIENT_ID: process.env.NEXT_PUBLIC_DEV_GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.NEXT_PUBLIC_DEV_GOOGLE_CLIENT_SECRET,
  REDIRECT_URI: 'http://localhost:3000/home' // URL de desarrollo
}

// Selecciona la configuración de autenticación según el hostname
let googleAuthConfig

if (typeof window !== 'undefined') {
  if (window.location.hostname === 'www.prosite.cl' || window.location.hostname === 'procureterrenoweb.vercel.app') {
    googleAuthConfig = googleAuthConfigProduction
  } else {
    googleAuthConfig = googleAuthConfigDevelopment
  }
} else {
  googleAuthConfig = googleAuthConfigDevelopment
}

const SCOPES = 'https://www.googleapis.com/auth/drive'

export const useGoogleAuth = () => {
  const [accessToken, setAccessToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params'))

    if (storedParams && storedParams.access_token) {
      // console.log('storedParams.access_token', storedParams.access_token)
      validateAccessToken(storedParams.access_token)
        .then(isValid => {
          // console.log('isValid', isValid)
          if (isValid) {
            setAccessToken(storedParams.access_token)
            setIsLoading(false)

            // Programar la re-autenticación antes de que expire el access_token
            const expiresIn = storedParams.expires_in
            scheduleTokenRefresh(expiresIn) // Automáticamente refresca el token antes de que expire
          } else {
            setIsDialogOpen(true) // Si el token no es válido, mostrar el diálogo
          }
        })
        .catch(() => {
          setIsDialogOpen(true) // Si el token no es válido, mostrar el diálogo
        })
    } else {
      parseQueryString() // Si no hay tokens, parsear la URL para obtenerlos
    }
  }, [])

  //expires_in: 3599

  const validateAccessToken = async token => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token)
      const data = await response.json()

      return data.expires_in > 0 // Comprueba si el token sigue siendo válido
    } catch (error) {
      return false
    }
  }

  const oauth2SignIn = () => {
    const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth'

    const params = {
      client_id: googleAuthConfig.CLIENT_ID,
      redirect_uri: googleAuthConfig.REDIRECT_URI,
      scope: SCOPES,
      state: 'try_sample_request',
      include_granted_scopes: 'true',
      response_type: 'token'
    }

    localStorage.removeItem('oauth2-test-params')

    const form = document.createElement('form')
    form.setAttribute('method', 'GET')
    form.setAttribute('action', oauth2Endpoint)

    for (const p in params) {
      const input = document.createElement('input')
      input.setAttribute('type', 'hidden')
      input.setAttribute('name', p)
      input.setAttribute('value', params[p])
      form.appendChild(input)
    }

    document.body.appendChild(form)
    form.submit()
    parseQueryString()
  }

  const refreshAccessToken = async refreshToken => {
    const params = new URLSearchParams()
    params.append('client_id', googleAuthConfig.CLIENT_ID)
    params.append('client_secret', googleAuthConfig.CLIENT_SECRET)
    params.append('refresh_token', refreshToken)
    params.append('grant_type', 'refresh_token')

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      if (!response.ok) {
        throw new Error('Failed to refresh access token')
      }

      const data = await response.json()
      const newAccessToken = data.access_token
      const expiresIn = data.expires_in

      const storedParams1 = JSON.parse(localStorage.getItem('oauth2-test-params'))
      storedParams1.access_token = newAccessToken
      storedParams1.expires_in = expiresIn

      localStorage.removeItem('oauth2-test-params')

      localStorage.setItem('oauth2-test-params', JSON.stringify(storedParams1))
      setAccessToken(newAccessToken)

      return expiresIn
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  // Programa el refresco del token antes de que expire
  const scheduleTokenRefresh = expiresIn => {
    // Refresca el token 5 minutos antes de que expire
    const refreshTime = (expiresIn - 300) * 1000 // 5 minutos en milisegundos
    setTimeout(() => {
      console.log('EJECUCIÓN DEL setTimeout en scheduleTokenRefresh')
      setIsDialogOpen(true) // Si el token no es válido, mostrar el diálogo
    }, refreshTime)
  }

  const parseQueryString = () => {
    const fragmentString = window.location.hash.substring(1)
    const params = {}
    const regex = /([^&=]+)=([^&]*)/g
    let match

    while ((match = regex.exec(fragmentString))) {
      params[decodeURIComponent(match[1])] = decodeURIComponent(match[2])
    }

    if (Object.keys(params).length > 0) {
      localStorage.setItem('oauth2-test-params', JSON.stringify(params))
      window.history.replaceState({}, document.title, window.location.pathname)
      if (params.state && params.state === 'try_sample_request') {
        setAccessToken(params.access_token)
        setRefreshToken(params.refresh_token)
        scheduleTokenRefresh(params.expires_in) // Programa el refresco automático
        window.location.href = '/home'
      }
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }

  const handleGoogleDriveAuthorization = async () => {
    const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params'))
    if (storedParams && storedParams['access_token']) {
      return storedParams['access_token']
    } else {
      oauth2SignIn()
    }
  }

  // Función para cerrar el diálogo
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
  }

  // Diálogo de reconexión
  const renderDialog = () => (
    <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
      <DialogTitle>Conexión expirada</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Tu conexión con Google Drive ha expirado. <br /> Haz clic en "Conectar" para volver a autenticarse.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            oauth2SignIn()
            handleCloseDialog()
          }}
          color='primary'
          autoFocus
        >
          Conectar
        </Button>
      </DialogActions>
    </Dialog>
  )

  return {
    accessToken,
    refreshToken,
    isLoading,
    error,
    oauth2SignIn,
    refreshAccessToken,
    handleGoogleDriveAuthorization,
    renderDialog // Devuelve el diálogo para que pueda ser utilizado en otros componentes
  }
}
