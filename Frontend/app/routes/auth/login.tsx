import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { RedirectIfAuthenticated } from "~/components/auth/RouteGuards";
import Button from "~/components/common/Button";
import Card from "~/components/common/Card";
import Input from "~/components/common/Input";
import { getApiErrorMessage } from "~/utils/apiError";
import { loginUser } from "~/services/auth";
import { resolvePostLoginPath } from "~/utils/auth";
import { useAuthStore } from "~/store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await loginUser({ email, password });
      const user = response.user;
      const token = response.token;

      if (!user || !token) {
        throw new Error("Invalid authentication response");
      }

      login(user, token, response.refresh ?? null);

      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(resolvePostLoginPath(user.role, from), { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <RedirectIfAuthenticated>
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <Card>
          <div className="mx-auto w-full max-w-xl space-y-6 lg:w-xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Electro</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">University E-Voting</h1>
              <p className="mt-2 text-sm text-slate-500">Sign in to access the election dashboard.</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="officer@electro.com"
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" loading={loading}>Login</Button>
            </form>
          </div>
        </Card>
      </div>
    </RedirectIfAuthenticated>
  );
}