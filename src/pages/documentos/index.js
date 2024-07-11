import React, { useEffect, useState } from 'react'

const Documentos = () => {
  /*
   * Definición de estados para el componente.
   */
  const [files, setFiles] = useState([]) // Almacena los archivos de Google Drive
  const [nextPageToken, setNextPageToken] = useState(null) // Token para la siguiente página de resultados
  const [prevPageTokens, setPrevPageTokens] = useState([]) // Almacena los tokens de las páginas anteriores
  const [currentPage, setCurrentPage] = useState(1) // Número de la página actual
  const [isFirstLoad, setIsFirstLoad] = useState(true) // Bandera para la primera carga
  const [nestedFiles, setNestedFiles] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false) // Bandera para alternar el estado de nestedFiles

  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
  const CLIENT_ID = process.env.NEXT_PUBLIC_DEV_GOOGLE_CLIENT_ID
  const CLIENT_SECRET = process.env.NEXT_PUBLIC_DEV_GOOGLE_CLIENT_SECRET
  const SCOPES = 'https://www.googleapis.com/auth/drive'
  const REDIRECT_URI = 'http://localhost:3000/documentos'
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'

  /*
   * useEffect se ejecuta al montar el componente.
   */
  useEffect(() => {
    const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params'))
    if (storedParams && storedParams['access_token']) {
      fetchData()
    } else {
      parseQueryString()
    }
  }, [nestedFiles])

  const fetchData = async () => {
    setCurrentPage(1) // Resetear currentPage a 1
    setPrevPageTokens([]) // Limpiar prevPageTokens
    setNextPageToken(null) // Resetear nextPageToken
    setIsFirstLoad(true)

    if (nestedFiles) {
      await getNestedFiles('180lLMkkTSpFhHTYXBSBQjLsoejSmuXwt')
    } else {
      await getGoogleDriveFiles()
    }

    setIsFirstLoad(false) // Marcar que la carga inicial ha terminado

    setIsSwitching(false) // Marcar que la conmutación ha terminado después de cargar los archivos
  }

  /*
   * Función para analizar los parámetros de la URL.
   */
  const parseQueryString = () => {
    const fragmentString = window.location.hash.substring(1)
    const params = {}
    const regex = /([^&=]+)=([^&]*)/g
    let m
    while ((m = regex.exec(fragmentString))) {
      params[decodeURIComponent(m[1])] = decodeURIComponent(m[2])
    }

    if (Object.keys(params).length > 0) {
      localStorage.setItem('oauth2-test-params', JSON.stringify(params))
      if (params['state'] && params['state'] === 'try_sample_request') {
        trySampleRequest()
      }
    }
  }

  /*
   * Función para probar una solicitud a la API de Google Drive.
   */
  function trySampleRequest() {
    const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params'))
    if (storedParams && storedParams['access_token']) {
      const xhr = new XMLHttpRequest()
      xhr.open(
        'GET',
        `https://www.googleapis.com/drive/v3/about?fields=user&access_token=${storedParams['access_token']}`
      )
      xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4 && xhr.status === 200) {
          console.log('API request successful')
        } else if (xhr.readyState === 4 && xhr.status === 401) {
          // Token invalid, so prompt for user permission.
          oauth2SignIn()
        }
      }
      xhr.send(null)
    } else {
      oauth2SignIn()
    }
  }

  /*
   * Crear formulario para solicitar el token de acceso desde el servidor OAuth 2.0 de Google.
   */
  function oauth2SignIn() {
    // Endpoint de OAuth 2.0 de Google para solicitar un token de acceso
    const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth'

    // Parámetros a pasar al endpoint de OAuth 2.0
    const params = {
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      state: 'try_sample_request',
      include_granted_scopes: 'true',
      response_type: 'token'
    }

    // Crear un elemento de formulario para abrir el endpoint de OAuth 2.0 en new window.
    const form = document.createElement('form')
    form.setAttribute('method', 'GET') // Envia solicitud GET
    form.setAttribute('action', oauth2Endpoint)

    // Añade parámetros del formulario como valores de entrada ocultos.
    for (const p in params) {
      const input = document.createElement('input')
      input.setAttribute('type', 'hidden')
      input.setAttribute('name', p)
      input.setAttribute('value', params[p])
      form.appendChild(input)
    }

    // Agrega el formulario a la página y lo envia para abrir el endpoint de OAuth 2.0
    document.body.appendChild(form)
    form.submit()
  }

  /*
   * Función para refrescar el token de acceso utilizando el token de refresco.
   */
  const refreshAccessToken = async refreshToken => {
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
      localStorage.setItem('oauth2-test-params', JSON.stringify(storedParams))

      return newAccessToken
    } catch (error) {
      console.error('Error refreshing access token:', error)
      throw error
    }
  }

  /*
   * Función para obtener archivos de Google Drive.
   */
  const getGoogleDriveFiles = async (pageToken = null, direction = 'next', retry = true) => {
    let params = JSON.parse(localStorage.getItem('oauth2-test-params'))
    let accessToken = params && params['access_token']

    if (!accessToken) {
      console.error('No access token found')

      return
    }

    try {
      const fetchFiles = token => {
        const url = new URL('https://www.googleapis.com/drive/v3/files')

        const queryParams = {
          includeItemsFromAllDrives: 'true',
          supportsAllDrives: 'true',
          pageSize: '100'
        }
        if (pageToken) {
          queryParams.pageToken = pageToken
        }
        url.search = new URLSearchParams(queryParams).toString()

        return fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).then(response => {
          if (!response.ok) {
            return response.json().then(err => Promise.reject(err))
          }

          return response.json()
        })
      }

      const data = await fetchFiles(accessToken)

      if (data.files) {
        setFiles(data.files)
      } else {
        setFiles([]) // Asegurarse de que files no sea undefined
      }

      if (direction === 'next') {
        setNextPageToken(data.nextPageToken || null)
        if (pageToken) {
          setPrevPageTokens(prevTokens => [...prevTokens, pageToken])
          if (!isFirstLoad && !isSwitching) {
            setCurrentPage(prevPage => prevPage + 1)
          }
        } else if (!isFirstLoad && !isSwitching) {
          setCurrentPage(prevPage => prevPage + 1)
        }
        setIsFirstLoad(false)
      } else if (direction === 'prev') {
        const newPrevTokens = prevPageTokens.slice(0, -1)
        setPrevPageTokens(newPrevTokens)
        setNextPageToken(data.nextPageToken || nextPageToken)
        setCurrentPage(prevPage => Math.max(1, prevPage - 1))
      } else {
        setNextPageToken(null)
      }
    } catch (error) {
      if (error.error && error.error.code === 401 && retry) {
        // Refrescar el token de acceso y reintenta
        try {
          accessToken = await refreshAccessToken(params['refresh_token'])
          await getGoogleDriveFiles(pageToken, direction, false)
        } catch (refreshError) {
          console.error('Error refreshing access token:', refreshError)
          localStorage.removeItem('oauth2-test-params')
        }
      } else {
        console.error('Error fetching Google Drive files:', error)
      }
    }
  }

  /*
   * función para obtener archivos y carpetas anidados y sub-anidados.
   */
  const getNestedFiles = async (folderId, pageToken = null, direction = 'next', retry = true) => {
    let params = JSON.parse(localStorage.getItem('oauth2-test-params'))
    let accessToken = params && params['access_token']

    if (!accessToken) {
      console.error('No access token found')

      return
    }

    try {
      const fetchFiles = token => {
        const url = new URL('https://www.googleapis.com/drive/v3/files')

        const queryParams = {
          q: `'${folderId}' in parents`,
          includeItemsFromAllDrives: 'true',
          supportsAllDrives: 'true',
          pageSize: '100'
        }
        if (pageToken) {
          queryParams.pageToken = pageToken
        }
        url.search = new URLSearchParams(queryParams).toString()

        return fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).then(response => {
          if (!response.ok) {
            return response.json().then(err => Promise.reject(err))
          }

          return response.json()
        })
      }

      const data = await fetchFiles(accessToken)

      if (data.files) {
        setFiles(data.files)
      } else {
        setFiles([]) // Asegurarse de que files no sea undefined
      }

      if (direction === 'next') {
        setNextPageToken(data.nextPageToken || null)
        if (pageToken) {
          setPrevPageTokens(prevTokens => [...prevTokens, pageToken])
          if (!isFirstLoad && !isSwitching) {
            setCurrentPage(prevPage => prevPage + 1)
          }
        } else if (!isFirstLoad && !isSwitching) {
          setCurrentPage(prevPage => prevPage + 1)
        }
        setIsFirstLoad(false)
      } else if (direction === 'prev') {
        const newPrevTokens = prevPageTokens.slice(0, -1)
        setPrevPageTokens(newPrevTokens)
        setNextPageToken(data.nextPageToken || nextPageToken)
        setCurrentPage(prevPage => Math.max(1, prevPage - 1))
      } else {
        setNextPageToken(null)
      }
    } catch (error) {
      if (error.error && error.error.code === 401 && retry) {
        try {
          accessToken = await refreshAccessToken(params['refresh_token'])
          await getNestedFiles(folderId, pageToken, direction, false)
        } catch (refreshError) {
          console.error('Error refreshing access token:', refreshError)
          localStorage.removeItem('oauth2-test-params')
        }
      } else {
        console.error('Error fetching nested files:', error)
      }
    }
  }

  /*
   * Función para subir archivos a Google Drive.
   */
  const uploadFiles = async files => {
    let params = JSON.parse(localStorage.getItem('oauth2-test-params'))
    let accessToken = params && params['access_token']

    if (!accessToken) {
      console.error('No access token found')

      return
    }

    try {
      const uploadSingleFile = file => {
        const metadata = {
          name: file.name,
          mimeType: file.type
        }

        const formData = new FormData()
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
        formData.append('file', file)

        return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          body: formData
        }).then(response => {
          if (!response.ok) {
            return response.json().then(err => Promise.reject(err))
          }

          return response.json()
        })
      }

      const uploadPromises = Array.from(files).map(uploadSingleFile)
      const results = await Promise.all(uploadPromises)
      console.log('Files uploaded:', results)
      getGoogleDriveFiles() // Refresca la lista de archivos después de la subida
    } catch (error) {
      if (error.error === 'invalid_token') {
        // Refrescar el token de acceso y reintenta
        try {
          accessToken = await refreshAccessToken(params['refresh_token'])
          params = JSON.parse(localStorage.getItem('oauth2-test-params'))

          const uploadPromises = Array.from(files).map(uploadSingleFile)
          const results = await Promise.all(uploadPromises)
          console.log('Files uploaded:', results)
          getGoogleDriveFiles() // Refresca la lista de archivos después de la subida
        } catch (refreshError) {
          console.error('Error refreshing access token:', refreshError)
        }
      } else {
        console.error('Error uploading files:', error)
      }
    }
  }

  const handleNextPage = () => {
    if (nestedFiles) {
      getNestedFiles('180lLMkkTSpFhHTYXBSBQjLsoejSmuXwt', nextPageToken, 'next')
    } else if (nextPageToken) {
      getGoogleDriveFiles(nextPageToken, 'next')
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const lastPageToken = prevPageTokens[prevPageTokens.length - 2]
      if (nestedFiles) {
        getNestedFiles('180lLMkkTSpFhHTYXBSBQjLsoejSmuXwt', lastPageToken, 'prev')
      } else {
        getGoogleDriveFiles(lastPageToken, 'prev')
      }
    }
  }

  const handleSwitchChange = () => {
    setIsSwitching(true)
    setNestedFiles(!nestedFiles) // Alternar el valor de nestedFiles
  }

  /* console.log('nestedFiles: ', nestedFiles)
  console.log('files: ', files)
  console.log('currentPage: ', currentPage)
  console.log('isFirstLoad: ', isFirstLoad)
  console.log('isSwitching: ', isSwitching)
  console.log('nextPageToken: ', nextPageToken) */

  return (
    <div>
      <div className='pagination'>
        <button onClick={handlePrevPage} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage}</span>
        <button onClick={handleNextPage} disabled={!nextPageToken}>
          Next
        </button>
      </div>

      <div>
        <label>
          <input type='checkbox' checked={nestedFiles} onChange={handleSwitchChange} />
          72336
        </label>
      </div>
      <button onClick={() => trySampleRequest()}>Try sample request</button>
      <button onClick={() => document.getElementById('fileInput').click()}>Upload Files</button>
      <input
        type='file'
        id='fileInput'
        style={{ display: 'none' }}
        onChange={e => uploadFiles(e.target.files)}
        multiple
      />
      <ul>
        {files.map(file => (
          <li key={file.id}>
            {/* {file.id} - */}
            {file.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

Documentos.acl = {
  subject: 'documentos'
}

export default Documentos
