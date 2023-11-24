# Prosite

## Introducción

Esta aplicación web está construida utilizando la plantilla [Materialize Admin Template](https://demos.pixinvent.com/materialize-nextjs-admin-template/documentation/guide/). Puedes encontrar varios componentes [aquí](https://demos.pixinvent.com/materialize-nextjs-admin-template/demo-1/dashboards/crm/) con su respectivo código.

## Algunos archivos de interés

La mayoría de las vistas disponibles se encuentran en la carpeta `src\pages`, que también contiene a `index.js` (relacionado con el objeto auth y con next/router) y `_app.js`, que contiene la aplicación envuelta en varios `Provider` de contexto.

### Navegación

Para agregar una página a la barra de navegación se debe editar los archivos `src\navigation\horizontal\index.js` y `src\navigation\vertical\index.js`.

### Hooks

La carpeta `src\hooks` contiene dos hooks relacionados con Firebase que venían incluídos en la plantilla y un custom hook llamado `useSnapshot.js` que permite traerse los datos actualizados desde la base de datos.
En `src\hooks\useFirebaseAuth.js` se encuentran todas las demás funciones de Firebase, que son async.

## Deployment

Como esta plantilla usa Next.js, es posible hacer el deploy en Vercel automáticamente cada vez que se hace un cambio en el repo, vía Github Actions.
test
