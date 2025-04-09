import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { CursorMode, Edge, Vertex, HighlightedElement } from "../types/type";

export interface EditorState {
	nextVertexId: number;
	// cursorMode: CursorMode;
	isAddEdgeMode: boolean;
	vertices: Vertex[];
	edges: Edge[];
	highlightedElement: HighlightedElement;
}

const initialState: EditorState = {
	nextVertexId: 1,
	// cursorMode: "pointer",
	isAddEdgeMode: false,
	highlightedElement: null,
	vertices: [],
	edges: [],
};

const editorSlice = createSlice({
	name: "editor",
	initialState: initialState,
	reducers: {
		/* ui state reducers */
		enterAddEdgeMode: (state, action: PayloadAction<void>) => {
			state.isAddEdgeMode = true;
		},
		exitAddEdgeMode: (state, action: PayloadAction<void>) => {
			state.isAddEdgeMode = false;
		},
		setHighlightedElement: (
			state,
			action: PayloadAction<HighlightedElement>
		) => {
			state.highlightedElement = action.payload;
		},

		/* widget reducers */
		// switchCursorMode: (state, action: PayloadAction<CursorMode>) => {
		// 	state.cursorMode = action.payload;
		// },

		/* vertex reducers */
		setNextVertexId: (state, action: PayloadAction<number>) => {
			state.nextVertexId = action.payload;
		},
		setVertices: (state, action: PayloadAction<Vertex[]>) => {
			state.vertices = action.payload;
		},
		addVertex: (state, action: PayloadAction<Vertex>) => {
			state.vertices = [...state.vertices, action.payload];
		},
		removeVertex: (state, action: PayloadAction<number>) => {
			state.vertices = state.vertices.filter(
				(v) => v.id !== action.payload
			);
			state.highlightedElement = null;
		},

		/* edge reducers */
		setEdges: (state, action: PayloadAction<Edge[]>) => {
			state.edges = action.payload;
		},
		addEdge: (state, action: PayloadAction<Edge>) => {
			state.edges = [...state.edges, action.payload];
		},
		removeEdge: (state, action: PayloadAction<string>) => {
			const splittedId = action.payload.split("-") as [string, string];
			if (splittedId.length !== 2) return;
			const uId = +splittedId[0];
			const vId = +splittedId[1];
			state.vertices = state.vertices.map((v) => {
				if (v.id === uId) {
					return {
						...v,
						neighbors: v.neighbors.filter(
							(neighborId) => neighborId !== vId
						),
					};
				} else if (v.id === vId) {
					return {
						...v,
						neighbors: v.neighbors.filter(
							(neighborId) => neighborId !== uId
						),
					};
				} else {
					return v;
				}
			});

			state.edges = state.edges.filter((e) => e.id !== action.payload);
		},
		removeConnectedEdges: (state, action: PayloadAction<number>) => {
			const neighbors =
				state.vertices.find((v) => v.id === action.payload)
					?.neighbors ?? [];
			const edgesToRemove = new Set();
			const neighborsSet = new Set();

			for (const neighborId of neighbors) {
				const edgeId = `${Math.min(
					neighborId,
					action.payload
				)}-${Math.max(neighborId, action.payload)}`;
				edgesToRemove.add(edgeId);
				neighborsSet.add(neighborId);
			}

			state.vertices = state.vertices.map((v) =>
				neighborsSet.has(v.id)
					? {
							...v,
							neighbors: v.neighbors.filter(
								(neighborId) => neighborId !== action.payload
							),
					  }
					: v
			);
			state.edges = state.edges.filter((e) => !edgesToRemove.has(e.id));
		},
	},
});

export default editorSlice;
