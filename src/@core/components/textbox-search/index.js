import * as React from 'react'
import { useState } from 'react'

import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'

const filter = createFilterOptions()

export default function FreeSoloCreateOptionDialog(props) {
  const [value, setValue] = useState(null)
  const [open, toggleOpen] = useState(false)

  const handleClose = () => {
    setDialogValue({
      name: '',
      contact: ''
    })
    toggleOpen(false)
  }

  const [dialogValue, setDialogValue] = useState({
    name: '',
    contact: ''
  })

  const handleSubmit = () => {
    setValue({
      name: dialogValue.name,
      contact: dialogValue.contact
    })
    props.saveContact(dialogValue)
    handleClose()
  }

  return (
    <React.Fragment>
      <Autocomplete
        value={value}
        onChange={(event, newValue) => {
          props.setterFunction(event.target.innerText)
          if (typeof newValue === 'string') {
            // timeout to avoid instant validation of the dialog's form.
            setTimeout(() => {
              toggleOpen(true)
              setDialogValue({
                name: newValue,
                contact: ''
              })
            })
          } else if (newValue && newValue.inputValue) {
            toggleOpen(true)
            setDialogValue({
              name: newValue.inputValue,
              contact: ''
            })
          } else {
            setValue(newValue)
          }
        }}
        filterOptions={(options, params) => {
          const filtered = filter(options, params)

          if (params.inputValue !== '') {
            filtered.push({
              inputValue: params.inputValue,
              name: `Agregar "${params.inputValue}"`
            })
          }

          return filtered
        }}
        id='free-solo-dialog-demo'
        options={props.options}
        getOptionLabel={option => {
          // e.g value selected with enter, right from the input
          if (typeof option === 'string') {
            return option
          }
          if (option.inputValue) {
            return option.inputValue
          }

          return option.name
        }}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        renderOption={(props, option) => <li {...props}>{option.name}</li>}
        freeSolo
        renderInput={params => <TextField {...params} label={props.label} error={props.error} />}
      />
      <Dialog open={open} onClose={handleClose}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Agregar nuevo {props.label}</DialogTitle>
          <DialogContent>
            <DialogContentText>Si la persona que buscas no está disponible, agrégal@ aquí</DialogContentText>
            <TextField
              autoFocus
              margin='dense'
              id='name'
              value={dialogValue.name}
              onChange={event =>
                setDialogValue({
                  ...dialogValue,
                  name: event.target.value
                })
              }
              label='Nombre'
              type='text'
              variant='standard'
            />
            <TextField
              margin='dense'
              id='name'
              value={dialogValue.contact}
              onChange={event =>
                setDialogValue({
                  ...dialogValue,
                  contact: event.target.value
                })
              }
              label='Contacto'
              variant='standard'
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleClose()}>Cancelar</Button>
            <Button onClick={() => handleSubmit()}>Agregar</Button>
          </DialogActions>
        </form>
      </Dialog>
    </React.Fragment>
  )
}
