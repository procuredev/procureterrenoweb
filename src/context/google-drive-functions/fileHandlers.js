import { Typography, Tooltip, IconButton } from '@mui/material'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import { getPlantInitals } from 'src/context/firebase-functions/firestoreQuerys'

/**
 * Función para obtener la siguiente revisión letra o número de un entregable.
 * Si es Iniciado, la siguiente revisión es A.
 * Si es una letra, la siguiente revisión es la siguiente letra. En el caso de Z cambia a AA.
 * Si es un número, la siguiente revisión es el siguiente número.
 * @param {string} revision - Revisión en que se encuentra el entregable.
 * @returns {string} - Retorna la siguiente revisión.
 */
function getNextChar(revision) {

  if (input === "Iniciado") {
      return "A"
  }

  // Caso en que el string es un número
  if (/^[0-9]+$/.test(revision)) {

    return (parseInt(revision, 10) + 1).toString()

  // Caso en que el string es una letra o secuencia de letras en mayúscula
  } else if (/^[A-Z]+$/.test(revision)) {

    let result = ""
    let carry = 1 // Representa el incremento

    for (let i = revision.length - 1; i >= 0; i--) {
      const charCode = revision.charCodeAt(i) + carry

      if (charCode > 90) { // 90 es el código ASCII de 'Z'
        result = "A" + result
        carry = 1 // Hay acarreo
      } else {
        result = String.fromCharCode(charCode) + result
        carry = 0 // No hay acarreo
      }
    }

    // Si hay un acarreo restante, añadimos 'A' al principio
    if (carry > 0) {
      result = "A" + result
    }

    return result

  } else {
    throw new Error("La Revisión debe ser un número, una letra o la palabra 'Iniciado'.")
  }
}

/**
 * Función para obtener la letra con la que debe ser creada la carpeta de la revisión en Google Drive.
 * @param {Object} blueprint - Objeto con los datos del entregable/plano.
 * @param {Object} authUser - Objeto con los datos del usuario conectado que está ejecutando la acción.
 * @returns {string} - Retorna la letra de la siguiente revisión con la que debe ser creada una carpeta.
 */
export const getNextRevisionFolderName = (blueprint, authUser) => {

  // Desestructuración de los Objetos blueprint y authUser.
  const { revision, id, userId, approvedByClient, approvedByDocumentaryControl } = blueprint
  const { role, uid } = authUser

  const nextChar = getNextChar(revision)
  const isM3D = id.split('-').slice(-2, -1)[0] === 'M3D'
  const isAuthorized = role === 8 || (role === 7 && userId === uid)

  // Si el usuario que ejecuta la acción no está autorizado, se retorna la actual revisión.
  if (!isAuthorized) {
    return revision
  }

  // Se define Patrón de reglas con condiciones y acciones para definir la siguiente revisión de la carpeta.
  // Este patrón
  const actions = [
    {
      // Si la revisión es mayor o igual a Rev. 0, está aprobada por el Cliente y no está Aprobada por Control Documental.
      // Se retorna la revisión actual (Rev. 0)
      condition: () => revision.charCodeAt(0) >= 48 && approvedByClient && !approvedByDocumentaryControl,
      action: () => revision
    },
    {
      // Si la revisión es mayor o igual a Rev. B y es aprobado por el Cliente.
      // Se retorna Rev. 0.
      condition: () => revision.charCodeAt(0) >= 66 && approvedByClient,
      action: () => '0'
    },
    {
      // Si la revisión es mayor o igual a Rev. 0, no está aprobada por el Cliente y está aprobado por Control Documental.
      // Se retorna la Revisión siguinete (1, 2, 3...)
      condition: () => revision.charCodeAt(0) >= 48 && !approvedByClient && approvedByDocumentaryControl,
      action: () => nextChar
    },
    {
      // Si la reivisión es "Iniciado" y el entregable es un M3D (Memoria de Cálculo).
      // Se retorna Rev. 0.
      condition: () => revision === 'Iniciado' && isM3D,
      action: () => '0'
    },
    {
      // Si la reivisión es "Iniciado" y el entregable no es un M3D (Memoria de Cálculo).
      // Se retorna Rev. A.
      condition: () => revision === 'Iniciado' && !isM3D,
      action: () => 'A'
    },
    {
      // Si la revisión es Rev. A.
      // Se retorna la siguiente letra si ha sido aprobada por Control Documental.
      // Se retorna Rev. A no si ha sido aprobada por Control Documental.
      condition: () => revision === 'A',
      action: () => approvedByDocumentaryControl ? nextChar : revision
    }
  ]

  // Se ejecuta la definición de la siguiente revisión.
  const matchedAction = actions.find(({ condition }) => condition())

  // Se retorna la siguiente revisión en caso de que concuerde con alguna de las condiciones definidas.
  // Si no, se retorna la revisión actual
  return matchedAction ? matchedAction.action() : revision

}


