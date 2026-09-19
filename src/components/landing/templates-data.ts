export type TemplateModel = {
  slug: string;
  name: string;
  category: string;
  img: string;
  badge: "Popular" | "Premium";
  accent: string;
};

export const TEMPLATE_MODELS: TemplateModel[] = [
  { slug: "hamburgueria", name: "Hamburgueria", category: "Alimentação", badge: "Popular", accent: "#f97316", img: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80" },
  { slug: "barbearia", name: "Barbearia", category: "Beleza", badge: "Popular", accent: "#eab308", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80" },
  { slug: "loja-roupas", name: "Loja de Roupas", category: "Varejo", badge: "Popular", accent: "#a855f7", img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80" },
  { slug: "advocacia", name: "Advocacia", category: "Serviços", badge: "Premium", accent: "#3b82f6", img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80" },
  { slug: "clinica", name: "Clínica", category: "Saúde", badge: "Premium", accent: "#22c55e", img: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80" },
  { slug: "imobiliaria", name: "Imobiliária", category: "Imóveis", badge: "Premium", accent: "#60a5fa", img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80" },
  { slug: "petshop", name: "Petshop", category: "Pets", badge: "Popular", accent: "#f472b6", img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80" },
  { slug: "academia", name: "Academia", category: "Fitness", badge: "Popular", accent: "#ef4444", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80" },
  { slug: "restaurante", name: "Restaurante", category: "Alimentação", badge: "Premium", accent: "#f59e0b", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" },
  { slug: "estetica", name: "Estética", category: "Beleza", badge: "Premium", accent: "#c084fc", img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80" },
  { slug: "oficina", name: "Oficina", category: "Automotivo", badge: "Popular", accent: "#94a3b8", img: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80" },
  { slug: "cafeteria", name: "Cafeteria", category: "Alimentação", badge: "Popular", accent: "#d97706", img: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80" },
];

export const TEMPLATE_PRICE = { setup: "R$ 497", monthly: "R$ 97/mês" };
