import { configureStore } from "@reduxjs/toolkit";
import editorSlice from "./modules/svg-editor/slices/editorSlice";
import runnerSlice from "./modules/algorithm-runner/slices/runnerSlice";
import globalSlice from "./globalSlice";

export const store = configureStore({
	reducer: {
		global: globalSlice.reducer,
		editor: editorSlice.reducer,
		runner: runnerSlice.reducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
