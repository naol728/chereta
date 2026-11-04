import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Banner() {
    const { t } = useTranslation();

    return (
        // Changed to a standard block wrapper with margins, fitting perfectly in MainLayout
        <div className="w-full bg-background px-4 py-4 font-sans">

            {/* Main Card Container */}
            <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-5 text-card-foreground shadow-sm">

                {/* Top Pill (Badge) */}
                <div className="mb-4 flex">
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1">
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                        <span className="text-[11px] font-semibold text-muted-foreground">
                            8 የቀጣይ ጨረታዎች
                        </span>
                    </div>
                </div>

                {/* Main Typography */}
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground">
                        {t("app.banner")}
                    </h1>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                        {t("app.bannerdescription")}
                    </p>
                </div>

                {/* Bottom Action */}
                <div className="flex justify-end">
                    <Link
                        to="/bids"
                        className="group inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
                    >
                        {t("app.bannerbutton")}
                        <ArrowUpRight
                            className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                            strokeWidth={2.5}
                        />
                    </Link>
                </div>

            </div>
        </div>
    );
}