import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  Link,
  Typography
} from '@mui/material'
import 'moment/locale/es'
import { Fragment, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useFirebase } from 'src/context/useFirebase'

import { HeadingTypography } from 'src/@core/components/custom-form/index'
import Icon from 'src/@core/components/icon'

const FormLayoutsDocViewer = () => {
  // ** Hooks
  const { getDomainData } = useFirebase()

  // ** States
  const [file, setFile] = useState(null)
  const [documentUrl, setDocumentUrl] = useState('')
  const [showDocumentDialog, setShowDocumentDialog] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [agreementId, setAgreementId] = useState(null) // Nuevo estado para almacenar el ID del acuerdo

  // useEffect para buscar toda la información de la colección domain en la base de datos
  useEffect(() => {
    const getAllDomainData = async () => {
      try {
        const domain = await getDomainData()
        if (!domain) {
          console.error('No se encontraron los datos o datos son indefinidos o null.')
          return
        }
        // Aquí puedes usar los datos del dominio si es necesario
      } catch (error) {
        console.error('Error buscando los datos:', error)
      }
    }
    getAllDomainData()
  }, [])

  const validateFile = file => {
    const documentExtensions = ['xls', 'xlsx', 'doc', 'docx', 'ppt', 'pptx', 'pdf', 'csv', 'txt']
    const maxSizeBytes = 10 * 1024 * 1024 // 10 MB in bytes

    const extension = file.name.split('.').pop().toLowerCase()
    return documentExtensions.includes(extension) && file.size <= maxSizeBytes
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => {
      const file = acceptedFiles[0]
      if (!validateFile(file)) {
        alert('Archivo inválido o excede el tamaño máximo de 10 MB.')
        return
      }

      // Configura el archivo y abre el diálogo de vista previa
      const fileUrl = URL.createObjectURL(file)
      setFile(file)
      setDocumentUrl(fileUrl)
      setShowDocumentDialog(true)
    },
    maxFiles: 1 // Limita la carga a un solo archivo
  })

  const handleSign = async () => {
    setIsSigning(true);
    try {
      // Solicitud para obtener el nuevo token de acceso
      const response = await fetch('/api/adobeSign', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Error al refrescar el token');
      }

      const { accessToken } = await response.json(); // Extraer el token de la respuesta

      // Imprimir el nuevo token en la consola
      console.log('Nuevo token de acceso:', accessToken);

    } catch (error) {
      console.error('Error al obtener el token de acceso:', error);
    } finally {
      setIsSigning(false);
    }
  };



  return (
    <Card>
      <CardContent>
        <form>
          <Grid container spacing={5}>

            {/* Dropzone archivos */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <Fragment>
                  <div {...getRootProps({ className: 'dropzone' })}>
                    <input {...getInputProps()} />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: ['column', 'column', 'row'],
                        alignItems: 'center',
                        margin: 'auto'
                      }}
                    >
                      <Box
                        sx={{ pl: 2, display: 'flex', flexDirection: 'column', alignItems: ['center'], margin: 'auto' }}
                      >
                        <HeadingTypography variant='h5'>Subir archivo</HeadingTypography>
                        <Icon icon='mdi:file-document-outline' />
                        <Typography sx={{ mt: 5 }} color='textSecondary'>
                          Arrastra el archivo acá o <Link>haz click acá</Link> para buscarlo en tu dispositivo
                        </Typography>
                      </Box>
                    </Box>
                  </div>
                </Fragment>
              </FormControl>
            </Grid>
          </Grid>
        </form>
      </CardContent>

      {/* Dialog para ver el documento */}
      <Dialog
        open={showDocumentDialog}
        onClose={() => setShowDocumentDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Ver documento</DialogTitle>
        <DialogContent>
          <iframe src={documentUrl} width="100%" height="500px" title="Document Viewer"></iframe>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSign} color="primary" disabled={isSigning}>
            {isSigning ? <CircularProgress size={24} /> : 'Firmar'}
          </Button>
          <Button onClick={() => setShowDocumentDialog(false)} color="secondary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default FormLayoutsDocViewer
