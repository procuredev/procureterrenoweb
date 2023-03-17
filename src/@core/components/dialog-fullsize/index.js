import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Chip from '@mui/material/Chip';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent, timelineOppositeContentClasses } from '@mui/lab';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const FullScreenDialog = ({open, handleClose, doc}) => {
let {title, state, description, start, user, date, area, events, id} = doc
state = state || 100

const dictionary = {
  1: {title:'En revisión', details:'En espera de revisión por Contract Operator', color:'primary'},
  2: {title:'En revisión', details:'En espera de revisión por Contract Owner', color:'primary'},
  3: {title:'En revisión', details:'En espera de revisión por Planificador', color:'primary'},
  4: {title:'En revisión', details:'En espera de revisión por Administrador de contrato', color:'primary'},
  5: {title:'En revisión', details:'En espera de revisión por Supervisor', color:'primary'},
  6: {title:'Aprobado', details:'Aprobado por supervisor', color:'success'},
  0: {title:'Rechazado', details:'Rechazado', color:'error'},
  100: {title: 'Loading', details:'Loading', color:'primary'}
}

  return (
    <div>
      <Dialog
        fullScreen
        open={open}
        onClose={()=>handleClose()}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={()=>handleClose()}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
             Detalles de la solicitud
            </Typography>
            <Button autoFocus color="inherit" onClick={()=>handleClose()}>
              Guardar
            </Button>
          </Toolbar>
        </AppBar>
    <Timeline>
    <Timeline
      sx={{
        [`& .${timelineOppositeContentClasses.root}`]: {
          flex: 0.2,
        },
      }}
    >
<Chip label={dictionary[state].title} color='primary' size='small' sx={{ width:100, mb: 3  }} />
<Typography sx={{ fontSize: 14 }} color="textSecondary" gutterBottom>
        </Typography>
        <Typography sx={{ fontSize: 14 }} color="textSecondary" gutterBottom>
          {dictionary[state].details}
        </Typography>
        <Typography variant="h5" sx={{ mb: 1.5 }} component="div">
          {title}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="textSecondary">
          Área {area} | Fecha de inicio: {start}
        </Typography>
        <Typography variant="body2" sx={{ mb: 5 }}>
        {description}
        </Typography>

      <TimelineItem>
        <TimelineOppositeContent color="textSecondary">
        Fecha en UNIX {date && date.seconds}
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

        {events && events.length>0 && events.map((element)=>{
          return(
          <div key={id}>
            <TimelineItem>
        <TimelineOppositeContent color="textSecondary">
        Fecha en UNIX {element.date.seconds}
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
    </Timeline>
      </Dialog>
    </div>
  );
}
