// ** Firebase Imports
import { getAuth, updateProfile, deleteUser, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import { Firebase, db } from 'src/configs/firebase'
import { doc, setDoc } from 'firebase/firestore'

// ** Trae funcion que valida los campos del registro
import { registerValidator } from '../form-validation/helperRegisterValidator'
import { getData } from './firestoreQuerys'

// ** Genera contraseña unica y aleatoria
const generatorPassword = require('generate-password')

const formatAuthUser = async user => {
  const data = await getData(user.uid)

  return {
    uid: user.uid,
    email: user.email,
    displayName: data ? data.name || 'No definido' : 'No disponible',
    urlFoto: data ? data.urlFoto || 'No definido' : 'No disponible',
    phone: data ? data.phone || 'No definido' : 'No disponible',
    role: data ? data.role || 'No definido' : 'No disponible',
    plant: data ? data.plant || 'No definido' : 'No disponible',
    engineering: data ? data.engineering || false : false,
    shift: data ? data.shift || 'No definido' : 'No disponible',
    company: data ? data.company || 'No definido' : 'No disponible',
    contop: data ? data.contop || 'No definido' : 'No disponible',
    opshift: data ? data.opshift || 'No definido' : 'No disponible'
  }
}

// Recuperar password (envia cooreo)
const resetPassword = email => {
  return Firebase.auth()
    .sendPasswordResetEmail(email)
    .catch(err => {
      if (err.code === 'auth/user-not-found') {
        throw new Error('Este usuario no se encuentra registrado')
      } else {
        throw new Error('Error al restablecer la contraseña')
      }
    })
}

// Actualizar password (para actualizar desde mi perfil)
const updatePassword = async password => {
  return await Firebase.auth().updatePassword(password)
}

// ** Inicio de sesión
const signInWithEmailAndPassword = (email, password) => {
  return Firebase.auth()
    .signInWithEmailAndPassword(email, password)
    .catch(err => {
      switch (err.code) {
        case 'auth/wrong-password':
          throw new Error('Contraseña incorrecta, intente de nuevo')
        case 'auth/user-not-found':
          throw new Error('Este usuario no se encuentra registrado')
        default:
          throw new Error('Error al iniciar sesión')
      }
    })
}

// ** Registro de usuarios
const createUser = async (values, userParam, saveEmail, saveUID) => {
  const { name, email } = values
  try {
    registerValidator(values)

    // Guarda correo del admin
    saveEmail(userParam.email)

    // Crea contraseña alfanumerica de 10 digitos
    // Se comenta esta funcion para posterior uso en producción
    // const newPassword = generatorPassword.generate({
    //   length: 10,
    //   numbers: true
    // })
    const newPassword = 'password'

    // Crea usuario
    try {
      await Firebase.auth().createUserWithEmailAndPassword(email, newPassword) // Reemplazar 'password' por newPassword
    } catch (createError) {
      console.log('Error al crear el usuario:', createError)
      throw createError // Re-lanzar el error para que se pueda capturar en un nivel superior si es necesario
    }

    // Envía correo para cambiar la contraseña
    resetPassword(email)

    // Guardar uid en un estado
    saveUID(Firebase.auth().currentUser.uid)

    // Actualiza usuario
    try {
      await updateProfile(Firebase.auth().currentUser, {
        displayName: name,
        photoURL: ''
      })
      console.log(Firebase.auth().currentUser)
    } catch (updateError) {
      console.log('Error al actualizar el perfil:', updateError)
      throw updateError // Re-lanzar el error para que se pueda capturar en un nivel superior si es necesario
    }
  } catch (error) {
    if (error.message === 'Firebase: Error (auth/email-already-in-use).') {
      throw new Error('El usuario ya se encuentra registrado.')
    } else {
      console.log('Error en datos ingresados:', error)
      throw new Error('Error al crear usuario: ' + error.message)
    }
  }
}

const createUserInDatabase = (values, uid) => {
  const { name, rut, phone, email, plant, engineering, shift, company, role, opshift, urlFoto } = values

  const photoURL = Firebase.auth().currentUser.photoURL

  return new Promise(async (resolve, reject) => {
    try {
      await setDoc(doc(db, 'users', uid), {
        name: name,
        email: email,
        rut: rut,
        phone: phone.replace(/\s/g, ''),
        company: company,
        role: role,
        ...(plant && { plant }),
        ...(engineering && { engineering }),
        ...(shift && { shift }),
        ...(opshift && { opshift }),
        photoURL: photoURL
      })

      resolve('Usuario creado exitosamente en la base de datos')
    } catch (error) {
      console.log(error)
      reject(new Error('Error al crear el usuario en la base de datos: ' + error))
    }
  })
}

// ** Permite que el admin entre de vuelta y escribe en db
const signAdminBack = async (values, password, oldEmail, uid, saveUID) => {
  try {
    await Firebase.auth().signInWithEmailAndPassword(oldEmail, password)
    const successMessage = await createUserInDatabase(values, uid)

    saveUID('')

    // Realizar acciones adicionales si es necesario

    return successMessage // Retornar el mensaje de éxito
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}

async function signAdminFailure() {
  const user = auth.currentUser

  return new Promise(async (resolve, reject) => {
    try {
      await deleteUser(user)
      resolve('Excediste el número de intentos. No se creó ningún usuario.')
    } catch (error) {
      reject(new Error(error))
    }
  })
}

const signGoogle = async () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider()

  /* Asks for permissions for the app to access the user's Drive files.
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
  provider.addScope('https://www.googleapis.com/auth/userinfo.email');
  provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
 */

  signInWithRedirect(auth, provider)
  // This gives you a Google Access Token. You can use it to access the Google API.
  /* getRedirectResult(auth)
  .then((result) => {
    let credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const params = {'access_token': token}
    localStorage.setItem('oauth2-test-params', JSON.stringify(params));
  }).catch((error) => {
    console.log(error)
  }); */
  }

export {
  formatAuthUser,
  resetPassword,
  updatePassword,
  signInWithEmailAndPassword,
  createUser,
  createUserInDatabase,
  signAdminBack,
  signAdminFailure,
  signGoogle,
}
