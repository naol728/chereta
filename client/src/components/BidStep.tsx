/* eslint-disable */
// @ts-nocheck
import React from "react";
import { useTranslation } from "react-i18next";

export default function BidStep() {
    const { t } = useTranslation();

    const steps = [
        {
            id: "01",
            titleKey: "bidStep.steps.chooseNumber.title",
            descriptionKey: "bidStep.steps.chooseNumber.description",
            active: true,
        },
        {
            id: "02",
            titleKey: "bidStep.steps.payEntryFee.title",
            descriptionKey: "bidStep.steps.payEntryFee.description",
            active: false,
        },
        {
            id: "03",
            titleKey: "bidStep.steps.stayUnique.title",
            descriptionKey: "bidStep.steps.stayUnique.description",
            active: false,
        },
    ];

    return (
        <div className="w-full bg-background px-4 py-5 text-foreground">

            {/* Header Section */}
            <div className="mb-5">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                    {t("bidStep.simpleStrategy")}
                </p>
                <h2 className="text-xl font-extrabold leading-tight tracking-tight">
                    {t("bidStep.threeStepsToWin")}
                </h2>
            </div>

            {/* Steps Section */}
            <div className="flex flex-col">
                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.id} className="flex gap-3">
                            {/* Left Column: Number & Line */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors ${step.active
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "border border-border bg-transparent text-foreground"
                                        }`}
                                >
                                    {step.id}
                                </div>

                                {/* Connecting Line */}
                                {!isLast && (
                                    <div className="my-1.5 w-[1px] flex-1 bg-border" />
                                )}
                            </div>

                            {/* Right Column: Text Content */}
                            <div className={`min-w-0 pt-1.5 ${isLast ? "pb-0" : "pb-6"}`}>
                                <h3 className="mb-1 text-[15px] font-bold leading-snug text-foreground">
                                    {t(step.titleKey)}
                                </h3>
                                <p className="text-[13px] leading-relaxed text-muted-foreground">
                                    {t(step.descriptionKey)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}