import { useEffect, useState } from "react";

import { getCurrentUser } from "~/services/auth";
import { useAuthStore } from "~/store/authStore";

export function useAuth() {
	const user = useAuthStore((state) => state.user);
	const token = useAuthStore((state) => state.token);

	return {
		user,
		token,
		isAuthenticated: Boolean(user && token),
	};
}

export function useAuthBootstrap() {
	const token = useAuthStore((state) => state.token);
	const login = useAuthStore((state) => state.login);
	const logout = useAuthStore((state) => state.logout);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		let mounted = true;

		const syncSession = async () => {
			if (!token) {
				if (mounted) {
					setIsReady(true);
				}
				return;
			}

			try {
				const user = await getCurrentUser();
				const refreshToken =
					useAuthStore.getState().refreshToken ??
					localStorage.getItem("refreshToken");
				if (mounted) {
					login(user, token, refreshToken);
				}
			} catch {
				logout();
			} finally {
				if (mounted) {
					setIsReady(true);
				}
			}
		};

		void syncSession();

		return () => {
			mounted = false;
		};
	}, [login, logout, token]);

	return { isReady };
}
