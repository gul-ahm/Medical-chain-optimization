import * as React from "react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<HTMLDivElement, any>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("relative w-full h-2 bg-secondary rounded-full", className)} {...props}>
      <div className="absolute h-full bg-primary rounded-full w-1/2" />
    </div>
  )
)
Slider.displayName = "Slider"
export { Slider }
