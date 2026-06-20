import { createFileRoute, Outlet } from "@tanstack/react-router";

function LearnLayout() {
	return <Outlet />;
}

export const Route = createFileRoute("/learn")({
	component: LearnLayout,
});
