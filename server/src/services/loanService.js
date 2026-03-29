import { addMonths } from 'date-fns';

export const calculateLoan = (principal, rateDecimal, durationMonths) => {
    if (!Number.isInteger(principal) || principal <= 0) {
        throw new Error('Principal must be a positive whole number in KES');
    }
    if (rateDecimal <= 0 || rateDecimal > 1) {
        throw new Error('Interest rate must be between 0 and 1 (e.g., 0.10 for 10%)');
    }
    if (!Number.isInteger(durationMonths) || durationMonths < 1) {
        throw new Error('Duration must be a positive whole number of months');
    }

    const totalInterest = Math.round(principal * rateDecimal * durationMonths);
    const totalDue = principal + totalInterest;
    const monthlyInstalment = Math.ceil(totalDue / durationMonths);

    return { totalInterest, totalDue, monthlyInstalment, dueDate: addMonths(new Date(), durationMonths) };
};
