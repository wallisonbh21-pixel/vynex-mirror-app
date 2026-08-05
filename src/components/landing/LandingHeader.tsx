import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth";

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Produto", href: "#ecossistema" },
    { label: "Recursos", href: "#studio" },
    { label: "Como funciona", href: "#fluxo" },
    { label: "Para quem é", href: "#publico" },
    { label: "Templates", href: "#templates" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        isScrolled 
          ? "bg-slate-950/80 backdrop-blur-md border-b border-slate-800 py-3" 
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground shadow-glow group-hover:scale-110 transition-transform">
            <Sparkles className="size-4" />
          </span>
          <span className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white leading-tight">ScaleNexus</span>
            <span className="text-[9px] tracking-[0.2em] text-slate-400 font-medium uppercase leading-none">
              Digital Business
            </span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-300 hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Button asChild variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl">
              <Link to="/painel">Painel</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl font-semibold">
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-glow">
                <Link to="/auth">Começar agora</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-slate-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-lg font-medium text-slate-300"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-800">
            <Button asChild variant="outline" className="w-full border-slate-700 text-white rounded-xl">
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button asChild className="w-full bg-primary text-primary-foreground font-bold rounded-xl">
              <Link to="/auth">Começar agora</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
