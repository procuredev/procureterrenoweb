import React, { Fragment, useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  Link,
  List,
  ListItem,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/system/Box'
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
import { getRootFolder } from 'src/@core/utils/constants'
import { getPlantAbbreviation, validateFileName, handleFileUpload } from 'src/@core/utils/fileHandlers'
import { validateFiles, getFileIcon } from 'src/@core/utils/fileValidation'
import FileList from 'src/@core/components/file-list'

export const UploadBlueprintsDialog = ({ doc, petitionId, currentRow, petition, checkRoleAndApproval }) => {
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
  const rootFolder = getRootFolder()

  const { updateDocs, authUser, addDescription, updateBlueprintsWithStorageOrHlc } = useFirebase()

  // Verifica estado
  revision = typeof revision === 'string' ? revision : 100

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
      const invalidFileNames = validateFileName(acceptedFiles, values, doc, authUser, checkRoleAndApproval).filter(
        file => !file.isValid
      )
      if (invalidFileNames.length > 0) {
        const res = validateFileName(invalidFileNames, values, doc, authUser, checkRoleAndApproval)
        const msj = res[0].msj
        handleOpenErrorDialog(msj)

        return invalidFileNames
      }

      if (authUser.role === 9 && doc.approvedByDocumentaryControl && !checkRoleAndApproval(authUser.role, doc)) {
        setHlcDocuments(acceptedFiles[0])
      }

      if (
        (authUser.uid === doc.userId && !doc.sentByDesigner) ||
        ((authUser.role === 6 || authUser.role === 7) && doc.sentByDesigner && !doc.approvedByDocumentaryControl) ||
        (authUser.role === 9 && (doc.approvedBySupervisor || doc.approvedByContractAdmin)) ||
        (doc.approvedByDocumentaryControl && checkRoleAndApproval(authUser.role, doc))
      ) {
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

  const handleSubmitHlcDocuments = async () => {
    try {
      setIsLoading(true)
      // Busca la carpeta de la planta.
      const plantFolders = await fetchFolders(rootFolder)
      let plantFolder = plantFolders.files.find(folder => folder.name.includes(getPlantAbbreviation(petition.plant)))

      // Si no existe la carpeta de la planta, se crea
      if (!plantFolder) {
        const plantName = getPlantAbbreviation(doc.plant)
        plantFolder = await createFolder(plantName, rootFolder)
      }

      if (plantFolder) {
        // Busca la carpeta del área.
        const areaFolders = await fetchFolders(plantFolder.id)
        let areaFolder = areaFolders.files.find(folder => folder.name === petition.area)

        // Si no existe la carpeta del área, se crea
        if (!areaFolder) {
          areaFolder = await createFolder(doc.area, plantFolder.id)
        }

        if (areaFolder) {
          const projectFolderName = `OT N°${petition.ot} - ${petition.title}`
          const existingProjectFolders = await fetchFolders(areaFolder.id)
          let projectFolder = existingProjectFolders.files.find(folder => folder.name === projectFolderName)

          // Si no existe la carpeta de la OT, se crea
          if (!projectFolder) {
            projectFolder = await createFolder(projectFolderName, areaFolder.id)
          }

          if (projectFolder) {
            // Ubica la carpeta "EMITIDOS"
            const issuedFolders = await fetchFolders(projectFolder.id)
            let issuedFolder = issuedFolders.files.find(folder => folder.name === 'EMITIDOS')

            // Si no existe la carpeta 'EMITIDOS', se crea
            if (!issuedFolder) {
              trabajoFolder = await createFolder('EMITIDOS', projectFolder.id)
            }

            if (issuedFolder) {
              // Crear o encontrar la subcarpeta de la revisión, por ejemplo: "REV_A"
              const revisionFolderName = `REV_${doc.revision}`
              const revisionFolders = await fetchFolders(issuedFolder.id)
              let revisionFolder = revisionFolders.files.find(folder => folder.name === revisionFolderName)

              if (!revisionFolder) {
                revisionFolder = await createFolder(revisionFolderName, issuedFolder.id)
              }

              if (revisionFolder) {
                const fileData = await uploadFile(hlcDocuments.name, hlcDocuments, revisionFolder.id)

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
      <Box sx={{ margin: 'auto' }}>
        {
          <Box>
            <List>
              {values && values.revision && (
                <ListItem divider={true}>
                  <Box sx={{ display: 'flex', width: '100%' }}>
                    <Typography component='div' sx={{ width: '30%', pr: 2 }}>
                      Revisión
                    </Typography>
                    <Box>{values.revision}</Box>
                  </Box>
                </ListItem>
              )}

              <DateListItem
                editable={false}
                label='Fecha de Creación'
                id='date'
                initialValue={date}
                value={values.date}
                onChange={handleInputChange('date')}
                required={false}
              />
              <CustomListItem
                editable={false}
                label='Encargado'
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
              {values && values.id && (
                <ListItem divider={true}>
                  <Box sx={{ display: 'flex', width: '100%' }}>
                    <Typography component='div' sx={{ width: '30%', pr: 2 }}>
                      Código Procure
                    </Typography>
                    <Box>{values.id}</Box>
                  </Box>
                </ListItem>
              )}
              {values && values.clientCode && (
                <ListItem divider={true}>
                  <Box sx={{ display: 'flex', width: '100%' }}>
                    <Typography component='div' sx={{ width: '30%', pr: 2 }}>
                      Código MEL
                    </Typography>
                    <Box>{values.clientCode}</Box>
                  </Box>
                </ListItem>
              )}

              {doc && authUser.uid === doc.userId ? (
                <CustomListItem
                  editable={doc && authUser.uid === doc.userId}
                  label='Descripción'
                  placeholder='Agregue la descripción del documento'
                  InputLabelProps={{
                    shrink: true
                  }}
                  id='description'
                  value={values?.description || ''}
                  onChange={e => {
                    handleInputChange('description')(e)
                    setIsDescriptionSaved(false) // Restablece el estado al cambiar la descripción
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
              ) : (
                <ListItem divider={true}>
                  <Box sx={{ display: 'flex', width: '100%' }}>
                    <Typography component='div' sx={{ width: '30%', pr: 2 }}>
                      Descripción
                    </Typography>
                    <Box>{values.description}</Box>
                  </Box>
                </ListItem>
              )}

              {!isSaving && doc && doc.storageBlueprints && doc.storageBlueprints.length > 0 && !isLoading && (
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
                  </Box>
                </ListItem>
              )}

              {doc && doc.storageHlcDocuments && doc.storageHlcDocuments.length > 0 && !isLoading && (
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
                  </Box>
                </ListItem>
              )}

              {isLoading === false ? (
                <Fragment>
                  <ListItem>
                    <FormControl fullWidth>
                      <Fragment>
                        {(!doc.storageBlueprints &&
                          !files &&
                          doc &&
                          authUser.uid === doc.userId &&
                          !doc.sentByDesigner) ||
                        (doc &&
                          (authUser.role === 6 || authUser.role === 7) &&
                          doc.sentByDesigner &&
                          !doc.approvedByDocumentaryControl &&
                          doc.storageBlueprints?.length < 2 &&
                          !doc.approvedBySupervisor &&
                          !doc.approvedByContractAdmin) ||
                        (doc &&
                          authUser.role === 9 &&
                          (doc.approvedBySupervisor || doc.approvedByContractAdmin) &&
                          doc.storageBlueprints?.length < 2 &&
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
                            <List>
                              <FileList files={files} handleRemoveFile={handleRemoveFile} />
                            </List>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                              <Button color='error' sx={{ m: 2 }} variant='outlined' onClick={handleRemoveAllFiles}>
                                Quitar
                              </Button>
                              <Button
                                color='primary'
                                sx={{ m: 2 }}
                                variant='outlined'
                                onClick={async () => {
                                  try {
                                    setIsLoading(true)
                                    await handleFileUpload({
                                      files,
                                      blueprint: doc,
                                      petitionId,
                                      petition,
                                      fetchFolders,
                                      uploadFile,
                                      createFolder,
                                      updateBlueprintsWithStorageOrHlc,
                                      rootFolder
                                    })
                                    setFiles(null)
                                  } catch (error) {
                                    console.error('Error al subir el archivo:', error)
                                  } finally {
                                    setIsLoading(false)
                                  }
                                }}
                              >
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
