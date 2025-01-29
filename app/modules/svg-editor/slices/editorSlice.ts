import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { CursorMode } from "../types/type";

export interface EditorState {
	cursorMode: CursorMode;
}

const initialState: EditorState = {
	cursorMode: "pointer",
};

const editorSlice = createSlice({
	name: "editor",
	initialState: initialState,
	reducers: {
		switchCursorMode: (state, action: PayloadAction<CursorMode>) => {
			state.cursorMode = action.payload;
		},
	},
});

export default editorSlice;
