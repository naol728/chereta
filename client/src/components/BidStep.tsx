/* eslint-disable */
// @ts-nocheck
import React from "react";

export default function BidStep() {
    const steps = [
        {
            id: "01",
            title: "ቁጥር ይምረጡ",
            description:
                "ከዝቅተኛው ይጀምሩና ሌላ ሰው አይመርጠውም የሚሉትን መጠን ይምረጡ።",
            active: true,
        },
        {
            id: "02",
            title: "የመግቢያ ክፍያውን ይክፈሉ",
            description:
                "የመግቢያ ክፍያውን በቴሌብር ወይም በሲቢኤ ብር ያጸድቁ። ቁጥርዎ ክፍያው ሲሳካ ብቻ ይገባል።",
            active: false,
        },
        {
            id: "03",
            title: "ልዩ ሆነው ይቆዩ",
            description:
                "ሌላ ተጫራች ቁጥርዎን ካዘመደው ሁለቱም ከውድድሩ ይወጣሉ። ዝቅተኛው ልዩ ቁጥር ያሸንፋል።",
            active: false,
        },
    ];

    return (
        // Simplified container: no min-h-screen, no safe area padding
        <div className="w-full bg-background px-4 py-5 text-foreground">

            {/* Header Section */}
            <div className="mb-5">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                    ቀላል ስልት
                </p>
                <h2 className="text-xl font-extrabold leading-tight tracking-tight">
                    ለማሸነፍ ሶስት እርምጃዎች
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
                                    {step.title}
                                </h3>
                                <p className="text-[13px] leading-relaxed text-muted-foreground">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}