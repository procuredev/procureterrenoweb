/**
 * Hook para gestionar la autenticación de Google OAuth2.
 * Incluye lógica para manejar tokens de acceso, refrescar tokens y reconectar en caso de expiración.
 */
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useEffect, useState } from 'react'
import googleAuthConfig from '../../configs/googleDrive'

/**
 * Hook para gestionar la autenticación de Google OAuth2.
 * @returns {Object} Funciones y estados relacionados con la autenticación.
 */
export const useGoogleAuth = () => {
  const [accessToken, setAccessToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)

  /**
   * Este efecto se ejecuta una vez al montar el componente.
   * Su propósito es gestionar el proceso de autenticación y validación del token de acceso almacenado.
   */
  useEffect(() => {

    // Recupera los parámetros de autenticación almacenados previamente en localStorage.
    const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params'))

    // Si hay un token de acceso almacenado en los parámetros.
    if (storedParams?.access_token) {

      // Llama a la función `validateAccessToken` para comprobar si el token es válido.
      validateAccessToken(storedParams.access_token)
        .then(isValid => {
          // Establece el estado de validez del token
          setIsValidToken(isValid)

          // Si el token es válido:
          if (isValid) {

            // Actualiza el estado `accessToken` con el token almacenado.
            setAccessToken(storedParams.access_token)

            // Cambia `isLoading` a `false` para indicar que el proceso de autenticación ha finalizado.
            setIsLoading(false)

            // Programa un refresco automático del token utilizando la función `scheduleTokenRefresh`.
            scheduleTokenRefresh(storedParams.expires_in)

            // Si el token no es válido:
          } else {

            // Abre un Dialog para informar al usuario de que debe volver a autenticarse.
            setIsDialogOpen(true)

          }
        })
        .catch(() => {
          // En caso de error durante la validación del token abre el diálogo para informar al usuario.
          setIsDialogOpen(true)
        })

      // Si no hay un token almacenado:
    } else {

      // Llama a la función `parseQueryString` para intentar extraer los parámetros de autenticación de la URL actual.
      parseQueryString()

    }
  }, [])

  /**
   * Valida si el token de acceso es válido.
   * @param {string} token - Token de acceso para validar.
   * @returns {Promise<boolean>} - `true` si el token es válido, `false` en caso contrario.
   */
  const validateAccessToken = async token => {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`)
      const data = await response.json()
      return data.expires_in > 0
    } catch {
      return false
    }
  }

  /**
   * Inicia el proceso de autenticación de OAuth2.
   */
  const oauth2SignIn = () => {

    // Define la URL del endpoint de autenticación de Google OAuth 2.0
    const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth'

    // Configura los parámetros necesarios para la autenticación
    const params = {
      client_id: googleAuthConfig.CLIENT_ID, // ID del cliente de la aplicación
      redirect_uri: googleAuthConfig.REDIRECT_URI, // URI de redirección después de autenticarse
      scope: 'https://www.googleapis.com/auth/drive', // Alcances solicitados (acceso a Google Drive)
      state: 'try_sample_request', // Estado personalizado para el seguimiento
      include_granted_scopes: 'true', // Incluir permisos previamente otorgados
      response_type: 'token' // Tipo de respuesta esperado (token de acceso)
    }

    // Limpia cualquier parámetro OAuth 2.0 previamente almacenado
    localStorage.removeItem('oauth2-test-params')

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
   * Refresca el token de acceso utilizando el token de refresco.
   * @param {string} refreshToken - Token de refresco.
   * @returns {Promise<number>} - Tiempo de expiración en segundos del nuevo token.
   */
  const refreshAccessToken = async refreshToken => {

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
      const expiresIn = data.expires_in // Tiempo de expiración en segundos

      // Recupera los parámetros almacenados en localStorage, o un objeto vacío si no existen
      const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params')) || {}
      storedParams.access_token = newAccessToken // Actualiza el token de acceso
      storedParams.expires_in = expiresIn // Actualiza el tiempo de expiración

      // Guarda los parámetros actualizados en localStorage
      localStorage.setItem('oauth2-test-params', JSON.stringify(storedParams))

      // Actualiza el estado con el nuevo token de acceso
      setAccessToken(newAccessToken)

      // Devuelve el tiempo de expiración
      return expiresIn
    } catch (error) {
      // Maneja errores y actualiza el estado de error
      setError(error.message)
      throw error // Relanza el error para manejarlo externamente
    }
  }

  /**
   * Programa el refresco del token antes de que expire.
   * @param {number} expiresIn - Tiempo en segundos antes de que expire el token.
   */
  const scheduleTokenRefresh = expiresIn => {
    const refreshTime = (expiresIn - 300) * 1000 // 5 minutos antes de expirar
    setTimeout(() => setIsDialogOpen(true), refreshTime)
  }

  /**
   * Parsea los parámetros del fragmento de URL y los almacena en localStorage.
   */
  const parseQueryString = () => {

    // Obtiene el fragmento de la URL (hash) excluyendo el símbolo '#'
    const fragmentString = window.location.hash.substring(1)

    // Inicializa un objeto para almacenar los parámetros
    const params = {}

    // Expresión regular para extraer pares clave-valor del fragmento
    const regex = /([^&=]+)=([^&]*)/g
    let match

    // Itera sobre los pares clave-valor encontrados en el fragmento
    while ((match = regex.exec(fragmentString))) {
      // Decodifica y almacena cada clave-valor en el objeto `params`
      params[decodeURIComponent(match[1])] = decodeURIComponent(match[2])
    }

    // Si se encontraron parámetros, los guarda en localStorage
    if (Object.keys(params).length > 0) {
      localStorage.setItem('oauth2-test-params', JSON.stringify(params))

      // Reemplaza el estado de la URL para eliminar el fragmento hash
      window.history.replaceState({}, document.title, window.location.pathname)

      // Si el parámetro `state` tiene el valor esperado, realiza acciones específicas
      if (params.state === 'try_sample_request') {
        setAccessToken(params.access_token) // Establece el token de acceso
        setRefreshToken(params.refresh_token) // Establece el token de actualización
        scheduleTokenRefresh(params.expires_in) // Programa la actualización del token
        window.location.href = '/home' // Redirige al usuario a la página de inicio
      }
    }

    // Finaliza la carga al completar la lógica
    setIsLoading(false)
  }

  /**
   * Maneja la autorización de Google Drive.
   * @returns {Promise<string|void>} - Token de acceso o inicia el flujo de autenticación.
   */
  const handleGoogleDriveAuthorization = async () => {
    const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params'))
    if (storedParams?.access_token) {
      return storedParams.access_token
    } else {
      oauth2SignIn()
    }
  };

  /**
   * Cierra el diálogo de reconexión.
   */
  const handleCloseDialog = () => setIsDialogOpen(false)

  /**
   * Renderiza el diálogo de reconexión.
   * @returns {JSX.Element} - Componente Dialog.
   */
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
          color="primary"
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
    renderDialog,
    isValidToken,
    setIsDialogOpen
  }
}
