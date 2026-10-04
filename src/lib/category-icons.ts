import {
  Baby,
  Dumbbell,
  Footprints,
  Gamepad2,
  type LucideIcon,
  Shapes,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
} from "lucide-react"

const ICONS: Record<string, LucideIcon> = {
  eletronicos: Smartphone,
  casa: Sofa,
  moda: Shirt,
  calcados: Footprints,
  beleza: Sparkles,
  esporte: Dumbbell,
  games: Gamepad2,
  infantil: Baby,
}

export const categoryIcon = (slug: string): LucideIcon => ICONS[slug] ?? Shapes
