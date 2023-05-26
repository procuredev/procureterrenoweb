import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent, timelineOppositeContentClasses } from '@mui/lab';
import AlertDialog from 'src/@core/components/dialog-warning';
import dictionary from 'src/@core/components/dictionary/index'
import { unixToDate } from 'src/@core/components/unixToDate';
import { useFirebase } from 'src/context/useFirebaseAuth';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});



export const FullScreenDialog = ({ open, handleClose, doc }) => {
  let { title, state, description, start, user, date, area, events, id } = doc
  const [values, setValues] = useState({})
  const [editable, setEditable] = useState(false)
  const [openAlert, setOpenAlert] = useState(false)

  const { updateDocs, useEvents } = useFirebase()

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  let display = fullScreen ? 'auto' : 'none'

// Verifica estado
  state = typeof state === 'number' ? state : 100

  const eventData = useEvents(id)

// Actualiza el estado al cambiar de documento, sólo valores obligatorios
  useEffect(() => {
    setValues({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      start: doc.start,
      area: doc.area,
    })
  }, [doc])

// Handlea dialog

  const handleOpenAlert = () => {
    setOpenAlert(true)
  };

  const writeCallback = () => {
    updateDocs(values.id, values)
    handleCloseAlert()
  }

  const handleCloseAlert = () => {
    setOpenAlert(false);
    setEditable(false);
  };


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
            Cerrar
          </Button>
        </Toolbar>
      </AppBar>

      <AlertDialog open={openAlert} handleClose={handleCloseAlert} callback={() => writeCallback()}></AlertDialog>

      <Paper sx={{ maxWidth: 700, margin: 'auto', padding: '30px', overflowY: 'hidden' }}>
        <Timeline sx={{ [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.2 } }}>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Chip label={state? dictionary[state].title:'Cargando...'} color={state? dictionary[state].color:'primary'} size='small' sx={{ width: 90 }} />
            <Box>
              <IconButton onClick={() => setEditable(prev => !prev)} color="primary" aria-label="edit" component="button">
                <Edit />
              </IconButton>
              <IconButton onClick={() => handleClose()} color="primary" aria-label="edit" component="button">
                {/*este botón debería cerrar y setEditable false*/}
                <Close />
              </IconButton>
            </Box>
          </Box>

          <Typography variant='button' sx={{ fontSize: 14, mb: 2 }} color="textSecondary">
            {state? dictionary[state].details:''}
          </Typography>
          {editable ? <TextField
            onChange={e => setValues({ ...values, title: e.target.value })}
            label="Título"
            id="title-input"
            defaultValue={title}
            size="small"
            sx={{ mt: 5, mb: 5, mr: 2 }}
          /> : <Typography variant="h5" sx={{ mb: 2.5 }} component="div">
            {title}
          </Typography>}

          {editable ? <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            <TextField
              onChange={e => setValues({ ...values, area: e.target.value })}
              label="Área"
              id="area-input"
              defaultValue={area}
              size="small"
              sx={{ mb: 5, mr: 2, flex: 'auto' }}
            />
            <TextField
              InputLabelProps={{ shrink: true }}
              onChange={e => setValues({ ...values, start: new Date(e.target.value) })}
              label="Fecha de inicio"
              type="date"
              id="start-input"
              defaultValue={start && unixToDate(start.seconds)}
              size="small"
              sx={{ mb: 5, mr: 2, flex: 'auto' }}
            /></Box> : <Typography sx={{ mb: 4 }} color="textSecondary">
            Área {area} | Fecha de inicio: {start && unixToDate(start.seconds)[0]}
          </Typography>}

          {editable && <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            <TextField
              onChange={e => setValues({ ...values, ot: e.target.value })}
              label="OT"
              id="OT-input"
              defaultValue='Asignar OT'
              size="small"
              sx={{ mb: 5, mr: 2, flex: 'auto' }}
            />

            <TextField
              onChange={e => setValues({ ...values, end: new Date(e.target.value) })}
              InputLabelProps={{ shrink: true }}
              label="Fecha de término"
              type="date"
              id="end-input"
              size="small"
              sx={{ mb: 5, mr: 2, flex: 'auto' }}
            />
            <TextField
              onChange={e => setValues({ ...values, shift: e.target.value })}
              label="Asignar turno"
              id="shift-input"
              defaultValue='Turno'
              size="small"
              sx={{ mb: 5, mr: 2, flex: 'auto' }}
            />
          </Box>

          }

          {editable ? <TextField
            onChange={e => setValues({ ...values, description: e.target.value })}
            label="Descripción"
            id="desc-input"
            defaultValue={description}
            size="small"
            sx={{ mb: 5, mr: 2 }}
          /> : <Typography variant="body2" sx={{ mb: 3 }}>
            {description}
          </Typography>}
          {editable ? <Button onClick={() => handleOpenAlert()} variant="contained">Guardar</Button> : null}
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
              <Typography >{state ? (dictionary[state].details) : ''}</Typography>
              <Typography variant="body2"> Creado por {user}</Typography>
            </TimelineContent>
          </TimelineItem>

          {eventData && eventData.length > 0 && eventData.map((element) => {
            let modified = (element.prevDoc) ? 'Modificado' : 'Aprobado'
            let status = (element.newState === 9) ? 'Rechazado' : modified


            return (
              <div key={element.date}>
                <TimelineItem>
                  <TimelineOppositeContent color="textSecondary">
                    {unixToDate(element.date.seconds)}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body1">{status} por {element.author}</Typography>
                    <Typography variant="body2">{dictionary[element.newState].details}</Typography>
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
