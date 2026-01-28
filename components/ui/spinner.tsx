import { cn } from "@/lib/utils";
import { IconLoader } from "@tabler/icons-react";

function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof IconLoader>) {
  return (
    <IconLoader
      aria-label="Loading"
      className={cn("animate-spin", className)}
      role="status"
      {...props}
    />
  );
}

export { Spinner };
