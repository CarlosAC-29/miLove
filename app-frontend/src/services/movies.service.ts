import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";

export interface MovieDto {
  id: string;
  title: string;
  description?: string | null;
  startAt: string; // ISO
  endAt?: string | null;
  owner?: { id: string; name?: string } | null;
}

export interface UpsertMovieInput {
  title: string;
  description?: string;
  startAt: string;
}

export const moviesService = {
  async listMovies(): Promise<MovieDto[]> {
    return apiClient.get<MovieDto[]>(API_ROUTES.movies.list);
  },

  async createMovie(input: UpsertMovieInput): Promise<MovieDto> {
    return apiClient.post<MovieDto>(API_ROUTES.movies.list, input);
  },

  async updateMovie(id: string, input: UpsertMovieInput): Promise<MovieDto> {
    return apiClient.put<MovieDto>(API_ROUTES.movies.byId(id), input);
  },

  async deleteMovie(id: string): Promise<void> {
    await apiClient.delete<void>(API_ROUTES.movies.byId(id));
  }
};
