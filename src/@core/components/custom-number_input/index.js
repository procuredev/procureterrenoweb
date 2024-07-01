import * as React from 'react'
import { unstable_useNumberInput as useNumberInput } from '@mui/base/unstable_useNumberInput'
import { unstable_useForkRef as useForkRef } from '@mui/utils'
import { StyledInputRoot, StyledInputElement, StyledStepperButton } from './NumberInputBasicStyles'

const NumberInputBasic = React.forwardRef(function NumberInputBasic(props, ref) {
  const { value, handleChange, onBlur, min, max, disabled } = props
  const enteredValue = !isNaN(value) ? parseFloat(value) : 0
  const [tempValue, setTempValue] = React.useState(enteredValue)

  const handleKeyDown = e => {
    // Permitir solo teclas numéricas y algunas teclas especiales
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End']

    console.log('Tecla presionada: ', e.key)

    if (allowedKeys.includes(e.key)) {
      console.log('Tecla permitida:', e.key)

      return
    }
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
      // Verifica que el valor ingresado sea numérico
      const newValue1 = e.key
      const newValue = !isNaN(newValue1) ? parseFloat(newValue1) : 0
      console.log('newValue1: ', newValue)
      if (/^\d*$/.test(newValue)) {
        console.log('newValue2: ', newValue)
        setTempValue(newValue)
        handleChange(newValue)
      } else {
        console.log('Entrada no permitida: ', newValue)
        e.preventDefault()
      }
    } else {
      e.preventDefault()
      console.log('Tecla no permitida:', e.key)
    }
  }

  const handleBlurInternal = event => {
    const newValue1 = event.target.value
    const newValue = !isNaN(newValue1) ? parseFloat(newValue1) : 0
    console.log('handleBlurInternal: ', newValue)
    if (onBlur) {
      onBlur(newValue)
    }
  }

  const handleButtonChange = newValue => {
    console.log('handleButtonChange')
    handleChange(newValue)
  }

  const { getRootProps, getInputProps, getIncrementButtonProps, getDecrementButtonProps, focused } = useNumberInput({
    value,
    disabled,
    min,
    max,
    onChange: (_, newValue) => {
      handleButtonChange(newValue)
    },
    onBlur: e => {
      handleBlurInternal(e)
    } //
  })

  const inputProps = getInputProps()
  inputProps.ref = useForkRef(inputProps.ref, ref)
  inputProps.onKeyDown = handleKeyDown
  inputProps.onBlur = e => handleBlurInternal(e)

  return (
    <StyledInputRoot {...getRootProps()} className={focused ? 'focused' : null}>
      <StyledStepperButton {...getIncrementButtonProps()} className='increment' disabled={disabled}>
        ▴
      </StyledStepperButton>
      <StyledStepperButton {...getDecrementButtonProps()} className='decrement' disabled={disabled}>
        ▾
      </StyledStepperButton>
      <StyledInputElement {...inputProps} value={tempValue} />
    </StyledInputRoot>
  )
})

export default NumberInputBasic
