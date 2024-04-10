const filterByLabel = (label, translation, data) => {
  const allOptions = [...new Set(data.flatMap(obj => obj[label]))]

  const filteredOptions = allOptions.reduce((result, element) => {
    result[element] = {
      label: `${element}`,
      type: `${translation}`,
      canSee: [1, 2, 5, 6, 7, 9, 11],
      filterFunction: doc => doc[label] === element
    }

    return result
  }, {})

  return filteredOptions
}

export default filterByLabel
