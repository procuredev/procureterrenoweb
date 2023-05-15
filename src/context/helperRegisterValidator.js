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

  for (key in values) {
    if (typeof values[key] !== 'string') {
      throw new Error(`El campo ${key} debe ser en formato texto`)
    }
  }

  if (!valName.test(name)) {
    throw new Error('El nombre debe contener solo letras y espacios en blanco.')
  }

  if (!valEmail.test(email)) {
    throw new Error('El correo no cumple con el formato requerido')
  }

  if (!valPhone.test(phone)) {
    throw new Error('El telefono solo recibe campos numericos')
  }

  if (!validateRut(rut)) {
    throw new Error('El RUT no cumple con la validación del digito verificador')
  }

  if (company !== 'Mel' && company !== 'Procure') {
    throw new Error('Debe seleccionar solo las Empresas sugeridas')
  }

  if (company === 'Procure' && !valRoleProcure.includes(role)) {
    throw new Error('El Rol seleccionado no se encuentra entre los sugeridos para la empresa Procure')
  }

  if (company === 'Mel' && !valRoleMel.includes(role)) {
    throw new Error('El Rol seleccionado no se encuentra entre los sugeridos para la empresa Mel')
  }

  if (!valPlant.includes(plant)) {
    throw new Error('La Planta seleccionada no coincide con ninguna de las sugeridas')
  }
}
