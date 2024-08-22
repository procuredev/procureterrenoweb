// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Import
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import Avatar from 'src/@core/components/mui/avatar'

// ** Hooks
import { useRouter } from 'next/router'
import { useFirebase } from 'src/context/useFirebase'

// Función que llenará los datos de cada card
const AppCard = ({ name, job, photo, description, linkedin }) => {
  const [expanded, setExpanded] = useState(false)

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  let shortDescription = ''
  if (description) {
    shortDescription = description.substring(0, 150)
  }

  let avatarContent
  if (Array.isArray(photo) && photo.length === 0) {
    // `photo` es un array vacío, proporcionar un valor predeterminado
    avatarContent = (
      <Avatar
        sx={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          objectFit: 'contain',
          bgcolor: 'primary.main'
        }}
      />
    )
  } else if (photo && typeof photo === 'string') {
    // `photo` es una imagen válida
    avatarContent = (
      <Avatar
        src={photo}
        alt={name}
        sx={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          objectFit: 'contain'
        }}
      />
    )
  } else {
    // No hay `photo` proporcionada, usar avatar con iniciales del nombre
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
    avatarContent = (
      <Avatar
        sx={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          objectFit: 'contain',
          bgcolor: 'primary.main',
          fontSize: '72px' // Tamaño de la fuente ajustado
        }}
      >
        {initials.toUpperCase()}
      </Avatar>
    )
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Box sx={{ position: 'absolute' }}>{avatarContent}</Box>
          {photo && typeof photo === 'string' && (
            <CardMedia
              component='img'
              sx={{
                width: 180,
                height: 180,
                borderRadius: '50%',
                objectFit: 'contain'
              }}
              image={photo}
            />
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant='h6' sx={{ mb: 1 }}>
            {name}
          </Typography>
          <Typography variant='h8' sx={{ mb: 4 }}>
            {job}
          </Typography>
          <Typography variant='body2' sx={{ mt: 2 }} textAlign='justify'>
            {description && (
              <>
                {expanded ? description : shortDescription}
                {description.length > 150 && !expanded && '...'}
              </>
            )}
          </Typography>
          {description && description.length > 150 && (
            <IconButton
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label='show more'
              sx={{ alignSelf: 'flex-end' }}
            >
              <ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </IconButton>
          )}
        </CardContent>
        {linkedin && (
          <Box sx={{ position: 'absolute', top: 15, right: 15 }}>
            <Link href={linkedin} target='_blank' rel='noopener'>
              <LinkedInIcon />
            </Link>
          </Box>
        )}
      </Box>
    </Card>
  )
}

const NuestroEquipo = () => {
  // ** Hooks
  const { authUser, getUserData } = useFirebase() // Importación de todos los usuarios que pertenezcan a Procure
  const router = useRouter() // Importación de router... no sé que utlidad le daré

  // ** States
  const [procureUsers, setProcureUsers] = useState([]) // declaración de constante donde se almacenan los datos de los usuarios de procure

  // useEffect para almacenar dentro de procureUsers
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getUserData('getAllProcureUsers')
        const enabledUsers = users.filter(user => (user.enabled != false))

        setProcureUsers(enabledUsers)
      } catch (error) {
        console.error('Error al obtener los usuarios de Procure:', error)
      }
    }

    fetchUsers()
  }, [])

  // Declaración de varibles: array usuarios, prioridad (orden en que serán mostrados), jon (cargo)
  let users = [] // array que almacenará los usuarios que cumplen con las condiciones
  let priority // número para poder mostrarlos en orden de prioridad
  let job // string donde se indicará el nombre de su rol

  // iteración para llenar el array users con los datos de los usuarios pertenecientes a Procure
  procureUsers.forEach(object => {
    // Se almacenarán todos los usuarios Procure que tienen roles 5, 6, 7 u 8
    if (object.role == 5 || object.role == 6 || object.role == 7 || object.role == 8) {
      if (object.role == 6) {
        priority = 1
        job = 'Administrador de Contrato'
      } else if (object.role == 7) {
        priority = 2
        job = 'Supervisor de Terreno'
      } else if (object.role == 5) {
        priority = 3
        job = 'Planificador'
      } else {
        priority = 4
        job = 'Proyectista de Terreno'
      }
      users.push({
        name: object.name,
        priority: priority,
        job: job,
        photo: object.urlFoto,
        description: object.description,
        linkedin: object.linkedin
      })
    }
  })

  // Se ordena el array users para que se muestre de mayor prioridad a menor prioridad
  users.sort((a, b) => a.priority - b.priority)

  return (
    <Grid container spacing={2}>
     {procureUsers.length > 0 ? (
        users.map((user, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <AppCard {...user} />
          </Grid>
        ))
      ) : (
        <Typography variant="body1">Cargando usuarios...</Typography>
      )}
    </Grid>
  )
}

NuestroEquipo.acl = {
  subject: 'nuestro-equipo'
}

export default NuestroEquipo
