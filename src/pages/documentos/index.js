import React, { useEffect, useState } from 'react'

const Documentos = () => {
    const [files, setFiles] = useState([])

    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
    const CLIENT_ID = '83406272260-dokqlmtnrssfcajc5fb0m5lihbtc6osm.apps.googleusercontent.com'
    const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly'
    const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

      const fragmentString = window.location.hash.substring(1);

      // Parse query string to see if page request is coming from OAuth 2.0 server.
      const params = {};
      const regex = /([^&=]+)=([^&]*)/g;
      let m;
      while ((m = regex.exec(fragmentString))) {
        params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
      }

      if (Object.keys(params).length > 0) {
        localStorage.setItem('oauth2-test-params', JSON.stringify(params));
        if (params['state'] && params['state'] === 'try_sample_request') {
          trySampleRequest();
        }
      }

      // If there's an access token, try an API request.
      // Otherwise, start OAuth 2.0 flow.
      function trySampleRequest() {
        const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params'));
        if (storedParams && storedParams['access_token']) {
          const xhr = new XMLHttpRequest();
          xhr.open(
            'GET',
            'https://www.googleapis.com/drive/v3/about?fields=user&' +
              'access_token=' + storedParams['access_token']
          );
          xhr.onreadystatechange = function (e) {
            if (xhr.readyState === 4 && xhr.status === 200) {

            } else if (xhr.readyState === 4 && xhr.status === 401) {
              // Token invalid, so prompt for user permission.
              oauth2SignIn();
            }
          };
          xhr.send(null);
        } else {
          oauth2SignIn();
        }
      }

      /*
       * Create form to request access token from Google's OAuth 2.0 server.
       */
      function oauth2SignIn() {
        // Google's OAuth 2.0 endpoint for requesting an access token
        const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

        // Parameters to pass to OAuth 2.0 endpoint.
        const params = {
          client_id: CLIENT_ID,
          redirect_uri: 'http://localhost:3000/documentos',
          scope: 'https://www.googleapis.com/auth/drive.file',
          state: 'try_sample_request',
          include_granted_scopes: 'true',
          response_type: 'token',
        };

        // Create form element to open OAuth 2.0 endpoint in a new window.
        const form = document.createElement('form');
        form.setAttribute('method', 'GET'); // Send as a GET request.
        form.setAttribute('action', oauth2Endpoint);

        // Add form parameters as hidden input values.
        for (const p in params) {
          const input = document.createElement('input');
          input.setAttribute('type', 'hidden');
          input.setAttribute('name', p);
          input.setAttribute('value', params[p]);
          form.appendChild(input);
        }

        // Add form to the page and submit it to open the OAuth 2.0 endpoint.
        document.body.appendChild(form);
        form.submit();
      }


      function getGoogleDriveFiles() {
        const params = JSON.parse(localStorage.getItem('oauth2-test-params'));
        if (params && params['access_token']) {
          const accessToken = params['access_token'];
          fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(data)
              if (data.files) {
                setFiles(data.files);
              }
            })
            .catch((error) => {
              console.error('Error fetching Google Drive files:', error);
            });
        }
      }

      // Llama a la función para obtener archivos de Google Drive cuando se autentique.
      if (Object.keys(params).length > 0) {
        localStorage.setItem('oauth2-test-params', JSON.stringify(params));
        if (params['state'] && params['state'] === 'try_sample_request') {
          trySampleRequest();
          getGoogleDriveFiles(); // Llama a la función aquí.
        }
      }

      function uploadFile(file) {
        const params = JSON.parse(localStorage.getItem('oauth2-test-params'));
        if (params && params['access_token']) {
          const accessToken = params['access_token'];
          const formData = new FormData();
          formData.append('file', file);

          fetch('https://www.googleapis.com/upload/drive/v3/files', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
          })
            .then((response) => response.json())
            .then((data) => {
              console.log('File uploaded:', data);
              // Puedes manejar la respuesta aquí
            })
            .catch((error) => {
              console.error('Error uploading file:', error);
            });
        }
      }


      useEffect(() => {
        const storedParams = JSON.parse(localStorage.getItem('oauth2-test-params'));
        if (storedParams && storedParams['access_token']) {
          // Ya tienes un token de acceso, no es necesario autenticar de nuevo.
          getGoogleDriveFiles();
        } else {
          // No tienes un token de acceso, inicia el flujo de autenticación.
          const fragmentString = window.location.hash.substring(1);
          const params = {};
          const regex = /([^&=]+)=([^&]*)/g;
          let m;
          while ((m = regex.exec(fragmentString))) {
            params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
          }

          if (Object.keys(params).length > 0) {
            localStorage.setItem('oauth2-test-params', JSON.stringify(params));
            if (params['state'] && params['state'] === 'try_sample_request') {
              trySampleRequest();
            }
          }
        }
      }, []);


    return (
      <div>
        <button onClick={()=>trySampleRequest()}>Try sample request</button>
        <input type="file" onChange={(e) => uploadFile(e.target.files[0])} />

        <ul>
        {files.map((file) => (
          <li key={file.id}>{file.name}</li>
        ))}
      </ul>
      </div>
    );
  };


Documentos.acl = {
  subject: 'documentos'
}

export default Documentos
