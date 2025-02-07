import React from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "highlight.js/styles/base16/classic-light.css";

import createTreeWidthAlgoModule from "./wasm/wasmTreeWidthAgo";

export default function CodeSnippet() {
	const codeRef = React.useRef<HTMLElement | null>(null);

	React.useEffect(() => {
		if (!codeRef.current) return;

		hljs.registerLanguage("javascript", javascript);
		hljs.highlightElement(codeRef.current);

		// temporary solution to avoid highlighting effect runs twice
		return () => {
			codeRef.current = null;
		};
	}, []);

	React.useEffect(() => {
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
				// Module.solve(total_nodes, total_edges, edges, nodes);
				// const res = Module.twoSum([1,2]);
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
	}, []);

	return (
		<pre>
			<code
				className="javascript bg-transparent p-2 text-sm"
				style={{ background: "transparent" }}
				ref={codeRef}
			>
				{`
function graphDecomposition(adjList) {
    const visited = new Set();
    const components = [];

    function dfs(node, currentComponent) {
        visited.add(node);
        currentComponent.add(node);

        const neighbors = adjList[node] || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                dfs(neighbor, currentComponent);
            }
        }
    }

    for (const node in adjList) {
        if (!visited.has(node)) {
            const currentComponent = new Set();
            dfs(node, currentComponent);
            components.push(currentComponent);
        }
    }

    return components;
}`}
			</code>
		</pre>
	);
}
