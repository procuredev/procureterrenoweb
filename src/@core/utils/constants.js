export const getRootFolder = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'www.prosite.cl' || window.location.hostname === 'procureterrenoweb.vercel.app') {
      return '180lLMkkTSpFhHTYXBSBQjLsoejSmuXwt' // carpeta original "72336"
    }

    return '1kKCLEpiN3E-gleNVR8jz_9mZ7dpSY8jw' // carpeta TEST
  }

  return '1kKCLEpiN3E-gleNVR8jz_9mZ7dpSY8jw' // carpeta TEST por defecto
}

export const PLANT_ABBREVIATIONS = {
  'Planta Concentradora Laguna Seca | Línea 1': 'LSL1',
  'Planta Concentradora Laguna Seca | Línea 2': 'LSL2',
  'Instalaciones Escondida Water Supply': 'IEWS',
  'Planta Concentradora Los Colorados': 'PCLC',
  'Instalaciones Cátodo': 'ICAT',
  'Chancado y Correas': 'CHCO',
  'Puerto Coloso': 'PCOL'
}
