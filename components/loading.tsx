"use client"

import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

export default function Loading({ className }: { className?: string }) {
    return (
        <div className={cn("fixed inset-0 z-50 bg-background/80 flex items-center justify-center", className)}>
            <LoaderCircle size={40} className="animate-spin text-foreground" />
        </div>
    )
}