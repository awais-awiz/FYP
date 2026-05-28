import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:brightness-110 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:brightness-110 hover:shadow-md hover:shadow-destructive/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
        outline: "border-2 border-primary/20 bg-transparent hover:border-primary hover:bg-primary/10 hover:text-primary active:scale-95",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:brightness-110 hover:shadow-md hover:shadow-secondary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground active:scale-95",
        link: "text-primary underline-offset-4 hover:underline",
        glow: "bg-gradient-to-r from-primary to-secondary text-white font-semibold hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] hover:scale-105 active:scale-95",
        hero: "bg-primary text-primary-foreground font-bold hover:brightness-110 hover:shadow-[0_0_40px_hsl(var(--primary)/0.8)] hover:scale-105 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700 active:scale-95"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);







const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };