/*
	Layout component for nested app routes 
*/

import type { MetaFunction } from "@remix-run/cloudflare";
import { Outlet, useLoaderData } from "@remix-run/react";
import { populateDefaultGraphData } from "~/data/dataPopulation";
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

// export function loader() {
	// return populateDefaultGraphData();
	// return redirect('/app');
// }

export default function App() {
	// const data = useLoaderData<typeof loader>();

	const dispatch = useAppDispatch();

	const handleClickOnSpareScreen = () => {
		dispatch(editorSlice.actions.setHighlightedElement(null));
		dispatch(editorSlice.actions.exitAddEdgeMode());
	};

	return (
		<main
			onClick={handleClickOnSpareScreen}
			className="flex items-center justify-center gap-1 w-screen xl:px-16 lg:px-10 px-4 min-h-screen"
		>
			{/* <SVGEditor preData={data} /> */}
			<SVGEditor />
			<Outlet />
		</main>
	);
}
