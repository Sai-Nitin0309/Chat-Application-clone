import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  messages: [],
  activeUser: null,
  users: [],
  loading: false,
  error: null
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {

    setLoading: (state, action) => {
      state.loading = action.payload
    },

    setError: (state, action) => {
      state.error = action.payload
      state.loading = false
    },

    setMessages: (state, action) => {
      state.messages = action.payload
      state.loading = false
    },

    addMessage: (state, action) => {
      state.messages.push(action.payload)
    },

    setActiveUser: (state, action) => {
      state.activeUser = action.payload
    },

    addUser: (state, action) => {
      state.users.push(action.payload)
    },

    removeAllUsers: (state) => {
      state.users = []
    },

    clearChat: (state) => {
      state.messages = []
    }

  }
})

export const {
  setLoading,
  setError,
  setMessages,
  addMessage,
  setActiveUser,
  addUser,
  removeAllUsers,
  clearChat
} = chatSlice.actions

export default chatSlice.reducer