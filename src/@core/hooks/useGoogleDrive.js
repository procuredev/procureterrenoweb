import { useEffect, useState } from 'react';
import googleAuthConfig from '../../configs/googleDrive'; // Configuración de Google Drive, como IDs de carpeta
import { useGoogleAuth } from './useGoogleAuth'; // Hook personalizado para manejar la autenticación de Google

/**
 * Hook personalizado para interactuar con Google Drive.
 * Proporciona funcionalidad para listar y subir archivos, y manejar el estado de autenticación.
 */
export const useGoogleDrive = () => {
  // Estados y funciones provenientes del hook de autenticación
  const {
    accessToken, // Token de acceso actual
    refreshAccessToken, // Función para refrescar el token de acceso
    isLoading: authLoading, // Estado de carga relacionado con la autenticación
    error: authError, // Error relacionado con la autenticación
    oauth2SignIn // Función para iniciar sesión con OAuth 2.0
  } = useGoogleAuth()

  // Estado local para gestionar la funcionalidad de Google Drive
  const [files, setFiles] = useState([]) // Lista de archivos actuales
  const [nextPageToken, setNextPageToken] = useState(null) // Token para la página siguiente
  const [prevPageTokens, setPrevPageTokens] = useState([]) // Pila de tokens para páginas anteriores
  const [currentPage, setCurrentPage] = useState(1) // Número de la página actual
  const [isLoading, setIsLoading] = useState(false) // Estado de carga general
  const [error, setError] = useState(null) // Mensaje de error
  const [nestedFiles, setNestedFiles] = useState(true) // Indicador para mostrar archivos de subcarpetas
  const [isFirstLoad, setIsFirstLoad] = useState(true) // Indicador para la primera carga de datos
  const [isSwitching, setIsSwitching] = useState(false) // Indicador de cambio de modo de visualización

  // Efecto para cargar archivos al obtener un token de acceso o cambiar el modo de archivos anidados
  useEffect(() => {
    if (accessToken) {
      fetchFiles()
    }
  }, [accessToken, nestedFiles])

  /**
   * Construye la URL y parámetros de la API de Google Drive.
   * @param {string} folderId - ID de la carpeta.
   * @param {string|null} pageToken - Token para paginación.
   * @returns {string} - URL completa con parámetros.
   */
  const buildDriveApiUrl = (folderId, pageToken) => {
    const url = new URL('https://www.googleapis.com/drive/v3/files')
    const queryParams = {
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
      pageSize: '100',
      q: `'${folderId}' in parents`
    }

    if (pageToken) {
      queryParams.pageToken = pageToken
    }

    url.search = new URLSearchParams(queryParams).toString()
    return url.toString()
  }

  /**
   * Maneja la paginación actualizando los estados relevantes.
   * @param {'next'|'prev'} direction - Dirección de la paginación.
   * @param {string|null} pageToken - Token actual.
   */
  const handlePagination = (direction, pageToken) => {
    if (isFirstLoad || isSwitching) {
      setCurrentPage(1)
      setPrevPageTokens([])
      setIsSwitching(false)
    } else if (direction === 'next') {
      setPrevPageTokens([...prevPageTokens, pageToken])
      setCurrentPage(currentPage + 1)
    } else if (direction === 'prev') {
      setPrevPageTokens(prevPageTokens.slice(0, -1))
      setCurrentPage(Math.max(1, currentPage - 1))
    }
  }

  /**
   * Obtiene una lista de archivos desde Google Drive.
   * @param {string} folderId - ID de la carpeta a listar (por defecto: principal o raíz).
   * @param {string|null} pageToken - Token para paginación.
   * @param {'next'|'prev'} direction - Dirección de la paginación.
   * @param {boolean} retry - Si se debe reintentar al fallar.
   */
  const fetchFiles = async (
    folderId = nestedFiles ? googleAuthConfig.MAIN_FOLDER_ID : 'root',
    pageToken = null,
    direction = 'next',
    retry = true
  ) => {
    if (!accessToken) {
      setError('No access token found')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const url = buildDriveApiUrl(folderId, pageToken)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 401 && retry) {
          await refreshAccessToken()
          return fetchFiles(folderId, pageToken, direction, false)
        }
        throw new Error('Failed to fetch files')
      }

      const data = await response.json()
      setFiles(data.files || [])
      setNextPageToken(data.nextPageToken || null)

      handlePagination(direction, pageToken)
      setIsFirstLoad(false)
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }


  /**
   * Sube un solo archivo a Google Drive.
   * @param {File} file - Archivo a subir.
   * @returns {Promise<object>} - Respuesta de la API de Google Drive.
   */
  const uploadSingleFile = async (file, accessToken) => {
    const metadata = {
      name: file.name, // Nombre del archivo
      mimeType: file.type, // Tipo MIME del archivo
    }

    const formData = new FormData()
    // Añade los metadatos del archivo y el archivo en sí a la solicitud
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    formData.append('file', file)

    try {
      // Realiza la solicitud de subida a Google Drive
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      )

      // Verifica si la respuesta es exitosa, de lo contrario lanza un error
      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      // Devuelve los datos del archivo subido
      return await response.json()
    } catch (error) {
      // Si ocurre un error, lo lanza
      throw error
    }
  }

  /**
   * Sube archivos al Google Drive del usuario.
   * @param {File[]} filesToUpload - Lista de archivos a subir.
   */
  const uploadFiles = async filesToUpload => {

    // Verifica si existe un token de acceso. Si no, solicita iniciar sesión.
    if (!accessToken) {
      setError('No access token found')
      oauth2SignIn()
      return
    }

    // Inicia el estado de carga y resetea el error
    setIsLoading(true)
    setError(null)

    try {
      // Crea una lista de promesas para subir cada archivo
      const uploadPromises = Array.from(filesToUpload).map(file =>
        uploadSingleFile(file, accessToken) // Ahora usa la función externa
      )

      // Espera que todas las promesas se resuelvan
      const results = await Promise.all(uploadPromises)

      // Actualiza el estado con los archivos subidos
      setFiles([...files, ...results])
    } catch (error) {
      // Si falla la subida, intenta obtener un nuevo token de acceso y reintentar la subida
      if (error.message === 'Failed to upload file') {
        const newAccessToken = await refreshAccessToken()
        await uploadFiles(filesToUpload); // Reintenta la carga
      } else {
        // En caso de cualquier otro error, establece el error
        setError(error.message)
      }
    } finally {
      // Finaliza el estado de carga
      setIsLoading(false)
    }
  }


  return {
    files,
    nextPageToken,
    prevPageTokens,
    currentPage,
    isLoading: isLoading || authLoading,
    error: error || authError,
    fetchFiles,
    uploadFiles,
    nestedFiles,
    setNestedFiles,
    isFirstLoad,
    isSwitching,
    setIsSwitching
  }
}
