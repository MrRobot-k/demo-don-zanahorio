export type Testimonial = {
  name: string;
  quote: string;
  rating: number;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Karla M.",
    quote: "El bowl de quinoa es mi lugar seguro para comer rico y ligero en Victoria.",
    rating: 5,
  },
  {
    name: "Jorge R.",
    quote: "Pedí para la oficina y llegó todo caliente y a tiempo. El pastel de zanahoria es otro nivel.",
    rating: 5,
  },
  {
    name: "Daniela T.",
    quote: "El programa de puntos me regresó dinero real en mi monedero, súper fácil de usar.",
    rating: 4,
  },
];

export type Cashier = {
  id: string;
  name: string;
  role: string;
  emoji: string;
};

export type TrainingModule = {
  id: string;
  title: string;
  type: "Video" | "Curso" | "Manual" | "Procedimiento";
  duration: string;
  emoji: string;
};

export const TRAINING_MODULES: TrainingModule[] = [
  { id: "bienvenida", title: "Bienvenida a Don Zanahorio", type: "Video", duration: "6 min", emoji: "🎬" },
  { id: "higiene", title: "Manual de higiene y manejo de alimentos", type: "Manual", duration: "12 páginas", emoji: "📘" },
  { id: "pos-basico", title: "Uso del sistema POS", type: "Curso", duration: "20 min", emoji: "💻" },
  { id: "servicio", title: "Estándares de servicio al cliente", type: "Procedimiento", duration: "8 min", emoji: "🤝" },
  { id: "cocina-segura", title: "Procedimiento de cocina segura", type: "Procedimiento", duration: "10 min", emoji: "🔥" },
  { id: "cierre-caja", title: "Corte y cierre de caja", type: "Curso", duration: "15 min", emoji: "🧾" },
];

export type JobPosition = {
  id: string;
  title: string;
  summary: string;
  responsibilities: string[];
};
