import { configureStore } from "@reduxjs/toolkit";
import editorSlice from "./modules/svg-editor/slices/editorSlice";

export const store = configureStore({
	reducer: {
		editor: editorSlice.reducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
