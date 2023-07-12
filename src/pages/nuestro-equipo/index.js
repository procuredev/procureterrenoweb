// ** MUI Import
import { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardMedia from '@mui/material/CardMedia'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import Link from '@mui/material/Link'
import IconButton from '@mui/material/IconButton'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const equipo = [
  {
    nombre: 'Rodrigo Fernández Rojas',
    cargo: 'Administrador de Contrato',
    imagen: '/images/avatars/card-stats-img-1.png',
    descripcion:
      'Profesional con mas 30 años de experiencia en el área de construcción e inspección de proyectos del área industrial, mediana minería y gran minería.',

    linkedin: ''
  },
  {
    nombre: 'Juan Pablo González Aguilera',
    cargo: 'Supervisor de Terreno',
    imagen: '/images/avatars/card-stats-img-3.png',
    descripcion:
      'Profesional con mas de 15 años de experiencia en faenas mineras; siendo su especialidad las áreas de Mecánica, Cañerías, Estructuras y Obras Civles Posee conocimientos en distintos softwares de diseño, fabricación y control de proyectos.',
    linkedin: 'https://www.linkedin.com/in/juan-pablo-gonz%C3%A1lez-aguilera-29b51476/'
  },
  {
    nombre: 'Luis Ordenes Teca',
    cargo: 'Supervisor de Terreno',
    imagen: '/images/avatars/card-stats-img-3.png',
    descripcion:
      'Profesional con 10 años de experiencia en empresas de ingeniería, diseñando planos y realizando levantamientos de información en terreno.',
    linkedin: ''
  },
  {
    nombre: 'Nicole Reyes Cea',
    cargo: 'Planificación y Control Documental',
    imagen: '/images/avatars/card-stats-img-2.png',
    descripcion:
      'Ingeniera Civil de la Universiad del BioBio. Posee experiencia en Control de Proyectos usando herramientas tales como MS Office Y Primavera.',
    linkedin: 'https://www.linkedin.com/in/nicole-reyes-cea-55957720b/'
  },
  {
    nombre: 'Robert Dahmen Macaya',
    cargo: 'Jefe de Administración',
    imagen: '/images/avatars/card-stats-img-1.png',
    descripcion:
      'Contador Auditor e Ingeniero Comercial. Tiene experiencia en creación, preparación y elaboración de informes contales, financieros y de planificación para toma de deciciones gerenciales.',
    linkedin: 'https://www.linkedin.com/in/robert-dahmen-macaya-88959918/'
  },
  {
    nombre: 'Luzmira Urzua',
    cargo: 'HSE Prevención de Riesgo',
    imagen: '/images/avatars/card-stats-img-2.png',
    descripcion: '',
    linkedin: ''
  },
  {
    nombre: 'Marcelo Salvador Ahumada',
    cargo: 'Proyectista de Terreno',
    imagen: '/images/avatars/card-stats-img-1.png',
    descripcion: '',
    linkedin: ''
  },
  {
    nombre: 'Robert Santander Aliaga',
    cargo: 'Proyectista de Terreno',
    imagen: '/images/avatars/card-stats-img-1.png',
    descripcion:
      'Profesional con 22 años de experiencia. Ha trabajado en proyectos de ingeniería conceptúal, básica, detalle, fabricación, montaje, construcción y mantenimiento. Realizando levantamientos en terreno y diseño de planos de ingeniería. Posee conocimiento avanzado de AutoCAD 2D- 3D, levantamiento 3D con escáner laser, manejo de nube de punto a través de softwares Imageware y Recap Proyect.',
    linkedin: ''
  },
  {
    nombre: 'Omar Figueroa Castro',
    cargo: 'Proyectista de Terreno',
    imagen: '/images/avatars/card-stats-img-1.png',
    descripcion:
      'Profesional con experiencia en confección de proyectos mineros, arquitectónicos, eléctricos, estructuras, levantamientos y topográficos.',
    linkedin: ''
  },
  {
    nombre: 'Andrés Inostroza Rivera',
    cargo: 'Proyectista de Terreno',
    imagen: '/images/avatars/card-stats-img-1.png',
    descripcion: '',
    linkedin: ''
  },
  {
    nombre: 'Francisco Cantizano',
    cargo: 'Proyectista de Terreno',
    imagen: '/images/avatars/card-stats-img-1.png',
    descripcion: '',
    linkedin: ''
  },
  {
    nombre: 'Rodrigo González Cortez',
    cargo: 'Proyectista de Terreno',
    imagen: '/images/avatars/card-stats-img-1.png',
    descripcion: '',
    linkedin: ''
  },
  {
    nombre: 'Berta Lara',
    cargo: 'Topógrafo',
    imagen: '/images/avatars/card-stats-img-2.png',
    descripcion: '',
    linkedin: ''
  },
  {
    nombre: 'Benjamín Vásquez',
    cargo: 'Topógrafo',
    imagen: '/images/avatars/card-stats-img-3.png',
    descripcion: '',
    linkedin: ''
  }
]

const NuestroEquipo = () => {
  return (
    <Grid container spacing={2}>
      {equipo.map((persona, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <AppCard {...persona} />
        </Grid>
      ))}
    </Grid>
  )
}

const AppCard = ({ nombre, cargo, imagen, descripcion, linkedin }) => {
  const [expanded, setExpanded] = useState(false)

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  const shortDescription = descripcion.substring(0, 150)

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CardMedia
            component='img'
            sx={{
              width: 180,
              height: 180,
              borderRadius: '50%',
              objectFit: 'contain'
            }}
            image={imagen}
          />
        </Box>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant='h6' sx={{ mb: 1 }}>
            {nombre}
          </Typography>
          <Typography variant='h8' sx={{ mb: 4 }}>
            {cargo}
          </Typography>
          <Typography variant='body2' sx={{ mt: 2 }} textAlign='justify'>
            {expanded ? descripcion : shortDescription}
            {descripcion.length > 150 && !expanded && '...'}
          </Typography>
          {descripcion.length > 150 && (
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

export default NuestroEquipo
