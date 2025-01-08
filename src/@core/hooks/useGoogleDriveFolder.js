import { useState } from 'react'
import { useGoogleAuth } from './useGoogleAuth'

/**
 * Hook para interactuar con Google Drive, que incluye la gestión de carpetas, permisos y subida de archivos.
 * @returns {Object} Funciones y estados para gestionar Google Drive.
 */
export const useGoogleDriveFolder = () => {
  const { accessToken, refreshAccessToken, oauth2SignIn } = useGoogleAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Obtiene una lista de carpetas dentro de una carpeta específica en Google Drive.
   * @async
   * @param {string} parentId - ID de la carpeta padre en Google Drive.
   * @returns {Promise<Object>} Respuesta con la lista de carpetas.
   * @throws {Error} Si la solicitud falla o no hay un token de acceso válido.
   */
  const fetchFolders = async (parentId) => {
    if (!accessToken) {
      setError('No access token found')
      oauth2SignIn()

      return

    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${parentId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&includeItemsFromAllDrives=true&supportsAllDrives=true`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          await refreshAccessToken()

          return fetchFolders(parentId) // Retry after refreshing the token
        }
        throw new Error('Failed to fetch folders')
      }

      return await response.json()
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  /**
   * Crea una nueva carpeta en Google Drive.
   * @async
   * @param {string} name - Nombre de la carpeta a crear.
   * @param {string} [parentFolderId='root'] - ID de la carpeta padre (por defecto, la raíz).
   * @returns {Promise<Object>} Datos de la carpeta creada.
   * @throws {Error} Si la creación falla o no hay un token de acceso válido.
   */
  const createFolder = async (name, parentFolderId = 'root') => {
    if (!accessToken) {
      setError('No access token found')
      oauth2SignIn()

return;
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?supportsAllDrives=true`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId]
          })
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          await refreshAccessToken()

          return createFolder(name, parentFolderId) // Retry after refreshing the token
        }
        throw new Error('Failed to create folder')
      }

      return await response.json()
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Crea un permiso para un archivo en Google Drive.
   * @async
   * @param {string} fileId - ID del archivo al que se aplicará el permiso.
   * @param {string} emailAddress - Dirección de correo del usuario que recibirá el permiso.
   * @param {string} role - Rol del permiso (e.g., 'reader', 'writer').
   * @returns {Promise<Object>} Datos del permiso creado.
   * @throws {Error} Si la creación del permiso falla o no hay un token de acceso válido.
   */
  const createPermission = async (fileId, emailAddress, role) => {
    if (!accessToken) {
      setError('No access token found')
      oauth2SignIn()

      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role,
            type: 'user',
            emailAddress
          })
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          await refreshAccessToken()

          return createPermission(fileId, emailAddress, role) // Retry after refreshing the token
        }
        throw new Error('Failed to create permission')
      }

      return await response.json()
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Sube un archivo a Google Drive.
   * @async
   * @param {string} fileName - Nombre del archivo a subir.
   * @param {File} file - Objeto de archivo a subir.
   * @param {string} parentFolderId - ID de la carpeta donde se subirá el archivo.
   * @returns {Promise<Object>} Datos del archivo subido.
   * @throws {Error} Si la subida falla o no hay un token de acceso válido.
   */
  const uploadFile = async (fileName, file, parentFolderId) => {
    if (!accessToken) {
      setError('No access token found')
      oauth2SignIn()

      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const metadata = {
        name: fileName,
        parents: [parentFolderId],
      }

      const formData = new FormData()
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      formData.append('file', file)

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&includeItemsFromAllDrives=true',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          body: formData
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          await refreshAccessToken()

          return uploadFile(fileName, file, parentFolderId) // Retry after refreshing the token
        }
        throw new Error('Failed to upload file')
      }

      return await response.json()
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    fetchFolders,
    createFolder,
    createPermission,
    uploadFile,
    isLoading,
    error,
  }
}
