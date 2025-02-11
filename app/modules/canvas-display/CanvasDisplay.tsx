import React from "react";
import { useAppSelector } from "~/hooks/reduxHooks";
import * as d3 from "d3";
import { Button } from "~/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "@remix-run/react";

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

export default function CanvasDisplay() {
	const { bags, edges } = useAppSelector((state) => state.display);

	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// get canvas displayed width and height
		const canvasWidth = canvas.getBoundingClientRect().width;
		const canvasHeight = canvas.getBoundingClientRect().height;

		// set attributes for the canvas instance
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;

		console.log("w", canvasWidth, "h", canvasHeight);

		const context = canvas.getContext("2d");
		if (!context) return;

		const nodes: NodeDatum[] = bags.map(([id, values]) => ({ id, values }));
		const links: LinkDatum[] = edges.map(([source, target]) => ({
			source,
			target,
		}));

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
			.force("center", d3.forceCenter(canvasWidth / 2, canvasHeight / 2));

		// On every simulation tick, redraw the canvas.
		simulation.on("tick", () => {
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
				// Define oval dimensions.
				const ovalWidth = 50;
				const ovalHeight = 15;

				// Draw the oval using the canvas ellipse API.
				context.beginPath();
				context.ellipse(x, y, ovalWidth, ovalHeight, 0, 0, 2 * Math.PI);
				context.fillStyle = "lightblue";
				context.fill();
				context.strokeStyle = "steelblue";
				context.stroke();

				// Draw the text inside the oval (centered).
				const text = values.join(",");
				context.fillStyle = "black";
				context.font = "12px sans-serif";
				const textMetrics = context.measureText(text);
				context.fillText(text, x - textMetrics.width / 2, y + 4);
			});
		});

		// Clean up the simulation on component unmount or when bags/edges change.
		return () => {
			simulation.stop();
		};
	}, [bags, edges]);

	return (
		<div className="relative border-2 border-stone-300 flex-1 h-[700px] rounded-lg">
			<Button
				asChild
				variant="outline"
				className="absolute top-1 left-1 text-stone-400"
			>
				<Link to="/app">
					<ChevronLeft className="text-stone-400" />
					Back
				</Link>
			</Button>
			<canvas ref={canvasRef} className="w-full h-full" />
		</div>
	);
}
