import createTreeWidthAlgoModule from "../../app/modules/algorithm-runner/wasm/wasmTreeWidthAlgo";

onmessage = function (msg) {
	if (msg.data.type === "RUN_TREE_WIDTH") {
		createTreeWidthAlgoModule().then(({ runTreeWidth }) => {
			const total_nodes = 11;
			const total_edges = 20;
			const nodes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
			const edges = [
				"1-2",
				"1-4",
				"1-5",
				"1-6",
				"1-7",
				"2-3",
				"2-9",
				"4-8",
				"4-10",
				"5-9",
				"5-11",
				"6-3",
				"6-10",
				"7-8",
				"7-11",
				"8-3",
				"8-9",
				"9-10",
				"10-11",
				"11-3",
			];
			try {
				const res = runTreeWidth(
					total_nodes,
					total_edges,
					nodes,
					edges
				);
				console.log("res in worker", res);
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
