import { Vertex } from "../modules/svg-editor/types/type";

export function populateDefaultGraphData() {
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