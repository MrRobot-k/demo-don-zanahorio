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

export type JobPosition = {
  id: string;
  title: string;
  summary: string;
  responsibilities: string[];
};
