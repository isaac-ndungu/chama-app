export const formatAuditEntry = (log) => {
    const actor = log.actorId?.name || 'Someone';
    const after = log.after || {};
    const before = log.before || {};

    const map = {
        CONTRIBUTION_RECORDED: () => `${actor} recorded a KES ${after.amount?.toLocaleString()} contribution (Ref: ${after.mpesaRef})`,
        CONTRIBUTION_VERIFIED: () => `${actor} verified a KES ${after.amount?.toLocaleString()} contribution`,
        CONTRIBUTION_DISPUTED: () => `${actor} flagged a contribution as disputed: "${after.disputeNote}"`,
        CONTRIBUTION_REJECTED: () => `${actor} rejected a contribution`,
        LOAN_APPLIED: () => `${actor} submitted a KES ${after.principalAmount?.toLocaleString()} loan application`,
        LOAN_APPROVED: () => `${actor} approved a loan`,
        LOAN_REJECTED: () => `${actor} rejected a loan`,
        LOAN_REPAYMENT_RECORDED: () => `${actor} recorded a loan repayment`,
        MEMBER_INVITED: () => `${actor} added ${after.email} as ${after.role}`,
        MEMBER_ROLE_CHANGED: () => `${actor} changed a member's role from ${before.role} to ${after.role}`,
        CYCLE_CREATED: () => `${actor} created a new contribution cycle`,
        CHAMA_CREATED: () => `${actor} created the chama`,
        POT_DISBURSED: () => `${actor} recorded pot disbursement`,
    };

    const formatter = map[log.action];
    return formatter ? formatter() : log.action.replace(/_/g, ' ');
};