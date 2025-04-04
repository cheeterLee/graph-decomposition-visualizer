import React from "react";
import * as d3 from "d3";
import { useSet } from "~/hooks/useSet";
import { useMap } from "~/hooks/useMap";
import { useAppSelector, useAppDispatch } from "~/hooks/reduxHooks";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Input } from "~/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import {
	Grab,
	MousePointer2,
	RotateCcw,
	Plus,
	Palette,
	Trash2,
	Spline,
	Upload,
} from "lucide-react";
import { Edge, SimLink, SimNode, SvgEditorData, Vertex } from "./types/type";
import type { RootState } from "~/store";
import { offset, padding } from "./constants/constant";
import editorSlice from "./slices/editorSlice";
import runnerSlice from "../algorithm-runner/slices/runnerSlice";
import { useNavigate } from "@remix-run/react";
import globalSlice from "~/globalSlice";
import { colorPalette } from "~/lib/config";

export default function SVGEditor({
	defaultRawData,
}: {
	defaultRawData: string;
}) {
	/* Following 2 lines could be removed, not using as this moment */
	// const { data, g, e, maxId } = preData;
	// const graph = useMap<number, Vertex>(Array.from(g.entries()));

	const {
		cursorMode,
		vertices,
		edges,
		nextVertexId,
		isAddEdgeMode,
		highlightedElement,
	} = useAppSelector((state: RootState) => state.editor);

	const {
		hasResult,
		hasHighlightedBag,
		nodesInHightedBag,
		previewHighlightedGroups,
		highlightedGroups,
		highlightingColorIdx,
	} = useAppSelector((state: RootState) => state.global);

	const { bags } = useAppSelector((state: RootState) => state.display);

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

	const [isUploadDialogOpen, setIsUploadDialogOpen] =
		React.useState<boolean>(false);
	const [rawData, setRawData] = React.useState<string>(defaultRawData);
	const [isFileUploadFinished, setIsFileUploadFinished] =
		React.useState<boolean>(false);

	const navigate = useNavigate();

	const handleResetGraph = () => {
		dispatch(editorSlice.actions.setVertices([]));
		dispatch(editorSlice.actions.setNextVertexId(1));
		dispatch(editorSlice.actions.setEdges([]));
		edgesSet.clear();
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
		const targetNodeId = highlightedElement.id;

		// need to first remove connected edges, then remove the vertex
		dispatch(editorSlice.actions.removeConnectedEdges(targetNodeId));
		dispatch(editorSlice.actions.removeVertex(targetNodeId));
	};

	const handleDeleteEdge = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		if (!highlightedElement || highlightedElement.type !== "edge") return;
		const targetEdgeId = highlightedElement.id;

		edgesSet.delete(targetEdgeId);
		dispatch(editorSlice.actions.removeEdge(targetEdgeId));
	};

	const dragStarted = (event: d3.D3DragEvent<Element, Vertex, unknown>) => {
		const group = d3
			.select(event.sourceEvent.target.parentNode as SVGGElement)
			.classed("dragging", true)
			.raise();

		group
			.select("circle")
			.attr("stroke", colorPalette.lightTheme.vertexDrag);
		group.select("text").attr("stroke", colorPalette.lightTheme.vertexDrag);
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
			.classed("dragging", false)
			.raise();

		group
			.select("circle")
			.attr("stroke", colorPalette.lightTheme.vertexBorder);
		group
			.select("text")
			.attr("stroke", colorPalette.lightTheme.vertexBorder);
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();

		reader.onloadend = (event: ProgressEvent<FileReader>) => {
			const text = event.target?.result;
			if (typeof text === "string") {
				// console.log(text);
				setRawData(text);
			}
			setIsFileUploadFinished(true);
		};

		reader.readAsText(file);
		dispatch(globalSlice.actions.clearGroupsHighlighting());
	};

	const parseGraph = (
		fileContent: string
	): { nodes: number[]; edges: [number, number][] } => {
		const lines = fileContent.split("\n");
		const nodesSet = new Set<number>();
		const edgesSet = new Set<string>();
		const edges: [number, number][] = [];

		let expectedNodes = 0;
		let expectedEdges = 0;

		lines.forEach((line) => {
			const trimmed = line.trim();

			// skip empty and comment lines
			if (!trimmed) return;
			if (trimmed.startsWith("c")) return;

			// If it's a header line, parse the expected numbers
			if (trimmed.startsWith("p")) {
				// Expected format: "p tw <nodes> <edges>"
				const parts = trimmed.split(" ");
				if (parts.length >= 4) {
					expectedNodes = parseInt(parts[2], 10);
					expectedEdges = parseInt(parts[3], 10);
				}
				return;
			}

			// Process the line as an edge (e.g. "1 2")
			const parts = trimmed.split(" ");
			if (parts.length >= 2) {
				const a = parseInt(parts[0], 10);
				const b = parseInt(parts[1], 10);

				// Add both nodes to the set (this ensures uniqueness)
				nodesSet.add(a);
				nodesSet.add(b);

				// Since the edge is undirected ("between 1 and 2"), we can sort the pair to avoid duplicates (1,2 === 2,1)
				const sortedEdge: [number, number] = a < b ? [a, b] : [b, a];
				const edgeKey = sortedEdge.join(",");

				if (!edgesSet.has(edgeKey)) {
					edgesSet.add(edgeKey);
					edges.push(sortedEdge);
				}
			}
		});

		// Convert the node set to a sorted array of numbers
		const nodes = Array.from(nodesSet).sort((a, b) => a - b);

		if (nodes.length !== expectedNodes) {
			console.error("Err: Incorrect nodes count in file");
		}
		if (edges.length !== expectedEdges) {
			console.error("Err: Incorrect edges count in file");
		}

		return { nodes, edges };
	};

	const handleFileSubmit = () => {
		const uploadedGraph = parseGraph(rawData);

		if (!svgContainerRef.current) return;

		const svgRect = svgContainerRef.current.getBoundingClientRect();
		const width = svgRect.width;
		const height = svgRect.height;

		const simulationNodes: SimNode[] = Array.from(
			uploadedGraph.nodes,
			(val, i) => ({
				index: i, // d3 internally overwrites it, kinda hack around it here
				id: val,
			})
		);
		const simulationLinks = Array.from(uploadedGraph.edges, (pair) => ({
			source: pair[0],
			target: pair[1],
		}));

		// console.log("sim nodes", simulationNodes);
		// console.log("sim links", simulationLinks);

		function boundingForce() {
			let nodes: SimNode[] = [];
			let width: number, height: number;

			function force(alpha: number) {
				nodes.forEach((node) => {
					// Clamp node.x and node.y to be within [0, width] and [0, height]
					node.x = Math.max(10, Math.min(width, node.x!));
					node.y = Math.max(10, Math.min(height, node.y!));
				});
			}

			// Called by D3 to initialize the force.
			force.initialize = (n: SimNode[]) => {
				console.log("force initialized");
				nodes = n;
				// Update the dimensions in case the container size changed
				const svgRect =
					svgContainerRef.current!.getBoundingClientRect();
				width = svgRect.width;
				height = svgRect.height;
			};

			return force;
		}

		const simulation = d3
			.forceSimulation<SimNode>(simulationNodes)
			.force(
				"link",
				d3
					.forceLink<SimNode, SimLink>(simulationLinks)
					.id((v) => v.id)
					.distance(20)
					.strength(1)
					.iterations(10)
			)
			.force("charge", d3.forceManyBody().strength(-30))
			.force("center", d3.forceCenter(width / 2, height / 2))
			.force("collide", d3.forceCollide(60))
			.force("bounding", boundingForce())
			.stop();

		simulation.tick(
			Math.ceil(
				Math.log(simulation.alphaMin()) /
					Math.log(1 - simulation.alphaDecay())
			)
		);

		// console.log("=====================");
		// console.log("sim nodes", simulationNodes);
		// console.log("sim links", simulationLinks);

		const generatedSimulationState = generateSimulationGraphState(
			simulationNodes,
			simulationLinks
		);

		dispatch(
			editorSlice.actions.setVertices(generatedSimulationState.vertices)
		);
		dispatch(editorSlice.actions.setEdges(generatedSimulationState.edges));
		dispatch(
			editorSlice.actions.setNextVertexId(
				generatedSimulationState.maxNodeId + 1
			)
		);
		setIsUploadDialogOpen(false);
		dispatch(globalSlice.actions.setHasResult(false));
		navigate("/app");
	};

	const generateSimulationGraphState = (
		simulationNodes: SimNode[],
		simulationLinks: SimLink[]
	): { vertices: Vertex[]; edges: Edge[]; maxNodeId: number } => {
		const map = new Map<number, number[]>();
		const edges: Edge[] = [];
		for (const e of simulationLinks) {
			const sourceId = (e.source as SimNode).id;
			const targetId = (e.target as SimNode).id;
			if (!map.has(sourceId)) {
				map.set(sourceId, [targetId]);
			} else {
				map.get(sourceId)?.push(targetId);
			}
			if (!map.has(targetId)) {
				map.set(targetId, [sourceId]);
			} else {
				map.get(targetId)?.push(sourceId);
			}
			const newEdge: Edge = {
				id: `${sourceId}-${targetId}`,
				uId: sourceId,
				vId: targetId,
			};
			edges.push(newEdge);
		}
		const vertices: Vertex[] = [];
		let maxNodeId = 0;
		for (const v of simulationNodes) {
			const neighbors = map.get(v.id) ?? [];
			const newVertex: Vertex = {
				id: v.id,
				cx: v.x ?? 0,
				cy: v.y ?? 0,
				neighbors: [...neighbors],
			};
			maxNodeId = Math.max(maxNodeId, v.id);
			vertices.push(newVertex);
		}
		return { vertices, edges, maxNodeId };
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
			.attr("stroke", colorPalette.lightTheme.edge)
			.attr("stroke-width", 5);

		linksGroupRef.current = linksGroup.node();

		const nodesGroup = svg
			.append("g")
			.attr("class", "node")
			.attr("fill", colorPalette.lightTheme.vertexFill)
			.attr("stroke", colorPalette.lightTheme.vertexBorder);
		// .attr("stroke-width", 3);

		nodesGroupRef.current = nodesGroup.node();

		const svgNode = svg.node();
		if (!svgNode) return;
		svgContainerRef.current.appendChild(svgNode);

		if (rawData !== "") {
			handleFileSubmit();
		}

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
			.attr("stroke", colorPalette.lightTheme.edge)
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
					dispatch(globalSlice.actions.clearHighlight());
				} else {
					dispatch(
						editorSlice.actions.setHighlightedElement({
							type: "edge",
							id: edgeKey,
						})
					);
					const highlightedBag = bags.find(
						([_, bagNodes]) =>
							bagNodes.includes(d.uId) && bagNodes.includes(d.vId)
					);
					if (highlightedBag !== undefined) {
						console.log("highlightedBagId", highlightedBag[0]);
						dispatch(
							globalSlice.actions.highlightEdge(highlightedBag[0])
						);
					}
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
						.attr("class", "base-circle")
						.attr("r", 15)
						.attr("fill", colorPalette.lightTheme.vertexFill)
						.attr("stroke", colorPalette.lightTheme.vertexBorder)
						.attr("stroke-width", 3);

					group
						.append("text")
						.text((d) => d.id.toString())
						.attr("text-anchor", "middle")
						.attr("dominant-baseline", "central")
						.attr("pointer-events", "none")
						.attr("font-size", "15px")
						.attr("fill", colorPalette.lightTheme.vertexBorder);

					return group;
				},
				(update) => {
					update.each(function (d) {
						const nodeGroup = d3.select(this);
						const baseCircle =
							nodeGroup.select("circle.base-circle");
						// Update the base circle stroke based on dragging / highlighted state.
						if (nodeGroup.classed("dragging")) {
							baseCircle.attr(
								"stroke",
								colorPalette.lightTheme.vertexDrag
							);
						} else if (
							highlightedGroups.length === 0 &&
							previewHighlightedGroups.length === 0
						) {
							baseCircle.attr(
								"stroke",
								colorPalette.lightTheme.vertexBorder
							);
						}

						if (
							previewHighlightedGroups.length >
							highlightedGroups.length
						) {
							// render logic for preview highlighting
							console.log("render when preview");
							baseCircle.attr(
								"stroke",
								colorPalette.lightTheme.vertexBorder
							);
							nodeGroup
								.selectAll("circle.extra-highlight")
								.remove();
							let level = 0;
							for (
								let i = 0;
								i < previewHighlightedGroups.length;
								i++
							) {
								const group = previewHighlightedGroups[i];
								if (group.includes(d.id)) {
									if (level === 0) {
										baseCircle.attr(
											"stroke",
											colorPalette.lightTheme.colorGroups[
												i
											]
										);
									} else {
										d3.select(this)
											.append("circle")
											.attr("class", "extra-highlight")
											.attr("r", 15 + 5 * level)
											.attr("fill", "none")
											.attr(
												"stroke",
												colorPalette.lightTheme
													.colorGroups[i]
											)
											.attr("stroke-width", 3);
									}
									level += 1;
								}
							}
						} else {
							// render logic after group selection
							console.log("render when not preview");
							nodeGroup
								.selectAll("circle.extra-highlight")
								.remove();
							baseCircle.attr(
								"stroke",
								colorPalette.lightTheme.vertexBorder
							);
							let level = 0;
							for (let i = 0; i < highlightedGroups.length; i++) {
								const group = highlightedGroups[i];
								if (group.includes(d.id)) {
									if (level === 0) {
										baseCircle.attr(
											"stroke",
											colorPalette.lightTheme.colorGroups[
												i
											]
										);
									} else {
										d3.select(this)
											.append("circle")
											.attr("class", "extra-highlight")
											.attr("r", 15 + 5 * level)
											.attr("fill", "none")
											.attr(
												"stroke",
												colorPalette.lightTheme
													.colorGroups[i]
											)
											.attr("stroke-width", 3);
									}
									level += 1;
								}
							}
						}
					});

					update.select("text").attr("stroke", function (d) {
						if (
							d3
								.select(
									(this as SVGTextElement)
										.parentNode as SVGGElement
								)
								.classed("dragging")
						) {
							return colorPalette.lightTheme.vertexDrag;
						}
						return hasHighlightedBag &&
							nodesInHightedBag.includes(d.id)
							? colorPalette.lightTheme.colorGroups[
									highlightingColorIdx
							  ]
							: colorPalette.lightTheme.vertexBorder;
					});
					return update;
				},
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

					// TODO: cancel highlight node to compare
					dispatch(globalSlice.actions.setHasHighlightedNode(false));
					dispatch(globalSlice.actions.setHighlightedNodeId(-1));
				} else {
					dispatch(
						editorSlice.actions.setHighlightedElement({
							type: "node",
							id: d.id,
						})
					);

					// TODO: highlight node to compare
					if (hasResult) {
						dispatch(
							globalSlice.actions.setHasHighlightedNode(true)
						);
						dispatch(
							globalSlice.actions.setHighlightedNodeId(d.id)
						);
					}
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
		nodesInHightedBag,
		hasHighlightedBag,
		previewHighlightedGroups,
		highlightedGroups,
	]);

	return (
		<div
			ref={svgContainerRef}
			className="relative border-2 border-stone-300 flex-1 h-[700px] rounded-lg shadow-sm"
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
				<Separator
					orientation="vertical"
					className="h-[60%] bg-stone-300"
				/>
				<Dialog
					open={isUploadDialogOpen}
					onOpenChange={setIsUploadDialogOpen}
				>
					<DialogTrigger asChild>
						<Button variant="ghost" size="icon">
							<Upload className="text-stone-400" />
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Upload Graph File</DialogTitle>
							<DialogDescription>
								only .gr files are allowed.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							{/* <Label htmlFor="picture">graph file(.gr)</Label> */}
							<Input
								id="picture"
								type="file"
								onChange={handleFileUpload}
							/>
						</div>
						<DialogFooter>
							<Button
								disabled={!isFileUploadFinished}
								onClick={handleFileSubmit}
								type="submit"
							>
								Upload
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
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

			{isEdgeSelected && (
				<div className="absolute border-2 border-stone-300 bottom-1 left-1/2 -translate-x-1/2 h-[50px] rounded-lg flex items-center justify-between gap-2 px-4">
					<Button variant="ghost" className="text-stone-400">
						<Palette className="text-stone-400" /> Color
					</Button>
					<Separator
						orientation="vertical"
						className="h-[60%] bg-stone-300"
					/>
					<Button
						onClick={handleDeleteEdge}
						variant="ghost"
						className="text-stone-400"
					>
						<Trash2 className="text-stone-400" /> Delete
					</Button>
				</div>
			)}

			
			<div className="pointer-events-none absolute border-2 rounded-lg border-stone-300 bottom-1 right-1 text-stone-400 text-xs p-2">
				<p className="font-semibold">Actions supported</p>
				<p>1. Highlight one node to view bags containing that node.</p>
				<p>2. Highlight one edge to view bags containing that edge.</p>
			</div>
		</div>
	);
}
