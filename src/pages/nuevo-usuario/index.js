// ** React Imports
import { useState } from 'react'

// ** MUI Components
import { styled, useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'
import FormLayoutsRegister from 'src/views/pages/forms/form-layouts/FormLayoutsRegister'

const NuevoUsuario = () => {


  return (
    <Box>
      <FormLayoutsRegister />
    </Box>
  )
}

/* NuevoUsuario.getLayout = page => <BlankLayout>{page}</BlankLayout>
NuevoUsuario.guestGuard = true */

export default NuevoUsuario
