import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface DisplayState {
	bags: Array<[number, number[]]>;
	edges: Array<[number, number]>;
	nodes: Array<number>;
	isViewRawMode: boolean;
	rawData: string;
	maxWidth: number;
}

const initialState: DisplayState = {
	bags: [],
	edges: [],
	nodes: [],
	isViewRawMode: false,
	rawData: "",
	maxWidth: 0,
};

const displaySlice = createSlice({
	name: "display",
	initialState: initialState,
	reducers: {
		setBags: (state, action: PayloadAction<number[][]>) => {
			state.bags = action.payload.map((val, idx) => [idx + 1, [...val]]);
			state.maxWidth = state.bags.reduce(
				(prev, curr) => Math.max(curr[1].length - 1, prev),
				0
			);
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
		setIsViewRawMode: (state, action: PayloadAction<boolean>) => {
			state.isViewRawMode = action.payload;
		},
		flushRawData: (state, action: PayloadAction<void>) => {
			// build the text content.
			let content = "";
			let maxBagSize = 0;

			state.bags.forEach(([bagId, nodes]) => {
				content += `b ${bagId} ${nodes.join(" ")}\n`;
				maxBagSize = Math.max(maxBagSize, nodes.length);
			});

			// Write out the edges information.
			state.edges.forEach(([bagA, bagB]) => {
				content += `${bagA} ${bagB}\n`;
			});

			content =
				`s td ${state.bags.length} ${maxBagSize} ${state.nodes.length}\n` +
				content;

			state.rawData = content;
		},
	},
});

export default displaySlice;
