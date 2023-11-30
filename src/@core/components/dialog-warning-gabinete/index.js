import * as React from 'react';
import { useState } from 'react'
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

export default function AlertDialogGabinete({open, handleClose, callback, approves, authUser, setRemarksState, blueprint}) {
  const [toggleRemarks, setToggleRemarks] = useState(false)

  return (

      <Dialog
        open={open}
        onClose={()=> {handleClose(); setToggleRemarks(false)}}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
        {(authUser.role === 8 ? 'Enviar' : approves ? 'Aprobar' : 'Rechazar')} entregable de la solicitud
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Estás segur@ de que quieres {(authUser.role === 8 ? 'enviar' : approves ? 'aprobar' : 'rechazar')} los entregables?
          </DialogContentText>

          { approves && authUser.role === 9 && blueprint.approvedByDocumentaryControl === true  ? (
              <FormControlLabel
                control={<Switch onChange={() => setToggleRemarks(!toggleRemarks)} />}

                label="Agregar Comentario"
              />
            ) : !approves ?(
              <FormControlLabel
                control={<Switch onChange={() => setToggleRemarks(!toggleRemarks)} />}
                label="Agregar Observasión"
              />
            ) : ''
          }

          {toggleRemarks && !approves ? (
              <TextField
              sx={{mt: 4}}
              label='Observación'
              onChange={e => setRemarksState(e.target.value)}
            />
            ) : toggleRemarks ? (
              <TextField
                sx={{mt: 4}}
                label='Comentario'
                onChange={e => setRemarksState(e.target.value)}
              />
            ) : ''
          }




        </DialogContent>
        <DialogActions>
          <Button onClick={()=> {handleClose(); setToggleRemarks(false)}}>No</Button>
          <Button onClick={callback} autoFocus>
            Sí
          </Button>
        </DialogActions>
      </Dialog>

  );
}
