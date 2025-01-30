import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { CursorMode, Edge, Vertex } from "../types/type";

export interface EditorState {
	nextVertexId: number;
	cursorMode: CursorMode;
	vertices: Vertex[];
	edges: Edge[];
}

const initialState: EditorState = {
	nextVertexId: 1,
	cursorMode: "pointer",
	vertices: [],
	edges: [],
};

const editorSlice = createSlice({
	name: "editor",
	initialState: initialState,
	reducers: {
		/* widget reducers */
		switchCursorMode: (state, action: PayloadAction<CursorMode>) => {
			state.cursorMode = action.payload;
		},

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
		},

		/* edge reducers */
		setEdges: (state, action: PayloadAction<Edge[]>) => {
			state.edges = action.payload;
		},
		addEdge: (state, action: PayloadAction<Edge>) => {
			state.edges = [...state.edges, action.payload];
		},
		removeEdge: (state, action: PayloadAction<string>) => {
			state.edges = state.edges.filter((e) => e.id != action.payload);
		},
	},
});

export default editorSlice;
