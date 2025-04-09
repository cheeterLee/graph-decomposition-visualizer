import React from "react";
import { Button } from "~/components/ui/button";
import CodeSnippet from "./components/CodeSnippet";
import { Link, useNavigate } from "@remix-run/react";
import runnerSlice from "./slices/runnerSlice";
import { useAppDispatch, useAppSelector } from "~/hooks/reduxHooks";
import type { RootState } from "~/store";
import { Loader2 } from "lucide-react";
import displaySlice from "../canvas-display/slices/displaySlice";
import globalSlice from "~/globalSlice";
import { Separator } from "~/components/ui/separator";

export default function AlgorithmRunner() {
	const { isRunning } = useAppSelector((state: RootState) => state.runner);

	const { hasResult } = useAppSelector((state: RootState) => state.global);

	const { vertices, edges } = useAppSelector(
		(state: RootState) => state.editor
	);

	const workerRef = React.useRef<Worker | null>(null);

	const dispatch = useAppDispatch();

	const navigate = useNavigate();

	// terminate worker when the algorithm is aborted
	const handleeAbortRunCode = () => {
		if (!workerRef.current) return;
		workerRef.current.terminate();
		dispatch(runnerSlice.actions.setIsRunning(false));
	};

	const handleRunCode = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();

		// destroy previous web worker
		if (workerRef.current) {
			workerRef.current.terminate();
			workerRef.current = null;
		}

		dispatch(runnerSlice.actions.setIsRunning(true));

		const worker = new Worker(
			new URL("/web-workers/algoWorker.js", import.meta.url),
			{
				type: "module",
			}
		);

		workerRef.current = worker;

		worker.postMessage({
			type: "RUN_TREE_WIDTH",
			payload: {
				storedVertices: vertices,
				storedEdges: edges,
			},
		});

		worker.onmessage = function (message) {
			if (message.data.type === "RESULT") {
				const res: {
					bags: Array<number[]>;
					edges: Array<[number, number]>;
				} = message.data.payload.res;
				// console.log("res in main thread", res);

				dispatch(displaySlice.actions.setBags(res.bags));
				dispatch(displaySlice.actions.setEdges(res.edges));
				dispatch(displaySlice.actions.setNodes());
				dispatch(displaySlice.actions.flushRawData());
				// dispatch(runnerSlice.actions.setHasResult(true));
				dispatch(globalSlice.actions.setHasResult(true));

				dispatch(globalSlice.actions.setIsInEditMode(false));

				// TODO: navigates fires twice when results exist and user clicks show result before the algorithm finishes running
				navigate("/app/result");
			}
			dispatch(runnerSlice.actions.setIsRunning(false));
		};

		worker.onerror = (error) => {
			console.error("Worker error:", error);
			dispatch(runnerSlice.actions.setIsRunning(false));
			worker.terminate();
		};
	};

	const handleShowResult = (e: React.SyntheticEvent) => {
		e.preventDefault();
		dispatch(globalSlice.actions.setIsInEditMode(false));
		navigate("result");
	};

	return (
		<div className="grid grid-rows-3 gap-1 flex-1 h-[700px] rounded-lg">
			<div className="relative border-2 border-stone-300 w-full row-span-3 rounded-lg shadow-sm">
				{/* <div className="max-w-full max-h-full overflow-scroll">
					<CodeSnippet />
				</div> */}
				<div className="w-full max-h-full px-8 py-8 overflow-scroll">
					<p className="text-stone-400 mb-2">
						Tree Width Decomposition
					</p>
					<Separator />
					<p className="text-stone-400 my-2">
						A tree width graph decomposition algorithm is a method
						used to transform a graph into a tree-like structure
						known as a tree decomposition. This decomposition
						organizes the graph into interconnected groups of
						vertices (often called "bags") that satisfy three main
						properties: <br />
						<br />
						1. Every graph vertex appears in at least one bag.
						<br />
						2. Every edge of the graph is contained within at least
						one bag. <br />
						3. For any given vertex, the bags containing that vertex
						form a connected subtree.
						<br />
						<br />
						The tree width of the graph is determined by the size of
						the largest bag minus one, and algorithms for tree
						decomposition aim to minimize this number, which is
						particularly useful in solving many computational
						problems more efficiently on graphs that are "close" to
						being trees.
					</p>
					<Separator />
					<p className="text-stone-400 my-2">
						Graph and result format are referenced from{" "}
						<Link
							className="underline text-blue-400"
							to="https://pacechallenge.wordpress.com/pace-2016/track-a-treewidth/"
							target="_blank"
						>
							PACE 2016
						</Link>
					</p>
					<p className="text-stone-400 mb-2">
						The algorithm used is modified from{" "}
						<Link
							className="underline text-blue-400"
							to="https://github.com/mrprajesh/pacechallenge"
							target="_blank"
						>
							mrprajesh
						</Link>
					</p>
				</div>

				<div className="w-full absolute bottom-16 px-16 flex items-center justify-end gap-1">
					{hasResult && (
						<Button
							className="bg-stone-700 hover:bg-stone-500
                text-stone-50"
							onClick={handleShowResult}
						>
							Show Result
						</Button>
					)}

					{isRunning && (
						<Button
							variant="destructive"
							onClick={handleeAbortRunCode}
							className="text-stone-200"
						>
							Stop
						</Button>
					)}
					<Button
						onClick={handleRunCode}
						disabled={isRunning}
						className="bg-stone-700 hover:bg-stone-500
                text-stone-50"
					>
						{isRunning && <Loader2 className="animate-spin" />}
						Run Code
					</Button>
				</div>
			</div>
			<div className="border-2 border-stone-300 w-full row-span-1 rounded-lg shadow-sm">
				<p className="text-center py-2 text-stone-400 text-xs font-light">© Ziyi Li, University of Leeds, 2025</p>
			</div>
		</div>
	);
}
