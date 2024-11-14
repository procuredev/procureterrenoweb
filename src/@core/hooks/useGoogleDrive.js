import { useState, useEffect } from 'react'
import { useGoogleAuth } from './useGoogleAuth'

export const useGoogleDrive = () => {
  const { accessToken, refreshAccessToken, isLoading: authLoading, error: authError, oauth2SignIn } = useGoogleAuth()
  const [files, setFiles] = useState([])
  const [nextPageToken, setNextPageToken] = useState(null)
  const [prevPageTokens, setPrevPageTokens] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [nestedFiles, setNestedFiles] = useState(true)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)

  useEffect(() => {
    if (accessToken) {
      fetchFiles()
    }
  }, [accessToken, nestedFiles])

  const fetchFiles = async (
    folderId = nestedFiles ? '1kKCLEpiN3E-gleNVR8jz_9mZ7dpSY8jw' : 'root', // '180lLMkkTSpFhHTYXBSBQjLsoejSmuXwt' : 'root',
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

    const url = new URL('https://www.googleapis.com/drive/v3/files')

    const queryParams = {
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
      pageSize: '100'
    }

    if (nestedFiles) queryParams.q = `'${folderId}' in parents`
    if (pageToken) queryParams.pageToken = pageToken

    url.search = new URLSearchParams(queryParams).toString()

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 401 && retry) {
          const newAccessToken = await refreshAccessToken()

          return fetchFiles(folderId, pageToken, direction, false)
        }
        throw new Error('Failed to fetch files')
      }

      const data = await response.json()
      setFiles(data.files || [])
      setNextPageToken(data.nextPageToken || null)

      if (isFirstLoad) {
        setCurrentPage(1)
        setPrevPageTokens([])
      } else if (isSwitching) {
        setCurrentPage(1)
        setPrevPageTokens([])
        setIsSwitching(false)
      } else {
        if (direction === 'next') {
          setPrevPageTokens([...prevPageTokens, pageToken])
          setCurrentPage(currentPage + 1)
        } else if (direction === 'prev') {
          setPrevPageTokens(prevPageTokens.slice(0, -1))
          setCurrentPage(Math.max(1, currentPage - 1))
        }
      }

      setIsFirstLoad(false)
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const uploadFiles = async filesToUpload => {
    if (!accessToken) {
      setError('No access token found')
      oauth2SignIn()

      return
    }

    setIsLoading(true)
    setError(null)

    const uploadSingleFile = async file => {
      const metadata = {
        name: file.name,
        mimeType: file.type
      }

      const formData = new FormData()
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
      formData.append('file', file)

      try {
        const response = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`
            },
            body: formData
          }
        )

        if (!response.ok) {
          throw new Error('Failed to upload file')
        }

        return await response.json()
      } catch (error) {
        setError(error.message)
        throw error
      }
    }

    try {
      const uploadPromises = Array.from(filesToUpload).map(uploadSingleFile)
      const results = await Promise.all(uploadPromises)
      setFiles([...files, ...results])
    } catch (error) {
      if (error.message === 'Failed to upload file') {
        const newAccessToken = await refreshAccessToken()
        await uploadFiles(filesToUpload)
      } else {
        setError(error.message)
      }
    } finally {
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
