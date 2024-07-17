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
    setCurrentPage(1) // Resetea currentPage a 1
    setPrevPageTokens([]) // Límpia prevPageTokens
    setNextPageToken(null) // Resetea nextPageToken
    setIsFirstLoad(true)

    if (nestedFiles) {
      await getNestedFiles('180lLMkkTSpFhHTYXBSBQjLsoejSmuXwt')
    } else {
      await getGoogleDriveFiles()
    }

    setIsFirstLoad(false) // Marca que la carga inicial ha terminado

    setIsSwitching(false) // Marca que la conmutación ha terminado después de cargar los archivos
  }

  /*
   * Función para analizar los parámetros de la URL.
   */
  const parseQueryString = () => {
    const fragmentString = window.location.hash.substring(1) // Obtiene la parte del fragmento de la URL (después del hash '#') y elimina el primer carácter.
    const params = {} // Inicializa un objeto vacío para almacenar los parámetros.
    const regex = /([^&=]+)=([^&]*)/g // Expresión regular para encontrar pares clave-valor en la cadena de consulta.
    let match

    // Bucle que ejecuta la expresión regular sobre el fragmento de la URL y almacena los resultados en el objeto params.
    while ((match = regex.exec(fragmentString))) {
      params[decodeURIComponent(match[1])] = decodeURIComponent(match[2])
    }

    // Verifica si hay algún parámetro en el objeto params.
    if (Object.keys(params).length > 0) {
      localStorage.setItem('oauth2-test-params', JSON.stringify(params)) // Guarda los parámetros en el almacenamiento local como una cadena JSON.

      // Si el parámetro 'state' está presente y su valor es 'try_sample_request', ejecuta la función trySampleRequest.
      if (params['state'] && params['state'] === 'try_sample_request') {
        trySampleRequest()
      }
    }
  }

  /*
   * Función para probar una solicitud a la API de Google Drive.
   */
  function trySampleRequest() {
    const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params')) // Obtiene los parámetros almacenados en localStorage bajo la clave 'oauth2-test-params'.

    // Verifica si los parámetros existen y si contienen un 'access_token'.
    if (storedParams && storedParams['access_token']) {
      fetch(`https://www.googleapis.com/drive/v3/about?fields=user&access_token=${storedParams['access_token']}`)
        .then(response => {
          if (response.ok) {
            console.log('API request successful')
          } else if (response.status === 401) {
            oauth2SignIn()
          }
        })
        .catch(error => {
          console.error('Error making API request:', error)
        })
    } else {
      oauth2SignIn() // Si no hay un token de acceso, inicia el proceso de autenticación.
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
      include_granted_scopes: 'true', //  el token de acceso incluirá todos los permisos concedidos anteriormente al usuario.
      response_type: 'token'
    }

    // Crea un elemento de formulario para abrir el endpoint de OAuth 2.0 en new window.
    const form = document.createElement('form')
    form.setAttribute('method', 'GET') // Envia solicitud GET
    form.setAttribute('action', oauth2Endpoint) // Configura el formulario para que apunte al endpoint de OAuth 2.0.

    // Añade parámetros del formulario como valores de entrada ocultos.
    for (const p in params) {
      const input = document.createElement('input')
      input.setAttribute('type', 'hidden') // Configura la entrada como oculta.
      input.setAttribute('name', p) // Establece el nombre del parámetro.
      input.setAttribute('value', params[p]) // Establece el valor del parámetro.
      form.appendChild(input) // Añade la entrada al formulario.
    }

    // Agrega el formulario a la página y lo envia para abrir el endpoint de OAuth 2.0
    document.body.appendChild(form)
    form.submit()
  }

  /*
   * Función para refrescar el token de acceso utilizando el token de refresco.
   */
  const refreshAccessToken = async refreshToken => {
    // Crea un objeto URLSearchParams para construir los parámetros de la solicitud POST.
    const params = new URLSearchParams()
    params.append('client_id', CLIENT_ID)
    params.append('client_secret', CLIENT_SECRET)
    params.append('refresh_token', refreshToken)
    params.append('grant_type', 'refresh_token')

    try {
      // Hace una solicitud POST a la API de Google para refrescar el token de acceso.
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      })

      // Verifica si la solicitud fue exitosa.
      if (!response.ok) {
        throw new Error('Failed to refresh access token')
      }

      // Parsea la respuesta JSON para obtener el nuevo token de acceso.
      const data = await response.json()
      const newAccessToken = data.access_token

      // Obtiene los parámetros almacenados en localStorage y actualiza el token de acceso.
      const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params'))
      storedParams['access_token'] = newAccessToken
      localStorage.setItem('oauth2-test-params', JSON.stringify(storedParams))

      // Devueleve el nuevo token de acceso.
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
    // Obtiene los parámetros almacenados en localStorage bajo la clave 'oauth2-test-params'.
    let params = JSON.parse(localStorage.getItem('oauth2-test-params'))
    let accessToken = params && params['access_token']

    // Verifica si existe un token de acceso.
    if (!accessToken) {
      console.error('No access token found')

      return
    }

    try {
      // Función interna para realizar la solicitud a la API de Google Drive.
      const fetchFiles = token => {
        // Construye la URL de la solicitud a la API de Google Drive.
        const url = new URL('https://www.googleapis.com/drive/v3/files')

        // Parámetros de la solicitud.
        const queryParams = {
          includeItemsFromAllDrives: 'true', // Incluir elementos de todas las unidades.
          supportsAllDrives: 'true', // Soporta todas las unidades.
          pageSize: '100' // Número de archivos por página.
        }
        if (pageToken) {
          queryParams.pageToken = pageToken // Agrega el token de la página si existe.
        }
        url.search = new URLSearchParams(queryParams).toString()

        // Realiza la solicitud a la API de Google Drive.
        return fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}` // Token de acceso en el encabezado.
          }
        }).then(response => {
          if (!response.ok) {
            return response.json().then(err => Promise.reject(err))
          }

          return response.json()
        })
      }

      // Llama a la función para obtener los archivos de Google Drive.
      const data = await fetchFiles(accessToken)

      // Verifica si se obtuvieron archivos.
      if (data.files) {
        setFiles(data.files)
      } else {
        setFiles([]) // Asegura que files no sea undefined
      }

      // Maneja la paginación y actualiza el estado correspondiente.
      if (direction === 'next') {
        setNextPageToken(data.nextPageToken || null) // Actualiza el estado nextPageToken con el token de la siguiente página, si existe.

        //Si se proporciona un pageToken, actualiza los tokens de las páginas anteriores (prevPageTokens) y el número de la página actual (currentPage).
        if (pageToken) {
          setPrevPageTokens(prevTokens => [...prevTokens, pageToken])
          if (!isFirstLoad && !isSwitching) {
            setCurrentPage(prevPage => prevPage + 1)
          }
        } else if (!isFirstLoad && !isSwitching) {
          setCurrentPage(prevPage => prevPage + 1)
        }
        setIsFirstLoad(false) // Marca que la primera carga ha terminado.
      } else if (direction === 'prev') {
        const newPrevTokens = prevPageTokens.slice(0, -1) // Elimina el último token de prevPageTokens.
        setPrevPageTokens(newPrevTokens) // Actualiza prevPageTokens con el nuevo array.
        setNextPageToken(data.nextPageToken || nextPageToken) // Actualiza nextPageToken si se proporciona un nuevo token.
        setCurrentPage(prevPage => Math.max(1, prevPage - 1)) // Actualiza el número de la página actual.
      } else {
        setNextPageToken(null)
      }
    } catch (error) {
      if (error.error && error.error.code === 401 && retry) {
        // Refresca el token de acceso y reintenta
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
    // Obtiene los parámetros almacenados en localStorage bajo la clave 'oauth2-test-params'.
    let params = JSON.parse(localStorage.getItem('oauth2-test-params'))
    let accessToken = params && params['access_token']

    // Verifica si existe un token de acceso.
    if (!accessToken) {
      console.error('No access token found')

      return
    }

    try {
      // Función interna para realizar la solicitud a la API de Google Drive.
      const fetchFiles = token => {
        // Construye la URL de la solicitud a la API de Google Drive.
        const url = new URL('https://www.googleapis.com/drive/v3/files')

        // Parámetros de la solicitud.
        const queryParams = {
          q: `'${folderId}' in parents`, // Consulta para obtener archivos dentro de la carpeta especificada.
          includeItemsFromAllDrives: 'true', // Incluir elementos de todas las unidades.
          supportsAllDrives: 'true', // Soporta todas las unidades.
          pageSize: '100' // Número de archivos por página.
        }
        if (pageToken) {
          queryParams.pageToken = pageToken // Agrega el token de la página si existe.
        }
        url.search = new URLSearchParams(queryParams).toString()

        // Realiza la solicitud a la API de Google Drive.
        return fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}` // Token de acceso en el encabezado.
          }
        }).then(response => {
          if (!response.ok) {
            return response.json().then(err => Promise.reject(err))
          }

          return response.json()
        })
      }

      // Llama a la función para obtener los archivos anidados de Google Drive.
      const data = await fetchFiles(accessToken)

      // Verifica si se obtuvieron archivos.
      if (data.files) {
        setFiles(data.files)
      } else {
        setFiles([]) // Asegura que files no sea undefined
      }

      // Maneja la paginación y actualiza el estado correspondiente.
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
        // Refresca el token de acceso y reintenta
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
    // Obtiene los parámetros almacenados en localStorage bajo la clave 'oauth2-test-params'.
    let params = JSON.parse(localStorage.getItem('oauth2-test-params'))
    let accessToken = params && params['access_token']

    // Verifica si existe un token de acceso.
    if (!accessToken) {
      console.error('No access token found')

      return
    }

    try {
      // Función interna para subir un solo archivo a Google Drive.
      const uploadSingleFile = file => {
        // Metadatos del archivo a subir.
        const metadata = {
          name: file.name, // Nombre del archivo.
          mimeType: file.type // Tipo MIME del archivo.
        }

        // Crea un objeto FormData para enviar el archivo y sus metadatos.
        const formData = new FormData()
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
        formData.append('file', file)

        // Realiza la solicitud para subir el archivo a Google Drive.
        return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}` // Token de acceso en el encabezado.
          },
          body: formData
        }).then(response => {
          if (!response.ok) {
            return response.json().then(err => Promise.reject(err))
          }

          return response.json()
        })
      }

      // Crea una lista de promesas para subir todos los archivos.
      const uploadPromises = Array.from(files).map(uploadSingleFile)
      const results = await Promise.all(uploadPromises)
      console.log('Files uploaded:', results)
      getGoogleDriveFiles() // Refresca la lista de archivos después de la subida
    } catch (error) {
      // Si el token es inválido, intenta refrescarlo y vuelve a intentar subir los archivos.
      if (error.error === 'invalid_token') {
        // Refresca el token de acceso y reintenta
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
    setNestedFiles(!nestedFiles) // Alterna el valor de nestedFiles
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
