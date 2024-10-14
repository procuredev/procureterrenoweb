import axios from 'axios';
import FormData from 'form-data';

// Función para obtener el token de acceso OAuth
const refreshAccessToken = async () => {
  try {
    const params = new URLSearchParams();
    params.append('refresh_token', process.env.NEXT_PUBLIC_ADOBE_SIGN_REFRESH_TOKEN);
    params.append('client_id', process.env.NEXT_PUBLIC_ADOBE_SIGN_CLIENT_ID);
    params.append('client_secret', process.env.NEXT_PUBLIC_ADOBE_SIGN_CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');

    const refreshUrl = 'https://api.adobesign.com/oauth/v2/refresh';

    const response = await axios.post(refreshUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const newAccessToken = response.data.access_token;
    return newAccessToken;
  } catch (error) {
    console.error('Error al refrescar el token:', error.response ? error.response.data : error.message);
    throw error;
  }
};

// Función para obtener la URL del endpoint
const getBaseUris = async (accessToken) => {
  const BASE_URL = 'https://api.adobesign.com/api/rest/v6';

  const response = await axios.get(`${BASE_URL}/baseUris`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data.apiAccessPoint;
};

// Función para subir un documento transitorio
const uploadTransientDocument = async (file, accessToken, baseUris) => {
  try {
    const formData = new FormData();

    formData.append('File-Name', file.name);
    formData.append('Mime-Type', file.type);
    formData.append('File', file);

    const response = await axios.post(`${baseUris}transientDocuments`, formData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.transientDocumentId;
  } catch (error) {
    console.error('Error subiendo el documento transitorio:', error.response.data);
    throw error;
  }
};

// Función para crear un acuerdo
const createAgreement = async (file) => {
  try {
    const accessToken = await refreshAccessToken();
    const baseUris = await getBaseUris(accessToken);

    const transientDocumentId = await uploadTransientDocument(file, accessToken, baseUris);

    const response = await axios.post(`${baseUris}agreements`, {
      documentCreationInfo: {
        fileInfos: [{ transientDocumentId }],
        recipientsList: [{ email: 'jorge.acuna@procure.cl' }],
        name: 'Document for Signature',
        signatureType: 'ESIGN',
        state: 'IN_PROCESS',
      },
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error creando el acuerdo:', error);
    throw error;
  }
};

// Nueva función para descargar el documento firmado
const downloadSignedDocument = async (agreementId, accessToken, baseUris) => {
  try {
    const response = await axios.get(`${baseUris}agreements/${agreementId}/combinedDocument`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/pdf',
      },
      responseType: 'arraybuffer', // Tipo de respuesta adecuado para la descarga de archivos
    });

    return response.data;
  } catch (error) {
    console.error('Error descargando el documento firmado:', error.response ? error.response.data : error.message);
    throw error;
  }
};

// Handler de la API
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const newAccessToken = await refreshAccessToken();
      res.status(200).json({ accessToken: newAccessToken });
    } catch (error) {
      res.status(500).json({ error: 'Error al refrescar el token' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}

