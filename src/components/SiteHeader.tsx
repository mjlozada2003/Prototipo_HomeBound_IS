import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Plus, User, BarChart3 } from "lucide-react";
import logo from "@/assets/logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SiteHeader() {
  const { session, name, isAdmin } = useAuth();
  const navigate = useNavigate();
  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/", replace: true });
  };
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo.url} alt="HomeBound" className="h-11 w-11 rounded-xl object-cover" />
          <span className="font-display text-2xl font-semibold text-primary">
            Home<span className="text-secondary">Bound</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin"><BarChart3 /> <span className="hidden sm:inline">Panel</span></Link>
            </Button>
          )}
          <Button asChild size="sm" className="rounded-full">
            <Link to="/publicar"><Plus /> Publicar</Link>
          </Button>
          {session ? (
            <>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to="/perfil"><User /> <span className="hidden sm:inline">{name ?? "Perfil"}</span></Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Cerrar sesión"><LogOut /></Button>
            </>
          ) : (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/auth">Ingresar</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
