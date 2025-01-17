import { useState } from 'react'
import { useGoogleAuth } from './useGoogleDriveAuth'

/**
 * Hook para interactuar con Google Drive, que incluye gestión de carpetas, permisos y subida de archivos.
 * @returns {Object} Funciones y estados para gestionar Google Drive.
 */
export const useGoogleDriveFolder = () => {

  const { refreshAccessToken, signInToGoogle } = useGoogleAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Maneja errores y la autenticación para cada solicitud a la API de Google Drive.
   * @param {Function} apiCall - Función que ejecuta la llamada a la API.
   * @param {...any} args - Argumentos necesarios para la función `apiCall`.
   * @returns {Promise<any>} Resultado de la llamada a la API.
   */
  const executeApiCall = async (apiCall, ...args) => {

    const storedParams = JSON.parse(localStorage.getItem('oauth2-params'))
    const accessToken = storedParams.access_token

    if (!accessToken) {
      setError('No access token found')
      await signInToGoogle()

      return
    }

    setIsLoading(true)
    setError(null)

    try {
      return await apiCall(...args)
    } catch (err) {
      if (err.response?.status === 401) {
        await refreshAccessToken()

        return apiCall(...args) // Reintentar después de refrescar el token
      }
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }

  }

  /**
   * Solicita datos a la API de Google Drive.
   * @param {string} url - Endpoint de la API.
   * @param {Object} options - Opciones de la solicitud.
   * @returns {Promise<Object>} Respuesta de la API.
   */
  const makeApiRequest = async (url, options = {}) => {

    const storedParams = JSON.parse(localStorage.getItem('oauth2-params'))
    const accessToken = storedParams.access_token

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Obtiene una lista de carpetas dentro de una carpeta específica en Google Drive.
   * @param {string} parentId - ID de la carpeta padre.
   * @returns {Promise<Object>} Lista de carpetas.
   */
  const fetchFolders = async (parentId) => {

    const url = `https://www.googleapis.com/drive/v3/files?q='${parentId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&includeItemsFromAllDrives=true&supportsAllDrives=true`

    return executeApiCall(() => makeApiRequest(url))

  }

  /**
   * Crea una nueva carpeta en Google Drive.
   * @param {string} name - Nombre de la carpeta.
   * @param {string} [parentFolderId='root'] - ID de la carpeta padre.
   * @returns {Promise<Object>} Carpeta creada.
   */
  const createFolder = async (name, parentFolderId = 'root') => {

    const url = 'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true'

    const body = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    }

    return executeApiCall(() => makeApiRequest(url, { method: 'POST', body: JSON.stringify(body) }))

  }

  /**
   * Crea un permiso para un archivo en Google Drive.
   * @param {string} fileId - ID del archivo.
   * @param {string} emailAddress - Dirección de correo.
   * @param {string} role - Rol (e.g., 'reader', 'writer').
   * @returns {Promise<Object>} Permiso creado.
   */
  const createPermission = async (fileId, emailAddress, role) => {

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`

    const body = {
      role,
      type: 'user',
      emailAddress,
    }

    return executeApiCall(() => makeApiRequest(url, { method: 'POST', body: JSON.stringify(body) }))
  }

  /**
   * Sube un archivo a Google Drive.
   * @param {string} fileName - Nombre del archivo.
   * @param {File} file - Archivo a subir.
   * @param {string} parentFolderId - ID de la carpeta donde se subirá.
   * @returns {Promise<Object>} Archivo subido.
   */
  const uploadFile = async (fileName, file, parentFolderId) => {

    const storedParams = JSON.parse(localStorage.getItem('oauth2-params'))
    const accessToken = storedParams.access_token

    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&includeItemsFromAllDrives=true'

    const metadata = {
      name: fileName,
      parents: [parentFolderId],
    }

    const formData = new FormData()
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    formData.append('file', file)

    return executeApiCall(() => fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: formData }).then(res => res.json()))

  }

  /**
   * Función para Buscar y/o Crear una nueva carpeta.
   * @param {string} folderName - Nombre de la carpeta a crear.
   * @param {string} parentFolderId - ID de la carpeta donde se debe buscar y/o crear la nueva carpeta.
   * @param {string} findBy - String para hacer el match de búsqueda mediante includes().
   * @returns
   */
  const findOrCreateFolder = async (folderName, parentFolderId, findBy) => {

    // Busca las carpetas dentro del directorio especificado.
    const folders = await fetchFolders(parentFolderId)
    let folder = folders.files.find(f => f.name.includes(findBy))

    // Si no existe, la crea.
    if (!folder) {
      folder = await createFolder(folderName, parentFolderId)
    }

    return folder
  }

  /**
   * Función para manejar la creación de carpetas y subcarpetas en Google Drive.
   * @param {string} mainFolderId - ID de la carpeta donde se debe buscar y/o crear la nueva carpeta.
   * @param {string} plantName - Nombre completo de la Planta de la OT.
   * @param {string} plantInitials - Iniciales de la Planta de la OT.
   * @param {string} areaName - Nombre completo del área de la OT.
   * @param {string} areaNumber - Número del área.
   * @param {string} projectFolderName - Nombre completo de la carpeta de la OT.
   * @param {string} projectOtNumber - Número de OT.
   * @param {Array.<string>} subfolders - Array de Strings con subcarpetas a crear dentro de la carpeta de la OT.
   * @returns
   */
  const processFolders = async (mainFolderId, plantName, plantInitials, areaName, areaNumber, projectFolderName, projectOtNumber, subfolders = []) => {
    // Carpeta principal (de la planta).
    const plantFolder = await findOrCreateFolder(plantInitials, mainFolderId, plantInitials)

    // Carpeta del área.
    const areaFolder = await findOrCreateFolder(areaName, plantFolder.id, areaNumber)

    // Carpeta del proyecto.
    const projectFolder = await findOrCreateFolder(projectFolderName, areaFolder.id, projectOtNumber)

    // Crear subcarpetas si se especifican.
    for (const subfolder of subfolders) {
      await findOrCreateFolder(subfolder, projectFolder.id, subfolder)
    }

    return projectFolder
  }

  return {
    fetchFolders,
    createFolder,
    createPermission,
    uploadFile,
    isLoading,
    error,
    findOrCreateFolder,
    processFolders
  }
}
