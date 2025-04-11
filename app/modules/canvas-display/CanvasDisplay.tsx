import React from "react";
import { useAppDispatch, useAppSelector } from "~/hooks/reduxHooks";
import * as d3 from "d3";
import { Button } from "~/components/ui/button";
import {
	ChevronLeft,
	Copy,
	Download,
	Eclipse,
	FileText,
	RotateCcw,
} from "lucide-react";
import { Link, useNavigate } from "@remix-run/react";
import displaySlice from "./slices/displaySlice";
import globalSlice from "~/globalSlice";
import editorSlice from "../svg-editor/slices/editorSlice";
import { colorPalette } from "~/lib/config";

// Define a node type used by the simulation.
interface NodeDatum {
	id: number;
	values: number[];
	// x, y, vx, vy are added by the simulation.
	x?: number;
	y?: number;
	vx?: number;
	vy?: number;
}

// Define a link type used by the simulation.
interface LinkDatum {
	source: number | NodeDatum;
	target: number | NodeDatum;
}

// Define oval dimensions.
const ovalWidth = 50;
const ovalHeight = 15;

export default function CanvasDisplay() {
	const { bags, edges, isViewRawMode, rawData, maxWidth } = useAppSelector(
		(state) => state.display
	);

	const {
		bagContainsHighlightedEdge,
		hasResult,
		hasHighlightedNode,
		highlightedNodeId,
		hasHighlightedBag,
		highlightedBagId,
		nodesInHightedBag,
		highlightedBags,
		selectedBagIds,
		highlightingColorIdx,
		showAddToGroupButton,
		previewHighlightedGroups,
		highlightedGroups,
	} = useAppSelector((state) => state.global);

	const [simulationDone, setSimulationDone] = React.useState(false);

	const [selectionStart, setSelectionStart] = React.useState<{
		x: number;
		y: number;
	} | null>(null);
	const [selectionRect, setSelectionRect] = React.useState<{
		x: number;
		y: number;
		width: number;
		height: number;
	} | null>(null);

	const [zoomPercentage, setZoomPercentage] = React.useState<number>(100);

	const dispatch = useAppDispatch();

	const navigate = useNavigate();

	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	const zoomRef = React.useRef<d3.ZoomBehavior<
		HTMLCanvasElement,
		unknown
	> | null>(null);
	const transformRef = React.useRef<d3.ZoomTransform | null>(null);

	const nodesRef = React.useRef<NodeDatum[]>([]);
	const linksRef = React.useRef<LinkDatum[]>([]);

	const bagsRef = React.useRef<NodeDatum[]>([]);

	// avoid click event overlaps with drag selection event
	const isDraggingRef = React.useRef<boolean>(false);

	const handleCanvasClick = (event: MouseEvent) => {
		event.stopPropagation();

		if (isDraggingRef.current === true) {
			isDraggingRef.current = false;
			// event.stopPropagation();
			return;
		}

		// TODO: clicking before the force simulation ends will only updates global state, but not rendering highlight correctly

		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();

		// convert viewport coord -> canvas coord
		const x = (event.clientX - rect.left) * (canvas.width / rect.width);
		const y = (event.clientY - rect.top) * (canvas.height / rect.height);

		// Adjust for the current zoom and pan transform
		const transform = transformRef.current || d3.zoomIdentity;
		const transformedX = (x - transform.x) / transform.k;
		const transformedY = (y - transform.y) / transform.k;

		let clickedBag: [number, number[]] | null = null;
		for (const node of bagsRef.current) {
			if (node.x == null || node.y == null) continue;

			const dx = transformedX - node.x;
			const dy = transformedY - node.y;

			if (
				(dx * dx) / (ovalWidth * ovalWidth) +
					(dy * dy) / (ovalHeight * ovalHeight) <=
				1
			) {
				clickedBag = bags.find((b) => b[0] === node.id) ?? null;
				break;
			}
		}

		if (clickedBag) {
			// setSelectedNodeIds(new Set([clickedBag[0]]));
			const bagId = clickedBag[0];
			dispatch(globalSlice.actions.selectBags([bagId]));

			const nodes = clickedBag[1];
			dispatch(globalSlice.actions.setGroupOfHighlightedNodes(nodes));
		} else {
			dispatch(globalSlice.actions.clearHighlight());
			// TODO: temporary fix, need to decouple editor slice in the future
			dispatch(editorSlice.actions.setHighlightedElement(null));

			// TODO: temporary fix to clear excessive preview highlight
			dispatch(globalSlice.actions.undoPreviewHighlighting());
		}
	};

	const toCanvasCoords = (event: MouseEvent) => {
		const canvas = canvasRef.current!;
		const rect = canvas.getBoundingClientRect();

		// console.log("canvas left", rect.left, "canvas right", rect.right);
		// console.log("event x", event.clientX, "event y", event.clientY);

		// Convert screen coordinates to canvas coordinates
		const x = (event.clientX - rect.left) * (canvas.width / rect.width);
		const y = (event.clientY - rect.top) * (canvas.height / rect.height);
		const transform = transformRef.current || d3.zoomIdentity;
		// console.log("transform", transform);

		const transformedX = (x - transform.x) / transform.k;
		const transformedY = (y - transform.y) / transform.k;
		// console.log(
		// 	"transformed x",
		// 	transformedX,
		// 	"transformed y",
		// 	transformedY
		// );

		return { x: transformedX, y: transformedY };
	};

	// abort selection if pointer drags out of bounds
	const handleMouseLeave = () => {
		if (selectionStart) {
			setSelectionStart(null);
			setSelectionRect(null);
			// TODO: may cause bug in selection
			// setSelectedNodeIds(new Set());
		}
	};

	const handleMouseDown = (e: MouseEvent) => {
		dispatch(globalSlice.actions.clearHighlight());
		// undo one step of preview highlighting if needed
		dispatch(globalSlice.actions.undoPreviewHighlighting());
		// TODO: temp fix
		dispatch(editorSlice.actions.setHighlightedElement(null));
		isDraggingRef.current = false;

		const { x, y } = toCanvasCoords(e);
		setSelectionStart({ x, y });

		setSelectionRect({ x, y, width: 0, height: 0 });
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (!selectionStart || !canvasRef.current) return;

		isDraggingRef.current = true;

		// Convert mouse event coordinates to canvas coordinates
		const { x, y } = toCanvasCoords(e);

		// Adjust the selection rectangle coordinates based on the zoom and pan transform
		const transform = transformRef.current || d3.zoomIdentity;
		const transformedStartX = selectionStart.x * transform.k + transform.x;
		const transformedStartY = selectionStart.y * transform.k + transform.y;
		const transformedX = x * transform.k + transform.x;
		const transformedY = y * transform.k + transform.y;

		// Calculate the selection rectangle in the transformed space
		const rect = {
			x: Math.min(transformedStartX, transformedX),
			y: Math.min(transformedStartY, transformedY),
			width: Math.abs(transformedX - transformedStartX),
			height: Math.abs(transformedY - transformedStartY),
		};

		setSelectionRect(rect);
	};

	const handleMouseUp = () => {
		if (!selectionRect) {
			setSelectionStart(null);
			return;
		}

		const newlySelected = new Set<number>();
		const transform = transformRef.current || d3.zoomIdentity;

		for (const node of bagsRef.current) {
			if (node.x == null || node.y == null) continue;

			// Transform the node coordinates to match the current zoom and pan state
			const transformedNodeX = node.x * transform.k + transform.x;
			const transformedNodeY = node.y * transform.k + transform.y;

			// Check if the transformed node coordinates are inside the selection rectangle
			const insideX =
				transformedNodeX >= selectionRect.x &&
				transformedNodeX <= selectionRect.x + selectionRect.width;
			const insideY =
				transformedNodeY >= selectionRect.y &&
				transformedNodeY <= selectionRect.y + selectionRect.height;

			if (insideX && insideY) newlySelected.add(node.id);
		}
		if (newlySelected.size > 0) {
			dispatch(globalSlice.actions.selectBags([...newlySelected]));
		}
		const newNodesInHighlightedBags = [
			...bags.reduce((prev, curr) => {
				if (newlySelected.has(curr[0])) {
					for (const el of curr[1]) {
						prev.add(el);
					}
				}
				return prev;
			}, new Set<number>()),
		];

		dispatch(
			globalSlice.actions.setGroupOfHighlightedNodes(
				newNodesInHighlightedBags
			)
		);

		setSelectionStart(null);
		setSelectionRect(null);
	};

	const handleDownload = () => {
		// create a Blob with the content, specifying the MIME type.
		const blob = new Blob([rawData], { type: "text/plain;charset=utf-8" });

		// create an object URL and a temporary link element to trigger the download.
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "decomposed.td";

		// append the link to the document, trigger a click, and then clean up.
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	};

	const handleZoomIn = (e: React.SyntheticEvent) => {
		e.stopPropagation();
		if (canvasRef.current && zoomRef.current) {
			d3.select(canvasRef.current)
				.transition()
				.call(zoomRef.current.scaleBy, 1.2);
		}
	};

	const handleZoomOut = (e: React.SyntheticEvent) => {
		e.stopPropagation();
		if (canvasRef.current && zoomRef.current) {
			d3.select(canvasRef.current)
				.transition()
				.call(zoomRef.current.scaleBy, 1 / 1.2);
		}
	};

	const handleViewRaw = () => {
		dispatch(displaySlice.actions.setIsViewRawMode(true));
	};

	const handleViewGraph = () => {
		dispatch(displaySlice.actions.setIsViewRawMode(false));
	};

	const handleCopyRawData = () => {
		window.navigator.clipboard.writeText(rawData);
	};

	const handleSelectAsAGroup = (e: React.MouseEvent) => {
		e.stopPropagation();
		dispatch(
			globalSlice.actions.selectAsGroup({
				// TODO: unnecessary param
				newGroupBags: [...selectedBagIds],
				newGroupNodes: nodesInHightedBag,
			})
		);
		// setSelectedNodeIds(new Set<number>());
		// setShowAddToGroupButton(false);
		// dispatch(globalSlice.actions.setShowAddToGroupButton(false));
		dispatch(globalSlice.actions.resetSelectBags());
	};

	const handleClearHighlights = (e: React.MouseEvent) => {
		e.stopPropagation();
		dispatch(globalSlice.actions.clearGroupsHighlighting());
		dispatch(globalSlice.actions.clearHighlight());
	};

	const drawCanvas = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const nodes = nodesRef.current;
		const links = linksRef.current;

		if (!nodes || !links) return;

		const context = canvas.getContext("2d");
		if (!context) return;
		// get canvas displayed width and height
		const canvasWidth = canvas.getBoundingClientRect().width;
		const canvasHeight = canvas.getBoundingClientRect().height;

		// Clear the canvas.
		context.clearRect(0, 0, canvasWidth, canvasHeight);

		// Apply zoom and pan transform
		if (transformRef.current) {
			context.save();
			context.setTransform(
				transformRef.current.k,
				0,
				0,
				transformRef.current.k,
				transformRef.current.x,
				transformRef.current.y
			);
		}

		// Draw all links.
		// context.strokeStyle = "#aaa";
		context.strokeStyle = colorPalette.lightTheme.edge;
		context.lineWidth = 2;
		links.forEach((link) => {
			// After simulation starts, source and target are node objects.
			const source = link.source as NodeDatum;
			const target = link.target as NodeDatum;
			context.beginPath();
			context.moveTo(source.x!, source.y!);
			context.lineTo(target.x!, target.y!);
			context.stroke();
		});

		// Draw all nodes as ovals with the bag numbers inside.
		nodes.forEach((node) => {
			if (node.x == null || node.y == null) return;
			const { x, y, values } = node;

			// Draw the oval using the canvas ellipse API.
			context.beginPath();
			context.ellipse(x, y, ovalWidth, ovalHeight, 0, 0, 2 * Math.PI);

			if (hasHighlightedNode) {
				if (values.includes(highlightedNodeId)) {
					// context.fillStyle = "pink";
					context.fillStyle = colorPalette.lightTheme.bagFill;
					// context.strokeStyle = "orange";
					context.strokeStyle = colorPalette.lightTheme.bagHighlight;
				} else {
					context.fillStyle = colorPalette.lightTheme.vertexFill;
					context.strokeStyle = colorPalette.lightTheme.vertexBorder;
				}
			} else if (bagContainsHighlightedEdge == node.id) {
				context.fillStyle = colorPalette.lightTheme.bagFill;
				context.strokeStyle =
					colorPalette.lightTheme.colorGroups[highlightingColorIdx];
			} else {
				context.fillStyle = colorPalette.lightTheme.vertexFill;
				context.strokeStyle = colorPalette.lightTheme.vertexBorder;
			}

			if (hasHighlightedBag && highlightedBagId == node.id) {
				context.fillStyle = colorPalette.lightTheme.bagFill;
				// context.strokeStyle = colorPalette.lightTheme.bagHighlight;
				context.strokeStyle =
					colorPalette.lightTheme.colorGroups[highlightingColorIdx];
			}

			if (selectedBagIds.includes(node.id)) {
				context.fillStyle = colorPalette.lightTheme.bagFill;
				// context.strokeStyle = colorPalette.lightTheme.bagHighlight;
				context.strokeStyle =
					colorPalette.lightTheme.colorGroups[highlightingColorIdx];
			}

			// existed highlighting
			let colorIdx = -1;
			for (let i = 0; i < highlightedBags.length; i++) {
				if (highlightedBags[i].includes(node.id)) {
					colorIdx = i;
				}
			}

			// indicates if current node should be highlighted
			if (colorIdx !== -1) {
				context.strokeStyle =
					colorPalette.lightTheme.colorGroups[colorIdx];
			}

			context.fill();
			context.stroke();

			// Draw the text inside the oval (centered).
			const text = values.join(",");
			if (hasHighlightedNode) {
				if (values.includes(highlightedNodeId)) {
					context.fillStyle =
						colorPalette.lightTheme.colorGroups[
							highlightingColorIdx
						];
				} else {
					context.fillStyle = colorPalette.lightTheme.bagBorder;
				}
			} else if (bagContainsHighlightedEdge === node.id) {
				context.fillStyle =
					colorPalette.lightTheme.colorGroups[highlightingColorIdx];
			} else {
				context.fillStyle = colorPalette.lightTheme.bagBorder;
			}

			if (highlightedBagId === node.id) {
				context.fillStyle =
					colorPalette.lightTheme.colorGroups[highlightingColorIdx];
			}

			if (selectedBagIds.includes(node.id)) {
				context.fillStyle =
					colorPalette.lightTheme.colorGroups[highlightingColorIdx];
			}

			if (colorIdx !== -1) {
				context.fillStyle =
					colorPalette.lightTheme.colorGroups[colorIdx];
			}

			// context.fillStyle = colorPalette.lightTheme.vertexBorder;
			context.font = "12px sans-serif";
			const textMetrics = context.measureText(text);
			context.fillText(text, x - textMetrics.width / 2, y + 4);
		});

		// Restore context if transform was applied
		if (transformRef.current) {
			context.restore();
		}

		if (selectionRect) {
			context.save();
			context.strokeStyle = colorPalette.lightTheme.bagBorder;
			context.setLineDash([4]);
			context.strokeRect(
				selectionRect.x,
				selectionRect.y,
				selectionRect.width,
				selectionRect.height
			);
			context.restore();
		}
	};

	React.useEffect(() => {
		if (!canvasRef.current) return;

		const canvas = canvasRef.current;

		const zoom = d3
			.zoom<HTMLCanvasElement, unknown>()
			.scaleExtent([0.1, 10])
			.on("zoom", (event) => {
				const canvasWidth = canvas.getBoundingClientRect().width;
				const canvasHeight = canvas.getBoundingClientRect().height;

				const centerX = canvasWidth / 2;
				const centerY = canvasHeight / 2;

				// transformRef.current = d3.zoomIdentity.scale(event.transform.k);
				const transform = event.transform;
				transformRef.current = d3.zoomIdentity
					.translate(centerX, centerY)
					.scale(transform.k)
					.translate(-centerX, -centerY);

				drawCanvas();
				setZoomPercentage(Math.round(event.transform.k * 100));
			});

		zoomRef.current = zoom;

		// apply zoom behavior to the canvas
		d3.select(canvas).call(zoom);

		// Disable panning by removing drag-related events
		d3.select(canvas)
			.on("mousedown.zoom", null)
			.on("mousemove.zoom", null)
			.on("dblclick.zoom", null);

		return () => {
			d3.select(canvas).on(".zoom", null);
		};
	}, [isViewRawMode]);

	React.useEffect(() => {
		drawCanvas();
	}, [
		hasHighlightedBag,
		highlightedBagId,
		highlightedNodeId,
		hasHighlightedNode,
	]);

	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// get canvas displayed width and height
		const canvasWidth = canvas.getBoundingClientRect().width;
		const canvasHeight = canvas.getBoundingClientRect().height;

		// set attributes for the canvas instance
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;

		const context = canvas.getContext("2d");
		if (!context) return;

		// bagsRef.current = nodes;
		const nodes: NodeDatum[] = bags.map(([id, values]) => ({ id, values }));
		bagsRef.current = nodes;

		const links: LinkDatum[] = edges.map(([source, target]) => ({
			source,
			target,
		}));

		nodesRef.current = nodes;
		linksRef.current = links;

		const simulation = d3
			.forceSimulation<NodeDatum>(nodes)
			// The link force uses the bag id for matching.
			.force(
				"link",
				d3
					.forceLink<NodeDatum, LinkDatum>(links)
					.id((d) => d.id)
					.distance(80)
			)
			// Repel nodes from each other.
			.force("charge", d3.forceManyBody().strength(-300))
			// Center the graph in the canvas.
			.force("center", d3.forceCenter(canvasWidth / 2, canvasHeight / 2))
			.force("collide", d3.forceCollide(70))
			.alphaDecay(0.1);

		// On every simulation tick, redraw the canvas.
		simulation
			.on("tick", () => {
				drawCanvas();
			})
			.on("end", () => {
				// TODO: toast to wait for simulation finished then enable click event
				setSimulationDone(true);
			});

		return () => {
			simulation.stop();
		};
	}, [bags, edges, isViewRawMode]);

	React.useEffect(() => {
		if (!canvasRef.current) return;
		canvasRef.current.addEventListener("click", handleCanvasClick);

		return () => {
			canvasRef.current?.removeEventListener("click", handleCanvasClick);
		};
	}, [handleCanvasClick, isViewRawMode]);

	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		canvas.addEventListener("mousedown", handleMouseDown);
		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("mouseup", handleMouseUp);
		canvas.addEventListener("mouseleave", handleMouseLeave);

		return () => {
			canvas.removeEventListener("mousedown", handleMouseDown);
			canvas.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("mouseup", handleMouseUp);
			canvas.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [selectionStart, selectionRect, isViewRawMode]);

	React.useEffect(() => {
		drawCanvas();
	}, [
		selectionStart,
		selectedBagIds,
		selectionRect,
		highlightedNodeId,
		highlightedBagId,
		bagContainsHighlightedEdge,
	]);

	const handleNavigateBack = (e: React.SyntheticEvent) => {
		e.preventDefault();
		dispatch(globalSlice.actions.setIsInEditMode(true));
		navigate("/app");
	};

	return (
		<div className="relative border-2 border-stone-300 flex-1 h-[700px] rounded-lg">
			<div className="absolute w-full top-1 px-2 flex flex-col items-end gap-2 pointer-events-none">
				<div className="flex w-full justify-between">
					<Button
						variant="outline"
						className="text-stone-400 pointer-events-auto"
						onClick={handleNavigateBack}
					>
						<ChevronLeft className="text-stone-400" />
						Back
					</Button>
					<div className="flex items-center gap-1">
						{isViewRawMode ? (
							<Button
								onClick={handleViewGraph}
								variant="outline"
								className="text-stone-400 pointer-events-auto"
							>
								<Eclipse className="text-stone-400" />
								View Graph
							</Button>
						) : (
							<Button
								onClick={handleViewRaw}
								variant="outline"
								className="text-stone-400 pointer-events-auto"
							>
								<FileText className="text-stone-400" />
								View Raw
							</Button>
						)}

						<Button
							onClick={handleDownload}
							variant="outline"
							className="text-stone-400 pointer-events-auto"
						>
							<Download className="text-stone-400" />
							Download Raw Result
						</Button>
					</div>
				</div>
				<div className="w-full flex items-center justify-between">
					<div className="text-stone-400 text-sm flex items-center gap-2">
						<p>
							Total Bags:{" "}
							<span className="font-semibold text-stone-500">{bags.length}</span>
						</p>
						<p>
							Max Width:{" "}
							<span className="font-semibold text-stone-500">{maxWidth}</span>
						</p>
						{/* <Button
							size="sm"
							variant="ghost"
							className="pointer-events-auto"
						>
							View Detail
						</Button> */}
					</div>
					<Button
						onClick={handleClearHighlights}
						variant="outline"
						className="text-stone-400 pointer-events-auto"
					>
						<RotateCcw className="text-stone-400" />
						Clear Highlights
					</Button>
				</div>
			</div>

			{isViewRawMode ? (
				<div className="w-full h-full flex items-center justify-center">
					<div
						className="w-1/2 h-1/2 relative overflow-scroll border-2 border-stone-200 rounded-lg 
					py-4 px-6 shadow-sm"
					>
						<Button
							onClick={handleCopyRawData}
							variant="outline"
							className="absolute top-1 right-1 pointer-events-auto"
							size="icon"
						>
							<Copy className="text-stone-400" />
						</Button>
						<p className="whitespace-pre font-mono text-stone-500">
							{rawData}
						</p>
					</div>
				</div>
			) : (
				<div className="w-full h-full">
					<canvas ref={canvasRef} className="w-full h-full" />
					{showAddToGroupButton && (
						<div
							className="absolute border-2 border-stone-300 bottom-1 left-1/2 -translate-x-1/2
						 h-[40px] rounded-lg flex items-center justify-between gap-2 px-4 z-20 bg-white"
						>
							<Button
								size="sm"
								variant="ghost"
								className="text-stone-400 pointer-events-auto"
								onClick={handleSelectAsAGroup}
							>
								Select as a group
							</Button>
						</div>
					)}
					<div className="absolute bottom-2 left-2 flex items-center gap-2 border-2 border-stone-200 rounded-lg p-1 shadow-sm z-10 bg-white">
						<Button
							onClick={handleZoomOut}
							variant="ghost"
							size="icon"
							className="text-stone-400"
						>
							-
						</Button>
						<span className="text-sm text-stone-400">
							{zoomPercentage}
						</span>
						<Button
							onClick={handleZoomIn}
							variant="ghost"
							size="icon"
							className="text-stone-400"
						>
							+
						</Button>
					</div>
				</div>
			)}
			<div className="pointer-events-none absolute border-2 rounded-lg border-stone-300 bottom-1 right-1 text-stone-400 text-xs p-2 z-10 bg-white">
				<p className="font-semibold">Actions supported</p>
				<p>1. Highlight one bag to view nodes contained.</p>
				<p>2. Highlight one group of bag to view nodes contained.</p>
				<p>
					3. Highlight several groups of bags to view nodes contained.
				</p>
				<p>4. View result in .td format.</p>
				<p>5. Download result in .td format.</p>
			</div>
		</div>
	);
}
