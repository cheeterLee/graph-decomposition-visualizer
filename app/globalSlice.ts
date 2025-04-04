import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface RunnerState {
	isColorBlindMode: boolean;
	isInEditMode: boolean;

	hasResult: boolean;

	hasHighlightedNode: boolean;
	highlightedNodeId: number;

	hasHighlightedBag: boolean;
	highlightedBagId: number;
	nodesInHightedBag: number[];

	highlightingColorIdx: number;

	previewHighlightedGroups: number[][];
	highlightedGroups: number[][];

	highlightedBags: number[][];

	selectedBagIds: number[];

	showAddToGroupButton: boolean;

	bagContainsHighlightedEdge: number;
}

const initialState: RunnerState = {
	isColorBlindMode: false,
	isInEditMode: true,

	hasResult: false,

	hasHighlightedNode: false,
	highlightedNodeId: -1,

	hasHighlightedBag: false,
	highlightedBagId: -1,
	nodesInHightedBag: [],

	highlightingColorIdx: 0,

	previewHighlightedGroups: [],
	highlightedGroups: [],

	highlightedBags: [],

	selectedBagIds: [],

	showAddToGroupButton: false,

	bagContainsHighlightedEdge: -1,
};

const globalSlice = createSlice({
	name: "global",
	initialState: initialState,
	reducers: {
		setIsInEditMode: (state, action: PayloadAction<boolean>) => {
			state.isInEditMode = action.payload;
		},

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

		setHasHighlightedBag: (state, action: PayloadAction<boolean>) => {
			state.hasHighlightedBag = action.payload;
		},

		setShowAddToGroupButton: (state, action: PayloadAction<boolean>) => {
			state.showAddToGroupButton = action.payload;
		},

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
			// ensure that only previewing the next selection
			if (
				state.previewHighlightedGroups.length -
					state.highlightedGroups.length >
				0
			) {
				state.previewHighlightedGroups.pop();
			}
			state.previewHighlightedGroups.push(action.payload);
		},

		selectBags: (state, action: PayloadAction<number[]>) => {
			state.selectedBagIds = action.payload;
			state.hasHighlightedBag = true;
			state.showAddToGroupButton = true;
		},

		resetSelectBags: (state, action: PayloadAction<void>) => {
			state.selectedBagIds = [];
			// state.hasHighlightedBag = true
			state.showAddToGroupButton = false;
		},

		setHighlightedBag: (
			state,
			action: PayloadAction<{ id: number; nodes: number[] }>
		) => {
			state.hasHighlightedBag = true;
			state.nodesInHightedBag = action.payload.nodes;

			// ensure that only previewing the next selection
			if (
				state.previewHighlightedGroups.length -
					state.highlightedGroups.length >
				0
			) {
				state.previewHighlightedGroups.pop();
			}
			state.previewHighlightedGroups.push(action.payload.nodes);

			state.highlightedBagId = action.payload.id;
		},

		clearHighlight: (state) => {
			state.highlightedBagId = -1;
			state.nodesInHightedBag = [];
			state.hasHighlightedNode = false;
			state.highlightedNodeId = -1;

			state.hasHighlightedBag = false;
			state.showAddToGroupButton = false;
			state.selectedBagIds = [];

			state.bagContainsHighlightedEdge = -1;
		},

		clearPreviewHighlight: (state) => {
			state.previewHighlightedGroups = [];
		},

		undoPreviewHighlighting: (state) => {
			if (
				state.previewHighlightedGroups.length >
				state.highlightedGroups.length
			) {
				state.previewHighlightedGroups.pop();
			}
		},

		selectAsGroup: (
			state,
			action: PayloadAction<{
				newGroupNodes: number[];
				newGroupBags: number[];
			}>
		) => {
			state.nodesInHightedBag = [];

			state.hasHighlightedBag = true;

			state.highlightedGroups.push(action.payload.newGroupNodes);
			state.previewHighlightedGroups = state.highlightedGroups;

			state.highlightedBags.push(action.payload.newGroupBags);

			state.highlightingColorIdx += 1;
		},

		// setHighlightingColorIdx: (state) => {
		// 	state.highlightingColorIdx += 1;
		// },

		clearGroupsHighlighting: (state) => {
			state.hasHighlightedBag = false;
			state.highlightingColorIdx = 0;
			state.highlightedGroups = [];
			state.previewHighlightedGroups = [];
			state.highlightedBags = [];
		},

		highlightEdge: (state, action: PayloadAction<number>) => {
			state.bagContainsHighlightedEdge = action.payload;
			// state.hasHighlightedNode = true;
			// let nodeId =
		},

		cancelHighlightEdge: (state) => {
			state.bagContainsHighlightedEdge = -1;
		},
	},
});

export default globalSlice;
