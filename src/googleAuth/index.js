const CLIENT_ID = process.env.NEXT_PUBLIC_DEV_GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.NEXT_PUBLIC_DEV_GOOGLE_CLIENT_SECRET
const SCOPES = 'https://www.googleapis.com/auth/drive'
const REDIRECT_URI = 'http://localhost:3000/home'

// Función para iniciar sesión con OAuth 2.0 de Google
export const oauth2SignIn = () => {
  const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth'

  const params = {
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state: 'try_sample_request',
    include_granted_scopes: 'true',
    response_type: 'token'
  }

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

// Función para refrescar el token de acceso
export const refreshAccessToken = async refreshToken => {
  const params = new URLSearchParams()
  params.append('client_id', CLIENT_ID)
  params.append('client_secret', CLIENT_SECRET)
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

    const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params'))
    storedParams['access_token'] = newAccessToken

    // Borrar el valor anterior de localStorage
    localStorage.removeItem('oauth2-test-params')

    localStorage.setItem('oauth2-test-params', JSON.stringify(storedParams))

    return newAccessToken
  } catch (error) {
    console.error('Error refreshing access token:', error)
    throw error
  }
}

// Función para analizar los parámetros de la URL

export const parseQueryString = () => {
  const fragmentString = window.location.hash.substring(1)
  const params = {}
  const regex = /([^&=]+)=([^&]*)/g
  let match

  while ((match = regex.exec(fragmentString))) {
    params[decodeURIComponent(match[1])] = decodeURIComponent(match[2])
  }

  if (Object.keys(params).length > 0) {
    localStorage.setItem('oauth2-test-params', JSON.stringify(params))
    // Usa window.history.replaceState para limpiar la URL sin recargar la página
    window.history.replaceState({}, document.title, window.location.pathname)
    // Redirige al usuario a la página de inicio o a la página de documentos después de almacenar el token
    if (params['state'] && params['state'] === 'try_sample_request') {
      window.location.href = '/home'
      console.log('Token almacenado y URL limpiada sin redirección.')
    }
  }
}

// Función para manejar la autorización inicial de Google Drive
export const handleGoogleDriveAuthorization = async () => {
  const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params'))
  if (storedParams && storedParams['access_token']) {
    return storedParams['access_token']
  } else {
    oauth2SignIn()
  }
}

export const updateUserToken = async token => {
  try {
    const response = await fetch('/api/updateUserToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    })

    if (!response.ok) {
      throw new Error('Failed to update user token')
    }
  } catch (error) {
    console.error('Error updating user token:', error)
  }
}
