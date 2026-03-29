import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async (data) => {
    const clean = (obj) => {
        if (!obj) return null;
        const { __v, ...rest } = obj;
        return rest;
    };
    await AuditLog.create({
        ...data,
        before: clean(data.before),
        after: clean(data.after)
    });
};
