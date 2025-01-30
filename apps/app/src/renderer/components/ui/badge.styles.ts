import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-md border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        success:
          "border-transparent bg-green-500 text-white shadow",
        info:
          "border-transparent bg-blue-500 text-white shadow",
        outline: "text-foreground",
        warning: "border-transparent bg-yellow-200 text-black shadow",
      },
      interactive: {
        true: "",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    compoundVariants: [
      {
        interactive: true,
        variant: "default",
        className: "hover:bg-primary/80",
      },
      {
        interactive: true,
        variant: "secondary",
        className: "hover:bg-secondary/80",
      },
      {
        interactive: true,
        variant: "destructive",
        className: "hover:bg-destructive/80",
      },
      {
        interactive: true,
        variant: "success",
        className: "hover:bg-green-600",
      },
      {
        interactive: true,
        variant: "info",
        className: "hover:bg-blue-600",
      },
      {
        interactive: true,
        variant: "warning",
        className: "hover:bg-yellow-300",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
    },
  },
);
