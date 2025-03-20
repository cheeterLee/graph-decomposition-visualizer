import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface RunnerState {
	isRunning: boolean;
}

const initialState: RunnerState = {
	isRunning: false,
};

const runnerSlice = createSlice({
	name: "runner",
	initialState: initialState,
	reducers: {
		setIsRunning: (state, action: PayloadAction<boolean>) => {
			state.isRunning = action.payload;
		},
	},
});

export default runnerSlice;
