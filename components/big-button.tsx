import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BigButton({
  children,
  href,
  onClick,
  disabled,
  variant = "default",
  type = "button",
  className,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "secondary" | "outline";
  type?: "button" | "submit";
  className?: string;
}) {
  if (href && !disabled) {
    return (
      <Button asChild size="lg" variant={variant} className={cn("w-full", className)}>
        <Link href={href}>{children}</Link>
      </Button>
    );
  }
  return (
    <Button
      type={type}
      size="lg"
      variant={variant}
      className={cn("w-full", className)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}
