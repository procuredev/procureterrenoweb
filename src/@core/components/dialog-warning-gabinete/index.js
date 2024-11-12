import React, { useState, useEffect, Fragment, useRef } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  TextField,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Link,
  CircularProgress,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Grid,
  Paper
} from '@mui/material'
import Icon from 'src/@core/components/icon'

import FileCopyIcon from '@mui/icons-material/FileCopy'
import { useDropzone } from 'react-dropzone'
import { useFirebase } from 'src/context/useFirebase'
import { useGoogleDriveFolder } from 'src/@core/hooks/useGoogleDriveFolder'
import DialogErrorFile from 'src/@core/components/dialog-errorFile'
import { useTheme } from '@mui/material/styles'

// Función para obtener el ícono adecuado según el tipo de archivo
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
    default:
      return 'mdi:file-document-outline'
  }
}

export default function AlertDialogGabinete({
  open,
  handleClose,
  callback,
  approves,
  authUser,
  setRemarksState,
  remarksState,
  blueprint,
  petitionId,
  petition,
  error,
  setError,
  onFileUpload,
  setDoc,
  checkRoleAndApproval
}) {
  const [values, setValues] = useState({})
  const [toggleRemarks, setToggleRemarks] = useState(false)
  const [toggleAttach, setToggleAttach] = useState(false)
  const [files, setFiles] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorDialog, setErrorDialog] = useState(false)
  const [errorFileMsj, setErrorFileMsj] = useState('')
  const previousBlueprintRef = useRef(blueprint)

  const theme = useTheme()
  const { updateBlueprintsWithStorageOrHlc, deleteReferenceOfLastDocumentAttached } = useFirebase()
  const { uploadFile, fetchFolders } = useGoogleDriveFolder()

  // Condición para habilitar el botón de rechazo si hay más de un blueprint y el campo de observaciones está lleno
  const canReject = blueprint?.storageBlueprints?.length > 1 && remarksState.length > 0

  const canAprove =
    toggleRemarks && !toggleAttach
      ? approves && remarksState.length > 0 && blueprint?.storageBlueprints?.length < 2
      : !toggleRemarks && blueprint?.storageBlueprints?.length > 1
      ? false
      : toggleRemarks && !toggleAttach && blueprint?.storageBlueprints?.length > 1
      ? false
      : toggleAttach
      ? blueprint?.storageBlueprints?.length > 1 && remarksState.length > 0
      : approves

  // Definir valores iniciales basados en blueprint
  const initialValues = {
    id: blueprint?.id,
    clientCode: blueprint?.clientCode,
    userId: blueprint?.userId,
    userName: blueprint?.userName,
    userEmail: blueprint?.userEmail,
    revision: blueprint?.revision,
    storageBlueprints: blueprint?.storageBlueprints,
    storageHlcDocuments: blueprint?.storageHlcDocuments,
    description: blueprint?.description,
    date: blueprint?.date
  }

  // Actualizar el estado values cuando blueprint cambia
  /* useEffect(() => {
    setValues(initialValues)
  }, [blueprint]) */

  useEffect(() => {
    const { storageBlueprints, ...otherBlueprintFields } = blueprint || {} // Excluye storageBlueprints

    setValues(prevValues => ({
      ...prevValues,
      ...otherBlueprintFields // Actualiza solo si otros campos de blueprint han cambiado
    }))
  }, [
    blueprint.id,
    blueprint.clientCode,
    blueprint.userId,
    blueprint.userName,
    blueprint.userEmail,
    blueprint.revision,
    blueprint.storageHlcDocuments,
    blueprint.description,
    blueprint.date
  ])

  useEffect(() => {
    if (previousBlueprintRef.current?.storageBlueprints !== blueprint.storageBlueprints) {
      setValues(prevValues => ({
        ...prevValues,
        storageBlueprints: blueprint.storageBlueprints
      }))
      previousBlueprintRef.current = blueprint
    }
  }, [blueprint.storageBlueprints])

  // Actualizar estados en caso de aprobación
  useEffect(() => {
    setToggleRemarks(!approves)
    setToggleAttach(!approves)
  }, [approves])

  const getNextRevisionFolderName = (blueprint, authUser) => {
    let newRevision = blueprint.revision

    const nextCharCode = blueprint.revision.charCodeAt(0) + 1
    const nextChar = String.fromCharCode(nextCharCode)

    // Verifica si el id contiene "M3D" antes del último guion
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
          action: () => {
            newRevision = '0'
          }
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

  // Manejar validación del nombre de archivo
  const validateFileName = acceptedFiles => {
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
    } else {
      const currentName = authUser.displayName

      const initials = currentName
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

  // Dropzone para manejar la carga de archivos
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      const invalidFiles = validateFiles(acceptedFiles).filter(file => !file.isValid)
      if (invalidFiles.length > 0) {
        handleOpenErrorDialog(invalidFiles[0].msj)

        return
      }

      const invalidFileNames = validateFileName(acceptedFiles).filter(file => !file.isValid)
      if (invalidFileNames.length > 0) {
        handleOpenErrorDialog(invalidFileNames[0].msj)

        return
      }

      if (toggleAttach) setFiles(acceptedFiles[0])
    },
    multiple: false
  })

  // Función para manejar el diálogo de error
  const handleOpenErrorDialog = msj => {
    setErrorFileMsj(msj)
    setErrorDialog(true)
  }

  const handleCloseErrorDialog = () => {
    setErrorDialog(false)
    setRemarksState('')
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

  // Función para subir archivos a Google Drive y actualizar Firestore
  const handleFileUpload = async () => {
    if (files && blueprint.id) {
      setIsUploading(true)
      try {
        // Paso 1: Buscar la carpeta correspondiente en Google Drive
        const plantFolders = await fetchFolders('1kKCLEpiN3E-gleNVR8jz_9mZ7dpSY8jw') // Carpeta raíz de prueba

        const plantFolder = plantFolders.files.find(folder =>
          folder.name.includes(getPlantAbbreviation(petition.plant))
        )

        if (plantFolder) {
          const areaFolders = await fetchFolders(plantFolder.id)
          const areaFolder = areaFolders.files.find(folder => folder.name === petition.area)

          if (areaFolder) {
            const projectFolderName = `OT N°${petition.ot} - ${petition.title}`
            const existingProjectFolders = await fetchFolders(areaFolder.id)
            const projectFolder = existingProjectFolders.files.find(folder => folder.name === projectFolderName)

            if (projectFolder) {
              const trabajoFolders = await fetchFolders(projectFolder.id)
              const trabajoFolder = trabajoFolders.files.find(folder => folder.name === 'EN TRABAJO')

              if (trabajoFolder) {
                // Paso 2: Subir el archivo a la carpeta "EN TRABAJO"
                const fileData = await uploadFile(files.name, files, trabajoFolder.id)

                if (fileData && fileData.id) {
                  const fileLink = `https://drive.google.com/file/d/${fileData.id}/view`

                  // Paso 3: Actualizar Firestore con el enlace al archivo en Google Drive

                  await updateBlueprintsWithStorageOrHlc(petitionId, blueprint.id, fileLink, fileData.name, 'storage')
                  setFiles(null)

                  // Llamar a onFileUpload para actualizar el estado en el componente padre
                  onFileUpload(fileLink, fileData.name)
                  setFiles(null)
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar el archivo a Google Drive:', error)
        setError('Error al cargar el archivo. Intente nuevamente.')
      }
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setFiles(null)
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

  const isRole9 = authUser.role === 9 // Ctrl. Documental : C-Doc
  const isRole8 = authUser.role === 8 // Proyectista
  const isRole7 = authUser.role === 7 // Suervisor
  const isRole6 = authUser.role === 6 // C. Owner : C-Ow

  const isRevisor = isRole6 || isRole7 || isRole9

  const handleClickDeleteDocumentReturned = async () => {
    try {
      setIsUploading(true)
      await deleteReferenceOfLastDocumentAttached(petitionId, blueprint.id)

      // Actualiza el estado de `values` directamente para reflejar la eliminación
      setDoc(prevValues => ({
        ...prevValues,
        storageBlueprints: blueprint.storageBlueprints.slice(0, -1) // elimina el último archivo localmente
      }))
      setIsUploading(false)
    } catch (error) {
      console.error('Error al cargar el archivo a Google Drive:', error)
      setError('Error al cargar el archivo. Intente nuevamente.')
    }
  }

  console.log('toggleRemarks', toggleRemarks)

  return (
    <Dialog
      open={open}
      onClose={() => {
        handleClose()
        setFiles(null)
        setToggleRemarks(false)
        setToggleAttach(false)
        setRemarksState('')
        setErrorDialog(false)
        setError('')
      }}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <DialogTitle id='alert-dialog-title'>
        {blueprint.userId === authUser.uid ? 'Enviar' : approves ? 'Aprobar' : 'Rechazar'} entregable de la solicitud
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', width: 600 }}>
        <DialogContentText>
          ¿Estás segur@ de que quieres{' '}
          {blueprint.userId === authUser.uid ? 'Enviar' : approves ? 'aprobar' : 'rechazar'} el entregable?
        </DialogContentText>

        {(approves && authUser.role === 9 && blueprint?.approvedByDocumentaryControl === true) ||
        (approves && authUser.role === 9 && blueprint?.revision === 'A') ? ( // Se comenta condicionales por petición de QA
          <FormControlLabel
            control={<Checkbox onChange={() => setToggleRemarks(!toggleRemarks)} />}
            sx={{ mt: 4 }}
            label='Agregar Comentario'
          />
        ) : (
          ''
        )}

        {toggleRemarks && !approves ? (
          <TextField
            sx={{ mt: 4 }}
            label='Observación'
            //* error={error} */
            error={Boolean(error)}
            helperText={error}
            onChange={e => setRemarksState(e.target.value)}
          />
        ) : toggleRemarks ? (
          <TextField
            sx={{ mt: 4 }}
            label='Comentario'
            error={Boolean(error)}
            helperText={error}
            onChange={e => setRemarksState(e.target.value)}
          />
        ) : (
          ''
        )}

        {isRevisor ? (
          <Fragment>
            {isUploading === false ? (
              <Fragment>
                {approves && toggleRemarks && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        disabled={!approves}
                        checked={toggleAttach}
                        onChange={() => setToggleAttach(!toggleAttach)}
                      />
                    }
                    label='Agregar Archivo Adjunto'
                  />
                )}

                {blueprint.storageBlueprints?.length === 2 && (
                  <Box sx={{ mt: 6 }}>
                    <Typography variant='body2'>
                      Documento de corrección cargado: <br /> {/* {blueprint.storageBlueprints[1].name} */}
                    </Typography>
                    <List dense sx={{ py: 4 }}>
                      <ListItem key={blueprint.storageBlueprints[1].name}>
                        <ListItemText primary={blueprint.storageBlueprints[1].name} />
                        <ListItemSecondaryAction sx={{ right: 0, my: 'auto' }}>
                          <IconButton
                            size='small'
                            sx={{ display: 'flex' }}
                            aria-haspopup='true'
                            onClick={() => handleClickDeleteDocumentReturned()} // handleClickDeleteDocumentReturned(blueprint.storageBlueprints[1].name)
                            aria-controls='modal-share-examples'
                          >
                            <Icon icon='mdi:delete-forever' color='#f44336' />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </List>
                  </Box>
                )}

                {toggleAttach && files && (
                  <Fragment>
                    <List>{fileList}</List>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                      <Button color='error' sx={{ m: 2 }} variant='outlined' onClick={handleRemoveFile}>
                        Quitar
                      </Button>
                      <Button
                        color='primary'
                        sx={{ m: 2 }}
                        variant='outlined'
                        onClick={handleFileUpload}
                        disabled={isLoading}
                      >
                        'Subir archivo'
                      </Button>
                    </Box>
                  </Fragment>
                )}
                {blueprint.storageBlueprints?.length < 2 && toggleAttach && !files && (
                  <div {...getRootProps({ className: 'dropzone' })}>
                    <input {...getInputProps()} />
                    <Box
                      sx={{
                        my: 5,
                        mx: 'auto',
                        p: 5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                        borderRadius: '10px'
                      }}
                    >
                      <Typography color='textSecondary'>
                        <Link onClick={() => {}}>Haz click acá</Link> para adjuntar archivo
                      </Typography>
                    </Box>
                  </div>
                )}
              </Fragment>
            ) : (
              <CircularProgress sx={{ m: 5 }} />
            )}
          </Fragment>
        ) : (
          ''
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setRemarksState('')
            setToggleRemarks(false)
            setToggleAttach(false)
            setErrorDialog(false)
            setError('')
            setFiles(null)
            handleClose()
          }}
        >
          No
        </Button>
        <Button onClick={callback} autoFocus disabled={(!approves && !canReject) || !canAprove}>
          Sí
        </Button>
      </DialogActions>
      {errorDialog && <DialogErrorFile open={errorDialog} handleClose={handleCloseErrorDialog} msj={errorFileMsj} />}
    </Dialog>
  )
}
