import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    size?: "sm" | "md" | "lg";
}

export default function Loading({
    title = "Chereta",
    subtitle = "Loading",
    size = "md",
    className,
    ...props
}: LoaderProps) {
    const sizeConfig = {
        sm: {
            container: "size-16",
            titleClass: "text-sm/tight font-medium",
            subtitleClass: "text-xs/relaxed",
            spacing: "space-y-1.5",
            maxWidth: "max-w-48",
        },
        md: {
            container: "size-24 sm:size-32", // Reduced slightly for mobile
            titleClass: "text-base/snug font-medium",
            subtitleClass: "text-sm/relaxed",
            spacing: "space-y-2",
            maxWidth: "max-w-56",
        },
        lg: {
            container: "size-32 sm:size-40",
            titleClass: "text-lg/tight font-semibold",
            subtitleClass: "text-base/relaxed",
            spacing: "space-y-3",
            maxWidth: "max-w-64",
        },
    };

    const config = sizeConfig[size];

    return (
        <div
            className={cn(
                // Full screen layout for Telegram
                "flex min-h-[100dvh] w-full flex-col items-center justify-center bg-background p-6 text-center font-sans",
                className
            )}
            style={{
                // Safe area insets for iOS/Telegram
                paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)",
                paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
            }}
            {...props}
        >
            {/* Enhanced Monochrome Loader */}
            <motion.div
                className={cn("relative", config.container)}
                animate={{
                    scale: [1, 1.02, 1],
                }}
                transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: [0.4, 0, 0.6, 1],
                }}
            >
                {/* Outer elegant ring with shimmer */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `conic-gradient(from 0deg, transparent 0deg, currentColor 90deg, transparent 180deg)`,
                        mask: `radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)`,
                        WebkitMask: `radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)`,
                        opacity: 0.8,
                    }}
                    animate={{ rotate: [0, 360] }}
                    transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                    }}
                />

                {/* Primary animated ring with gradient */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `conic-gradient(from 0deg, transparent 0deg, currentColor 120deg, color-mix(in srgb, currentColor 50%, transparent) 240deg, transparent 360deg)`,
                        mask: `radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)`,
                        WebkitMask: `radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)`,
                        opacity: 0.9,
                    }}
                    animate={{ rotate: [0, 360] }}
                    transition={{
                        duration: 2.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: [0.4, 0, 0.6, 1],
                    }}
                />

                {/* Secondary elegant ring - counter rotation */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `conic-gradient(from 180deg, transparent 0deg, color-mix(in srgb, currentColor 60%, transparent) 45deg, transparent 90deg)`,
                        mask: `radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)`,
                        WebkitMask: `radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)`,
                        opacity: 0.35,
                    }}
                    animate={{ rotate: [0, -360] }}
                    transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: [0.4, 0, 0.6, 1],
                    }}
                />

                {/* Accent particles */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `conic-gradient(from 270deg, transparent 0deg, color-mix(in srgb, currentColor 40%, transparent) 20deg, transparent 40deg)`,
                        mask: `radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)`,
                        WebkitMask: `radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)`,
                        opacity: 0.5,
                    }}
                    animate={{ rotate: [0, 360] }}
                    transition={{
                        duration: 3.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                    }}
                />

                {/* Center dot - small addition to anchor the loader */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-foreground opacity-50" />
                </div>
            </motion.div>

            {/* Enhanced Typography with Breathing Animation */}
            <motion.div
                className={cn("mt-6 text-center", config.spacing, config.maxWidth)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.4,
                    duration: 1,
                    ease: [0.4, 0, 0.2, 1],
                }}
            >
                {/* Clean title */}
                <motion.h1
                    className={cn(
                        config.titleClass,
                        "leading-[1.15] font-black tracking-tight text-foreground"
                    )}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 0.6,
                        duration: 0.8,
                        ease: [0.4, 0, 0.2, 1],
                    }}
                >
                    <motion.span
                        animate={{ opacity: [0.9, 0.6, 0.9] }}
                        transition={{
                            duration: 3,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: [0.4, 0, 0.6, 1],
                        }}
                    >
                        {title}
                    </motion.span>
                </motion.h1>

                {/* Clean subtitle */}
                <motion.p
                    className={cn(
                        config.subtitleClass,
                        "leading-[1.45] font-medium text-muted-foreground"
                    )}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 0.8,
                        duration: 0.8,
                        ease: [0.4, 0, 0.2, 1],
                    }}
                >
                    <motion.span
                        animate={{ opacity: [0.6, 0.3, 0.6] }}
                        transition={{
                            duration: 4,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: [0.4, 0, 0.6, 1],
                        }}
                    >
                        {subtitle}
                    </motion.span>
                </motion.p>
            </motion.div>
        </div>
    );
}