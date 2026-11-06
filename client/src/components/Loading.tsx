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
            container: "size-24 sm:size-32",
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
                "flex min-h-[100dvh] w-full flex-col items-center justify-center bg-background p-6 text-center font-sans",
                className
            )}
            style={{
                paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)",
                paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
            }}
            {...props}
        >
            {/* Logo with Breathing Animation */}
            <motion.div
                className={cn("relative", config.container)}
                animate={{
                    scale: [1, 1.04, 1],
                }}
                transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: [0.4, 0, 0.6, 1],
                }}
            >
                <motion.img
                    src="/logo.jpg"
                    alt="Chereta Logo"
                    className="h-full w-full rounded-full object-cover"
                    animate={{ opacity: [1, 0.85, 1] }}
                    transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: [0.4, 0, 0.6, 1],
                    }}
                />
                {/* Subtle glow ring in the logo's green color */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        boxShadow: "0 0 24px 4px rgba(52, 211, 153, 0.35)",
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: [0.4, 0, 0.6, 1],
                    }}
                />
            </motion.div>

            {/* Text below logo */}
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
                {/* Title - Chereta in the logo's green color */}
                <motion.h1
                    className={cn(
                        config.titleClass,
                        "leading-[1.15] font-black tracking-tight"
                    )}
                    style={{ color: "#34d399" }} // Matches the green in the logo
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

                {/* Subtitle */}
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