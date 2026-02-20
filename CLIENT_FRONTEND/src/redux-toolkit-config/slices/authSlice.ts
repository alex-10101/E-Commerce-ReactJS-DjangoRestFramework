import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { IUser } from "../../types/types";
import { apiSlice } from "../apiSlice";

interface IInitialState {
  user: IUser | null;
}

const initialState: IInitialState = {
  user: null,
};

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: IUser }>) => {
      state.user = action.payload.user;
    },
    removeCredentials: (state) => {
      state.user = null;
      apiSlice.util.resetApiState();
    },
  },
});

export const { setCredentials, removeCredentials } = slice.actions;

export default slice.reducer;
