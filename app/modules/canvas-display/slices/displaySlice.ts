import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface DisplayState {
	bags: Array<[number, number[]]>;
	edges: Array<[number, number]>;
	nodes: Array<number>;
}

const initialState: DisplayState = {
	bags: [],
	edges: [],
	nodes: [],
};

const displaySlice = createSlice({
	name: "display",
	initialState: initialState,
	reducers: {
		setBags: (state, action: PayloadAction<number[][]>) => {
			state.bags = action.payload.map((val, idx) => [idx + 1, [...val]]);
		},
		setNodes: (state, action: PayloadAction<void>) => {
			const set = new Set<number>();
			state.bags.reduce((prev, curr) => {
				for (const node of curr[1]) {
					prev.add(node);
				}
				return prev;
			}, set);
			state.nodes = [...set];
		},
		setEdges: (state, action: PayloadAction<[number, number][]>) => {
			state.edges = action.payload;
		},
	},
});

export default displaySlice;
