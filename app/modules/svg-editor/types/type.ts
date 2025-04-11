import { SimulationLinkDatum, SimulationNodeDatum } from "d3";

export type Vertex = {
	id: number;
	cx: number;
	cy: number;
	neighbors: number[];
};

export type Edge = {
	id: string;
	uId: number;
	vId: number;
};

export interface SimNode extends SimulationNodeDatum {
	id: number
}

export interface SimLink extends SimulationLinkDatum<SimNode> {}

export type CursorMode = "pointer" | "grab";

export type HighlightedElement =
	| {
			type: "node";
			id: number;
	  }
	| { type: "edge"; id: string }
	| null;
