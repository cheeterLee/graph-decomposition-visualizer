import { redirect } from "@remix-run/react";

// redirect user to '/app' route
export function loader() {
	return redirect('/app');
}

export default function Index() {
    return <></>
}