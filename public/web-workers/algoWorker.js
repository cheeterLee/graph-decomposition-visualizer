import createTreeWidthAlgoModule from "../../app/modules/algorithm-runner/wasm/treeWidthAlgo";

onmessage = function (msg) {
	if (msg.data.type === "RUN_TREE_WIDTH") {
		createTreeWidthAlgoModule().then(({ runTreeWidth }) => {
			const { storedVertices, storedEdges } = msg.data.payload;
			const totalNodes = storedVertices.length;
			const totalEdges = storedEdges.length;
			const nodes = storedVertices.map((v) => v.id);
			const edges = storedEdges.map((e) => e.id);

			try {
				const res = runTreeWidth(totalNodes, totalEdges, nodes, edges);
				// console.log("res in worker", res);
				postMessage({
					type: "RESULT",
					payload: {
						res: res,
					},
				});
			} catch (e) {
				console.log(e);
			}
		});
	}
};
