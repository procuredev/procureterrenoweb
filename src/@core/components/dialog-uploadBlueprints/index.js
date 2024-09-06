import { Download } from '@mui/icons-material'
import BorderColorIcon from '@mui/icons-material/BorderColor'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Paper from '@mui/material/Paper'
import Slide from '@mui/material/Slide'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/system/Box'
import React, { Fragment, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import DialogErrorFile from 'src/@core/components/dialog-errorFile'
import AlertDialog from 'src/@core/components/dialog-warning'
import Icon from 'src/@core/components/icon'
import { useFirebase } from 'src/context/useFirebase'
import { useGoogleDriveFolder } from 'src/@core/hooks/useGoogleDriveFolder'

import 'moment/locale/es'

import { InputAdornment } from '@mui/material'
import DateListItem from 'src/@core/components/custom-date'
import CustomListItem from 'src/@core/components/custom-list'
import { auto } from '@popperjs/core'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

//esta función se usa para establecer los iconos de los documentos que ya se han adjuntado al documento
function getIconForFileType(filePath) {
  const urlWithoutParams = filePath.split('?')[0]
  const extension = urlWithoutParams.split('.').pop().toLowerCase()

  switch (extension) {
    case 'pdf':
      return '/icons/pdf.png'
    case 'ppt':
    case 'pptx':
      return '/icons/ppt.png'
    case 'doc':
    case 'docx':
      return '/icons/doc.png'
    case 'xls':
    case 'xlsx':
      return '/icons/xls.png'
    default:
      return '/icons/default.png'
  }
}

//esta función se usa para establecer los iconos de los documentos que se van a adjuntar al documento, previo a cargarlos.
const getFileIcon = fileType => {
  switch (fileType) {
    case 'application/pdf':
      return 'mdi:file-pdf'
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'mdi:file-word'
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'mdi:file-excel'
    // ... agregar más tipos de archivo según sea necesario
    default:
      return 'mdi:file-document-outline'
  }
}

const getFileName = (content, index) => {
  if (typeof content === 'string') {
    const urlSegments = content.split('%2F')
    const encodedFileName = urlSegments[urlSegments.length - 1]
    const fileNameSegments = encodedFileName.split('?')
    const fileName = decodeURIComponent(fileNameSegments[0])

    return fileName
  } else {
    // Si content no es una cadena, devuelve un valor por defecto o maneja el caso como consideres necesario.
    return ''
  }
}

// función que renderiza cada elemento adjunto y renderiza la variable 'displaySrc' que usa un condicional en caso que el elemento sea una image muestra el thumbnail, caso contrario muestra el icono según el tipo de archivo
const PhotoItem = ({ photoUrl }) => {
  const urlWithoutParams = photoUrl.split('?')[0]
  const isImage = /\.(jpeg|jpg|gif|png)$/.test(urlWithoutParams.toLowerCase())
  const displaySrc = isImage ? photoUrl : getIconForFileType(photoUrl)

  const onError = () => {
    const imageRef = document.getElementById(photoUrl)
    imageRef.src = 'https://fonts.gstatic.com/s/i/materialiconsoutlined/error/v20/24px.svg'
    imageRef.style.filter = 'contrast(0.5) invert(1)'
    imageRef.style.height = '30px'
    imageRef.style.marginRight = '5px'
    imageRef.nextSibling.style.display = 'none'
    imageRef.parentElement.parentElement.style.height = '30px'
    imageRef.parentElement.style.display = 'flex'
    imageRef.parentElement.style.alignItems = 'center'
    imageRef.parentElement.append('Error al cargar imagen')
  }

  return (
    <Box sx={{ position: 'relative', height: '-webkit-fill-available', p: 2 }}>
      <Typography variant='body2' color='textPrimary' sx={{ mb: 2, pl: 2 }}>
        {getFileName(photoUrl)} {/* Aquí se muestra el nombre del archivo */}
      </Typography>
      <Box
        component='img'
        id={photoUrl}
        src={displaySrc}
        onClick={() => window.open(photoUrl, '_blank')}
        alt='Photo'
        style={{ height: 90, cursor: 'pointer' }}
        onError={onError}
      />
      <IconButton
        href={photoUrl}
        target='_blank'
        rel='noopener noreferrer'
        sx={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: 'rgba(220, 220, 220, 0.1)'
        }}
      >
        <Download />
      </IconButton>
    </Box>
  )
}

