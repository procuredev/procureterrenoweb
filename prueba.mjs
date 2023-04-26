import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth'
import admin from 'firebase-admin'

import serviceAccount from './procureterrenoweb-firebase-adminsdk-ii0ix-fc477c019d.json' assert { type: "json" }
import { get } from 'http';

initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://procureterrenoweb.firebaseio.com"
});

const auth = getAuth();

//crea usuario y asigna rol
 auth.createUser({
    email: 'aaaeeeiii@aa.aa',
    emailVerified: false,
    password: 'secretPassword',
    displayName: 'John Doe',
    photoURL: 'http://www.example.com/12345678/photo.png',
    disabled: false,
  })
  .then((userRecord) => {
    // See the UserRecord reference doc for the contents of userRecord.
    console.log('Successfully created new user:', userRecord.uid);
    const uid = userRecord.uid;
    const customClaims = { role: "admin" };

    auth.setCustomUserClaims(uid, customClaims)
      .then(() => {
        console.log("Custom claims added to user:", uid);

        //SE TRAE EL RECORD PARA REVISAR QUE FUNCIONÓ
          auth.getUser(uid)
          .then((userRecord) => {
            // See the UserRecord reference doc for the contents of userRecord.
            console.log(userRecord)
          })
          .catch((error) => {
            console.log('Error fetching user data:', error);
          });
      })
      .catch((error) => {
        console.log(error);
      });
  })
  .catch((error) => {
    console.log('Error creating new user:', error);
  });


