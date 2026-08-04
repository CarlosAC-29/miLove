/** Simula latencia de red mientras la capa de datos usa mocks. */
export const delay = (ms = 350): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
