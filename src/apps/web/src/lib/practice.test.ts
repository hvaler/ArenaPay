import { expect, it } from 'vitest';
import { practiceApi } from './practice';
import { verifyReplay } from '../../../../packages/shared/src/simulation';
import { ENGINE_VERSION, LEGACY_ENGINE_VERSION } from '../../../../packages/shared/src/contracts';
it('public practice produces verifiable local evidence and refuses Testnet execution', async () => {
  const match = await practiceApi.create(2026, ENGINE_VERSION);
  await expect(practiceApi.run(match.matchId, true)).rejects.toThrow('no realiza operaciones');
  const completed = await practiceApi.run(match.matchId);
  expect(completed.testnet).toBeUndefined();
  expect((await verifyReplay(completed.replay!)).valid).toBe(true);
  expect(await practiceApi.get(match.matchId)).toEqual(completed);
});
it('does not create new practice matches with a historical engine', async () => {
  await expect(practiceApi.create(2026, LEGACY_ENGINE_VERSION)).rejects.toThrow('histórico');
});
