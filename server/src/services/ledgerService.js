import Contribution from '../models/Contribution.js';
import Cycle from '../models/Cycle.js';
import Chama from '../models/Chama.js';
import MemberLedger from '../models/MemberLedger.js';
import Membership from '../models/Membership.js';

export const recalculateMemberLedger = async (chamaId, memberId) => {
    const chama = await Chama.findById(chamaId);

    // Sum all verified contributions for this member in this chama
    const contribAgg = await Contribution.aggregate([
        { $match: { chamaId: chama._id, memberId, status: 'verified' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalContributed = contribAgg[0]?.total || 0;

    // Count cycles where this member was active
    const membership = await Membership.findOne({ chamaId, userId: memberId });
    const activeCycleCount = await Cycle.countDocuments({
        chamaId,
        status: { $in: ['active', 'collection', 'disbursed', 'closed'] },
        startDate: { $gte: membership.joinedAt }
    });

    const totalOwed = activeCycleCount * chama.contributionAmount;
    const balance = totalOwed - totalContributed;   // positive = in arrears

    await MemberLedger.findOneAndUpdate(
        { chamaId, memberId },
        { totalContributed, totalOwed, balance, lastUpdated: new Date() },
        { upsert: true, new: true }
    );
};
