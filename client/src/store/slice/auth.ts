/* eslint-disable */

import apiClient from "@/api/apiClient";
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

export const initAuth = createAsyncThunk("auth/init", async () => {
  const res = await apiClient.post(`/auth/telegram`, {
    initData: window.Telegram.WebApp.initData,
  });
  console.log(res);

  const data = res.data;

  if (!data?.access_token) {
    throw new Error("Auth failed");
  }

  localStorage.setItem("access_token", data.access_token);

  return data;
});

export interface User {
  id: string;
  telegram_id: number;
  username: string;
  created_at: string;
  updated_at: string;
  Fname: string;
  Lname: string | null;
  referral_id: string;
  invited_by: string | null;
  phone: string | null;
}

type InitalState = {
  user: User | null;
  loading: boolean;
};

const initialState: InitalState = {
  user: null,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;

      localStorage.setItem("user", JSON.stringify(action.payload));
    },
  },

  extraReducers: (builder) => {
    builder

      // =========================
      // INIT AUTH
      // =========================
      .addCase(initAuth.pending, (state) => {
        state.loading = true;
      })

      .addCase(initAuth.fulfilled, (state, action) => {
        const { user } = action.payload;
        state.user = { ...user };
        state.loading = false;
      })

      .addCase(initAuth.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setUser } = authSlice.actions;

export default authSlice.reducer;
