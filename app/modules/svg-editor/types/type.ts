export type Vertex = {
	id: number;
	cx: number;
	cy: number;
	neighbors: number[];
};

export type SvgEditorData = {
	data: Vertex[];
	e: [number, number][];
	g: Map<number, Vertex>;
	maxId: number;
};

export type CursorMode = "pointer" | "grab";
