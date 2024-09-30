import axios from 'axios';

const BASE_URL = 'https://api.na1.adobesign.com/api/rest/v6';

// Función para obtener el token de acceso OAuth
export const getAccessToken = async () => {
  const clientId = process.env.ADOBE_CLIENT_ID;
  const clientSecret = process.env.ADOBE_CLIENT_SECRET;
  const redirectUri = 'https://your_redirect_uri.com/callback'; // Asegúrate de usar tu URL de redirección real
  const authorizationCode = 'authorization_code_obtenido_previamente'; // Obtén este código al hacer el flujo de OAuth

  const tokenUrl = `https://api.na1.adobesign.com/oauth/token`;

  try {
    const response = await axios.post(tokenUrl, {
      client_id: clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error obteniendo el access token:', error);
    throw error;
  }
};

// Función para crear un acuerdo con el token de acceso
export const createAgreement = async (file, signerEmail) => {
  try {
    // Obtener el token de acceso dinámicamente
    const accessToken = await getAccessToken();

    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${BASE_URL}/agreements`, {
      documentCreationInfo: {
        fileInfos: [{ transientDocumentId: file }],
        recipientsList: [{ email: signerEmail }],
        name: 'Document for Signature',
        signatureType: 'ESIGN',
        state: 'IN_PROCESS',
      }
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,  // Usar el token dinámico
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error creando el acuerdo:', error);
    throw error;
  }
};

// Función para descargar el documento firmado con el token de acceso
export const downloadSignedDocument = async (agreementId) => {
  try {
    // Obtener el token de acceso dinámicamente
    const accessToken = await getAccessToken();

    const response = await axios.get(`${BASE_URL}/agreements/${agreementId}/combinedDocument`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,  // Usar el token dinámico
        'Content-Type': 'application/pdf'
      },
      responseType: 'blob' // Necesario para la descarga de archivos
    });

    // Crear una URL para el archivo descargado
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'signed_document.pdf');
    document.body.appendChild(link);
    link.click();
  } catch (error) {
    console.error('Error descargando el documento firmado:', error);
    throw error;
  }
};
