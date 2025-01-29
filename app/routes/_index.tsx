import type { MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { populateDefaultGraphData } from "~/data/dataPopulation";

import CodeSnippet from "~/modules/algorithm-runner/CodeSnippet";
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

export function loader() {
	return populateDefaultGraphData();
}

export default function Index() {
	const data = useLoaderData<typeof loader>()

	return (
		<main
			// TODO: add global state management tool
			// onClick={(event: React.MouseEvent) => {
			// 	setHighlightedElement(null);
			// 	setIsAddEdgeMode(false);
			// }}
			className="flex items-center justify-center gap-1 w-screen xl:px-16 lg:px-10 px-4 min-h-screen"
		>
			<SVGEditor preData={data} />

			<div className="grid grid-rows-3 gap-1 w-[500px] h-[700px] rounded-lg">
				<div className="border-2 border-stone-300 w-full row-span-2 rounded-lg overflow-scroll">
					<CodeSnippet />
				</div>
				<div className="border-2 border-stone-300 w-full row-span-1 rounded-lg"></div>
			</div>
		</main>
	);
}
