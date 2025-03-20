import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface RunnerState {
	isColorBlindMode: boolean;
	hasResult: boolean;

	hasHighlightedNode: boolean;
	highlightedNodeId: number;

	hasHighlightedBag: boolean;
	nodesInHightedBag: number[];
}

const initialState: RunnerState = {
	isColorBlindMode: false,
	hasResult: false,

	hasHighlightedNode: false,
	highlightedNodeId: -1,

	hasHighlightedBag: false,
	nodesInHightedBag: [],
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
		setHasHighlightedNode: (state, action: PayloadAction<boolean>) => {
			state.hasHighlightedNode = action.payload;
		},
		setHighlightedNodeId: (state, action: PayloadAction<number>) => {
			state.highlightedNodeId = action.payload;
		},
	},
});

export default globalSlice;
