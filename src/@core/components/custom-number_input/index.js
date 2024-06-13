import * as React from 'react'
import { unstable_useNumberInput as useNumberInput } from '@mui/base/unstable_useNumberInput'
import { unstable_useForkRef as useForkRef } from '@mui/utils'
import { StyledInputRoot, StyledInputElement, StyledStepperButton } from './NumberInputBasicStyles'

const NumberInputBasic = React.forwardRef(function NumberInputBasic(props, ref) {
  const { value, handleChange, handleBlur, min, max, disabled } = props
  const [tempValue, setTempValue] = React.useState(value)
  //console.log('tempValue: ', tempValue)
  React.useEffect(() => {
    setTempValue(value)
  }, [value])

  const handleInputChange = event => {
    const newValue = event.target.value
    if (/^\d*$/.test(newValue)) {
      console.log('newValue: ', newValue)
      //handleChange(newValue)
      setTempValue(newValue)
    }
  }

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
      const newValue = e.key
      console.log('newValue1: ', newValue)
      if (/^\d*$/.test(newValue)) {
        console.log('newValue2: ', newValue)
        //handleChange(Number(newValue))
        setTempValue(newValue)
      } else {
        console.log('Entrada no permitida: ', newValue)
        e.preventDefault()
      }
    } else {
      e.preventDefault()
      console.log('Tecla no permitida:', e.key)
    }
  }

  const handleBlurInternal = e => {
    console.log('handleBlurInternal: ', e.target.value)
    if (handleBlur) {
      handleBlur(e)
    }
    handleChange(tempValue)
  }

  const handleButtonChange = newValue => {
    handleChange(newValue)
  }

  const { getRootProps, getInputProps, getIncrementButtonProps, getDecrementButtonProps, focused } = useNumberInput({
    value,
    disabled,
    min,
    max,
    //onInputChange: handleInputChange, //
    onChange: (_, newValue) => {
      //handleChange(newValue)
      handleButtonChange(newValue)
    }
    //onBlur: handleBlur //
  })

  const inputProps = getInputProps()
  inputProps.ref = useForkRef(inputProps.ref, ref)
  inputProps.onKeyDown = handleKeyDown
  inputProps.onBlur = handleBlurInternal

  return (
    <StyledInputRoot {...getRootProps()} className={focused ? 'focused' : null}>
      <StyledStepperButton {...getIncrementButtonProps()} className='increment' disabled={disabled}>
        ▴
      </StyledStepperButton>
      <StyledStepperButton {...getDecrementButtonProps()} className='decrement' disabled={disabled}>
        ▾
      </StyledStepperButton>
      <StyledInputElement {...inputProps} /* onBlur={handleBlur} */ value={tempValue} onChange={handleInputChange} />
    </StyledInputRoot>
  )
})

export default NumberInputBasic
