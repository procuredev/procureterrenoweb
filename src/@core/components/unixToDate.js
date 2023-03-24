export const unixToDate = (seconds) => {

return new Date(seconds*1000).toLocaleString('es-ES').split(',')

}
