function localDate(input) {
  let date = new Date(input)
  let offset = date.getTimezoneOffset()
  date.setMinutes(date.getMinutes() + offset)

  return date
}

export default localDate
