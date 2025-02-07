import React from "react";
import { Button } from "~/components/ui/button";
import CodeSnippet from "./components/CodeSnippet";

import createTreeWidthAlgoModule from "./wasm/wasmTreeWidthAgo";

export default function AlgorithmRunner() {
	const handleRunCode = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
        console.log('running code')
		createTreeWidthAlgoModule().then(({ runTreeWidth }) => {
			const total_nodes = 11;
			const total_edges = 20;
			const nodes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
			const edges = [
				"1-2",
				"1-4",
				"1-5",
				"1-6",
				"1-7",
				"2-3",
				"2-9",
				"4-8",
				"4-10",
				"5-9",
				"5-11",
				"6-3",
				"6-10",
				"7-8",
				"7-11",
				"8-3",
				"8-9",
				"9-10",
				"10-11",
				"11-3",
			];
			try {
				const res = runTreeWidth(
					total_nodes,
					total_edges,
					nodes,
					edges
				);
				console.log("res", res);
			} catch (e) {
				console.log(e);
			}
		});
	};

	return (
		<div className="grid grid-rows-3 gap-1 w-[500px] h-[700px] rounded-lg">
			<div className="relative border-2 border-stone-300 w-full row-span-2 rounded-lg">
				<div className="max-w-full max-h-full overflow-scroll">
					<CodeSnippet />
				</div>
				<Button
					onClick={handleRunCode}
					className="bg-stone-700 hover:bg-stone-500
                text-stone-50  absolute right-2 bottom-2"
				>
					Run Code
				</Button>
			</div>
			<div className="border-2 border-stone-300 w-full row-span-1 rounded-lg"></div>
		</div>
	);
}
