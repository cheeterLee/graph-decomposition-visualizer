import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface RunnerState {
	isColorBlindMode: boolean;
	hasResult: boolean;
}

const initialState: RunnerState = {
	isColorBlindMode: false,
	hasResult: false,
};

const globalSlice = createSlice({
	name: "global",
	initialState: initialState,
	reducers: {
		setIsColorBlindMode: (state, action: PayloadAction<boolean>) => {
			state.isColorBlindMode = action.payload;
		},
		setHasResult: (state, action: PayloadAction<boolean>) => {
			state.hasResult = action.payload;
		},
	},
});

export default globalSlice;
