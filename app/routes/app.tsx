/*
	Layout component for nested app routes 
*/

import type { MetaFunction } from "@remix-run/cloudflare";
import { Outlet, useLoaderData } from "@remix-run/react";
import { populateGraphData } from "~/data/dataPopulation";
import globalSlice from "~/globalSlice";
import { useAppDispatch } from "~/hooks/reduxHooks";

import editorSlice from "~/modules/svg-editor/slices/editorSlice";
import SVGEditor from "~/modules/svg-editor/SvgEditor";

export const meta: MetaFunction = () => {
	return [
		{ title: "Graph Decomposition Visualizer" },
		{
			name: "description",
			content: "Visualization tool for graph decomposition algorithms",
		},
	];
};

export async function loader() {
	return populateGraphData('GrotzschGraph');
}

export default function App() {
	const data = useLoaderData<typeof loader>();

	const dispatch = useAppDispatch();

	const handleClickOnSpareScreen = () => {
		dispatch(editorSlice.actions.setHighlightedElement(null));
		dispatch(editorSlice.actions.exitAddEdgeMode());

		dispatch(globalSlice.actions.clearHighlight());

		// TODO: temporary fix to clear excessive preview highlight 
		dispatch(globalSlice.actions.undoPreviewHighlighting());
	};

	return (
		<main
			onClick={handleClickOnSpareScreen}
			className="flex items-center justify-center gap-1 w-screen xl:px-16 lg:px-10 px-4 min-h-screen"
		>
			<SVGEditor defaultRawData={data} />
			<Outlet />
		</main>
	);
}
