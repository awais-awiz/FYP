import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Dot } from "lucide-react";

import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef(
  ({ className, containerClassName, ...props }, ref) =>
  <OTPInput
    ref={ref}
    containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props} />


);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center", className)} {...props} />
);
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef(


  ({ index, className, activeClassName, hasValueClassName, ...props }, ref) => {
    const inputOTPContext = React.useContext(OTPInputContext);
    const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];
    const hasValue = !!char;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center justify-center transition-all duration-300",
          isActive && "z-10",
          isActive && activeClassName,
          hasValue && hasValueClassName,
          className
        )}
        {...props}>
        
      {char && (
        <div className="animate-in zoom-in spin-in-12 duration-200 text-current">
          {char}
        </div>
      )}
      
      {!char && !hasFakeCaret && (
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 transition-all" />
      )}

      {hasFakeCaret &&
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-8 w-[3px] rounded-full bg-current duration-1000" />
        </div>
        }
    </div>);

  });
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef(
  ({ ...props }, ref) =>
  <div ref={ref} role="separator" {...props}>
      <Dot />
    </div>

);
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };