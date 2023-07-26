export function solicitudValidator(values) {
  const valPlant = [
    'Planta Concentradora Los Colorados',
    'Planta Concentradora Laguna Seca | Línea 1',
    'Planta Concentradora Laguna Seca | Línea 2',
    'Chancado y Correas',
    'Puerto Coloso',
    'Instalaciones Cátodo'
  ]

  const valPlantLosColorados = [
    '0000 - Estándares',
    '0200 - Flowsheets | Inst. Concentrado',
    '0230 - Stockpile y Almacenamiento',
    '0240 - Concentradora',
    '0250 - Espesador de Concentrado | Sistema de Recuperación de Agua',
    '0260 - Dispositivos de Relave | Recuperación de Agua',
    '0270 - Edificio de Reactivos I',
    '0300 - Abastecimiento de agua salar de P. Negra',
    '0672 - Laboratorio',
    '0750 - Bodega',
    '0900 - Ubicación General del Proyecto',
    '5000 - Reemplazo Instalaciones Los Colorados',
    '6000 - Desmantelamiento y Demolición Los Colorados'
  ]

  const valPlantLagunaSeca1 = [
    '0200 -',
    '0300 - Concentradora | Molienda | Molinos',
    '0410 - Espesadores de concentrado',
    '0800 - Infraestructura'
  ]

  const valPlantLagunaSeca2 = [
    '0230 - Stockpile',
    '0900 - Preparación de Terreno e Instalaciones Fase IV',
    '1000 - General - Concentrador LSL2',
    '1300 - Concentrador LSL2',
    '3000 - Suministro de Agua (Planta Desalinización)'
  ]

  const valPlantChancadoCorreas = [
    '0100 - Infraest. Chancado - Harneros - Aglomeradores',
    '0200 - Transporte de Mineral Fase IV',
    '0220 - Chancado y Correas',
    '1200 - Transporte de Mineral OGP1'
  ]

  const valPlantPuertoColoso = ['0500 - Coloso', '6900 - Terreno General de La Planta de desalinización']

  const valPlantInstalacionesCatodo = [
    '0000 - Generalidades',
    '3100 - Pilas de Lixiviación',
    '3200 - Piscinas de Emergencia',
    '3300 - Piscinas Pls/Refino Y Estaciones de Bombeo',
    '3400 - Extracción Por Solventes Sx',
    '3500 - Patio de Estanques Sx Y Reactivos',
    '3600 - Patio de Estanques Ew Y Reactivos',
    '3700 - Electro Obtención',
    '3800 - Modificaciones de La Planta de Oxido',
    '4100 - Almacenamiento Y Distribución de Ácido Sx',
    '4200 - Agua de Alimentación Planta',
    '4400 - Sistema de Combustible Sx',
    '4600 - Suministro de Energía',
    '4800 - Comunicaciones',
    '5100 - Desarrollo de Terrenos Varios',
    '5200 - Caminos de Acceso Y de La Planta',
    '5500 - Desvío Ferroviario',
    '7100 - Instalaciones Provisorias',
    '7200 - Servicios Temporales En Terreno',
    '60010 - Nodo de Comunicaciones'
  ]

  const valObjetive = [
    'Análisis fotogramétrico',
    'Análisis GPR',
    'Inspección Dron',
    'Levantamiento 3D',
    'Levantamiento 3D GPS',
    'Topografía'
  ]

  const allowedDeliverables = ['Sketch', 'Plano de Fabricación', 'Plano de Diseño', 'Memoria de Cálculo', 'Informe']

  const valType = ['Normal', 'Outage', 'Shutdown']

  const valDetention = ['yes', 'no', 'n/a']

  const valTitle = /^[a-zA-Z0-9-ZáéíóúñüÁÉÍÓÚÑÜ0-9 !@#$%^&*()-_-~.+,/\" ]+$/ // /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ0-9\s]+$/
  const valDescription = /^[a-zA-Z0-9-ZáéíóúñüÁÉÍÓÚÑÜ0-9 !@#$%^&*()-_-~.+,/\" ]+$/ // /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ0-9\s]+$/
  const valSap = /^[0-9+]{0,10}$/
  const valFnLocation = /^[a-zA-Z0-9 -./]{0,25}$/ // /^[0-9+]{4,6}$/

  const validations = {
    title: {
      validate: value => valTitle.test(value),
      message: 'El título no admite caracteres especiales.'
    },
    description: {
      validate: value => valDescription.test(value),
      message: 'La descripción no admite caracteres especiales.'
    },
    sap: {
      validate: value => valSap.test(value),
      message: 'El SAP solo recibe campos numéricos y debe tener de 8 a 10 caracteres.'
    },
    fnlocation: {
      validate: value => valFnLocation.test(value),
      message: 'El Functional Location solo recibe caracteres alfa-numéricos y debe tener máximo 25 caracteres.'
    },
    area: {
      validate: value => {
        if (values.plant === 'Planta Concentradora Los Colorados') {
          return valPlantLosColorados.includes(value)
        } else if (values.plant === 'Planta Concentradora Laguna Seca | Línea 1') {
          return valPlantLagunaSeca1.includes(value)
        } else if (values.plant === 'Planta Concentradora Laguna Seca | Línea 2') {
          return valPlantLagunaSeca2.includes(value)
        } else if (values.plant === 'Chancado y Correas') {
          return valPlantChancadoCorreas.includes(value)
        } else if (values.plant === 'Puerto Coloso') {
          return valPlantPuertoColoso.includes(value)
        } else if (values.plant === 'Instalaciones Cátodo') {
          return valPlantInstalacionesCatodo.includes(value)
        }

        return false
      },
      message: 'El Area seleccionada no se encuentra entre los sugeridos para la planta seleccionada.'
    },

    plant: {
      validate: value => valPlant.includes(value),
      message: 'La Planta seleccionada no coincide con ninguna de las sugeridas.'
    },

    type: {
      validate: value => valType.includes(value),
      message: 'El tipo de trabajo seleccionado no coincide con ningunos de los sugeridos.'
    },
    detention: {
      validate: value => valDetention.includes(value),
      message: 'El campo detención de máquina no coincide con ningunos de los sugeridos.'
    },
    objetive: {
      validate: value => valObjetive.includes(value),
      message: 'El tipo de levantamiento seleccionado no coincide con ningunos de los sugeridos.'
    },
    start: {
      validate: value => value instanceof Date && !isNaN(value.getTime()),
      message: 'La fecha de inicio no es válida.'
    },
    deliverable: {
      validate: value => {
        if (Array.isArray(value)) {
          return value.every(item => allowedDeliverables.includes(item))
        } else if (typeof value === 'string') {
          return allowedDeliverables.includes(value)
        }

        return false
      },
      message:
        'El valor del entregable debe ser uno o más de los siguientes: Sketch, Plano de Fabricación, Plano de Diseño, Memoria de Cálculo, Informe.'
    }
  }

  for (const key in values) {
    let keyStringName = ''
    if (key == 'title') {
      keyStringName = 'Título'
    } else if (key == 'plant') {
      keyStringName = 'Planta'
    } else if (key == 'area') {
      keyStringName = 'Área'
    } else if (key == 'contop') {
      keyStringName = 'Contract Operator'
    } else if (key == 'fnlocation') {
      keyStringName = 'Functional Location'
    } else if (key == 'petitioner') {
      keyStringName = 'Solicitante'
    } else if (key == 'opshift') {
      keyStringName = 'Contraturno del Solicitante'
    } else if (key == 'type') {
      keyStringName = 'Estado Operacional de la Planta'
    } else if (key == 'detention') {
      keyStringName = '¿Estará la máquina detenida?'
    } else if (key == 'sap') {
      keyStringName = 'Número SAP'
    } else if (key == 'objective') {
      keyStringName = 'Tipo de Levantamiento'
    } else if (key == 'deliverable') {
      keyStringName = 'Entregables del levantamiento'
    } else if (key == 'receiver') {
      keyStringName = 'Destinatarios'
    } else if (key == 'description') {
      keyStringName = 'Descripción'
    }

    if (typeof values[key] === 'string') {
      if (key == 'fnlocation' || key == 'sap' || key == 'opshift') {
        // console.log('hacer nada')
      } else {
        if (values[key].trim() === '') {
          console.log('Debes rellenar todos los campos. ' + `Error en el campo ${keyStringName}. `)
          throw new Error('Debes rellenar todos los campos. ' + `Error en el campo ${keyStringName}. `)
        }
      }
    } else {
      if (values[key] == '') {
        console.log('Debes rellenar todos los campos. ' + `Error en el campo ${keyStringName}. `)
        throw new Error('Debes rellenar todos los campos. ' + `Error en el campo ${keyStringName}. `)
      }
    }

    if (!['receiver', 'deliverable', 'start', 'sap', 'fnlocation'].includes(key) && typeof values[key] !== 'string') {
      console.log(`El campo ${key} debe ser en formato texto.`)
      throw new Error(`El campo ${key} debe ser en formato texto.`)
    }

    if (validations.hasOwnProperty(key)) {
      const { validate, message } = validations[key]
      if (!validate(values[key])) {
        console.log('asdasdasdas aers')
        console.log(message)
        throw new Error(message)
      }
    }
  }
}

/* faltó validar:
petitioner: string
opshift: string
receiver: [] */
