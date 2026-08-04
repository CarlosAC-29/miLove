import { couplesRepository } from "./couples.repository.js";

export const couplesService = {
  async create(userId: string, name: string) {
    const couple = await couplesRepository.create(name, userId);
    await couplesRepository.addMember({
      coupleId: couple.id,
      userId,
      displayName: "Titular",
      contributionAmount: 0,
    });
    return couple;
  },

  listMine(userId: string) {
    return couplesRepository.listByUser(userId);
  },

  addMember(
    coupleId: string,
    input: {
      displayName: string;
      userId?: string;
      externalMemberId?: string;
      contributionAmount: number;
    },
  ) {
    return couplesRepository.addMember({
      coupleId,
      ...input,
    });
  },
};
