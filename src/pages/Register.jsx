import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MovingImageBackground from "../components/MovingImageBackground";
import { registerUser } from "../services/authService";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);

    const full_name = formData.get("full_name").trim();
    const email = formData.get("email").trim();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirm_password");

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        full_name,
        email,
        password,
      });

      navigate("/login", {
        replace: true,
        state: {
          success: "Account created successfully. You can now sign in.",
        },
      });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#242424] px-3 py-2 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20";

  const passwordInputClass =
    "min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500";

  const passwordContainerClass =
    "flex items-center rounded-lg border border-white/10 bg-[#242424] transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/20";

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-x-hidden bg-[#101010] px-3 py-4 sm:px-6 sm:py-6">
      {/* Moving background remains behind the stationary card */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <MovingImageBackground />
      </div>

      {/* Compact, solid registration card */}
      <section className="relative z-10 my-auto w-full max-w-[360px] rounded-2xl border border-orange-400/25 bg-[#171717] px-4 py-4 text-white shadow-2xl shadow-black/60 sm:px-6 sm:py-5">
        {/* Brand */}
        <header className="mb-4 text-center">
          <div className="mx-auto mb-1.5 grid h-8 w-8 place-items-center rounded-lg border border-orange-400/30 bg-orange-500/10 text-lg text-orange-400">
            ✳
          </div>

          <h1 className="text-xl font-extrabold tracking-[4px] text-orange-400">
            DINCOM
          </h1>

          <p className="mt-0.5 text-[10px] tracking-wide text-gray-400">
            Poultry Farm Management
          </p>
        </header>

        {/* Heading */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-orange-300">
            Create your account
          </h2>

          <p className="mt-0.5 text-xs text-gray-400">
            Get started managing your poultry farm.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Full name */}
          <div>
            <label
              htmlFor="full_name"
              className="mb-1 block text-xs font-medium text-gray-200"
            >
              Full name
            </label>

            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-medium text-gray-200"
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
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-medium text-gray-200"
            >
              Password
            </label>

            <div className={passwordContainerClass}>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={8}
                required
                className={passwordInputClass}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="mr-2 rounded px-1.5 py-1 text-xs font-semibold text-orange-400 hover:text-orange-300 focus-visible:outline-2 focus-visible:outline-orange-400"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirm_password"
              className="mb-1 block text-xs font-medium text-gray-200"
            >
              Confirm password
            </label>

            <div className={passwordContainerClass}>
              <input
                id="confirm_password"
                name="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Enter password again"
                autoComplete="new-password"
                minLength={8}
                required
                className={passwordInputClass}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((current) => !current)
                }
                className="mr-2 rounded px-1.5 py-1 text-xs font-semibold text-orange-400 hover:text-orange-300 focus-visible:outline-2 focus-visible:outline-orange-400"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300"
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-bold text-black shadow-md shadow-orange-950/20 transition hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-3 text-center text-xs leading-5 text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-orange-400 hover:text-orange-300 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Register;