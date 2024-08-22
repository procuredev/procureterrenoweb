// ** MUI Imports
import { useTheme } from '@emotion/react'
import InfoIcon from '@mui/icons-material/Info'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import OutlinedInput from '@mui/material/OutlinedInput'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import Icon from 'src/@core/components/icon'

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
  const { options, label, error, disabled, helper, required, ...selectProps } = props

  return (
    <Grid item xs={12}>
      <FormControl fullWidth sx={{ '& .MuiInputBase-root ': { width: '100%' } }} disabled={disabled} error={!!error}>
        <InputLabel>
          {label} {required && <span>*</span>}
        </InputLabel>
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

const CustomSelectOptions = props => {
  const { options, label, onChange, ...selectProps } = props

  return (
    <FormControl fullWidth sx={{ '& .MuiInputBase-root ': { width: '100%' } }}>
      <InputLabel>{label}</InputLabel>
      <Box display='flex' alignItems='center'>
        <Select input={<OutlinedInput label={label} onChange={onChange} />} {...selectProps}>
          {options &&
            options.map(option => {
              return (
                <MenuItem key={option.name || option} value={option.name || option}>
                  {option.name || option}
                </MenuItem>
              )
            })}
        </Select>
      </Box>
    </FormControl>
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

const FileList = props => {
  const { files, handleRemoveFile } = props
  const theme = useTheme()

  return (
    <Grid container spacing={2}>
      {files.map(file => (
        <Grid item key={file.name}>
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              border: `4px solid ${theme.palette.primary.main}`,
              borderRadius: '4px',
              width: '220px',
              position: 'relative' // Agregamos esta propiedad para posicionar el icono correctamente
            }}
          >
            {file.type.startsWith('image') ? (
              <img width={50} height={50} alt={file.name} src={URL.createObjectURL(file)} />
            ) : (
              <Icon icon='mdi:file-document-outline' fontSize={50} />
            )}
            <Typography
              variant='body2'
              sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', ml: '10px' }}
            >
              {`... ${file.name.slice(file.name.length - 15, file.name.length)}`}
            </Typography>
            <IconButton
              onClick={() => handleRemoveFile(file)}
              sx={{
                position: 'absolute', // Posicionamos el icono en relación al Paper
                top: '0px', // Ajusta el valor según la posición vertical deseada
                right: '0px' // Ajusta el valor según la posición horizontal deseada
              }}
            >
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Paper>
        </Grid>
      ))}
    </Grid>
  )
}

export {
  HeadingTypography,
  CustomTextField,
  CustomSelect,
  CustomAutocomplete,
  StyledTooltip,
  StyledInfoIcon,
  FileList,
  CustomSelectOptions
}
