/**
 * Signup Form — PocketBase email/password registration + auto-login.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../store/useAuthStore";
import { authSchema } from "../utils/validation";

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signup, isLoading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      const msg = validation.error.format()._errors[0] || "Invalid input";
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      await signup(email, password);
      toast.success("Account created — welcome!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative z-10 w-full max-w-md mx-auto py-12 px-6"
    >
      <div className="bg-white border border-slate-200 shadow-sm p-8">
        <h2 className="text-2xl font-bold font-headline text-slate-900 mb-2 uppercase tracking-wide">
          Create your account
        </h2>
        <p className="text-sm text-slate-500 mb-8 font-body">
          Start optimizing your finances in under a minute
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label htmlFor="signup-email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              className="w-full px-4 py-3 border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors bg-white text-slate-900 font-body text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-required="true"
              aria-describedby={error ? "signup-error" : undefined}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="signup-password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              className="w-full px-4 py-3 border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors bg-white text-slate-900 font-body text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-required="true"
              autoComplete="new-password"
              placeholder="Min 8 characters"
            />
          </div>

          {error && (
            <div
              id="signup-error"
              role="alert"
              aria-live="assertive"
              className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 text-sm font-medium"
            >
              {error}
            </div>
          )}

          <motion.button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider text-sm transition-colors mb-4 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isLoading}
            aria-busy={isLoading}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <UserPlus size={16} />
            )}
            {isLoading ? "Creating account..." : "Create Account"}
          </motion.button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-6">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="font-bold text-slate-900 hover:text-slate-700 underline underline-offset-2 transition-colors"
          >
            Log in
          </button>
        </p>
      </div>
    </motion.div>
  );
}
