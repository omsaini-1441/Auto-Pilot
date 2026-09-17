type SpinnerProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
};

const sizeClass = {
  sm: "spinner-sm",
  md: "spinner-md",
  lg: "spinner-lg",
} as const;

export function Spinner({ className = "", size = "md", label }: SpinnerProps) {
  return (
    <span
      className={`spinner ${sizeClass[size]} ${className}`.trim()}
      role="status"
      aria-label={label || "Loading"}
    >
      <span className="sr-only">{label || "Loading"}</span>
    </span>
  );
}
