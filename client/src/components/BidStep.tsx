import React, { useEffect } from "react";

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

    // Optional: expand Telegram WebApp to full height & set header color
    useEffect(() => {
        if (typeof window !== "undefined" && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand(); // Make sure Mini App uses full screen
        }
    }, []);

    return (
        <div
            className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground"
            // Safe-area insets for iOS notches + Telegram's own header/footer
            style={{
                paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)",
                paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
                paddingLeft: "1.25rem",
                paddingRight: "1.25rem",
            }}
        >
            {/* Header Section */}
            <div className="mb-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                    ቀላል ስልት
                </p>
                <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-3xl">
                    ለማሸነፍ ሶስት እርምጃዎች
                </h1>
            </div>

            {/* Steps Section */}
            <div className="flex flex-1 flex-col">
                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    return (
                        <div key={step.id} className="flex gap-4">
                            {/* Left Column: Number & Line */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold transition-colors ${step.active
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "border border-border bg-transparent text-foreground"
                                        }`}
                                >
                                    {step.id}
                                </div>
                                {!isLast && (
                                    <div className="my-2 w-[1px] flex-1 bg-border" />
                                )}
                            </div>

                            {/* Right Column: Text Content */}
                            <div className={`min-w-0 pt-2.5 ${isLast ? "pb-0" : "pb-8"}`}>
                                <h3 className="mb-1.5 text-[17px] font-bold leading-snug text-foreground">
                                    {step.title}
                                </h3>
                                <p className="text-[14.5px] leading-relaxed text-muted-foreground">
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