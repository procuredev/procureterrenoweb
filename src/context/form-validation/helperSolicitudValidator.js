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
    '0210 - Instalaciones Generales Concentrado',
    '0211 - Trabajos en Terreno',
    '0212 - Cañerías en Terreno',
    '0213 - Electricidad en Terreno',
    '0214 - Distribución de Agua Fresca y TK de Agua',
    '0215 - Distribución Petróleo',
    '0216 - Sistema de Detección y Protección contra Incendios',
    '0230 - Stockpile y Almacenamiento',
    '0231 - Cubierta Stockpile',
    '0240 - Concentradora',
    '0241 - Edificio Concentradora',
    '0242 - Relaves y Aguas Recuperadas',
    '0243 - Oficina de Control y Shift Office',
    '0244 - Flotación y Remolienda',
    '0245 - Flotación de Moly y Remolienda',
    '0246 - Taller de la Planta',
    '0247 - Flotación Rougher',
    '0248 - Flotación Scavenger de barrido y distribución',
    '0249 - Flotación Columnar y Concentrado Final',
    '0250 - Espesador de Concentrado | Sistema de Recuperación de Agua',
    '0251 - Espesador de Concentrado',
    '0252 - Espesador de Relave | Túneles',
    '0254 - TKS de Concentrado',
    '0257 - Parrón de Cañerías | Listado de Componentes',
    '0260 - Dispositivos de Relave | Recuperación de Agua',
    '0261 - Tuberías de Relave',
    '0262 - Sistema de Agua de Proceso',
    '0263 - Relave y Recuperación de Agua',
    '0270 - Edificio de Reactivos I',
    '0271 - Planta de Cal | Mezcla y Manejo',
    '0272 - Reactivos de Cobre',
    '0274 - Edificio de Reactivos II',
    '0276 - Floculantes | TK Mezcla Secundaria',
    '0300 - Abastecimiento de agua salar de P. Negra',
    '0310 - Salar de P. Negra | Campo de Pozos | Cañerías',
    '0320 - Estación de Bombas Booster',
    '0330 - Planta de tratamiento de agua potable',
    '0340 - Sistema Temporal de Agua',
    '0350 - Planta TAS',
    '0380 - Salar de Hamburgo | Captación de Agua',
    '0672 - Laboratorio',
    '0750 - Bodega',
    '0900 - Ubicación General del Proyecto',
    '5000 - Reemplazo Instalaciones Los Colorados',
    '5200 - Sistema de Entrega de Mineral',
    '5300 - Sistema de Almacenamiento y Distribución de Agua Fresca',
    '5500 - Otros Infraestructuras y Edificios',
    '6000 - Desmantelamiento y Demolición Los Colorados'
  ]

  const valPlantLagunaSeca1 = [
    '0200 - ',
    '0230 - Stockpile',
    '0240 - Alimentación Stockpile | Reactivos | Planta de Cal | Manejo Materiales',
    '0300 - Concentradora | Molienda | Molinos',
    '0310 - Molienda | Planta de Cal | Molinos',
    '0320 - Flotación | Remolienda',
    '0330 - Chancado de Pebbles | Staker',
    '0340 - Espesador de Concentrado | Almacenamiento y Bombeo de ...',
    '0350 - Espesador de Relaves | Piscina de Emergencia | Agua Recuperada',
    '0360 - Reactivos',
    '0370 - Planta de Cal',
    '0390 - Planta de Aire',
    '0410 - Espesadores de concentrado',
    '0800 - Infraestructura',
    '0810 - Edificio Molienda',
    '0880 - Campamento de Construcción'
  ]

  const valPlantLagunaSeca2 = [
    '0230 - Stockpile',
    '0900 - Preparación de Terreno e Instalaciones Fase IV',
    '0920 - Patio de Bombeo y Almacenamiento (Existente LSD)',
    '1000 - General | Concentrador LSL2',
    '1230 - Edificio Pila de Acopio',
    '1240 - Pila de Acopio y Recuperación de Gruesos',
    '1300 - Concentrador LSL2',
    '1310 - Molinos SAG y de Bolas',
    '1320 - Flotación (rougher, scavenger, limpieza) y Remolienda',
    '1330 - Chancador de Pebbles',
    '1340 - Espesador de Concentrado',
    '1350 - Espesador de Relaves',
    '1360 - Reactivos',
    '1370 - Planta y Distribución de Cal',
    '1390 - Planta de Aire',
    '3000 - Suministro de Agua (Planta Desalinización)',
    '3200 - Tubería Agua Desalinizada y Estación de Bombeo',
    '3300 - Estanque Agua Dulce',
    '3400 - Línea de Transmisión y Sub Estaciones',
  ]

  const valPlantChancadoCorreas = [
    '0100 - Infraest. Chancado | Harneros | Aglomeradores',
    '0110 - Chancado N° 4 Primario Y Correas',
    '0130 - Chancado Secundario Y Terciario | Stockpile',
    '0200 - Transporte de Mineral Fase IV',
    '0210 - Chancador N° 3 Primario',
    '0220 - Chancado y Correas',
    '0221 - Chancadores N° 1 - 2 Primario',
    '0222 - Correas (Overland) LC',
    '0223 - Tripper Correa-A y Tripper Correa-B',
    '1200 - Transporte de Mineral OGP1',
    '1220 - Transporte de Minerales Gruesos (New Overland)'
  ]

  const valPlantPuertoColoso = [
    '0500 - Coloso',
    '0510 - Planta Filtro | Desaguado de Concentrado',
    '0511 - Movimiento de Tierra',
    '0512 - Instalaciones en Terreno',
    '0513 - Electricidad en Terreno',
    '0520 - Recepción de Concentrado | TTO. Aguas | Pta.',
    '0521 - Recepción del Concentrado y Tratamiento del agua',
    '0522 - Piscinas de Decantación',
    '0530 - Correas Stock Pile | Correas Muelle',
    '0532 - Recuperación de Concentrado',
    '0536 - Modificación Línea A/T Mejillones/ MEL y Zaldívar/MEL',
    '0540 - Bodega // Carguío de Concentrado Coloso',
    '0541 - Otros Edificios',
    '0542 - Pirita | Terreno | Caminos | Tailings',
    '0550 - Lix. Amoniacal',
    '0551 - Planta Lix. | Plot Plant | Mov. Tierra',
    '0553 - Producción Agua Fresca',
    '0560 - Espesador Concentrado | Recepción',
    '0570 - Flotación | Filtracion Lix.',
    '0571 - Estructura Marina | Descarga Marina',
    '0580 - Patio de estanques',
    '0590 - Extracción por solventes',
    '0591 - Electrowinning',
    '0592 - Manejo y Recuperación Amoniaco',
    '0661 - Distribución Electricidad',
    '0671 - Oficinas Coloso',
    '0672 - Laboratorio Coloso',
    '0673 - Bodega Coloso',
    '6900 - Terreno General de La Planta de desalinización',
    '6910 - Planta de desalinización de Coloso',
    '6920 - Sistema E Transporte de Agua',
    '6930 - Estación de Bombeo N°1',
    '6940 - Estación de Bombeo N°2',
    '6950 - Estación de Bombeo N°3',
    '6960 - Estación de Bombeo N°4'
  ]

  const valPlantInstalacionesCatodo = [
    '0000 - Generalidades',
    '0005 - Estándares',
    '0230 - Almacenamiento Y Aglomerado de Mineral Fino',
    '0240 - Mineral Fino | Aglomerado | Edif. Mult | Chanc. Sec. Y Terciario',
    '0300 - Lixiviación',
    '0310 - Lixiviación Pilas (Pad 1) Base B',
    '0315 - Lixiviación Pilas (Pad 2) Base A',
    '0320 - Area General Pila Dinamica (Pad 3)',
    '0330 - Formación de Pila Dinamica (Pad 3)',
    '0335 - Equipos Formación Pilas | Apilam. Mineral (Pad 1)',
    '0336 - Equipos Formación Pilas | Apilam. Mineral (Pad 2)',
    '0337 - Equipos de Reclamo de Ripios Lixiviados (Pad 3) (Rotopala / Overland /Apilador Ripios)',
    '0340 - Piscinas PLS-ILS-Refino(Pad 1)',
    '0345 - Piscinas PLS-ILS-Refino(Pad 2)',
    '0346 - Piscinas PLS-ILS-Refino(Pad 3)',
    '0350 - Sist. de Cañerías | Irrig. Pilas | Tubo Colector (Pad 1)',
    '0351 - Sistema Cañerías de Irrigación (Pad 3)',
    '0352 - Sistema Cañerías de Colección (Pad 3)',
    '0353 - Sistema de Bombeo ILS',
    '0354 - Sistema de Irrigación (PAD 3)',
    '0355 - Sistema de Colección ILS y PLS',
    '0356 - Bombeo de PLS a Planta SX (PAD 3)',
    '0357 - Sistema de Bombeo de Piscinas de Emergencia',
    '0358 - Impulsión PLS',
    '0360 - Formación Botadero de Ripios Lixiviados (Pad 3)',
    '0361 - Piscina de Emergencia Botadero de Ripios Lixiviados (Pad 3)',
    '0400 - Planta Electrowinning',
    '0410 - Extracción Por Solventes',
    '0420 - Áreas de Estanques',
    '0440 - Almac. Y Dist. de Ác. Sulfúrico',
    '0450 - Sist. de Agua Caliente',
    '0510 - Edificio de Electro Obtención',
    '0700 - Planta General Óxido',
    '0710 - Lev. Topog. | desarr. En Terreno | Tks. de Agua.',
    '0711 - Infraest. | Modif. Camino Princ. | Tub. Agua Potable',
    '0712 - Caminos de Acceso | Modificación Caminos Principales (Pad 3)',
    '0713 - Sistema de desviación de Aguas Lluvias (Pad 3)',
    '0720 - Sist. de Agua | Tk de Agua | Pta. Tto. Agua (Pad 1)',
    '0721 - Sistema de Agua | Tk de Agua | Pta. Tto. Agua (Pad 3)',
    '0725 - Servicios de Agua E Incendio (Pad 2)',
    '0726 - Servicios de Agua Industrial E Incendio (Pad 3)',
    '0730 - Sist. de Aguas Servidas',
    '0731 - Sistemas de Alcantarillados Y Aguas Servidas (Pad 3)',
    '0740 - Sistema de Combustible',
    '0751 - Dist. Eléct. | Línea 34,5 Kv | 13,8 Kv | Sist. Energía',
    '0752 - Distribución Eléctrica 13,8 Kv | Sistema de Energía (Pad 3)',
    '0760 - Sist. de Comunicaciones Permanentes',
    '0761 - Sistema de Comunicaciones Permanentes (Pad 3)',
    '0772 - Edif. Bodega | Talleres Mant.',
    '0773 - Bodegas, Talleres Mantenimiento (Pad 3)',
    '0773 - Edif. Admin. Existente',
    '0774 - Edif. Admin. Nuevo',
    '0775 - Infraestructura de Oficinas (Pad 3)',
    '0776 - Casa de Cambio (Pad 3)',
    '0770 - Sistema de Comunicaciones',
    '0780 - Línea Férrea',
    '0810 - Servicios Temporales (Pad 1)',
    '0811 - Instalaciones Y Servicios Temporales (Pad 3)',
    '0820 - Sist. de Comunic. | Inst. de Faenas de Construcción'
  ]

  const valObjetive = [
    'Análisis fotogramétrico',
    'Análisis GPR',
    'Inspección Dron',
    'Levantamiento 3D',
    'Levantamiento 3D GPS',
    'Topografía'
  ]

  const allowedDeliverables = [
    'Sketch',
    'Plano de Fabricación',
    'Plano de Diseño',
    'Memoria de Cálculo',
    'Informe',
    'Nube de Puntos'
  ]

  const valType = ['Normal', 'Outage', 'Shutdown', 'Oportunidad']

  const valDetention = ['Sí', 'No', 'No aplica']

  //const valTitle = /^[a-zA-Z0-9-ZáéíóúñüÁÉÍÓÚÑÜ0-9 !@#$%^&*()-_-~.+,/\" ]+$/ // /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ0-9\s]+$/
  //const valDescription = /^[a-zA-Z0-9-ZáéíóúñüÁÉÍÓÚÑÜ0-9 !@#$%^&*()-_-~.+,/\" ]+$/ // /^[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ0-9\s]+$/
  const valSap = /^[0-9+]{0,10}$/
  const valFnLocation = /^[a-zA-Z0-9 -./]{0,25}$/ // /^[0-9+]{4,6}$/

  const validations = {
   /*  title: {
      validate: value => valTitle.test(value),
      message: 'El título no admite caracteres especiales.'
    },
    description: {
      validate: value => valDescription.test(value),
      message: 'La descripción no admite caracteres especiales.'
    }, */
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

  const keyMap = {
    title: 'Título',
    plant: 'Planta',
    area: 'Área',
    contop: 'Contract Operator',
    fnlocation: 'Functional Location',
    petitioner: 'Solicitante',
    opshift: 'Contraturno del Solicitante',
    type: 'Estado Operacional de la Planta',
    detention: '¿Estará la máquina detenida?',
    sap: 'Número SAP',
    objective: 'Tipo de Levantamiento',
    deliverable: 'Entregables del levantamiento',
    receiver: 'Destinatarios',
    description: 'Descripción',
    urlvideo: 'URL de video',
    tag: 'TAG'
  }

  for (const key in values) {
    let keyStringName = keyMap[key] || [key]
    const nonRequiredFields = ['fnlocation', 'sap', 'opshift', 'urlvideo', 'tag', 'end', 'ot', 'urgency']

    if (typeof values[key] === 'string' && !nonRequiredFields.includes(key)) {
      if (values[key].trim() === '') {
        throw new Error('Debes rellenar todos los campos. ' + `Error en el campo ${keyStringName}. `)
      }
    } else {
      if (values[key] == '' && !nonRequiredFields.includes(key)) {
        console.log('Debes rellenar todos los campos. ' + `Error en el campo ${keyStringName}. `)
        throw new Error('Debes rellenar todos los campos. ' + `Error en el campo ${keyStringName}. `)
      }
    }

    if (!['receiver', 'deliverable', 'start', 'sap', 'fnlocation', 'end'].includes(key) && typeof values[key] !== 'string') {
      console.log(`El campo ${key} debe ser en formato texto.`)
      throw new Error(`El campo ${key} debe ser en formato texto.`)
    }

    if (validations.hasOwnProperty(key)) {
      const { validate, message } = validations[key]
      if (!validate(values[key])) {
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
