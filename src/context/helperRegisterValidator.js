import { validateRut } from '@fdograph/rut-utilities'

export function registerValidator(values) {
  const valName = /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]+$/
  const valEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const valPhone = /^[0-9+]{8,12}$/
  const valRoleMel = [2, 3, 4]
  const valRoleProcure = [5, 6, 7, 8, 9, 10]
  const valShiftMel = ['P', 'Q']
  const valShiftProcure = ['A', 'B']

  const valPlant = [
    'Planta Concentradora Los Colorados',
    'Planta Concentradora Laguna Seca | Línea 1',
    'Planta Concentradora Laguna Seca | Línea 2',
    'Chancado y Correas',
    'Puerto Coloso',
    'Instalaciones Cátodo',
    'allPlants'
  ]

  const validations = {
    name: {
      validate: value => valName.test(value),
      message: 'El nombre debe contener solo letras y espacios en blanco.'
    },
    email: {
      validate: value => valEmail.test(value),
      message: 'El correo no cumple con el formato requerido.'
    },
    phone: {
      validate: value => valPhone.test(value.replace(/\s/g, "")),
      message: 'El teléfono solo recibe campos numéricos y debe tener 8-12 caracteres.'
    },
    rut: {
      validate: value => validateRut(value),
      message: 'El RUT no cumple con la validación del dígito verificador.'
    },
    company: {
      validate: value => value === 'MEL' || value === 'Procure',
      message: 'Debe seleccionar solo las Empresas sugeridas.'
    },
    role: {
      validate: value => {
        if (values.company === 'MEL') {
          return valRoleMel.includes(value)
        } else if (values.company === 'Procure') {
          return valRoleProcure.includes(value)
        }

        return false
      },
      message: 'El Rol seleccionado no se encuentra entre los sugeridos para la empresa seleccionada.'
    },
    plant: {
      validate: value => {
        if (values.company === 'Procure') {
          return true // No se valida la planta si la empresa es "Procure"
        }

        if (Array.isArray(value)) {
          return value.every(item => valPlant.includes(item))
        }

        return false
      },
      message: 'La Planta seleccionada no coincide con ninguna de las sugeridas.'
    },
    shift: {
      validate: value => {
        if (values.company === 'MEL' && values.role === 3 || values.role === 4) {
          return true
        } else if (values.company === 'Procure' && values.role === 5 || values.role === 9 || values.role === 10) {
          return true
        } else if (values.company === 'MEL' && values.role === 2) {
          return valShiftMel.includes(value)
        } else if (values.company === 'Procure' && values.role === 6 || values.role === 7 || values.role === 8) {
          return valShiftProcure.includes(value)
        }

        return false
      },
      message: 'El Turno seleccionado no se encuentra entre los sugeridos para la empresa seleccionada.'
    }
  }

  for (const key in values) {
    if (typeof values[key] === 'string') {
      if (key !== 'opshift' && values[key].trim() === '') {
        throw new Error('Debes rellenar todos los campos. ' + `Error en campo ${key} `)
      }
    }
    if (!['role', 'plant'].includes(key) && typeof values[key] !== 'string') {
      throw new Error(`El campo ${key} debe ser en formato texto.`)
    }
    if (validations.hasOwnProperty(key)) {
      const { validate, message } = validations[key]
      if (!validate(values[key])) {
        throw new Error(message)
      }
    }
  }
}
