import type { MetaFunction } from "@remix-run/cloudflare";

import React from "react";
import * as d3 from "d3";
import { useSet } from "~/hooks/useSet";
import { useMap } from "~/hooks/useMap";

import {
	Grab,
	MousePointer2,
	RotateCcw,
	Plus,
	Palette,
	Trash2,
	Spline,
} from "lucide-react";

import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "highlight.js/styles/base16/classic-light.css";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
	return [
		{ title: "Graph Decomposition Visualizer" },
		{
			name: "description",
			content: "Visualization tool for graph decomposition algorithms",
		},
	];
};

hljs.registerLanguage("javascript", javascript);

function CodeSnippet() {
	const codeRef = React.useRef<HTMLElement | null>(null);

	React.useEffect(() => {
		if (!codeRef.current) return;
		hljs.highlightBlock(codeRef.current);
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

type Vertex = {
	id: number;
	cx: number;
	cy: number;
	neighbors: number[];
};

const offSet = 100;

export function loader() {
	const graph = new Map<number, Vertex>();
	let maxId = 0;

	const data: Vertex[] = [
		{
			id: 1,
			cx: 200,
			cy: 200,
			neighbors: [2],
		},
		{
			id: 2,
			cx: 300,
			cy: 300,

			neighbors: [1],
		},
		{
			id: 3,
			cx: 200,
			cy: 300,
			neighbors: [1],
		},
	];

	const edges: [number, number][] = [
		...data.reduce((prev, curr) => {
			graph.set(curr.id, curr);
			maxId = Math.max(curr.id, maxId);
			for (const nei of curr.neighbors) {
				if (
					!prev.has(`${curr.id}-${nei}`) &&
					!prev.has(`${nei}-${curr.id}`)
				) {
					prev.add(`${curr.id}-${nei}`);
				}
			}
			return prev;
		}, new Set<string>()),
	].map((e) => {
		let arr = e.split("-");
		return [+arr[0], +arr[1]] as [number, number];
	});

	return { data, e: edges, g: graph, maxId };
}

export default function Index() {
	const { data, e, g, maxId } = useLoaderData<typeof loader>();

	const [vertices, setVertices] = React.useState<Vertex[]>(data);
	const [edges, setEdges] = React.useState<[number, number][]>(e);

	const graph = useMap<number, Vertex>(Array.from(g.entries()));

	const edgesSet = useSet<string>(edges.map((e) => `${e[0]}-${e[1]}`));

	const [nextVertexId, setNextVertexId] = React.useState<number>(maxId + 1);

	const [highlightedElement, setHighlightedElement] = React.useState<{
		type: "node" | "edge";
		id: number | string; // For nodes, use the node ID; for edges, use a string like '1-2'
	} | null>(null);

	const isNodeSelected = highlightedElement?.type === "node";

	const [isAddEdgeMode, setIsAddEdgeMode] = React.useState<boolean>(false);

	const handleResetGraph = () => {
		setVertices(data);
		setEdges(e);
	};

	const handleAddVertex = () => {
		if (!svgContainerRef.current) return;
		const newVertex = {
			id: nextVertexId,
			cx:
				svgContainerRef.current.clientWidth / 2 +
				Math.pow(-1, Math.floor(Math.random() * 5)) *
					Math.random() *
					offSet,
			cy:
				svgContainerRef.current.clientHeight / 2 +
				Math.pow(-1, Math.floor(Math.random() * 5)) *
					Math.random() *
					offSet,

			neighbors: [],
		};
		setVertices([...vertices, newVertex]);
		setNextVertexId((prevId) => prevId + 1);
	};

	const handleAddEdge = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		if (!highlightedElement || highlightedElement.type !== "node") return;
		setIsAddEdgeMode(true);
	};

	const dragStarted = (event: d3.D3DragEvent<Element, Vertex, unknown>) => {
		const group = d3
			.select(event.sourceEvent.target.parentNode as SVGGElement)
			.raise();

		group.select("circle").attr("stroke", "#FF7F50");
		group.select("text").attr("stroke", "#FF7F50");
	};

	const dragged = (event: d3.D3DragEvent<Element, Vertex, unknown>) => {
		const nodeDragged = event.subject as Vertex;
		setVertices((prevVertices) =>
			prevVertices.map((prevVertex) =>
				prevVertex.id !== nodeDragged.id
					? prevVertex
					: { ...prevVertex, cx: event.x, cy: event.y }
			)
		);
	};

	const dragEnded = (event: d3.D3DragEvent<Element, Vertex, unknown>) => {
		const group = d3
			.select(event.sourceEvent.target.parentNode as SVGGElement)
			.raise();

		group.select("circle").attr("stroke", "#5f9ea0");
		group.select("text").attr("stroke", "#5f9ea0");
	};

	const svgContainerRef = React.useRef<HTMLDivElement | null>(null);

	const svgRef = React.useRef<d3.Selection<
		SVGSVGElement,
		undefined,
		null,
		undefined
	> | null>(null);

	const linksGroupRef = React.useRef<SVGGElement | null>(null);
	const nodesGroupRef = React.useRef<SVGGElement | null>(null);

	// Effect runs on initial mount to draw SVG
	React.useEffect(() => {
		if (!svgContainerRef.current) return;

		const svg = d3
			.create("svg")
			.attr("width", svgContainerRef.current.clientWidth)
			.attr("height", svgContainerRef.current.clientHeight);
		svgRef.current = svg;

		const linksGroup = svg
			.append("g")
			.attr("class", "link")
			.attr("stroke", "#DEB887")
			.attr("stroke-width", 5);

		linksGroupRef.current = linksGroup.node();

		const nodesGroup = svg
			.append("g")
			.attr("class", "node")
			.attr("fill", "#fff")
			.attr("stroke", "#5f9ea0")
			.attr("stroke-width", 3);

		nodesGroupRef.current = nodesGroup.node();

		const svgNode = svg.node();
		if (!svgNode) return;
		svgContainerRef.current.appendChild(svgNode);
	}, []);

	// Effect to re-draw SVG upon user interaction
	React.useEffect(() => {
		if (!nodesGroupRef.current || !linksGroupRef.current) return;

		const linksGroup = d3.select(linksGroupRef.current);
		const nodesGroup = d3.select(nodesGroupRef.current);

		// Data join for links (edges)
		linksGroup
			.selectAll<SVGLineElement, [number, number]>("line")
			.data(edges, (d: [number, number]) => `${d[0]}-${d[1]}`) // Key function for unique identification
			.join("line")
			.attr("x1", (e) => vertices.find((v) => v.id === e[0])?.cx ?? 0)
			.attr("y1", (e) => vertices.find((v) => v.id === e[0])?.cy ?? 0)
			.attr("x2", (e) => vertices.find((v) => v.id === e[1])?.cx ?? 0)
			.attr("y2", (e) => vertices.find((v) => v.id === e[1])?.cy ?? 0)
			.attr("stroke", "#DEB887")
			.attr("stroke-width", 3)
			.on("click", function (event: MouseEvent, d) {
				event.stopPropagation();
				const edgeKey = `${d[0]}-${d[1]}`;
				if (
					highlightedElement?.type === "edge" &&
					highlightedElement.id === edgeKey
				) {
					setHighlightedElement(null);
				} else {
					setHighlightedElement({ type: "edge", id: edgeKey });
				}
			})
			.classed(
				"highlighted-edge",
				(d) =>
					highlightedElement?.type === "edge" &&
					highlightedElement.id === `${d[0]}-${d[1]}`
			);

		// Data join for nodes (vertices)
		nodesGroup
			.selectAll<SVGGElement, Vertex>("g.node-group")
			.data(vertices, (d: Vertex) => d.id)
			.join(
				(enter) => {
					const group = enter.append("g").attr("class", "node-group");

					group
						.append("circle")
						.attr("r", 15)
						.attr("fill", "#fff")
						.attr("stroke", "#5f9ea0")
						.attr("stroke-width", 3);

					group
						.append("text")
						.text((d) => d.id.toString())
						.attr("text-anchor", "middle")
						.attr("dominant-baseline", "central")
						.attr("pointer-events", "none")
						.attr("font-size", "15px")
						.attr("fill", "#5f9ea0");

					return group;
				},
				(update) => update,
				(exit) => exit.remove()
			)
			.attr("transform", (d) => `translate(${d.cx}, ${d.cy})`)
			.call(
				d3
					.drag<SVGGElement, Vertex>()
					.on("start", dragStarted)
					.on("drag", dragged)
					.on("end", dragEnded)
			)
			.on("click", function (event: MouseEvent, d) {
				event.stopPropagation();

				if (isAddEdgeMode && d.id !== highlightedElement?.id) {
					if (!highlightedElement) return;
					const sourceNodeId = highlightedElement.id;
					if (typeof sourceNodeId !== "number") return;

					if (
						!edgesSet.has(`${d.id}-${sourceNodeId}`) &&
						!edgesSet.has(`${sourceNodeId}-${d.id}`)
					) {
						const newEdge = `${d.id}-${sourceNodeId}`;
						edgesSet.add(newEdge);
						setEdges((prevEdges) => [
							...prevEdges,
							[d.id, sourceNodeId],
						]);
					}

					setIsAddEdgeMode(false);
					setHighlightedElement(null);
					return;
				}

				if (
					highlightedElement?.type === "node" &&
					highlightedElement.id === d.id
				) {
					setHighlightedElement(null);
					setIsAddEdgeMode(false);
				} else {
					setHighlightedElement({
						type: "node",
						id: d.id,
					});
				}
			})
			.classed(
				"highlighted-node",
				(d) =>
					highlightedElement?.type === "node" &&
					highlightedElement.id === d.id
			)
			.classed(
				"glowing-node",
				(d) => isAddEdgeMode === true && highlightedElement?.id !== d.id
			);
	}, [
		vertices,
		edges,
		dragStarted,
		dragged,
		dragEnded,
		highlightedElement,
		isAddEdgeMode,
		edgesSet,
	]);

	return (
		<main
			onClick={(event: React.MouseEvent) => {
				setHighlightedElement(null);
				setIsAddEdgeMode(false);
			}}
			className="flex items-center justify-center gap-1 w-screen xl:px-16 lg:px-10 px-4 min-h-screen"
		>
			<div
				ref={svgContainerRef}
				className="relative border-2 border-stone-300 flex-1 h-[700px] rounded-lg"
			>
				<div className="absolute border-2 border-stone-300 top-1 left-1/2 -translate-x-1/2 h-[50px] rounded-lg flex items-center gap-2 px-4">
					<Button variant="ghost" size="icon">
						<MousePointer2 className="text-stone-400" />
					</Button>
					<Separator
						orientation="vertical"
						className="h-[60%] bg-stone-300"
					/>
					<Button variant="ghost" size="icon">
						<Grab className="text-stone-400" />
					</Button>
					<Separator
						orientation="vertical"
						className="h-[60%] bg-stone-300"
					/>
					<Button
						onClick={handleAddVertex}
						variant="ghost"
						size="icon"
					>
						<Plus className="text-stone-400" />
					</Button>
					<Separator
						orientation="vertical"
						className="h-[60%] bg-stone-300"
					/>
					<Button
						onClick={handleResetGraph}
						variant="ghost"
						size="icon"
					>
						<RotateCcw className="text-stone-400" />
					</Button>
				</div>

				{isNodeSelected && (
					<div className="absolute border-2 border-stone-300 bottom-1 left-1/2 -translate-x-1/2 h-[50px] rounded-lg flex items-center justify-between gap-2 px-4">
						<Button variant="ghost" className="text-stone-400">
							<Palette className="text-stone-400" /> Color
						</Button>
						<Separator
							orientation="vertical"
							className="h-[60%] bg-stone-300"
						/>
						<Button
							onClick={handleAddEdge}
							variant="ghost"
							className="text-stone-400"
						>
							<Spline className="text-stone-400" /> Add Edge
						</Button>
						<Separator
							orientation="vertical"
							className="h-[60%] bg-stone-300"
						/>
						<Button variant="ghost" className="text-stone-400">
							<Trash2 className="text-stone-400" /> Delete
						</Button>
					</div>
				)}
			</div>

			<div className="grid grid-rows-3 gap-1 w-[500px] h-[700px] rounded-lg">
				<div className="border-2 border-stone-300 w-full row-span-2 rounded-lg overflow-scroll">
					<CodeSnippet />
				</div>
				<div className="border-2 border-stone-300 w-full row-span-1 rounded-lg"></div>
			</div>
		</main>
	)
}
