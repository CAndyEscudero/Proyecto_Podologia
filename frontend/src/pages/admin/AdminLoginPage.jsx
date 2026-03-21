import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/adminApi";
import { setStoredToken } from "../../shared/utils/auth";
import { Button } from "../../shared/ui/button/Button";

const loginSchema = z.object({
  email: z.string().trim().min(6, "Email invalido").max(120, "Email invalido").email("Email invalido"),
  password: z.string().min(8, "Minimo 8 caracteres").max(72, "Maximo 72 caracteres"),
});

export function AdminLoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values) {
    try {
      const data = await login(values);
      setStoredToken(data.token);
      toast.success("Sesion iniciada");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error?.response?.data?.message || "No fue posible iniciar sesion");
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-hero-glow px-5 py-16">
      <div className="card-surface w-full max-w-md p-8">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-wine">Admin</p>
        <h1 className="mt-4 font-display text-4xl text-brand-ink">Acceso al panel</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-ink">Email</span>
            <input type="email" {...register("email")} className="field-input" placeholder="tu@email.com" />
            {errors.email ? <span className="mt-2 block text-xs text-red-500">{errors.email.message}</span> : null}
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-ink">Password</span>
            <input type="password" {...register("password")} className="field-input" placeholder="Tu password" />
            {errors.password ? <span className="mt-2 block text-xs text-red-500">{errors.password.message}</span> : null}
          </label>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </div>
    </section>
  );
}
