import type { HouseholdProfileDto } from "../types";

export const MOCK_HOUSEHOLD_PROFILE: HouseholdProfileDto = {
  id: "household-1",
  name: "Carlos ❤️ Laura",
  members: [
    { memberId: "usr-carlos", userId: "usr-carlos", memberName: "Carlos", amount: 2_100_000 },
    { memberId: "usr-laura", userId: "usr-laura", memberName: "Laura", amount: 1_500_000 }
  ]
};
