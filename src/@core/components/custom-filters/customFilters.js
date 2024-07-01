const filterByLabel = (label, translation, data) => {
  const allOptions = [...new Set(data.flatMap(obj => obj[label]))]
  allOptions.sort()

  const filteredOptions = allOptions.reduce((result, element) => {
    result[element] = {
      label: `${element}`,
      type: `${translation}`,
      canSee: [1, 2, 5, 6, 7, 8, 9, 10, 11, 12],
      filterFunction: doc => doc[label] === element
    }

    return result
  }, {})

  return filteredOptions
}

export default filterByLabel
