// ** React Imports
import { useEffect } from 'react'

// ** Next Imports
import { useRouter } from 'next/router'

// ** Spinner Import
import Spinner from 'src/@core/components/spinner'

// ** Hook Imports
import { useFirebase } from 'src/context/useFirebaseAuth'

export const getHomeRoute = async (authUser) => {
  await authUser(); // esperar a que se resuelva la promesa
  const user = await authUser(); // obtener el valor de la promesa
  if (user) {
    return '/home'
  }

  return '/login'
}

const Home = () => {
  // ** Hooks
  const { authUser } = useFirebase()
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) {
      return
    }

    const fetchHomeRoute = async () => {
      const homeRoute = await getHomeRoute(authUser)

      // Redirect user to Home URL
      router.replace(homeRoute)
    }

    fetchHomeRoute()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, router.isReady])

  return <Spinner />
}

export default Home
