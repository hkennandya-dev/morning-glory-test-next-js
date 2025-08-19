"use client"
import { cn } from '@/lib/utils';
import { useRef } from 'react';
import SimpleBar from 'simplebar-react';

export default function ScrollLayout({ children, className }: { children: React.ReactNode, className?: string }) {
    const ref = useRef(null);
    return (
        <SimpleBar className={cn("max-w-screen w-full h-svh overflow-x-hidden", className)} scrollableNodeProps={{ ref }}>
            {children}
        </SimpleBar>
    )

}