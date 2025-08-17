import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  loader: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    userExits: (state, action) => {
      state.user = action.payload;
      state.loader = false;
    },
    userNotExits: (state) => {
      state.user = null;
      state.loader = false;
    },
    logout: (state) => {
      state.user = null;
      state.loader = false;
    },
  },
});

export const { userExits, userNotExits, logout } = authSlice.actions;
export default authSlice.reducer;
