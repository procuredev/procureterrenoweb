// **Validar RUT
import { validateRut } from '@fdograph/rut-utilities'

export function registerValidator(values) {
  const valName = /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]+$/
  const valEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const valPhone = /^[0-9+]{8,12}$/
  const valRoleMel = ['Solicitante', 'Contract Operator', 'Contract Owner']
  const valRoleProcure = ['Administrador de Contrato', 'Supervisor', 'Gerente', 'Proyectista']

  const valPlant = [
    'Planta Concentradora Los Colorados',
    'Planta Concentradora Laguna Seca | Línea 1',
    'Planta Concentradora Laguna Seca | Línea 2',
    'Chancado y correas',
    'Puerto Coloso',
    'Instalaciones Cátodo'
  ]
  const { name, rut, phone, email, company, role, plant, shift, contop, opshift } = values

  /* for (const key in values) {
    if (typeof values[key] !== 'string') {
      throw new Error(`El campo ${key} debe ser en formato texto`)
    }
  } */
  /* if (!valName.test(name)) {
    throw new Error('El nombre debe contener solo letras y espacios en blanco.')
  } else {
    if (!valEmail.test(email)) {
      throw new Error('El correo no cumple con el formato requerido')
    } else {
      if (!valPhone.test(phone)) {
        throw new Error('El telefono solo recibe campos numericos')
      } else {
        if (!validateRut(rut)) {
          throw new Error('El RUT no cumple con la validación del digito verificador')
        } else {
          if (company === 'Procure') {
            if (!valRoleProcure.includes(role)) {
              throw new Error('El Rol seleccionado no se encuentra entre los sugeridos para la la empresa Procure')
            }
          } else if (company === 'MEL') {
            if (!valRoleMel.includes(role)) {
              throw new Error('El Rol seleccionado no se encuentra entre los sugeridos para la la empresa Mel')
            } else {
              if (!valPlant.includes(plant)) {
                throw new Error('La planta seleccionada no se encuentra entre los sugeridos para la la empresa Mel')
              }
            }
          } else {
            throw new Error('Debe seleccionar solo las Empresas sugeridas')
          }
        }
      }
    }
  } */

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
      validate: value => valPhone.test(value),
      message: 'El teléfono solo recibe campos numéricos y debe tener 8-12 caracteres.'
    },
    rut: {
      validate: value => validateRut(value),
      message: 'El RUT no cumple con la validación del dígito verificador.'
    },
    company: {
      validate: value => value !== 'MEL' || value !== 'Procure',
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
      validate: value => !valPlant.includes(value),
      message: 'La Planta seleccionada no coincide con ninguna de las sugeridas.'
    }
  }

  for (const key in values) {
    if (values[key].trim() === '') {
      throw new Error('Debes rellenar todos los campos.')
    }
    if (typeof values[key] !== 'string') {
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
