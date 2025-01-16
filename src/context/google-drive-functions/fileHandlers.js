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
        condition: () => blueprint.revision === 'iniciado' && !isM3D,
        action: () => (newRevision = 'A')
      },
      incrementRevisionInA: {
        condition: () => blueprint.revision === 'A',
        action: () => (newRevision = blueprint.approvedByDocumentaryControl ? nextChar : blueprint.revision)
      },
      dotCloud: {
        condition: () => blueprint.revision === 'iniciado' && isM3D,
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

export const createFolderStructure = async (
  petition,
  blueprint,
  rootFolder,
  fetchFolders,
  createFolder,
  uploadInFolder
) => {
  const plantFolders = await fetchFolders(rootFolder)
  let plantFolder = plantFolders.files.find(folder => folder.name.includes(getPlantInitals(petition.plant)))

  if (!plantFolder) {
    plantFolder = await createFolder(getPlantInitals(blueprint.plant), rootFolder)
  }

  const areaFolder = await ensureFolder(plantFolder.id, petition.area, fetchFolders, createFolder)

  const projectFolder = await ensureFolder(
    areaFolder.id,
    `OT N°${petition.ot} - ${petition.title}`,
    fetchFolders,
    createFolder
  )

  const destinationFolder = await ensureFolder(projectFolder.id, uploadInFolder, fetchFolders, createFolder)

  return destinationFolder
}

/**
 * Función para crear una carpeta de nombre específico en una carpeta de ID específico.
 * @param {string} parentId - ID de la carpeta analizada.
 * @param {string} folderName - Nombre de la carpeta a crear.
 * @param {Function} fetchFolders - Función que busca las carpetas existentes en parentId.
 * @param {Function} createFolder - Función que crea una carpeta de nombre "folderName" en parentId.
 * @returns {object} - Objeto folder de Google Drive.
 */
const ensureFolder = async (parentId, folderName, fetchFolders, createFolder) => {

  const folders = await fetchFolders(parentId)
  let folder = folders.files.find(f => f.name === folderName)

  if (!folder) {
    folder = await createFolder(folderName, parentId)
  }

  return folder
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
      blueprint,
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
