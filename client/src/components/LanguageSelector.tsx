import React from "react";
import { Globe, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "am", label: "አማርኛ" },
    { code: "om", label: "Afaan Oromoo" },
];

export default function LanguageSelector() {
    const { i18n } = useTranslation();

    // Get the current language (e.g., "en" from "en-US")
    const currentLangCode = i18n.resolvedLanguage?.split("-")[0] ?? "en";

    const changeLanguage = async (language: string) => {
        await i18n.changeLanguage(language);
        localStorage.setItem("app-language", language);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger >
                <Button
                    variant="outline"
                    className="h-10 gap-1.5 rounded-full border-border bg-transparent px-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:h-11 sm:gap-2 sm:px-4"
                    aria-label="Select language"
                >
                    <Globe className="size-4 sm:size-5" />
                    <span className="text-sm font-semibold uppercase sm:text-base">
                        {currentLangCode}
                    </span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="min-w-[140px] rounded-xl border-border bg-popover text-popover-foreground"
            >
                {LANGUAGES.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className="cursor-pointer gap-2 py-2 text-xs focus:bg-accent focus:text-accent-foreground"
                    >
                        {/* Checkmark for the active language */}
                        <span className="flex w-3.5 items-center justify-center">
                            {currentLangCode === lang.code && (
                                <Check className="size-3.5" />
                            )}
                        </span>

                        <span className="font-bold uppercase">
                            {lang.code}
                        </span>

                        <span className="text-muted-foreground text-[11px]">
                            {lang.label}
                        </span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}