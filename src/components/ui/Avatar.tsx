import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, { wrapper: string; text: string; px: number }> = {
  xs: { wrapper: "h-6 w-6", text: "text-[10px]", px: 24 },
  sm: { wrapper: "h-8 w-8", text: "text-xs", px: 32 },
  md: { wrapper: "h-10 w-10", text: "text-sm", px: 40 },
  lg: { wrapper: "h-12 w-12", text: "text-base", px: 48 },
  xl: { wrapper: "h-16 w-16", text: "text-xl", px: 64 },
};

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const { wrapper, text, px } = sizeMap[size];
  const initials = name ? getInitials(name) : "?";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 select-none",
        wrapper,
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? "avatar"}
          fill
          sizes={`${px}px`}
          className="object-cover"
        />
      ) : (
        <span className={cn("font-semibold text-brand-700", text)}>{initials}</span>
      )}
    </span>
  );
}

// Stack of overlapping avatars
interface AvatarGroupProps {
  avatars: Array<{ src?: string | null; name?: string }>;
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({ avatars, max = 4, size = "sm" }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;
  const { wrapper, text } = sizeMap[size];

  return (
    <div className="flex -space-x-2">
      {visible.map((a, i) => (
        <Avatar
          key={i}
          src={a.src}
          name={a.name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-slate-200 ring-2 ring-white",
            wrapper,
            text,
            "font-medium text-slate-600"
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
