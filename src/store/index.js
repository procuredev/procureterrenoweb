// ** Toolkit imports
import { configureStore } from '@reduxjs/toolkit'

// ** Reducers

import Calendar from 'src/store/apps/calendar'


export const store = configureStore({
  reducer:  {Calendar} ,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})
