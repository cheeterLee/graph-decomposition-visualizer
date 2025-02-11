import { configureStore } from "@reduxjs/toolkit";

import globalSlice from "./globalSlice";
import editorSlice from "./modules/svg-editor/slices/editorSlice";
import runnerSlice from "./modules/algorithm-runner/slices/runnerSlice";
import displaySlice from "./modules/canvas-display/slices/displaySlice";

export const store = configureStore({
	reducer: {
		global: globalSlice.reducer,
		editor: editorSlice.reducer,
		runner: runnerSlice.reducer,
		display: displaySlice.reducer
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