const PhotoGallery = ({ photos }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      overflow: 'auto',
      height: '140px',
      width: '70%',
      justifyContent: 'space-evently'
    }}
  >
    {photos.map((fotoUrl, index) => (
      <PhotoItem key={index} photoUrl={fotoUrl} />
    ))}
  </Box>
)

export const UploadBlueprintsDialog = ({
  handleClose,
  doc,
  roleData,
  petitionId,
  currentRow,
  petition,
  checkRoleAndApproval
}) => {
  let id, userId, userName, userEmail, revision, storageBlueprints, description, date, clientCode, storageHlcDocuments

  if (doc) {
    ;({
      id,
      userId,
      userName,
      userEmail,
      revision,
      storageBlueprints,
      description,
      date,
      clientCode,
      storageHlcDocuments
    } = doc)
  } else {
    console.log('doc is undefined')
  }

  const [values, setValues] = useState({})
  const [message, setMessage] = useState('')

  const [openAlert, setOpenAlert] = useState(false)
  const [files, setFiles] = useState(null)
  const [hlcDocuments, setHlcDocuments] = useState(null)
  const [errorFileMsj, setErrorFileMsj] = useState('')
  const [errorDialog, setErrorDialog] = useState(false)

  const [isDescriptionSaved, setIsDescriptionSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const theme = useTheme()

  const {
    updateDocs,
    authUser,
    addDescription,
    uploadFilesToFirebaseStorage,
    updateBlueprintsWithStorageOrHlc
  } = useFirebase()
  const fullScreen = useMediaQuery(theme.breakpoints.down('xs'))

  // Verifica estado
  revision = typeof revision === 'string' ? revision : 100

  //console.log('files', files)

  const initialValues = {
    id,
    clientCode,
    userId,
    userName,
    userEmail,
    revision,
    storageBlueprints,
    storageHlcDocuments,
    description,
    date
  }

  // Actualiza el estado al cambiar de documento, sólo valores obligatorios
  useEffect(() => {
    setValues(initialValues)
  }, [doc])

  const { uploadFile, createFolder, fetchFolders } = useGoogleDriveFolder()

  const writeCallback = () => {
    const newData = {}

    for (const key in values) {
      if (hasChanges[key]) {
        newData[key] = values[key]
      }
    }

    if (Object.keys(newData).length > 0) {
      updateDocs(id, newData, authUser)
    } else {
      console.log('No se escribió ningún documento')
    }

    handleCloseAlert()
  }

  const handleCloseAlert = () => {
    setOpenAlert(false)
    setEditable(false)
  }

  // Función onchange utilizando currying
  const handleInputChange = field => event => {
    const fieldValue = event.target.value
    setValues({ ...values, [field]: fieldValue })
  }

  const validateFileName = acceptedFiles => {
    const expectedClientCode = values.clientCode
    console.log('authUser', authUser)

    const expectedRevision = getNextRevisionFolderName(doc, authUser)

    let expectedFileName = null

    if (authUser.role === 8 || (authUser.role === 7 && doc.userId === authUser.uid)) {
      expectedFileName = `${expectedClientCode}_REV_${expectedRevision}`
    } else if (authUser.role === 9 && doc.approvedByDocumentaryControl && !checkRoleAndApproval(authUser.role, doc)) {
      expectedFileName = `${expectedClientCode}_REV_${expectedRevision}_HLC`
    } else {
      const currentName = authUser.displayName

      const initials = currentName
        .toUpperCase()
        .split(' ')
        .map(word => word.charAt(0))
        .join('')

      expectedFileName = `${expectedClientCode}_REV_${expectedRevision}_${initials}`
    }

    const validationResults = acceptedFiles.map(file => {
      const fileNameWithoutExtension = file.name.split('.').slice(0, -1).join('.') // Quita la extensión del archivo

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

    return validationResults
  }

  const validateFiles = acceptedFiles => {
    const imageExtensions = ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'tiff', 'svg', 'heif', 'HEIF']
    const documentExtensions = ['xls', 'xlsx', 'doc', 'docx', 'ppt', 'pptx', 'pdf', 'csv', 'txt']
    const maxSizeBytes = 5 * 1024 * 1024 // 5 MB in bytes

    const isValidImage = file => {
      const extension = file.name.split('.').pop().toLowerCase()

      return imageExtensions.includes(extension) && file.size <= maxSizeBytes
    }

    const isValidDocument = file => {
      const extension = file.name.split('.').pop().toLowerCase()

      return documentExtensions.includes(extension) && file.size <= maxSizeBytes
    }

    const isValidFile = file => {
      return isValidImage(file) || isValidDocument(file)
    }

    const validationResults = acceptedFiles.map(file => {
      return {
        name: file.name,
        isValid: isValidFile(file),
        msj: isValidFile(file) ? `${file.name}` : `${file.name} - El archivo excede el tamaño máximo de 5 MB`
      }
    })

    return validationResults
  }

  const handleOpenErrorDialog = msj => {
    setErrorFileMsj(msj)
    setErrorDialog(true)
  }

  const handleCloseErrorDialog = () => {
    setErrorDialog(false)
  }

  const submitDescription = async () => {
    setIsSaving(true)
    try {
      await addDescription(petitionId, currentRow, values.description)
        .then(() => {
          setIsDescriptionSaved(true)
        })
        .catch(err => console.error(err))
      setIsDescriptionSaved(true)
    } catch (err) {
      console.error(err)
    }
    setIsSaving(false)
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      // Valida los archivos con base en el tamaño y tipo
      const invalidFiles = validateFiles(acceptedFiles).filter(file => !file.isValid)
      if (invalidFiles.length > 0) {
        const res = validateFiles(invalidFiles)
        const msj = res[0].msj
        handleOpenErrorDialog(msj)

        return invalidFiles
      }

      // Valida los archivos con base en el nombre
      const invalidFileNames = validateFileName(acceptedFiles).filter(file => !file.isValid)
      if (invalidFileNames.length > 0) {
        const res = validateFileName(invalidFileNames)
        const msj = res[0].msj
        handleOpenErrorDialog(msj)

        return invalidFileNames
      }

      if (authUser.role === 9 && doc.approvedByDocumentaryControl && !checkRoleAndApproval(authUser.role, doc)) {
        //setHlcDocuments(prevFiles => [...prevFiles, ...acceptedFiles.map(file => Object.assign(file))])
        setHlcDocuments(acceptedFiles[0])
      }

      if (
        (authUser.uid === doc.userId && !doc.sentByDesigner) ||
        ((authUser.role === 6 || authUser.role === 7) && doc.sentByDesigner && !doc.approvedByDocumentaryControl) ||
        (authUser.role === 9 && (doc.approvedBySupervisor || doc.approvedByContractAdmin)) ||
        (doc.approvedByDocumentaryControl && checkRoleAndApproval(authUser.role, doc))
      ) {
        // Agregar los nuevos archivos a los archivos existentes en lugar de reemplazarlos
        //setFiles(prevFiles => [...prevFiles, ...acceptedFiles.map(file => Object.assign(file))])
        setFiles(acceptedFiles[0])
      }
    },
    multiple: false // Esto limita a los usuarios a seleccionar solo un archivo a la vez
  })

  const handleRemoveFile = () => {
    setFiles(null)
  }

  const handleRemoveHLC = () => {
    setHlcDocuments(null)
  }

  const getPlantAbbreviation = plantName => {
    const plantMap = {
      'Planta Concentradora Laguna Seca | Línea 1': 'LSL1',
      'Planta Concentradora Laguna Seca | Línea 2': 'LSL2',
      'Instalaciones Escondida Water Supply': 'IEWS',
      'Planta Concentradora Los Colorados': 'PCLC',
      'Instalaciones Cátodo': 'ICAT',
      'Chancado y Correas': 'CHCO',
      'Puerto Coloso': 'PCOL'
    }

    return plantMap[plantName] || ''
  }

  const fileList = (
    <Grid container spacing={2} sx={{ justifyContent: 'center', m: 2 }}>
      {files && (
        <Grid item key={files.name}>
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              border: `4px solid ${theme.palette.primary.main}`,
              borderRadius: '4px',
              width: '220px',
              position: 'relative' // esta propiedad posiciona el icono correctamente
            }}
          >
            {files.type.startsWith('image') ? (
              <img width={50} height={50} alt={files.name} src={URL.createObjectURL(files)} />
            ) : (
              <Icon icon={getFileIcon(files.type)} fontSize={50} />
            )}
            <Typography
              variant='body2'
              sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', ml: '10px' }}
            >
              {`... ${files.name.slice(files.name.length - 15, files.name.length)}`}
            </Typography>
            <IconButton
              onClick={handleRemoveFile}
              sx={{
                position: 'absolute', // Posiciona el icono en relación al Paper
                top: '0px', // Ajusta el valor según la posición vertical deseada
                right: '0px' // Ajusta el valor según la posición horizontal deseada
              }}
            >
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Paper>
        </Grid>
      )}
    </Grid>
  )

  const hlcList = (
    <Grid container spacing={2} sx={{ justifyContent: 'center', m: 2 }}>
      {hlcDocuments && (
        <Grid item key={hlcDocuments.name}>
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px',
              border: `4px solid ${theme.palette.primary.main}`,
              borderRadius: '4px',
              width: '220px',
              position: 'relative' // Agregamos esta propiedad para posicionar el icono correctamente
            }}
          >
            {hlcDocuments.type.startsWith('image') ? (
              <img width={50} height={50} alt={hlcDocuments.name} src={URL.createObjectURL(hlcDocuments)} />
            ) : (
              <Icon icon={getFileIcon(hlcDocuments.type)} fontSize={50} />
            )}
            <Typography
              variant='body2'
              sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', ml: '10px' }}
            >
              {`... ${hlcDocuments.name.slice(hlcDocuments.name.length - 15, hlcDocuments.name.length)}`}
            </Typography>
            <IconButton
              onClick={handleRemoveHLC}
              sx={{
                position: 'absolute', // Posicionamos el icono en relación al Paper
                top: '0px', // Ajusta el valor según la posición vertical deseada
                right: '0px' // Ajusta el valor según la posición horizontal deseada
              }}
            >
              <Icon icon='mdi:close' fontSize={20} />
            </IconButton>
          </Paper>
        </Grid>
      )}
    </Grid>
  )

  const getNextRevisionFolderName = (doc, authUser) => {
    let newRevision = doc.revision

    const nextCharCode = doc.revision.charCodeAt(0) + 1
    const nextChar = String.fromCharCode(nextCharCode)

    const isRole8 = authUser.role === 8
    const isRole7 = authUser.role === 7

    if (isRole8 || (isRole7 && doc.userId === authUser.uid)) {
      // Lógica para el role 8
      const actions = {
        keepRevision: {
          condition: () =>
            doc.revision.charCodeAt(0) >= 48 &&
            doc.approvedByClient === true &&
            doc.approvedByDocumentaryControl === false,
          action: () => (newRevision = doc.revision)
        },
        resetRevision: {
          condition: () => doc.revision.charCodeAt(0) >= 66 && doc.approvedByClient === true,
          action: () => (newRevision = '0')
        },
        incrementRevision: {
          condition: () =>
            (doc.revision.charCodeAt(0) >= 66 || doc.revision.charCodeAt(0) >= 48) &&
            doc.approvedByClient === false &&
            doc.approvedByDocumentaryControl === true,
          action: () => (newRevision = nextChar)
        },
        startRevision: {
          condition: () => doc.revision === 'iniciado',
          action: () => (newRevision = 'A')
        },
        incrementRevisionInA: {
          condition: () => doc.revision === 'A',
          action: () => (newRevision = doc.approvedByDocumentaryControl ? nextChar : doc.revision)
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

  const handleSubmitAllFiles = async () => {
    try {
      //await uploadFilesToFirebaseStorage(files, doc.id, 'blueprints', petitionId)
      setIsLoading(true)
      // Busca la carpeta de la planta.
      const plantFolders = await fetchFolders('180lLMkkTSpFhHTYXBSBQjLsoejSmuXwt')
      const plantFolder = plantFolders.files.find(folder => folder.name.includes(getPlantAbbreviation(petition.plant)))

      if (plantFolder) {
        // Busca la carpeta del área.
        const areaFolders = await fetchFolders(plantFolder.id)
        const areaFolder = areaFolders.files.find(folder => folder.name === petition.area)

        if (areaFolder) {
          const projectFolderName = `OT N${petition.ot} - ${petition.title}`
          const existingProjectFolders = await fetchFolders(areaFolder.id)
          const projectFolder = existingProjectFolders.files.find(folder => folder.name === projectFolderName)

          if (projectFolder) {
            // Ubica la carpeta "EN TRABAJO"
            const trabajoFolders = await fetchFolders(projectFolder.id)
            const trabajoFolder = trabajoFolders.files.find(folder => folder.name === 'EN TRABAJO')

            if (trabajoFolder) {
              // Crear o encontrar la subcarpeta de la revisión, por ejemplo: "REV_A"
              const revisionFolderName = `REV_${await getNextRevisionFolderName(doc, authUser)}`

              const revisionFolders = await fetchFolders(trabajoFolder.id)
              let revisionFolder = revisionFolders.files.find(folder => folder.name === revisionFolderName)

              if (!revisionFolder) {
                revisionFolder = await createFolder(revisionFolderName, trabajoFolder.id)
              }

              if (revisionFolder) {
                // Crear o encontrar la carpeta "PLANOS" dentro de la revisión
                const planosFolderName = 'PLANOS'
                const planosFolders = await fetchFolders(revisionFolder.id)
                let planosFolder = planosFolders.files.find(folder => folder.name === planosFolderName)

                if (!planosFolder) {
                  planosFolder = await createFolder(planosFolderName, revisionFolder.id)
                }

                // Subir archivos a la carpeta "PLANOS"
                if (planosFolder) {
                  const fileData = await uploadFile(files.name, files, planosFolder.id)

                  if (fileData && fileData.id) {
                    const fileLink = `https://drive.google.com/file/d/${fileData.id}/view`

                    // Actualiza el campo storageBlueprints del blueprint en Firestore
                    await updateBlueprintsWithStorageOrHlc(petitionId, doc.id, fileLink, fileData.name, 'storage')
                  }
                }
              }
            }
          }
        }
      }

      setFiles(null)
      setIsLoading(false)
    } catch (error) {
      console.log(error)
    }
  }

  const handleSubmitHlcDocuments = async () => {
    try {
      //await uploadFilesToFirebaseStorage(hlcDocuments, doc.id, 'hlcDocuments', petitionId)
      setIsLoading(true)
      // Busca la carpeta de la planta.
      const plantFolders = await fetchFolders('180lLMkkTSpFhHTYXBSBQjLsoejSmuXwt')
      const plantFolder = plantFolders.files.find(folder => folder.name.includes(getPlantAbbreviation(petition.plant)))

      if (plantFolder) {
        // Busca la carpeta del área.
        const areaFolders = await fetchFolders(plantFolder.id)
        const areaFolder = areaFolders.files.find(folder => folder.name === petition.area)

        if (areaFolder) {
          const projectFolderName = `OT N${petition.ot} - ${petition.title}`
          const existingProjectFolders = await fetchFolders(areaFolder.id)
          const projectFolder = existingProjectFolders.files.find(folder => folder.name === projectFolderName)

          if (projectFolder) {
            // Ubica la carpeta "EN TRABAJO"
            const trabajoFolders = await fetchFolders(projectFolder.id)
            const trabajoFolder = trabajoFolders.files.find(folder => folder.name === 'EN TRABAJO')

            if (trabajoFolder) {
              // Crear o encontrar la subcarpeta de la revisión, por ejemplo: "REV_A"
              const revisionFolderName = `REV_${doc.revision}`
              const revisionFolders = await fetchFolders(trabajoFolder.id)
              let revisionFolder = revisionFolders.files.find(folder => folder.name === revisionFolderName)

              if (!revisionFolder) {
                revisionFolder = await createFolder(revisionFolderName, trabajoFolder.id)
              }

              if (revisionFolder) {
                // Crear o encontrar la carpeta "DOCUMENTOS" dentro de la revisión
                const documentosFolderName = 'DOCUMENTOS'
                const documentosFolders = await fetchFolders(revisionFolder.id)
                let documentosFolder = documentosFolders.files.find(folder => folder.name === documentosFolderName)

                if (!documentosFolder) {
                  documentosFolder = await createFolder(documentosFolderName, revisionFolder.id)
                }

                // Subir archivos a la carpeta "DOCUMENTOS"
                if (documentosFolder) {
                  const fileData = await uploadFile(hlcDocuments.name, hlcDocuments, documentosFolder.id)

                  if (fileData && fileData.id) {
                    const fileLink = `https://drive.google.com/file/d/${fileData.id}/view`

                    // Actualiza el campo storageBlueprints del blueprint en Firestore
                    await updateBlueprintsWithStorageOrHlc(petitionId, doc.id, fileLink, fileData.name, 'hlc')
                  }
                }
              }
            }
          }
        }
      }

      setHlcDocuments(null)
      setIsLoading(false)
    } catch (error) {
      console.log(error)
    }
  }

  const handleRemoveAllFiles = () => {
    setFiles(null)
    setHlcDocuments(null)
  }

  const handleLinkClick = event => {
    event.preventDefault()
  }

  return (
    <Box>
      <AlertDialog open={openAlert} handleClose={handleCloseAlert} onSubmit={() => writeCallback()}></AlertDialog>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant='h5'>Revisión: {values.revision}</Typography>
          <Typography variant='h5' sx={{ lineHeight: 3 }}>
            {`Código Procure: ${values.id}` || 'Sin código Procure'}
          </Typography>
          <Typography variant='h6' sx={{ my: 2, display: 'flex', alignItems: 'center' }}>
            Código MEL: {values.clientCode}
          </Typography>
        </Box>
      </DialogTitle>
      <Box sx={{ margin: 'auto' }}>
        {
          <Box>
            <List>
              <CustomListItem
                editable={doc && authUser.uid === doc.userId}
                label='Descripción'
                placeholder='Agregue la descripción del documento'
                InputLabelProps={{
                  shrink: true
                }}
                id='description'
                initialValue={description}
                value={values.description}
                onChange={e => {
                  handleInputChange('description')(e)
                  setIsDescriptionSaved(false) // Restablecer el estado al cambiar la descripción
                }}
                required={false}
                inputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      {!isDescriptionSaved && (
                        <Button
                          onClick={submitDescription}
                          disabled={isSaving}
                          color={storageBlueprints?.length > 0 && !description ? 'error' : 'primary'}
                        >
                          {isSaving ? 'Guardando...' : 'Guardar descripción'}
                        </Button>
                      )}
                    </InputAdornment>
                  )
                }}
              />
              <DateListItem
                editable={false}
                label='Fecha'
                id='date'
                initialValue={date}
                value={values.date}
                onChange={handleInputChange('date')}
                required={false}
              />
              <CustomListItem
                editable={false}
                label='Creado por'
                id='userName'
                initialValue={userName}
                value={values.userName}
                onChange={handleInputChange('userName')}
                required={false}
              />
              <CustomListItem
                editable={false}
                label='Contacto'
                id='userEmail'
                initialValue={userEmail}
                value={values.userEmail}
                onChange={handleInputChange('userEmail')}
                required={false}
              />
              {doc && doc.storageBlueprints && doc.storageBlueprints.length > 0 && (
                <ListItem>
                  <Box sx={{ display: 'flex', width: '100%' }}>
                    <Typography component='div' sx={{ width: '30%', pr: 2 }}>
                      Plano adjunto
                    </Typography>
                    <Box>
                      {doc.storageBlueprints.map(file => (
                        <Fragment key={file.url}>
                          <Link href={file.url} target='_blank' rel='noreferrer'>
                            {file.name}
                          </Link>
                          <br />
                        </Fragment>
                      ))}
                    </Box>

                    {/* <PhotoGallery photos={storageBlueprints} /> */}
                  </Box>
                </ListItem>
              )}

              {doc && doc.storageHlcDocuments && doc.storageHlcDocuments.length > 0 && (
                <ListItem>
                  <Box sx={{ display: 'flex', width: '100%' }}>
                    <Typography component='div' sx={{ width: '30%', pr: 2 }}>
                      HLC adjunto
                    </Typography>
                    <Box>
                      <Link href={doc.storageHlcDocuments[0].url} target='_blank' rel='noreferrer'>
                        {doc.storageHlcDocuments[0].name}
                      </Link>
                    </Box>
                    {/* <PhotoGallery photos={storageHlcDocuments} /> */}
                  </Box>
                </ListItem>
              )}

              {/* Aquí true debe reemplazarse por el permiso para subir archivos */}
              {isLoading === false ? (
                <Fragment>
                  <ListItem>
                    <FormControl fullWidth>
                      <Fragment>
                        {(doc && authUser.uid === doc.userId && !doc.sentByDesigner) ||
                        (doc &&
                          (authUser.role === 6 || authUser.role === 7) &&
                          doc.sentByDesigner &&
                          !doc.approvedByDocumentaryControl &&
                          !doc.approvedBySupervisor &&
                          !doc.approvedByContractAdmin) ||
                        (doc &&
                          authUser.role === 9 &&
                          (doc.approvedBySupervisor || doc.approvedByContractAdmin) &&
                          !checkRoleAndApproval(authUser.role, doc)) ? (
                          <div {...getRootProps({ className: 'dropzone' })}>
                            <input {...getInputProps()} />
                            <Box
                              sx={{
                                my: 5,
                                mx: 'auto',
                                p: 5,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: ['center'],
                                backdropFilter: 'contrast(0.8)',
                                width: '100%',
                                borderRadius: '10px',
                                justifyContent: 'center'
                              }}
                            >
                              <Icon icon='mdi:file-document-outline' />
                              <Typography sx={{ mt: 5 }} color='textSecondary'>
                                <Link onClick={() => handleLinkClick}>Haz click acá</Link> para adjuntar Plano.
                              </Typography>
                            </Box>
                          </div>
                        ) : (
                          ''
                        )}
                        {files && (
                          <Fragment>
                            <List>{fileList}</List>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                              <Button color='error' sx={{ m: 2 }} variant='outlined' onClick={handleRemoveAllFiles}>
                                Quitar
                              </Button>
                              <Button color='primary' sx={{ m: 2 }} variant='outlined' onClick={handleSubmitAllFiles}>
                                Subir archivo
                              </Button>
                            </Box>
                          </Fragment>
                        )}
                      </Fragment>
                    </FormControl>
                  </ListItem>

                  <ListItem>
                    <FormControl fullWidth>
                      <Fragment>
                        {authUser.role === 9 &&
                        (doc.sentByDesigner || doc.sentBySupervisor) &&
                        doc.approvedByDocumentaryControl &&
                        !checkRoleAndApproval(authUser.role, doc) ? (
                          <div {...getRootProps({ className: 'dropzone' })}>
                            <input {...getInputProps()} />
                            <Box
                              sx={{
                                my: 5,
                                mx: 'auto',
                                p: 5,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: ['center'],
                                backdropFilter: 'contrast(0.8)',
                                width: '100%',
                                borderRadius: '10px',
                                justifyContent: 'center'
                              }}
                            >
                              <Icon icon='mdi:file-document-outline' />
                              <Typography sx={{ mt: 5 }} color='textSecondary'>
                                <Link onClick={() => handleLinkClick}>Haz click acá</Link> para adjuntar archivo HLC.
                              </Typography>
                            </Box>
                          </div>
                        ) : (
                          ''
                        )}
                        {hlcDocuments && doc.approvedByDocumentaryControl && !checkRoleAndApproval(authUser.role, doc) && (
                          <Fragment>
                            <List>{hlcList}</List>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                              <Button color='error' sx={{ m: 2 }} variant='outlined' onClick={handleRemoveAllFiles}>
                                Quitar
                              </Button>
                              <Button
                                color='primary'
                                sx={{ m: 2 }}
                                variant='outlined'
                                onClick={handleSubmitHlcDocuments}
                              >
                                Subir archivo HLC
                              </Button>
                            </Box>
                          </Fragment>
                        )}
                      </Fragment>
                    </FormControl>
                  </ListItem>
                </Fragment>
              ) : (
                <CircularProgress sx={{ m: 5 }} />
              )}
            </List>
          </Box>
        }
      </Box>
      {errorDialog && <DialogErrorFile open={errorDialog} handleClose={handleCloseErrorDialog} msj={errorFileMsj} />}
      <Dialog open={!!message} aria-labelledby='message-dialog-title' aria-describedby='message-dialog-description'>
        <DialogTitle id='message-dialog-title'>Creando solicitud</DialogTitle>
        <DialogContent>
          <DialogContentText id='message-dialog-description'>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMessage('')}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
