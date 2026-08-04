/**
 * Perfil financiero del hogar: quiénes lo componen y cuánto aporta cada uno.
 * Preparado para que cada miembro sea un usuario real con su propia cuenta.
 */
export interface ContributionDto {
  memberId: string;
  memberName: string;
  amount: number;
}

export interface Contribution {
  readonly memberId: string;
  readonly memberName: string;
  readonly amount: number;
}

export interface HouseholdProfileDto {
  id: string;
  name: string;
  members: ContributionDto[];
}

export interface HouseholdProfile {
  readonly id: string;
  readonly name: string;
  readonly members: readonly Contribution[];
}

export function mapHouseholdProfile(dto: HouseholdProfileDto): HouseholdProfile {
  return { id: dto.id, name: dto.name, members: dto.members.map((m) => ({ ...m })) };
}
