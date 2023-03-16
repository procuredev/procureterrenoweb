import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
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
let {title, description, start, user, date, area} = doc

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

<Typography sx={{ fontSize: 14 }} color="textSecondary" gutterBottom>
          Estado
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
          09:30 am
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


      <TimelineItem>
        <TimelineOppositeContent color="textSecondary">
          09:30 am
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot />
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
        <Typography>Aprobado</Typography>
        <Typography variant="body2"> Aprobado por otrouser</Typography>
        </TimelineContent>
      </TimelineItem>

    </Timeline>
    </Timeline>
      </Dialog>
    </div>
  );
}
