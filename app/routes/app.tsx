/*
	Layout component for nested app routes 
*/

import type { MetaFunction } from "@remix-run/cloudflare";
import { Outlet, useLoaderData } from "@remix-run/react";
import { populateGraphData } from "~/data/dataPopulation";
import globalSlice from "~/globalSlice";
import { useAppDispatch } from "~/hooks/reduxHooks";
import { useWindowSize } from "@react-hookz/web";

import editorSlice from "~/modules/svg-editor/slices/editorSlice";
import SVGEditor from "~/modules/svg-editor/SvgEditor";
import React from "react";
import { WorkerProvider } from "~/modules/algorithm-runner/context/WorkerContext";

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
	return populateGraphData("GrotzschGraph");
}

export default function App() {
	const data = useLoaderData<typeof loader>();

	const dispatch = useAppDispatch();

	const { width, height } = useWindowSize();

	const [isValidScreenSize, setIsValidScreenSize] =
		React.useState<boolean>(true);

	// hack fix for highlighting not work
	const [isClickOnNodeWithHighestId, setIsClickOnNodeWithHighestId] =
		React.useState<boolean>(false);

	const handleClickOnSpareScreen = () => {
		if (isClickOnNodeWithHighestId) {
			setIsClickOnNodeWithHighestId(false);
			return;
		}

		dispatch(editorSlice.actions.setHighlightedElement(null));
		dispatch(editorSlice.actions.exitAddEdgeMode());

		dispatch(globalSlice.actions.clearHighlight());

		// TODO: temporary fix to clear excessive preview highlight
		dispatch(globalSlice.actions.undoPreviewHighlighting());
	};

	React.useEffect(() => {
		if (width < 1100 || height < 700) {
			setIsValidScreenSize(false);
		} else {
			setIsValidScreenSize(true);
		}
	}, [width, height]);

	return (
		<main
			onClick={handleClickOnSpareScreen}
			className="flex items-center justify-center gap-1 w-screen xl:px-16 lg:px-10 px-4 min-h-screen"
		>
			<WorkerProvider>
				<SVGEditor defaultRawData={data} abortClearScreen={setIsClickOnNodeWithHighestId} />
				<Outlet />
			</WorkerProvider>
			<div
				className={`fixed top-0 bottom-0 right-0 left-0 z-30 
					w-screen h-screen bg-stone-50 text-stone-400 flex items-center justify-center
					font-bold text-lg ${isValidScreenSize ? "hidden" : "block"}`}
			>
				A minimum browser window size of 1100 x 700 is needed to use
				this tool :)
			</div>
		</main>
	);
}
