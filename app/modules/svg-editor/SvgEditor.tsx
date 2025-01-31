import React from "react";
import * as d3 from "d3";
import { useSet } from "~/hooks/useSet";
import { useMap } from "~/hooks/useMap";
import { useAppSelector, useAppDispatch } from "~/hooks/reduxHooks";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
	Grab,
	MousePointer2,
	RotateCcw,
	Plus,
	Palette,
	Trash2,
	Spline,
} from "lucide-react";
import { Edge, SvgEditorData, Vertex } from "./types/type";
import type { RootState } from "~/store";
import { offset, padding } from "./constants/constant";
import editorSlice from "./slices/editorSlice";

export default function SVGEditor({ preData }: { preData: SvgEditorData }) {
	/* Following 2 lines could be removed, not using as this moment */
	const { data, g, e, maxId } = preData;
	const graph = useMap<number, Vertex>(Array.from(g.entries()));

	const {
		cursorMode,
		vertices,
		edges,
		nextVertexId,
		isAddEdgeMode,
		highlightedElement,
	} = useAppSelector((state: RootState) => state.editor);

	const dispatch = useAppDispatch();

	const edgesSet = useSet<string>();

	const isNodeSelected = highlightedElement?.type === "node";
	const isEdgeSelected = highlightedElement?.type === "edge";

	const svgContainerRef = React.useRef<HTMLDivElement | null>(null);

	const svgRef = React.useRef<d3.Selection<
		SVGSVGElement,
		undefined,
		null,
		undefined
	> | null>(null);

	const linksGroupRef = React.useRef<SVGGElement | null>(null);
	const nodesGroupRef = React.useRef<SVGGElement | null>(null);

	const handleResetGraph = () => {
		dispatch(editorSlice.actions.setVertices([]));
		dispatch(editorSlice.actions.setNextVertexId(1));
		dispatch(editorSlice.actions.setEdges([]));
	};

	const handleAddVertex = () => {
		if (!svgContainerRef.current) return;
		const newVertex = {
			id: nextVertexId,
			cx:
				svgContainerRef.current.clientWidth / 2 +
				Math.pow(-1, Math.floor(Math.random() * 5)) *
					Math.random() *
					offset,
			cy:
				svgContainerRef.current.clientHeight / 2 +
				Math.pow(-1, Math.floor(Math.random() * 5)) *
					Math.random() *
					offset,

			neighbors: [],
		};

		dispatch(editorSlice.actions.addVertex(newVertex));
		dispatch(editorSlice.actions.setNextVertexId(nextVertexId + 1));
	};

	const handleAddEdge = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		if (!highlightedElement || highlightedElement.type !== "node") return;
		dispatch(editorSlice.actions.enterAddEdgeMode());
	};

	const handleDeleteVertex = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		if (!highlightedElement || highlightedElement.type !== "node") return;
		const targetNodeId = highlightedElement.id as number;

		dispatch(editorSlice.actions.removeDangledEdges(targetNodeId));
		dispatch(editorSlice.actions.removeVertex(targetNodeId));
	};

	const dragStarted = (event: d3.D3DragEvent<Element, Vertex, unknown>) => {
		const group = d3
			.select(event.sourceEvent.target.parentNode as SVGGElement)
			.raise();

		group.select("circle").attr("stroke", "#FF7F50");
		group.select("text").attr("stroke", "#FF7F50");
	};

	const dragged = (event: d3.D3DragEvent<Element, Vertex, unknown>) => {
		if (!svgContainerRef.current) return;

		const nodeDragged = event.subject as Vertex;

		const svgRect = svgContainerRef.current.getBoundingClientRect();
		const svgRectWidth = svgRect.width;
		const svgRectHeight = svgRect.height;

		const clampedX = Math.max(
			padding,
			Math.min(event.x, svgRectWidth - padding)
		);
		const clampedY = Math.max(
			padding,
			Math.min(event.y, svgRectHeight - padding)
		);

		dispatch(
			editorSlice.actions.setVertices(
				vertices.map((v) =>
					v.id !== nodeDragged.id
						? v
						: { ...v, cx: clampedX, cy: clampedY }
				)
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

		return () => {
			// cleanup svgNode appended to dom
			if (!svgContainerRef.current) return;
			svgContainerRef.current.removeChild(svgNode);
		};
	}, []);

	// Effect to re-draw SVG upon user interaction
	React.useEffect(() => {
		if (!nodesGroupRef.current || !linksGroupRef.current) return;

		const linksGroup = d3.select(linksGroupRef.current);
		const nodesGroup = d3.select(nodesGroupRef.current);

		// Data join for links (edges)
		linksGroup
			.selectAll<SVGLineElement, Edge>("line")
			.data(
				edges,
				(d: Edge) =>
					`${Math.min(d.uId, d.vId)}-${Math.max(d.uId, d.vId)}`
			) // Key function for unique identification
			.join("line")
			.attr("x1", (e) => vertices.find((v) => v.id === e.uId)?.cx ?? 0)
			.attr("y1", (e) => vertices.find((v) => v.id === e.uId)?.cy ?? 0)
			.attr("x2", (e) => vertices.find((v) => v.id === e.vId)?.cx ?? 0)
			.attr("y2", (e) => vertices.find((v) => v.id === e.vId)?.cy ?? 0)
			.attr("stroke", "#DEB887")
			.attr("stroke-width", 3)
			.on("click", function (event: MouseEvent, d) {
				event.stopPropagation();
				const edgeKey = `${Math.min(d.uId, d.vId)}-${Math.max(
					d.uId,
					d.vId
				)}`;
				if (
					highlightedElement?.type === "edge" &&
					highlightedElement.id === edgeKey
				) {
					dispatch(editorSlice.actions.setHighlightedElement(null));
				} else {
					dispatch(
						editorSlice.actions.setHighlightedElement({
							type: "edge",
							id: edgeKey,
						})
					);
				}
			})
			.classed(
				"highlighted-edge",
				(d) =>
					highlightedElement?.type === "edge" &&
					highlightedElement.id ===
						`${Math.min(d.uId, d.vId)}-${Math.max(d.uId, d.vId)}`
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

					const newEdgeId = `${Math.min(
						d.id,
						sourceNodeId
					)}-${Math.max(d.id, sourceNodeId)}`;

					if (!edgesSet.has(newEdgeId)) {
						edgesSet.add(newEdgeId);
						const newEdge: Edge = {
							id: newEdgeId,
							uId: Math.min(d.id, sourceNodeId),
							vId: Math.max(d.id, sourceNodeId),
						};

						dispatch(
							editorSlice.actions.setVertices(
								vertices.map((v) => {
									if (v.id === sourceNodeId) {
										return {
											...v,
											neighbors: [...v.neighbors, d.id],
										};
									} else if (v.id === d.id) {
										return {
											...v,
											neighbors: [
												...v.neighbors,
												sourceNodeId,
											],
										};
									} else {
										return v;
									}
								})
							)
						);

						dispatch(
							editorSlice.actions.setEdges([...edges, newEdge])
						);
					}

					dispatch(editorSlice.actions.exitAddEdgeMode());
					dispatch(editorSlice.actions.setHighlightedElement(null));
					return;
				}

				if (
					highlightedElement?.type === "node" &&
					highlightedElement.id === d.id
				) {
					dispatch(editorSlice.actions.setHighlightedElement(null));
					dispatch(editorSlice.actions.exitAddEdgeMode());
				} else {
					dispatch(
						editorSlice.actions.setHighlightedElement({
							type: "node",
							id: d.id,
						})
					);
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

		return () => {
			// remove event listeners
			linksGroup.selectAll("line").on("click", null);
			nodesGroup.selectAll("g.node-group").on("click", null);
			nodesGroup
				.selectAll<SVGGElement, Vertex>("g.node-group")
				.call(
					d3
						.drag<SVGGElement, Vertex>()
						.on("start", null)
						.on("drag", null)
						.on("end", null)
				);
		};
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
		<div
			ref={svgContainerRef}
			className="relative border-2 border-stone-300 flex-1 h-[700px] rounded-lg"
		>
			<div className="absolute border-2 border-stone-300 top-1 left-1/2 -translate-x-1/2 h-[50px] rounded-lg flex items-center gap-2 px-4">
				{cursorMode === "pointer" ? (
					<Button
						variant="ghost"
						size="icon"
						className="bg-stone-200"
					>
						<MousePointer2
							fill="#bcaaa4"
							className="text-[#bcaaa4]"
						/>
					</Button>
				) : (
					<Button
						onClick={() =>
							dispatch(
								editorSlice.actions.switchCursorMode("pointer")
							)
						}
						variant="ghost"
						size="icon"
					>
						<MousePointer2 className="text-stone-400" />
					</Button>
				)}
				<Separator
					orientation="vertical"
					className="h-[60%] bg-stone-300"
				/>
				{cursorMode === "grab" ? (
					<Button
						variant="ghost"
						size="icon"
						className="bg-stone-200"
					>
						<Grab fill="#bcaaa4" className="text-stone-300" />
					</Button>
				) : (
					<Button
						onClick={() =>
							dispatch(
								editorSlice.actions.switchCursorMode("grab")
							)
						}
						variant="ghost"
						size="icon"
					>
						<Grab className="text-stone-400" />
					</Button>
				)}
				<Separator
					orientation="vertical"
					className="h-[60%] bg-stone-300"
				/>
				<Button onClick={handleAddVertex} variant="ghost" size="icon">
					<Plus className="text-stone-400" />
				</Button>
				<Separator
					orientation="vertical"
					className="h-[60%] bg-stone-300"
				/>
				<Button onClick={handleResetGraph} variant="ghost" size="icon">
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
					<Button
						onClick={handleDeleteVertex}
						variant="ghost"
						className="text-stone-400"
					>
						<Trash2 className="text-stone-400" /> Delete
					</Button>
				</div>
			)}
		</div>
	);
}
