import { useState, useEffect } from 'react'

const CLIENT_ID = process.env.NEXT_PUBLIC_DEV_GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.NEXT_PUBLIC_DEV_GOOGLE_CLIENT_SECRET
const SCOPES = 'https://www.googleapis.com/auth/drive'
const REDIRECT_URI = 'http://localhost:3000/home'

export const useGoogleAuth = () => {
  const [accessToken, setAccessToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params'))
    if (storedParams && storedParams.access_token) {
      console.log('storedParams.access_token', storedParams.access_token)
      validateAccessToken(storedParams.access_token)
        .then(isValid => {
          console.log('isValid', isValid)
          if (isValid) {
            setAccessToken(storedParams.access_token)
            setRefreshToken(storedParams.refresh_token)
            setIsLoading(false)
          } else {
            //oauth2SignIn()
          }
        })
        .catch(() => {
          oauth2SignIn()
        })
    } else {
      parseQueryString()
    }
  }, [])

  const validateAccessToken = async token => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token)
      const data = await response.json()

      return data.expires_in > 0 // Comprueba si el token sigue siendo válido
    } catch (error) {
      return false
    }
  }

  const oauth2SignIn = () => {
    const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth'

    const params = {
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      state: 'try_sample_request',
      include_granted_scopes: 'true',
      response_type: 'token'
    }

    const form = document.createElement('form')
    form.setAttribute('method', 'GET')
    form.setAttribute('action', oauth2Endpoint)

    for (const p in params) {
      const input = document.createElement('input')
      input.setAttribute('type', 'hidden')
      input.setAttribute('name', p)
      input.setAttribute('value', params[p])
      form.appendChild(input)
    }

    document.body.appendChild(form)
    form.submit()
  }

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
      storedParams.access_token = newAccessToken

      localStorage.setItem('oauth2-test-params', JSON.stringify(storedParams))
      setAccessToken(newAccessToken)
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const parseQueryString = () => {
    const fragmentString = window.location.hash.substring(1)
    const params = {}
    const regex = /([^&=]+)=([^&]*)/g
    let match

    while ((match = regex.exec(fragmentString))) {
      params[decodeURIComponent(match[1])] = decodeURIComponent(match[2])
    }

    if (Object.keys(params).length > 0) {
      localStorage.setItem('oauth2-test-params', JSON.stringify(params))
      window.history.replaceState({}, document.title, window.location.pathname)
      if (params.state && params.state === 'try_sample_request') {
        setAccessToken(params.access_token)
        setRefreshToken(params.refresh_token)
      }
      setIsLoading(false)
    } else {
      setIsLoading(false)
    }
  }

  return {
    accessToken,
    refreshToken,
    isLoading,
    error,
    oauth2SignIn,
    refreshAccessToken
  }
}
