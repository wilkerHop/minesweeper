'use server';

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

export async function getMockLeaderboard() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    { id: '1', playerName: 'VOID_WALKER', score: 15000, rank: 1 },
    { id: '2', playerName: 'NEO_MINER', score: 12500, rank: 2 },
    { id: '3', playerName: 'CYBER_GHOST', score: 9800, rank: 3 },
    { id: '4', playerName: 'GLITCH_HUNTER', score: 8500, rank: 4 },
    { id: '5', playerName: 'SYSTEM_ADMIN', score: 7200, rank: 5 },
  ];
}

export async function submitMockScore(score: number, playerName: string) {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true, rank: Math.floor(Math.random() * 10) + 1 };
}
