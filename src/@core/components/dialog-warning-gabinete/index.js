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
  Link,
  CircularProgress,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText
} from '@mui/material'
import Icon from 'src/@core/components/icon'

import { useDropzone } from 'react-dropzone'
import { useFirebase } from 'src/context/useFirebase'
import { useGoogleDriveFolder } from 'src/@core/hooks/useGoogleDriveFolder'
import DialogErrorFile from 'src/@core/components/dialog-errorFile'
import { getRootFolder } from 'src/@core/utils/constants'
import { validateFileName, handleFileUpload } from 'src/@core/utils/fileHandlers'
import { validateFiles } from 'src/@core/utils/fileValidation'
import FileList from 'src/@core/components/file-list'

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
  const [toggleRemarks, setToggleRemarks] = useState(!approves)
  const [toggleAttach, setToggleAttach] = useState(!approves)
  const [files, setFiles] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errorDialog, setErrorDialog] = useState(false)
  const [errorFileMsj, setErrorFileMsj] = useState('')
  const previousBlueprintRef = useRef(blueprint)

  const rootFolder = getRootFolder()
  const { updateBlueprintsWithStorageOrHlc, deleteReferenceOfLastDocumentAttached } = useFirebase()
  const { uploadFile, fetchFolders, createFolder } = useGoogleDriveFolder()

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

  // Actualiza estados en caso de aprobación
  useEffect(() => {
    setToggleRemarks(!approves)
    setToggleAttach(!approves)
  }, [approves])

  // Dropzone para manejar la carga de archivos
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      const invalidFiles = validateFiles(acceptedFiles).filter(file => !file.isValid)
      if (invalidFiles.length > 0) {
        handleOpenErrorDialog(invalidFiles[0].msj)

        return
      }

      const invalidFileNames = validateFileName(
        acceptedFiles,
        values,
        blueprint,
        authUser,
        checkRoleAndApproval
      ).filter(file => !file.isValid)
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
  }

  const handleRemoveFile = () => {
    setFiles(null)
  }

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

  return (
    <Dialog
      open={open}
      onClose={() => {
        handleClose()
        setFiles(null)
        setToggleRemarks(!approves)
        setToggleAttach(!approves)
        setRemarksState('')
        setErrorDialog(false)
        setError('')
      }}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
    >
      <DialogTitle id='alert-dialog-title'>
        {blueprint.userId === authUser.uid
          ? 'Enviar'
          : approves
          ? 'Aprobar'
          : !approves && authUser.role === 9
          ? 'Rechazar'
          : 'Devolver'}{' '}
        entregable de la solicitud
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', width: 600 }}>
        <DialogContentText>
          ¿Estás segur@ de que quieres{' '}
          {blueprint.userId === authUser.uid
            ? 'Enviar'
            : approves
            ? 'aprobar'
            : !approves && authUser.role === 9
            ? 'rechazar'
            : 'devolver'}{' '}
          el entregable?
        </DialogContentText>

        {(approves && authUser.role === 9 && blueprint?.approvedByDocumentaryControl === true) ||
        (approves && authUser.role === 9 && blueprint?.revision === 'A') ? (
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
                    <List>
                      <FileList files={files} handleRemoveFile={handleRemoveFile} />
                    </List>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                      <Button color='error' sx={{ m: 2 }} variant='outlined' onClick={handleRemoveFile}>
                        Quitar
                      </Button>
                      <Button
                        color='primary'
                        sx={{ m: 2 }}
                        variant='outlined'
                        onClick={async () => {
                          try {
                            setIsUploading(true)
                            await handleFileUpload({
                              files,
                              blueprint,
                              petitionId,
                              petition,
                              fetchFolders,
                              uploadFile,
                              createFolder,
                              updateBlueprintsWithStorageOrHlc,
                              rootFolder,
                              onFileUpload
                            })
                            setFiles(null)
                          } catch (error) {
                            console.error('Error al subir el archivo:', error)
                          } finally {
                            setIsUploading(false)
                          }
                        }}
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
            setToggleRemarks(!approves)
            setToggleAttach(!approves)
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
