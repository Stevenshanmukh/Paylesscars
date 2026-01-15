'use client';

import { useEffect, useState } from 'react';

interface HealthStatus {
    frontend: boolean;
    backend: boolean;
    database: boolean;
}

export function useHealthCheck() {
    const [status, setStatus] = useState<HealthStatus>({
        frontend: true,
        backend: false,
        database: false,
    });
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/health/`,
                    { method: 'GET' }
                );
                const data = await response.json();

                setStatus({
                    frontend: true,
                    backend: response.ok,
                    database: data.database === 'connected',
                });
            } catch (error) {
                setStatus({
                    frontend: true,
                    backend: false,
                    database: false,
                });
            } finally {
                setChecking(false);
            }
        };

        checkHealth();
    }, []);

    return { status, checking };
}

export function HealthCheck() {
    const { status, checking } = useHealthCheck();

    if (checking) {
        return (
            <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow">
                Checking connection...
            </div>
        );
    }

    if (!status.backend) {
        return (
            <div className="fixed bottom-4 right-4 bg-red-100 text-red-800 px-4 py-2 rounded-lg shadow">
                ⚠️ Backend not connected. Start with: python manage.py runserver
            </div>
        );
    }

    return null; // All good, don't show anything
}
