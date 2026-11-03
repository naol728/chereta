import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Banner() {
    const { t } = useTranslation();

    return (
        <div
            className="flex min-h-[100dvh] w-full flex-col bg-background font-sans overscroll-y-none"
            style={{
                paddingTop: "calc(env(safe-area-inset-top) + 1rem)",
                paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)",
                paddingLeft: "1rem",
                paddingRight: "1rem",
            }}
        >
            {/* Main Card Container */}
            <div className="relative flex w-full flex-1 flex-col justify-between overflow-hidden rounded-[2rem] bg-card text-card-foreground shadow-sm border border-border/50 min-h-[500px]">

                {/* Background Patterns (SVG) */}
                <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
                    {/* Diagonal Lines */}
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern
                                id="diagonal-stripes"
                                width="40"
                                height="40"
                                patternUnits="userSpaceOnUse"
                                patternTransform="rotate(45)"
                            >
                                <line
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="40"
                                    stroke="currentColor"
                                    className="text-primary"
                                    strokeWidth="1"
                                    opacity="0.15"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#diagonal-stripes)" />
                    </svg>

                    {/* Faint Circles */}
                    <svg
                        width="100%"
                        height="100%"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute inset-0"
                    >
                        <defs>
                            <pattern
                                id="dots"
                                x="0"
                                y="0"
                                width="100"
                                height="100"
                                patternUnits="userSpaceOnUse"
                            >
                                <circle
                                    cx="20"
                                    cy="20"
                                    r="10"
                                    fill="none"
                                    stroke="currentColor"
                                    className="text-primary"
                                    strokeWidth="1.5"
                                    opacity="0.2"
                                />
                                <circle
                                    cx="20"
                                    cy="20"
                                    r="2"
                                    fill="currentColor"
                                    className="text-primary"
                                    opacity="0.4"
                                />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#dots)" />
                    </svg>
                </div>

                {/* Top Pill (Badge) */}
                <div className="relative z-10 px-6 pt-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 backdrop-blur-sm">
                        <div className="size-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-semibold text-foreground/90">
                            8 የቀጣይ ጨረታዎች
                        </span>
                    </div>
                </div>

                {/* Main Typography */}
                <div className="relative z-10 mt-8 flex-1 px-6">
                    <h1 className="text-[38px] font-black leading-[1.15] tracking-tight text-foreground sm:text-5xl">
                        {t("app.banner")}
                    </h1>

                    <p className="mt-6 max-w-[90%] text-[14px] leading-relaxed text-muted-foreground">
                        {t("app.bannerdescription")}
                    </p>
                </div>

                {/* Bottom Action & Decorative Number */}
                <div className="relative z-10 h-36 w-full">
                    {/* Large Number '01' */}
                    <div className="absolute -right-2 bottom-0 select-none text-[180px] font-bold leading-none text-primary opacity-90">
                        01
                    </div>

                    {/* Button */}
                    <div className="absolute bottom-6 left-6">
                        <Link
                            to="/bids"
                            className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-4 text-[15px] font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
                        >
                            <ArrowUpRight
                                className="size-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                                strokeWidth={2.5}
                            />
                            {t("app.bannerbutton")}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}