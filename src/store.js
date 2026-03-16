import { configureStore } from '@reduxjs/toolkit'
import chatReducer from './counterSlice'

export const store = configureStore({
  reducer: {
    chat: chatReducer
  }
})