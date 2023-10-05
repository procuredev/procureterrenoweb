import React, { useState, useEffect } from 'react'
import { useFirebase } from 'src/context/useFirebase'
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

const FilterComponent = ({ filterConfig, activeFilters, handleFilterChange, handleClearFilters, authUser }) => {
  const [options, setOptions] = useState([])
  const [initialValues, setInitialValues] = useState({})
  const theme = useTheme()
  const small = useMediaQuery(theme.breakpoints.down('sm'))

  const plural = word => {
    if (word === 'OT') return 'Con y sin OT'

    return ['a','e','i','o','u'].includes(word.charAt(word.length - 1)) ? word + 's' : word + 'es'
  }

  const getFilterOptionsByType = type => {
    const optionsByType = Object.entries(filterConfig)
      .filter(([key, value]) => value.type === type && value.canSee.includes(authUser.role))
      .map(([key, value]) => ({
        key,
        label: value.label
      }))

    const result = {}
    result[type] = optionsByType

    return result
  }

  useEffect(() => {
    const types = [...new Set(Object.values(filterConfig).map(item => item.type))]
    const options = types.map(type => getFilterOptionsByType(type))
    setOptions(options)
  }, [filterConfig, authUser])

  useEffect(() => {
    const initializeValues = () => {
      const newValues = options.reduce((values, optionGroup) => {
        const optionGroupName = Object.keys(optionGroup)[0]
        values[optionGroupName] = ''

        return values
      }, {})
      setInitialValues(newValues)
    }
    initializeValues()
    handleClearFilters(initialValues)
  }, [options])

  return (
    <Accordion defaultExpanded={!small} sx={{ mb: 4, borderRadius: '10px' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls='panel1a-content' id='panel1a-header'>
        <Typography variant='h6'>Filtros</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2} sx={{ width: 'auto' }}>
          {options.map(optionGroup => {
            const optionGroupName = Object.keys(optionGroup)[0]
            const optionGroupData = optionGroup[optionGroupName]

            if (optionGroupName === 'General' && optionGroupData.length === 0) {
              return null
            }

            return (
              <Grid item xs={12} sm={4} md={3} key={optionGroupName}>
                <FormControl sx={{ width: '100%' }}>
                  <InputLabel id={`select-label-${optionGroupName}`}>{optionGroupName}</InputLabel>
                  <Select
                    labelId={`select-label-${optionGroupName}`}
                    label={optionGroupName}
                    value={activeFilters[optionGroupName] || ''}
                    onChange={e => handleFilterChange(optionGroupName, e.target.value)}
                  >
                    <MenuItem key={`all-${optionGroupName}`} value={''}>
                      {plural(optionGroupName)}
                    </MenuItem>
                    {optionGroupData.map(option => (
                      <MenuItem key={option.key} value={option.key}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )
          })}

          <Grid item xs={12} sm={4} md={3}>
            <Button
              variant='outlined'
              onClick={() => {
                handleClearFilters(initialValues)
              }}
              sx={{ width: '100%', height: '100%' }}
            >
              Limpiar filtros
            </Button>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  )
}

export default FilterComponent
