// ** React Imports
import { useEffect } from 'react'

// ** Next Imports
import { useRouter } from 'next/router'

// ** Spinner Import
import Spinner from 'src/@core/components/spinner'

// ** Hook Imports
import { useFirebase } from 'src/context/useFirebaseAuth'

const getHomeRoute = (authUser) => {
  if (authUser) {
    return '/home'
  }

  return '/login'
}

const Home = () => {
  // ** Hooks
  const { authUser, loading } = useFirebase()
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) {
      return
    }
    if (!loading) {
      const fetchHomeRoute = async () => {
        const homeRoute = getHomeRoute(authUser)

        // Wait for authUser to change
        await authUser

        // Redirect user to Home URL
        router.replace(homeRoute)
      }

      fetchHomeRoute()
    }


    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, router.isReady])

  return <Spinner />
}

export default Home
