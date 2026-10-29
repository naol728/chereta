import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Banner() {
    const { t } = useTranslation();

    return (
        <div className="mx-auto w-full max-w-md p-4">
            {/* Main Card Container */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#1d1714] text-white shadow-xl min-h-[500px] flex flex-col justify-between">

                {/* Background Patterns (SVG) */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                    {/* Diagonal Lines */}
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="diagonal-stripes" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                <line x1="0" y1="0" x2="0" y2="40" stroke="#eab83f" strokeWidth="1" opacity="0.15" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#diagonal-stripes)" />
                    </svg>

                    {/* Faint Circles */}
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
                        <defs>
                            <pattern id="dots" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                                <circle cx="20" cy="20" r="10" fill="none" stroke="#eab83f" strokeWidth="1.5" opacity="0.2" />
                                <circle cx="20" cy="20" r="2" fill="#eab83f" opacity="0.4" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#dots)" />
                    </svg>
                </div>

                {/* Top Pill (Badge) */}
                <div className="relative z-10 pt-6 px-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
                        <div className="size-2 rounded-full bg-[#eab83f]" />
                        <span className="text-xs font-semibold text-white/90">
                            {/* You might want to add a translation key for this later, e.g., t("app.upcoming") */}
                            8 የቀጣይ ጨረታዎች
                        </span>
                    </div>
                </div>

                {/* Main Typography */}
                <div className="relative z-10 px-6 mt-8 flex-1">
                    {/* 
                      Using the translation key here. 
                      Adjusted font size slightly to accommodate English text length.
                    */}
                    <h1 className="text-[38px] font-black leading-[1.15] tracking-tight text-white/95 sm:text-5xl">
                        {t("app.banner")}
                    </h1>

                    <p className="mt-6 max-w-[90%] text-[14px] leading-relaxed text-white/70">
                        {t("app.bannerdescription")}
                    </p>
                </div>

                {/* Bottom Action & Decorative Number */}
                <div className="relative z-10 w-full h-36">
                    {/* Large Number '01' */}
                    <div className="absolute -right-2 bottom-0 text-[180px] font-bold leading-none text-[#b55d49] opacity-90 select-none">
                        01
                    </div>

                    {/* Button */}
                    <div className="absolute left-6 bottom-6">
                        <Link
                            to="/bids"
                            className="group inline-flex items-center gap-2 rounded-full bg-[#eab83f] px-6 py-3.5 text-[15px] font-bold text-[#3d2208] transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-[#eab83f]/20"
                        >
                            <ArrowUpRight className="size-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
                            {/* Added a hardcoded fallback here. You should add an "app.joinbids" key to your JSON */}
                            {t("app.bannerbutton")}
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}