import { useState } from 'react'
import { useGoogleAuth } from './useGoogleAuth'

export const useGoogleDriveFolder = () => {
  const { accessToken, refreshAccessToken, oauth2SignIn } = useGoogleAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchFolders = async parentId => {
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

          return fetchFolders(parentId) // Reintenta después de actualizar el token
        }
        throw new Error('Failed to fetch folders')
      }

      const data = await response.json()

      console.log('data.files', data.files)

      return data.files
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const createFolder = async (name, parentFolderId = 'root') => {
    if (!accessToken) {
      setError('No access token found')
      oauth2SignIn()

      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?supportsAllDrives=true`, {
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
      })

      if (!response.ok) {
        if (response.status === 401) {
          await refreshAccessToken()

          return createFolder(name, parentFolderId) // Reintenta después de actualizar el token
        }
        throw new Error('Failed to create folder')
      }

      const data = await response.json()

      return data
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
    isLoading,
    error
  }
}
