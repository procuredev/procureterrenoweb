import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function AlertDialogGabinete({open, handleClose, callback, approves, authUser, setDevolutionRemarks, devolutionRemarks}) {

  return (

      <Dialog
        open={open}
        onClose={handleClose}
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
          {!approves ? (<TextField
            sx={{mt: 4}}
            label='Observación'
            onChange={e => setDevolutionRemarks(e.target.value)}
          />) : ''}

        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>No</Button>
          <Button onClick={callback} autoFocus>
            Sí
          </Button>
        </DialogActions>
      </Dialog>

  );
}
