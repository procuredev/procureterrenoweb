import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useEffect, useState } from 'react'
import googleAuthConfig from '../../configs/googleDrive'

/**
 * Valida si el token de acceso es válido.
 * @param {string} token - Token de acceso para validar.
 * @returns {Promise<boolean>} - `true` si el token es válido, `false` en caso contrario.
 */
const tokenExpiresIn = async token => {
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`)
    const data = await response.json()

    return data.expires_in
  } catch {
    return false
  }
}

/**
 * Inicia el proceso de autenticación de OAuth2.
 */
const oauth2SignIn = async () => {

  // Define la URL del endpoint de autenticación de Google OAuth 2.0
  const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth'

  // Configura los parámetros necesarios para la autenticación
  const params = {
    redirect_uri: googleAuthConfig.REDIRECT_URI, // URI de redirección después de autenticarse
    prompt: 'consent',
    response_type: 'code', // Tipo de respuesta esperado (token de acceso)
    client_id: googleAuthConfig.CLIENT_ID, // ID del cliente de la aplicación
    scope: 'https://www.googleapis.com/auth/drive', // Alcances solicitados (acceso a Google Drive)
    // state: 'try_sample_request', // Estado personalizado para el seguimiento
    // include_granted_scopes: 'true', // Incluir permisos previamente otorgados
    access_type: 'offline'
  }

  // Crea dinámicamente un formulario HTML para redirigir al usuario al endpoint de autenticación
  const form = document.createElement('form')
  form.setAttribute('method', 'GET') // Método de envío del formulario
  form.setAttribute('action', oauth2Endpoint) // URL de destino del formulario

  // Agrega los parámetros como campos ocultos en el formulario
  for (const key in params) {
    const input = document.createElement('input')
    input.type = 'hidden' // Campo oculto
    input.name = key // Nombre del parámetro
    input.value = params[key] // Valor del parámetro
    form.appendChild(input) // Añade el campo al formulario
  }

  // Añade el formulario al cuerpo del documento y lo envía
  document.body.appendChild(form)
  form.submit() // Redirige al usuario al endpoint de autenticación
}

/**
 * Intercambia el código de autorización por tokens.
 */
const getTokens = async (code) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code: code,
      client_id: googleAuthConfig.CLIENT_ID,
      client_secret: googleAuthConfig.CLIENT_SECRET,
      redirect_uri: googleAuthConfig.REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  const data = await response.json()

  // Almacena los tokens en localStorage
  if (data.access_token && data.refresh_token) {
    const tokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      timestamp: new Date().toISOString(),
    }

    localStorage.setItem('oauth2-params', JSON.stringify(tokens))
    console.log('Tokens almacenados:', tokens)

    // Reemplaza el estado de la URL para eliminar el fragmento hash
    window.history.replaceState({}, document.title, window.location.pathname)
    window.location.href = '/home' // Redirige al usuario a la página de inicio
  }
}

/**
 * Refresca el token de acceso utilizando el token de refresco.
 * @param {string} refreshToken - Token de refresco.
 * @returns {Promise<number>} - Tiempo de expiración en segundos del nuevo token.
 */
const refreshAccessToken = async refreshToken => {

  if (tokenExpiresIn() > 300) {
    return
  } else {
    // Configura los parámetros necesarios para refrescar el token de acceso
    const params = new URLSearchParams()
    params.append('client_id', googleAuthConfig.CLIENT_ID) // ID del cliente
    params.append('client_secret', googleAuthConfig.CLIENT_SECRET) // Secreto del cliente
    params.append('refresh_token', refreshToken) // Token de actualización
    params.append('grant_type', 'refresh_token') // Tipo de concesión (token de actualización)

    try {
      // Realiza una solicitud POST al endpoint para refrescar el token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST', // Método POST
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // Encabezados necesarios
        body: params.toString() // Cuerpo con los parámetros en formato URL-encoded
      })

      // Lanza un error si la respuesta no es exitosa
      if (!response.ok) throw new Error('Failed to refresh access token')

      // Analiza la respuesta JSON para obtener el nuevo token y el tiempo de expiración
      const data = await response.json()
      const newAccessToken = data.access_token // Nuevo token de acceso

      // Recupera los parámetros almacenados en localStorage, o un objeto vacío si no existen
      const storedParams = JSON.parse(localStorage.getItem('oauth2-params')) || {}
      storedParams.access_token = newAccessToken // Actualiza el token de acceso

      // Guarda los parámetros actualizados en localStorage
      localStorage.setItem('oauth2-params', JSON.stringify(storedParams))

    } catch (error) {
      throw error // Relanza el error para manejarlo externamente
    }
  }
}

/**
 * Maneja la autorización de Google Drive.
 * @returns {Promise<string|void>} - Token de acceso o inicia el flujo de autenticación.
 */
const handleGoogleDriveAuthorization = async () => {
  const storedParams = JSON.parse(localStorage.getItem('oauth2-params'))
  if (storedParams) {
    return
  } else {
    try {

      // Se loguea con oauth2
      await oauth2SignIn()

      console.log("se ejecuta oauth2")

      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')

      await getTokens(code)


    } catch (error) {
      throw new Error (error)
    }
  }
}

export {
  oauth2SignIn,
  tokenExpiresIn,
  refreshAccessToken,
  handleGoogleDriveAuthorization
}
