import React from "react";

const WorkerContext =
	React.createContext<React.MutableRefObject<Worker | null> | null>(null);

export const WorkerProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const workerRef = React.useRef<Worker | null>(null);
	return (
		<WorkerContext.Provider value={workerRef}>
			{children}
		</WorkerContext.Provider>
	);
};

export const useWorker = () => {
	const context = React.useContext(WorkerContext);
	if (!context) {
		throw new Error("useWorker should be used in WorkerProvider");
	}
	return context;
};
