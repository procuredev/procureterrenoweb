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

## Material UI y customización de componentes

Esta aplicación usa componentes de Material UI para la mayoría de las vistas. Existen dos propiedades importantes que pueden pasarse a los componentes para su customización: `slotProps` y `sx`.

### La propiedad slotProps

`slotProps` es una propiedad que se utiliza para personalizar los componentes internos de un componente de Material-UI. Por ejemplo, si tienes un componente `DatePicker` y quieres personalizar el componente `TextField` dentro de él, puedes usar `slotProps` para establecer propiedades específicas en ese componente interno.

```javascript
slotProps={{
  textField: {
    error: errors.start ? true : false,
    helperText: errors.start
  }
}}
```

### La propiedad sx

`sx` es una propiedad de Material-UI que se utiliza para aplicar estilos en línea a un componente. Es una forma rápida y conveniente de aplicar estilos sin tener que crear una hoja de estilos separada. En este ejemplo, `sx` se utiliza para establecer el ancho del componente `FormControl` al 100%.

```javascript
<FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
```

## Algunos archivos de interés

La mayoría de las vistas disponibles se encuentran en la carpeta `src\pages`, que también contiene a `index.js` (relacionado con el objeto auth y con next/router) y `_app.js`, que contiene la aplicación envuelta en varios `Provider` de contexto.

### Navegación

Para agregar una página a la barra de navegación se debe editar los archivos `src\navigation\horizontal\index.js` y `src\navigation\vertical\index.js`.

### Hooks

La carpeta `src\hooks` contiene dos hooks relacionados con Firebase que venían incluídos en la plantilla y un custom hook llamado `useSnapshot.js` que permite traerse los datos actualizados desde la base de datos.
En `src\hooks\useFirebaseAuth.js` se encuentran todas las demás funciones de Firebase, que son async.

## Material UI y customización de componentes

Esta aplicación usa componentes de Material UI para la mayoría de las vistas. Existen dos propiedades importantes que pueden pasarse a los componentes para su customización: `slotProps` y `sx`.

### La propiedad slotProps

`slotProps` es una propiedad que se utiliza para personalizar los componentes internos de un componente de Material-UI. Por ejemplo, si tienes un componente `DatePicker` y quieres personalizar el componente `TextField` dentro de él, puedes usar `slotProps` para establecer propiedades específicas en ese componente interno.

```javascript
slotProps={{
  textField: {
    error: errors.start ? true : false,
    helperText: errors.start
  }
}}
```

### La propiedad sx

`sx` es una propiedad de Material-UI que se utiliza para aplicar estilos en línea a un componente. Es una forma rápida y conveniente de aplicar estilos sin tener que crear una hoja de estilos separada. En este ejemplo, `sx` se utiliza para establecer el ancho del componente `FormControl` al 100%.

```javascript
<FormControl fullWidth sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
```

## Deployment

Como esta plantilla usa Next.js, es posible hacer el deploy en Vercel automáticamente cada vez que se hace un cambio en el repo, vía Github Actions.
test
