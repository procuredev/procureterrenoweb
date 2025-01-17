import { Typography, Tooltip, IconButton } from '@mui/material'
import FileCopyIcon from '@mui/icons-material/FileCopy'
import { getPlantInitals } from 'src/context/firebase-functions/firestoreQuerys'

export const getNextRevisionFolderName = (blueprint, authUser) => {
  let newRevision = blueprint.revision
  const nextCharCode = blueprint.revision.charCodeAt(0) + 1
  const nextChar = String.fromCharCode(nextCharCode)
  const isM3D = blueprint.id.split('-').slice(-2, -1)[0] === 'M3D'

  const isRole8 = authUser.role === 8
  const isRole7 = authUser.role === 7

  if (isRole8 || (isRole7 && blueprint.userId === authUser.uid)) {
    const actions = {
      keepRevision: {
        condition: () =>
          blueprint.revision.charCodeAt(0) >= 48 &&
          blueprint.approvedByClient === true &&
          blueprint.approvedByDocumentaryControl === false,
        action: () => (newRevision = blueprint.revision)
      },
      resetRevision: {
        condition: () => blueprint.revision.charCodeAt(0) >= 66 && blueprint.approvedByClient === true,
        action: () => (newRevision = '0')
      },
      incrementRevision: {
        condition: () =>
          (blueprint.revision.charCodeAt(0) >= 66 || blueprint.revision.charCodeAt(0) >= 48) &&
          blueprint.approvedByClient === false &&
          blueprint.approvedByDocumentaryControl === true,
        action: () => (newRevision = nextChar)
      },
      startRevision: {
        condition: () => blueprint.revision === 'Iniciado' && !isM3D,
        action: () => (newRevision = 'A')
      },
      incrementRevisionInA: {
        condition: () => blueprint.revision === 'A',
        action: () => (newRevision = blueprint.approvedByDocumentaryControl ? nextChar : blueprint.revision)
      },
      dotCloud: {
        condition: () => blueprint.revision === 'Iniciado' && isM3D,
        action: () => (newRevision = '0')
      }
    }

    Object.values(actions).forEach(({ condition, action }) => {
      if (condition()) {
        action()
      }
    })
  }

  return newRevision
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
 * Crea una estructura de carpetas jerárquica en Google Drive basada en los datos de la petición.
 * @param {object} petition - Objeto con la información de la OT.
 * @param {string} rootFolder - String con el ID de la carpeta.
 * @param {Function} fetchFolders - Función que busca las carpetas existentes en parentId.
 * @param {Function} createFolder - Función que crea una carpeta de nombre "folderName" en parentId.
 * @param {string} uploadInFolder - Nombre de la carpeta específica que se quiere crear.
 * @returns {Promise<object>} - Objeto que representa la carpeta final creada o encontrada en Google Drive.
 */
export const createFolderStructure = async (
  petition,
  rootFolder,
  fetchFolders,
  createFolder,
  uploadInFolder
) => {

  // Función para obtener el Número de Área a partir del nombre completo del área.
  function extractAreaNumber(areaFullname) {
    const nameArray = areaFullname.split(" - ")

    return nameArray[0]
  }

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
