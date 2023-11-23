import React from 'react'
import { Box, FormControl, ListItem, TextField, Typography } from '@mui/material'

function CustomListItem({
  editable,
  label,
  id,
  value,
  onChange,
  disabled = false,
  required = false,
  multiline = false,
  initialValue
})



{
  return (
    <>
      {editable ? (
        <ListItem id={`list-${label}`} divider={!editable}>
          <FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
            <TextField
              onChange={onChange}
              label={label}
              id={`${id}-input`}
              defaultValue={initialValue || ''}
              disabled={disabled}
              required={required}
              value={value}
              size='small'
              variant='standard'
              fullWidth={true}
              multiline={multiline}
            />
          </FormControl>
        </ListItem>
      ) : (
        initialValue && (
          <ListItem id={`list-${label}`} divider={!editable}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography component='div' sx={{ width: '30%' }}>
                {label}
              </Typography>
              <Typography component='div' sx={{ width: '70%' }}>
                {initialValue}
              </Typography>
            </Box>
          </ListItem>
        )
      )}
    </>
  )
}

export default CustomListItem
