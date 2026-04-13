interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "sale" | "new" | "outOfStock";
}

const variantClasses: Record<string, string> = {
  default: "bg-gray-100 text-gray-700",
  sale: "bg-accent-600 text-white",
  new: "bg-primary-600 text-white",
  outOfStock: "bg-gray-700 text-white",
};

export default function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}
