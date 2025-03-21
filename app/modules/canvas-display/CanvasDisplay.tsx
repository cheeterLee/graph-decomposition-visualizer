import React from "react";
import { useAppDispatch, useAppSelector } from "~/hooks/reduxHooks";
import * as d3 from "d3";
import { Button } from "~/components/ui/button";
import { ChevronLeft, Copy, Download, Eclipse, FileText } from "lucide-react";
import { Link } from "@remix-run/react";
import displaySlice from "./slices/displaySlice";
import globalSlice from "~/globalSlice";
import editorSlice from "../svg-editor/slices/editorSlice";

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
	const { bags, edges, isViewRawMode, rawData } = useAppSelector(
		(state) => state.display
	);

	const {
		hasResult,
		hasHighlightedNode,
		highlightedNodeId,
		hasHighlightedBag,
		highlightedBagId,
		nodesInHightedBag,
	} = useAppSelector((state) => state.global);

	const [simulationDone, setSimulationDone] = React.useState(false);

	const dispatch = useAppDispatch();

	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	const nodesRef = React.useRef<NodeDatum[]>([]);
	const linksRef = React.useRef<LinkDatum[]>([]);

	const bagsRef = React.useRef<NodeDatum[]>([]);

	const handleCanvasClick = (event: MouseEvent) => {
		// TODO: clicking before the force simulation ends will only updates global state, but not rendering highlight correctly
		event.stopPropagation();

		const canvas = canvasRef.current;
		if (!canvas) return;

		const rect = canvas.getBoundingClientRect();

		// convert viewport coord -> canvas coord
		const x = (event.clientX - rect.left) * (canvas.width / rect.width);
		const y = (event.clientY - rect.top) * (canvas.height / rect.height);

		let clickedBag: [number, number[]] | null = null;
		for (const node of bagsRef.current) {
			if (node.x == null || node.y == null) continue;
			const dx = x - node.x,
				dy = y - node.y;
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
			dispatch(
				globalSlice.actions.setHighlightedBag({
					id: clickedBag[0],
					nodes: clickedBag[1],
				})
			);
		} else {
			dispatch(globalSlice.actions.clearHighlight());
			dispatch(editorSlice.actions.setHighlightedElement(null));
		}
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

	const handleViewRaw = () => {
		dispatch(displaySlice.actions.setIsViewRawMode(true));
	};

	const handleViewGraph = () => {
		dispatch(displaySlice.actions.setIsViewRawMode(false));
	};

	const handleCopyRawData = () => {
		window.navigator.clipboard.writeText(rawData);
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

		// Draw all links.
		context.strokeStyle = "#aaa";
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
					context.fillStyle = "pink";
					context.strokeStyle = "orange";
				} else {
					context.fillStyle = "lightBlue";
					context.strokeStyle = "steelblue";
				}
			} else {
				context.fillStyle = "lightblue";
				context.strokeStyle = "steelblue";
			}

			if (hasHighlightedBag && highlightedBagId == node.id) {
				context.fillStyle = "yellow";
				context.strokeStyle = "orange";
			}

			context.fill();
			context.stroke();

			// Draw the text inside the oval (centered).
			const text = values.join(",");
			context.fillStyle = "black";
			context.font = "12px sans-serif";
			const textMetrics = context.measureText(text);
			context.fillText(text, x - textMetrics.width / 2, y + 4);
		});
	};

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
			.force("collide", d3.forceCollide(70));

		// On every simulation tick, redraw the canvas.
		simulation
			.on("tick", () => {
				drawCanvas();
			})
			.on("end", () => {
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
	}, [handleCanvasClick]);

	return (
		<div className="relative border-2 border-stone-300 flex-1 h-[700px] rounded-lg">
			<div className="absolute w-full top-1 px-2 flex items-center justify-between">
				<Button asChild variant="outline" className="text-stone-400">
					<Link to="/app">
						<ChevronLeft className="text-stone-400" />
						Back
					</Link>
				</Button>
				<div className="flex items-center gap-1">
					{isViewRawMode ? (
						<Button
							onClick={handleViewGraph}
							variant="outline"
							className="text-stone-400"
						>
							<Eclipse className="text-stone-400" />
							View Graph
						</Button>
					) : (
						<Button
							onClick={handleViewRaw}
							variant="outline"
							className="text-stone-400"
						>
							<FileText className="text-stone-400" />
							View Raw
						</Button>
					)}

					<Button
						onClick={handleDownload}
						variant="outline"
						className="text-stone-400"
					>
						<Download className="text-stone-400" />
						Download Raw Result
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
							className="absolute top-1 right-1"
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
				<canvas ref={canvasRef} className="w-full h-full" />
			)}
		</div>
	);
}
