import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface RunnerState {
	isRunning: boolean;
	hasResult: boolean;
}

const initialState: RunnerState = {
	isRunning: false,
	hasResult: false,
};

const runnerSlice = createSlice({
	name: "runner",
	initialState: initialState,
	reducers: {
		setIsRunning: (state, action: PayloadAction<boolean>) => {
			state.isRunning = action.payload;
		},
		setHasResult: (state, action: PayloadAction<boolean>) => {
			state.hasResult = action.payload;
		},
	},
});

export default runnerSlice;
