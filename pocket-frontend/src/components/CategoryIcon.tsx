import { icons, HelpCircle, type LucideProps } from "lucide-react";

interface Props extends LucideProps {
  name: string;
}

export function CategoryIcon({ name, ...rest }: Props) {
  const Icon = (icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name] ?? HelpCircle;
  return <Icon {...rest} />;
}

// A curated set of icons users can pick when creating custom categories
export const ICON_OPTIONS = [
  "ShoppingBag", "Coffee", "Pizza", "Car", "Plane", "Train", "Bus",
  "Home", "Building2", "Briefcase", "GraduationCap", "BookOpen",
  "Gift", "Heart", "HeartPulse", "Dumbbell", "Bike", "Gamepad2",
  "Music", "Film", "Tv", "Camera", "Smartphone", "Laptop",
  "Receipt", "CreditCard", "Wallet", "PiggyBank", "Sparkles",
  "Sun", "Moon", "Star", "Flame", "Leaf", "Dog", "Cat",
];

export const COLOR_OPTIONS = [
  "158 64% 42%",
  "180 70% 45%",
  "210 90% 60%",
  "260 75% 65%",
  "320 80% 65%",
  "350 80% 62%",
  "0 80% 60%",
  "24 95% 60%",
  "40 90% 55%",
  "70 80% 50%",
  "120 60% 50%",
];
