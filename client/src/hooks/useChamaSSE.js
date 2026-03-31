import { useEffect } from 'react';

// Subscribes to the chama's SSE stream and calls handlers for specific events
const useChamaSSE = (chamaId, handlers = {}) => {
    useEffect(() => {
        if (!chamaId) return;

        const token = window.__accessToken__;
        if (!token) return;

       
        const url = `/api/chamas/${chamaId}/events?token=${token}`;
        const source = new EventSource(url);

        source.addEventListener('connected', () => {
            console.log(`SSE connected to chama ${chamaId}`);
        });

        Object.entries(handlers).forEach(([event, handler]) => {
            source.addEventListener(event, (e) => {
                try {
                    handler(JSON.parse(e.data));
                } catch {
                    console.error('SSE parse error', e.data);
                }
            });
        });

        source.onerror = () => {
            // EventSource auto-reconnects
            console.warn('SSE connection error — will retry automatically');
        };

        return () => source.close();
    }, [chamaId]);
};

export default useChamaSSE;