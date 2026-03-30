const clients = new Map();

export const addClient = (chamaId, res) => {
    if (!clients.has(chamaId)) clients.set(chamaId, new Set());
    clients.get(chamaId).add(res);
};

export const removeClient = (chamaId, res) => {
    clients.get(chamaId)?.delete(res);
};

export const broadcastToChama = (chamaId, eventName, data) => {
    const chamaClients = clients.get(chamaId.toString());
    if (!chamaClients || chamaClients.size === 0) return;

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    chamaClients.forEach(res => {
        try {
            res.write(payload);
        } catch {
            // Client disconnected — remove silently
            chamaClients.delete(res);
        }
    });
};