export const validateFileName = (acceptedFiles, values, blueprint, authUser, checkRoleAndApproval, approves) => {

  // Si es rol 9 y está aprobado por control documental, retornamos válido sin restricciones
  if (
    authUser.role === 9 &&
    blueprint.approvedByDocumentaryControl === true &&
    checkRoleAndApproval(authUser.role, blueprint)
  ) {
    return acceptedFiles.map(file => ({
      name: file.name,
      isValid: true,
      msj: `${file.name}`
    }))
  }

  const expectedClientCode = values.clientCode
  const expectedRevision = getNextRevisionFolderName(blueprint, authUser)

  let expectedFileName = null

  if (authUser.role === 8 || (authUser.role === 7 && blueprint.userId === authUser.uid)) {
    expectedFileName = `${expectedClientCode}_REV_${expectedRevision}`
  } else if (
    authUser.role === 9 &&
    blueprint.approvedByDocumentaryControl &&
    !checkRoleAndApproval(authUser.role, blueprint)
  ) {
    expectedFileName = `${expectedClientCode}_REV_${expectedRevision}_HLC`
  } else if (
    authUser.role === 9 &&
    (blueprint.approvedBySupervisor || blueprint.approvedByContractAdmin) &&
    blueprint.revision !== 'A' &&
    approves
  ) {
    expectedFileName = `${expectedClientCode}_REV_${expectedRevision}`
  } else {
    const initials = authUser.displayName
      .toUpperCase()
      .split(' ')
      .map(word => word.charAt(0))
      .join('')

    expectedFileName = `${expectedClientCode}_REV_${expectedRevision}_${initials}`
  }

  const handleCopyToClipboard = text => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('Texto copiado al portapapeles:', text)
      })
      .catch(err => {
        console.error('Error al copiar al portapapeles:', err)
      })
  }

  return acceptedFiles.map(file => {
    const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.')
    const isValid = fileNameWithoutExtension === expectedFileName

    return {
      name: file.name,
      isValid,
      msj: isValid ? (
        `${file.name}`
      ) : (
        <Typography variant='body2'>
          El nombre del archivo debe ser:{' '}
          <Typography variant='body2' component='span' color='primary'>
            {expectedFileName}
            <Tooltip title='Copiar'>
              <IconButton
                sx={{ ml: 3 }}
                size='small'
                onClick={() => handleCopyToClipboard(expectedFileName)}
                aria-label='copiar'
              >
                <FileCopyIcon fontSize='small' />
                <Typography>copiar</Typography>
              </IconButton>
            </Tooltip>
          </Typography>
          <br />
          <br />
          El nombre del archivo que intentó subir es:{' '}
          <Typography variant='body2' component='span' color='error'>
            {fileNameWithoutExtension}
          </Typography>
        </Typography>
      )
    }
  })
}

/**
 * Función para extraer el número de área desde el string que contiene el nombre completo del área.
 * @param {string} name - String con el nombre completo del área. Ej: "0100 - Planta Desaladora".
 * @returns {string} - areaNumber que es un string con él número. Ek: "0100".
 */
function extractAreaNumber(areaFullname) {
  const nameArray = areaFullname.split(" - ")

  return nameArray[0]
}

