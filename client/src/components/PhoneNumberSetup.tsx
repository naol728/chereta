/*eslint-disable*/
// @ts-nocheck

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { me } from "@/api/auth";
import { RotateCw } from "lucide-react";

interface TelegramWebApp {
    requestContact: (
        callback: (shared: boolean) => void
    ) => void;
}

interface TelegramWindow {
    Telegram?: {
        WebApp?: TelegramWebApp;
    };
}

interface User {
    phone: string | null;
}

interface MeResponse {
    user?: User;
}

interface PhoneNumberSetupProps {
    onComplete: (phone: string) => void;
}

export default function PhoneNumberSetup({
    onComplete,
}: PhoneNumberSetupProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [canReload, setCanReload] = useState(false);

    const waitForPhone = async (): Promise<string> => {
        const maxAttempts = 15;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`Checking phone... attempt ${attempt} `);

                const response = await me();
                const data = response as MeResponse;

                const phone = data.user?.phone ?? null;

                if (phone) {
                    console.log("✅ Phone found:", phone);
                    return phone;
                }

                // Wait 1 second before trying again
                await new Promise<void>((resolve) =>
                    setTimeout(resolve, 1000)
                );
            } catch (err) {
                console.error("Phone check failed:", err);

                // Don't immediately fail.
                // The backend may still be processing the Telegram update.
                await new Promise<void>((resolve) =>
                    setTimeout(resolve, 1000)
                );
            }
        }

        throw new Error(t("phoneSetup.stillProcessing"));
    };

    const requestPhone = (): void => {
        setError(null);
        setCanReload(false);

        const telegramWindow =
            window as unknown as TelegramWindow;

        const webApp = telegramWindow.Telegram?.WebApp;

        if (!webApp) {
            setError(t("phoneSetup.openInTelegram"));
            return;
        }

        setLoading(true);

        webApp.requestContact(
            async (shared: boolean): Promise<void> => {
                if (!shared) {
                    setLoading(false);
                    setError(t("phoneSetup.mustSharePhone"));
                    return;
                }

                try {
                    console.log(
                        "📱 Phone shared by Telegram. Waiting for backend..."
                    );

                    const phone = await waitForPhone();

                    console.log("✅ Phone successfully processed:", phone);

                    onComplete(phone);
                } catch (error: unknown) {
                    console.error(
                        "❌ Phone processing error:",
                        error
                    );

                    setError(
                        error instanceof Error
                            ? error.message
                            : t("phoneSetup.failedToProcess")
                    );
                    setCanReload(true);
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    const reloadPage = (): void => {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.("light");
        window.location.reload();
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-md">
                <h1 className="text-2xl font-bold">
                    {t("phoneSetup.title")}
                </h1>

                <p className="mt-2 text-muted-foreground">
                    {t("phoneSetup.subtitle")}
                </p>

                {error && (
                    <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <Button
                    className="mt-6 w-full"
                    onClick={requestPhone}
                    disabled={loading}
                >
                    {loading
                        ? t("phoneSetup.processingPhone")
                        : t("phoneSetup.sharePhoneNumber")}
                </Button>

                {/* Reload button — shown only after a timeout/failure */}
                {canReload && (
                    <div className="mt-3 space-y-1.5">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={reloadPage}
                        >
                            <RotateCw className="mr-2 h-4 w-4" />
                            {t("phoneSetup.reloadPage")}
                        </Button>
                        <p className="text-center text-[11px] text-muted-foreground">
                            {t("phoneSetup.reloadHint")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}