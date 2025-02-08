import React from "react";
import { Button } from "~/components/ui/button";
import CodeSnippet from "./components/CodeSnippet";
import { useNavigate } from "@remix-run/react";
import runnerSlice from "./slices/runnerSlice";
import { useAppDispatch, useAppSelector } from "~/hooks/reduxHooks";
import type { RootState } from "~/store";
import { Loader2 } from "lucide-react";

export default function AlgorithmRunner() {
	const { isRunning } = useAppSelector((state: RootState) => state.runner);
	console.log(isRunning);

	const dispatch = useAppDispatch();

	const navigate = useNavigate();

	const handleRunCode = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();

		dispatch(runnerSlice.actions.setIsRunning(true));

		const worker = new Worker(
			new URL("/web-workers/algoWorker.js", import.meta.url),
			{
				type: "module",
			}
		);

		worker.postMessage({
			type: "RUN_TREE_WIDTH",
			payload: {},
		});

		worker.onmessage = function (message) {
			if (message.data.type === "RESULT") {
				const res = message.data.payload.res;
				navigate("result");
				console.log("res in main thread", res);
			}
			dispatch(runnerSlice.actions.setIsRunning(false));
		};
	};

	return (
		<div className="grid grid-rows-3 gap-1 w-[500px] h-[700px] rounded-lg">
			<div className="relative border-2 border-stone-300 w-full row-span-2 rounded-lg">
				<div className="max-w-full max-h-full overflow-scroll">
					<CodeSnippet />
				</div>
				<Button
					onClick={handleRunCode}
					disabled={isRunning}
					className="bg-stone-700 hover:bg-stone-500
                text-stone-50  absolute right-2 bottom-2"
				>
					{isRunning && <Loader2 className="animate-spin" />}
					Run Code
				</Button>
			</div>
			<div className="border-2 border-stone-300 w-full row-span-1 rounded-lg"></div>
		</div>
	);
}
