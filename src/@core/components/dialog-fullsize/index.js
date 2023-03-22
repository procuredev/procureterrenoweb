import * as React from 'react';
import { useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Close from '@mui/icons-material/Close'
import Dialog from '@mui/material/Dialog';
import Paper from '@mui/material/Paper';
import Box from '@mui/system/Box';
import TextField from '@mui/material/TextField';
import Edit from '@mui/icons-material/Edit';
import AppBar from '@mui/material/AppBar';
import Chip from '@mui/material/Chip';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent, timelineOppositeContentClasses } from '@mui/lab';

import { unixToDate } from 'src/@core/components/unixToDate';


const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});



export const FullScreenDialog = ({ open, handleClose, doc }) => {
  let { title, state, description, start, user, date, area, events, id } = doc
  const [editable, setEditable] = useState(false)
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  let display = fullScreen ? 'auto' : 'none'

  state = typeof state === 'number' ? state : 100

  const dictionary = {
    1: { title: 'En revisión', details: 'En espera de revisión por Contract Operator', color: 'primary' },
    2: { title: 'En revisión', details: 'En espera de revisión por Contract Owner', color: 'primary' },
    3: { title: 'En revisión', details: 'En espera de revisión por Planificador', color: 'primary' },
    4: { title: 'En revisión', details: 'En espera de revisión por Administrador de contrato', color: 'primary' },
    5: { title: 'En revisión', details: 'En espera de revisión por Supervisor', color: 'primary' },
    6: { title: 'Aprobado', details: 'Aprobado por supervisor', color: 'success' },
    0: { title: 'Rechazado', details: 'Rechazado', color: 'error' },
    100: { title: 'Loading', details: 'Loading', color: 'primary' }
  }



  return (

    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={() => handleClose()}
      TransitionComponent={Transition}
      scroll='body'
    >
      <AppBar sx={{ position: 'relative', display: { display } }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => handleClose()}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Detalles de la solicitud
          </Typography>
          <Button autoFocus color="inherit" onClick={() => handleClose()}>
            Guardar
          </Button>
        </Toolbar>
      </AppBar>


      <Paper sx={{ maxWidth: 700, margin: 'auto', padding: '30px', overflowY: 'hidden' }}>
        <Timeline sx={{ [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.2 } }}>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Chip label={dictionary[state].title} color='primary' size='small' sx={{ width: 90 }} />
            <Box>
            <IconButton onClick={()=>setEditable(prev=>!prev)} color="primary" aria-label="edit" component="button">
              <Edit />
            </IconButton>
            <IconButton onClick={()=>handleClose()} color="primary" aria-label="edit" component="button">
              {/*este botón debería cerrar y setEditable false*/}
              <Close />
            </IconButton>
            </Box>
          </Box>

          <Typography variant='button' sx={{ fontSize: 14, mb:2 }} color="textSecondary">
          {dictionary[state].details}
          </Typography>

          {editable ? <TextField
            label="Título"
            id="title-input"
            defaultValue={title}
            size="small"
            sx={{ mt:5, mb: 5,mr:2 }}
          /> : <Typography variant="h5" sx={{ mb: 2.5 }} component="div">
            {title}
          </Typography>}

          {editable ? <Box sx={{ display:'flex', flexWrap:'wrap' }}>
            <TextField
              label="Área"
              id="area-input"
              defaultValue={area}
              size="small"
              sx={{ mb: 5,mr:2, flex: 'auto' }}
            />
            <TextField
              label="Fecha de inicio"
              type="date"
              id="start-input"
              defaultValue={start && unixToDate(start.seconds)}
              size="small"
              sx={{ mb: 5,mr:2, flex: 'auto'}}
            /></Box> : <Typography sx={{ mb: 4 }} color="textSecondary">
            Área {area} | Fecha de inicio: {start && unixToDate(start.seconds)}
          </Typography>}

          {editable ? <TextField
            label="Descripción"
            id="desc-input"
            defaultValue={description}
            size="small"
            sx={{ mb: 5,mr:2 }}
          /> : <Typography variant="body2" sx={{ mb: 3 }}>
            {description}
          </Typography>}

          {editable ? <Button variant="contained">Guardar</Button> : null}
          {/*este botón debería preguntar si estás seguro, y si dice que sí abrir un dialog que permita: hacer observación+guardar+set edit false+cerrar */}

          <TimelineItem sx={{ mt: 1 }}>
            <TimelineOppositeContent color="textSecondary">
              {date && unixToDate(date.seconds)}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography >En revisión</Typography>
              <Typography variant="body2"> Creado por {user}</Typography>
            </TimelineContent>
          </TimelineItem>

          {events && events.length > 0 && events.map((element) => {
            return (
              <div key={id}>
                <TimelineItem>
                  <TimelineOppositeContent color="textSecondary">
                    {unixToDate(element.date.seconds)}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography >Cambio de {element.prevState} a {element.newState}</Typography>
                    <Typography variant="body2">Por {element.author}</Typography>
                  </TimelineContent>
                </TimelineItem>
              </div>
            )
          })}

        </Timeline>
      </Paper>
    </Dialog>

  );
}
