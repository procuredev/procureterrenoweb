import * as React from 'react'
import { Unstable_NumberInput as BaseNumberInput, numberInputClasses } from '@mui/base/Unstable_NumberInput'
import { styled } from '@mui/system'

const NumberInput = React.forwardRef(function CustomNumberInput(props, ref) {
  const { onChange, onBlur, disabled, ...other } = props

  const handleChange = (e, value) => {
    console.log('value from CustomNumberInput: ', value)

    const numericValue = Math.min(parseInt(value, 10), 12)
    if (!isNaN(numericValue)) {
      if (onChange) {
        onChange(numericValue)
      }
    }
  }

  const handleBlur = e => {
    if (onBlur) {
      onBlur(e)
    }
  }

  return (
    <BaseNumberInput
      slots={{
        root: StyledInputRoot,
        input: StyledInputElement,
        incrementButton: StyledButton,
        decrementButton: StyledButton
      }}
      slotProps={{
        incrementButton: {
          children: '▴'
        },
        decrementButton: {
          children: '▾'
        }
      }}
      {...other}
      onChange={handleChange}
      onBlur={handleBlur}
      ref={ref}
      disabled={disabled}
      onKeyDown={(e, value) => {
        // Permitir solo teclas numéricas y algunas teclas especiales
        const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End']

        if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
          console.log('e.key: ', e.key)
          console.log('e.keyCode: ', e.keyCode)
          //e.preventDefault()

          const numericValue = Math.min(parseInt(e.key, 10), 12)
          if (!isNaN(numericValue)) {
            if (onChange) {
              onChange(numericValue)
            }
          }
        } else {
          if (e.keyCode <= 48 || e.keyCode >= 57 || e.keyCode <= 96 || e.keyCode >= 105) {
            console.log('2e.key: ', e.key)
            console.log('2e.keyCode: ', e.keyCode)
            e.preventDefault()
          }
        }
      }}
    />
  )
})

export default function NumberInputBasic({ value, onChange, onBlur, min, max, disabled }) {
  const safeValue = value !== undefined && !isNaN(value) ? value : ''

  return (
    <NumberInput
      aria-label='Demo number input'
      placeholder='Horas'
      variant='outlined'
      value={safeValue}
      min={min}
      max={max}
      onChange={onChange}
      onBlur={onBlur}
      sx={{ my: 5 }}
      disabled={disabled}
    />
  )
}

const blue = {
  100: '#DAECFF',
  200: '#80BFFF',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0072E5'
}

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#484952',
  900: '#1C2025'
}

const StyledInputRoot = styled('div')(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 700;
  border-radius: 8px;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: ${theme.palette.mode === 'dark' ? grey[800] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? '#6b6c78' : grey[200]};

  display: grid;
  grid-template-columns: 1fr 19px;
  grid-template-rows: 1fr 1fr;
  overflow: hidden;
  column-gap: 8px;
  padding: 4px;
  width: 100%;

  &.${numberInputClasses.focused} {
    border-color: ${'#88b340'};
  }

  &:hover {
    border-color: ${'#88b340'};
  }

  &:focus-visible {
    outline: 0;
  }
`
)

const StyledInputElement = styled('input')(
  ({ theme }) => `
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 700;
  line-height: 1.5;
  grid-column: 1/2;
  grid-row: 1/3;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: inherit;
  border: none;
  border-radius: inherit;
  padding: 8px 12px;
  outline: 0;
  width: 48px;
`
)

const StyledButton = styled('button')(
  ({ theme }) => `
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  appearance: none;
  padding: 0;
  width: 19px;
  height: 19px;
  font-family: system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1;
  box-sizing: border-box;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 0;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;

  &:hover {
    background: ${theme.palette.mode === 'dark' ? grey[800] : grey[50]};
    border-color: ${theme.palette.mode === 'dark' ? grey[600] : grey[300]};
    cursor: pointer;
  }

  &.${numberInputClasses.incrementButton} {
    grid-column: 2/3;
    grid-row: 1/2;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    border: 1px solid;
    border-bottom: 0;
    &:hover {
      cursor: pointer;
      background: ${'#88b340'};
      color: ${grey[50]};
    }
    border-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[200]};
    background: ${theme.palette.mode === 'dark' ? grey[800] : grey[50]};
    color: ${theme.palette.mode === 'dark' ? grey[200] : grey[900]};
  }

  &.${numberInputClasses.decrementButton} {
    grid-column: 2/3;
    grid-row: 2/3;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    border: 1px solid;
    &:hover {
      cursor: pointer;
      background: ${'#88b340'};
      color: ${grey[50]};
    }
    border-color: ${theme.palette.mode === 'dark' ? grey[800] : grey[200]};
    background: ${theme.palette.mode === 'dark' ? grey[800] : grey[50]};
    color: ${theme.palette.mode === 'dark' ? grey[200] : grey[900]};
  }
`
)
