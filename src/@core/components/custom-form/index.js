// ** MUI Imports
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import InfoIcon from '@mui/icons-material/Info'
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip'
import Autocomplete from '@mui/material/Autocomplete'
import OutlinedInput from '@mui/material/OutlinedInput'

// Styled component for the heading inside the dropzone area
const HeadingTypography = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(5),
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(4)
  }
}))

//Styled tooltip-popover
const StyledTooltip = styled(({ className, ...props }) => <Tooltip {...props} classes={{ popper: className }} />)(
  ({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.grey[700],
      color: 'white',
      boxShadow: theme.shadows[1],
      fontSize: '1.0em', // Aquí es donde especificas el tamaño del texto
      padding: theme.spacing(4, 4)
    }
  })
)

const StyledInfoIcon = styled(InfoIcon)(({ theme }) => ({
  marginLeft: theme.spacing(4) // Añade un margen a la izquierda del InfoIcon
}))

const CustomTextField = props => {
  const { error, required, ...textProps } = props

  return (
    <Grid item xs={12}>
      <Box display='flex' alignItems='center'>
        <TextField
          fullWidth
          InputLabelProps={{ required: required ? true : false }}
          error={error ? true : false}
          helperText={error}
          {...textProps}
        />
        <StyledTooltip title={props.helper}>
          <StyledInfoIcon color='action' />
        </StyledTooltip>
      </Box>
    </Grid>
  )
}

const CustomSelect = props => {
  const { options, label, error, disabled, helper, ...selectProps } = props

  return (
    <Grid item xs={12}>
      <FormControl fullWidth sx={{ '& .MuiInputBase-root ': { width: '100%' } }} disabled={disabled} error={error}>
        <InputLabel>{label}</InputLabel>
        <Box display='flex' alignItems='center'>
          <Select input={<OutlinedInput label={label} />} {...selectProps}>
            {options &&
              options.map(option => {
                return (
                  <MenuItem key={option.name || option} value={option.name || option}>
                    {option.name || option}
                  </MenuItem>
                )
              })}
          </Select>
          <StyledTooltip title={helper}>
            <StyledInfoIcon color='action' />
          </StyledTooltip>
        </Box>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    </Grid>
  )
}

const CustomAutocomplete = props => {
  const { error, label, helper, required, ...autoProps } = props

  return (
    <Grid item xs={12}>
      <FormControl fullWidth>
        <Box display='flex' alignItems='center'>
          <Autocomplete
            getOptionLabel={option => option.name || option}
            multiple
            fullWidth
            {...autoProps}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  key={index}
                  label={option.name || option}
                  {...getTagProps({ index })}
                  disabled={option.disabled}
                />
              ))
            }
            renderInput={params => (
              <TextField
                {...params}
                label={label}
                InputLabelProps={{ required: required }}
                error={error ? true : false}
                helperText={error}
              />
            )}
          />
          <StyledTooltip title={helper}>
            <StyledInfoIcon color='action' />
          </StyledTooltip>
        </Box>
      </FormControl>
    </Grid>
  )
}

export { HeadingTypography, CustomTextField, CustomSelect, CustomAutocomplete, StyledTooltip, StyledInfoIcon }
