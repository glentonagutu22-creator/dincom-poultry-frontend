
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MovingImageBackground from "../components/MovingImageBackground";
import { loginUser } from "../services/authService";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.success;
  const previousError = location.state?.error;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const email = formData.get("email").trim();
    const password = formData.get("password");

    try {
      const result = await loginUser({ email, password });
      const data = result?.data ?? result;
      const token = data?.token;

      if (!token) {
        throw new Error("The server did not return an authentication token.");
      }

      sessionStorage.setItem("dincom_token", token);

      if (data.user) {
        sessionStorage.setItem(
          "dincom_user",
          JSON.stringify(data.user)
        );
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#101010] px-4 py-8 sm:px-6">
      {/* Moving image background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <MovingImageBackground />
      </div>

      {/* Login card */}
     <section className="auth-card-3d w-full max-w-[370px] rounded-[22px] border border-orange-400/25 bg-gradient-to-br from-[#171717]/85 to-[#080808]/85 px-6 py-6 text-white shadow-2xl shadow-black/40 backdrop-blur-md sm:px-7 sm:py-7">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl border border-orange-400/30 bg-orange-500/10 text-xl text-orange-400 shadow-inner">
            ✳
          </div>

          <h1 className="text-[26px] font-extrabold tracking-[5px] text-orange-400">
            DINCOM
          </h1>

          <p className="mt-1 text-xs tracking-wide text-gray-400">
            Poultry Farm Management
          </p>
        </header>

        <div className="mb-5">
          <h2 className="text-[22px] font-semibold tracking-tight text-orange-300">
            Welcome back
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Sign in to manage your farm.
          </p>
        </div>

        {successMessage && (
          <p className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {successMessage}
          </p>
        )}

        {previousError && (
          <p className="mb-4 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {previousError}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold text-orange-200"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-white/10 bg-[#242424] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold text-orange-200"
            >
              Password
            </label>

            <div className="flex items-center rounded-xl border border-white/10 bg-[#242424] transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/20">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="mr-2 rounded-md px-1.5 py-1 text-xs font-semibold text-orange-400 transition hover:text-orange-300"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-black shadow-lg shadow-orange-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-6 text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-orange-400 transition hover:text-orange-300 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Login;