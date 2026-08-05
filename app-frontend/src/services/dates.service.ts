import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";

export interface AppointmentDto {
  id: string;
  title: string;
  description?: string | null;
  startAt: string; // ISO
  endAt?: string | null;
  owner?: { id: string; name?: string } | null;
}

export const datesService = {
  async listAppointments(): Promise<AppointmentDto[]> {
    return apiClient.get<AppointmentDto[]>(API_ROUTES.dates.list);
  }
};
