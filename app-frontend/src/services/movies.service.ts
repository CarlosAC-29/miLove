import { env } from "@/app/config/env";
import { apiClient } from "@/services/api/client";
import { API_ROUTES } from "@/services/api/config";
import { createDemoStore } from "@/services/demo/demo-store";

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

const demoMovies = createDemoStore<MovieDto>("milove.demo.movies", [
  {
    id: "demo-movie-1",
    title: "Una película para viernes",
    description: "Pendiente para la próxima noche de cine.",
    startAt: "2026-10-16T20:30:00.000Z",
    owner: { id: "usr-carlos", name: "Carlos Rivera" }
  }
]);

export const moviesService = {
  async listMovies(): Promise<MovieDto[]> {
    if (env.useMocks) return demoMovies.list();
    return apiClient.get<MovieDto[]>(API_ROUTES.movies.list);
  },

  async createMovie(input: UpsertMovieInput): Promise<MovieDto> {
    if (env.useMocks) {
      return demoMovies.create({
        ...input,
        owner: { id: "usr-carlos", name: "Carlos Rivera" }
      });
    }
    return apiClient.post<MovieDto>(API_ROUTES.movies.list, input);
  },

  async updateMovie(id: string, input: UpsertMovieInput): Promise<MovieDto> {
    if (env.useMocks) return demoMovies.update(id, input);
    return apiClient.put<MovieDto>(API_ROUTES.movies.byId(id), input);
  },

  async deleteMovie(id: string): Promise<void> {
    if (env.useMocks) {
      demoMovies.remove(id);
      return;
    }
    await apiClient.delete<void>(API_ROUTES.movies.byId(id));
  }
};
