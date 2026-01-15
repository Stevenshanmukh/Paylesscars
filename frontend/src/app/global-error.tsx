'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
                    <h2 className="text-2xl font-bold mb-4">Critical Application Error</h2>
                    <p className="mb-4 text-muted-foreground">The application encountered a critical error and could not recover.</p>
                    <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/10 rounded overflow-auto max-w-lg">
                        <code className="text-red-600 dark:text-red-400 text-sm">{error.message}</code>
                    </div>
                    <Button onClick={() => reset()}>Refresh Application</Button>
                </div>
            </body>
        </html>
    );
}
