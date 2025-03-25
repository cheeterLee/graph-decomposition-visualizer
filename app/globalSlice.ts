import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface RunnerState {
	isColorBlindMode: boolean;
	hasResult: boolean;

	hasHighlightedNode: boolean;
	highlightedNodeId: number;

	hasHighlightedBag: boolean;
	highlightedBagId: number;
	nodesInHightedBag: number[];

	selectedBagIds: number[];
}

const initialState: RunnerState = {
	isColorBlindMode: false,
	hasResult: false,

	hasHighlightedNode: false,
	highlightedNodeId: -1,

	hasHighlightedBag: false,
	highlightedBagId: -1,
	nodesInHightedBag: [],

	selectedBagIds: [],
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
		// setHasHighlightedBag: (state, action: PayloadAction<boolean>) => {
		// 	state.hasHighlightedBag = action.payload;
		// },
		// setHighlightedBagId: (state, action: PayloadAction<number>) => {
		// 	state.highlightedBagId = action.payload;
		// },
		// setNodesInHightLightedBag: (state, action: PayloadAction<number[]>) => {
		// 	state.nodesInHightedBag = action.payload;
		// },

		setGroupOfHighlightedNodes: (
			state,
			action: PayloadAction<number[]>
		) => {
			state.hasHighlightedBag = true;
			state.nodesInHightedBag = action.payload;
		},

		setSelectedBagIds: (state, action: PayloadAction<number[]>) => {
			state.selectedBagIds = action.payload;
		},

		setHighlightedBag: (
			state,
			action: PayloadAction<{ id: number; nodes: number[] }>
		) => {
			state.hasHighlightedBag = true;
			state.nodesInHightedBag = action.payload.nodes;
			state.highlightedBagId = action.payload.id;
		},

		clearHighlight: (state) => {
			state.hasHighlightedBag = false;
			state.highlightedBagId = -1;
			state.nodesInHightedBag = [];
			state.hasHighlightedNode = false;
			state.highlightedNodeId = -1;
		},
	},
});

export default globalSlice;
