import { validateRut } from '@fdograph/rut-utilities';

export function registerValidator(values) {
  const valName = /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]+$/;
  const valEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valPhone = /^[0-9+]{8,12}$/;
  const valRoleMel = [2,3,4];
  const valRoleProcure = [5,6,7,8,9];

  const valPlant = [
    'Los Colorados',
    'Laguna Seca 1',
    'Laguna Seca 2',
    'Chancado y correas',
    'Puerto Coloso',
    'Instalaciones Cátodo'
  ];

  const validations = {
    name: {
      validate: (value) => valName.test(value),
      message: 'El nombre debe contener solo letras y espacios en blanco.'
    },
    email: {
      validate: (value) => valEmail.test(value),
      message: 'El correo no cumple con el formato requerido.'
    },
    phone: {
      validate: (value) => valPhone.test(value),
      message: 'El teléfono solo recibe campos numéricos y debe tener 8-12 caracteres.'
    },
    rut: {
      validate: (value) => validateRut(value),
      message: 'El RUT no cumple con la validación del dígito verificador.'
    },
    company: {
      validate: (value) => value === 'MEL' || value === 'Procure',
      message: 'Debe seleccionar solo las Empresas sugeridas.'
    },
    role: {
      validate: (value) => {
        if (values.company === 'MEL') {
          return valRoleMel.includes(value);
        } else if (values.company === 'Procure') {
          return valRoleProcure.includes(value);
        }

        return false;
      },
      message: 'El Rol seleccionado no se encuentra entre los sugeridos para la empresa seleccionada.'
    },
    plant: {
      validate: (value) => {
        if (values.company === 'Procure') {
          return true; // No se valida la planta si la empresa es "Procure"
        }

        return valPlant.includes(value);
      },
      message: 'La Planta seleccionada no coincide con ninguna de las sugeridas.'
    }
  };

  for (const key in values) {
    if (values[key].trim() === '') {
      throw new Error('Debes rellenar todos los campos.'+`Error en campo ${key} `);
    }
    if (typeof values[key] !== 'string') {
      throw new Error(`El campo ${key} debe ser en formato texto.`)
    }
      if (validations.hasOwnProperty(key)) {
        const { validate, message } = validations[key];
        if (!validate(values[key])) {
          throw new Error(message);
        }
      }
    }
  }
