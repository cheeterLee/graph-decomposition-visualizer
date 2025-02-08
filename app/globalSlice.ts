import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface RunnerState {
	isColorBlindMode: boolean;
}

const initialState: RunnerState = {
	isColorBlindMode: false,
};

const globalSlice = createSlice({
	name: "global",
	initialState: initialState,
	reducers: {
		setIsColorBlindMode: (state, action: PayloadAction<boolean>) => {
			state.isColorBlindMode = action.payload;
		},
	},
});

export default globalSlice;