/**
 * Crea una estructura de carpetas jerárquica en Google Drive basada en los datos de la petición.
 * @param {object} petition - Objeto con la información de la OT.
 * @param {string} rootFolder - String con el ID de la carpeta.
 * @param {Function} fetchFolders - Función que busca las carpetas existentes en parentId.
 * @param {Function} createFolder - Función que crea una carpeta de nombre "folderName" en parentId.
 * @param {string} uploadInFolder - Nombre de la carpeta específica que se quiere crear.
 * @returns {Promise<object>} - Objeto que representa la carpeta final creada o encontrada en Google Drive.
 */
export const createFolderStructure = async (petition, rootFolder, fetchFolders, createFolder, uploadInFolder) => {

  const plantInitials = await getPlantInitals(petition.plant)
  const plantFolder = await ensureFolder(rootFolder, plantInitials, fetchFolders, createFolder, plantInitials)
  const areaFolder = await ensureFolder(plantFolder.id, petition.area, fetchFolders, createFolder, extractAreaNumber(petition.area))
  const projectFolder = await ensureFolder(areaFolder.id, `OT N°${petition.ot} - ${petition.title}`, fetchFolders, createFolder, petition.ot)
  const destinationFolder = await ensureFolder(projectFolder.id, uploadInFolder, fetchFolders, createFolder, uploadInFolder)

  return destinationFolder
}

/**
 * Asegura la existencia de una carpeta con un nombre específico dentro de una carpeta padre en Google Drive.
 * Si la carpeta no existe, se crea.
 * @param {string} parentId - ID de la carpeta analizada.
 * @param {string} folderName - Nombre de la carpeta a crear.
 * @param {Function} fetchFolders - Función que busca las carpetas existentes en parentId.
 * @param {Function} createFolder - Función que crea una carpeta de nombre "folderName" en parentId.
 * @param {string} includedString - String para hacer el Match de la búsqueda mediante "includes".
 * @returns {Promise<object>} - Objeto que representa la carpeta final creada o encontrada en Google Drive.
 */
const ensureFolder = async (parentId, folderName, fetchFolders, createFolder, includedString) => {

  try {
    const parentFolders = await fetchFolders(parentId)
    let folder = parentFolders.files.find(f => f.name.includes(includedString))

    if (!folder) {
      folder = await createFolder(folderName, parentId)
    }

    return folder
  } catch (error) {
    console.error('Error en la ejecución de ensureFolder():', error)
    throw error
  }
}

export const handleFileUpload = async ({
  files,
  blueprint,
  petitionId,
  petition,
  fetchFolders,
  uploadFile,
  createFolder,
  updateBlueprintsWithStorageOrHlc,
  rootFolder,
  authUser,
  onFileUpload = null,
  uploadInFolder = 'EN TRABAJO'
}) => {
  if (!files || !blueprint.id) return null

  try {
    // Utilizamos createFolderStructure para manejar toda la lógica de carpetas
    const destinationFolder = await createFolderStructure(
      petition,
      rootFolder,
      fetchFolders,
      createFolder,
      uploadInFolder
    )
    const revisionFolderName = `REV_${await getNextRevisionFolderName(blueprint, authUser)}`
    const revisionFolders = await fetchFolders(destinationFolder.id)
    let revisionFolder = revisionFolders.files.find(folder => folder.name === revisionFolderName)

    if (!revisionFolder) {
      revisionFolder = await createFolder(revisionFolderName, destinationFolder.id)
    }
    const fileData = await uploadFile(files.name, files, revisionFolder.id)

    if (fileData?.id) {
      const fileLink = `https://drive.google.com/file/d/${fileData.id}/view`
      await updateBlueprintsWithStorageOrHlc(petitionId, blueprint.id, fileLink, fileData.name, 'storage')

      if (onFileUpload) {
        onFileUpload(fileLink, fileData.name)
      }

      return { fileLink, fileName: fileData.name }
    }
  } catch (error) {
    console.error('Error en handleFileUpload:', error)
    throw error
  }

  return null
}
