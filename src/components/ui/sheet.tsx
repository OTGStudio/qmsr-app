import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const Sheet = DialogPrimitive.Root

const SheetTrigger = DialogPrimitive.Trigger

const SheetClose = DialogPrimitive.Close

function SheetPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/40 duration-100 supports-backdrop-filter:backdrop-blur-xs data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

interface SheetContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content> {
  side?: "left" | "right"
}

function SheetContent({
  className,
  children,
  side = "left",
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-0 bg-background p-0 shadow-lg outline-none ring-1 ring-foreground/10 duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
          side === "left" &&
            "inset-y-0 left-0 h-full w-[min(100%,280px)] max-w-[100vw] border-r border-border",
          side === "right" &&
            "inset-y-0 right-0 h-full w-[min(100%,280px)] max-w-[100vw] border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          className
        )}
        {...props}
      >
        <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
        {children}
      </DialogPrimitive.Content>
    </SheetPortal>
  )
}

export { Sheet, SheetClose, SheetContent, SheetTrigger }
