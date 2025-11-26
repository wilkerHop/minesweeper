// Mock environment for local development when databases aren't configured

let mockSessionCounter = 0;

export async function createMockGameSession() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const sessionId = `mock-session-${++mockSessionCounter}`;
  const seed = Math.random().toString(36).substring(7);
  
  return {
    sessionId,
    seed,
    mineDensity: 0.15,
  };
}

export async function recordMockCellModification() {
  // No-op for mock mode
  return Promise.resolve();
}

export async function updateMockGameScore() {
  // No-op for mock mode
  return Promise.resolve();
}

export async function endMockGameSession() {
  // No-op for mock mode
  return Promise.resolve();
}
