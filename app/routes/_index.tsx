import type { MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { populateDefaultGraphData } from "~/data/dataPopulation";
import { useAppDispatch } from "~/hooks/reduxHooks";

import editorSlice from "~/modules/svg-editor/slices/editorSlice";
import SVGEditor from "~/modules/svg-editor/SvgEditor";
import AlgorithmRunner from "~/modules/algorithm-runner/AlgorithmRunner";

export const meta: MetaFunction = () => {
	return [
		{ title: "Graph Decomposition Visualizer" },
		{
			name: "description",
			content: "Visualization tool for graph decomposition algorithms",
		},
	];
};

export function loader() {
	return populateDefaultGraphData();
}

export default function Index() {
	const data = useLoaderData<typeof loader>();

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
			<SVGEditor preData={data} />
			<AlgorithmRunner />
		</main>
	);
}
