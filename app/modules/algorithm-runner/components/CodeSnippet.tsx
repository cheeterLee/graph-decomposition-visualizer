import React from "react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "highlight.js/styles/base16/classic-light.css";

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
