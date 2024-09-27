// pages/api/adobeSign.js

import fetch from 'node-fetch'

const clientId = process.env.NEXT_PUBLIC_PROD_ADOBE_SIGN_CLIENT_ID
const clientSecret = process.env.NEXT_PUBLIC_PROD_ADOBE_SIGN_CLIENT_SECRET
const apiBaseUrl = 'https://api.na2.adobesign.com/api/rest/v6'

// Función para obtener el token de acceso
async function getAccessToken() {
  const response = await fetch('https://api.na2.adobesign.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'client_id': clientId,
      'client_secret': clientSecret,
      'grant_type': 'client_credentials', // O 'authorization_code' si usas un flujo de autorización
    })
  })

  if (!response.ok) {
    throw new Error('Error al obtener el token de acceso')
  }

  const data = await response.json()
  return data.access_token
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Obtener el token de acceso
      const accessToken = await getAccessToken()
      const { documentUrl } = req.body

      // Llamada a la API de Adobe Sign para crear el acuerdo y firmar el documento
      const response = await fetch(`${apiBaseUrl}/agreements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileInfos: [{ url: documentUrl }], // Usa la URL del archivo cargado
          name: 'Documento para firmar',
          signatureType: 'ESIGN',
          state: 'IN_PROCESS'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Error en Adobe Sign:', data)
        return res.status(response.status).json({ error: data.message })
      }

      // Manejar la respuesta de Adobe Sign
      res.status(200).json({ message: 'Documento enviado para firma', agreementId: data.agreementId })
    } catch (error) {
      console.error('Error en la API de Adobe Sign:', error)
      res.status(500).json({ error: 'Error al conectar con Adobe Sign' })
    }
  } else {
    res.status(405).json({ error: 'Método no permitido' })
  }
}
