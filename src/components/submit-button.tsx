"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  pendingText,
  confirmText,
  variant = "primary",
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  confirmText?: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      onClick={(event) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
      className={cn(
        variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-danger" : "btn-secondary",
        className,
      )}
    >
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {pendingText ?? "Menyimpan…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}
