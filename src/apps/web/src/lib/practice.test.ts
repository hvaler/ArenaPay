import { expect, it } from 'vitest';
import { practiceApi } from './practice';
import { verifyReplay } from '../../../../packages/shared/src/simulation';
it('public practice produces verifiable local evidence and refuses Testnet execution', async () => {
  const match = await practiceApi.create(2026);
  await expect(practiceApi.run(match.matchId, true)).rejects.toThrow('no realiza operaciones');
  const completed = await practiceApi.run(match.matchId);
  expect(completed.testnet).toBeUndefined();
  expect((await verifyReplay(completed.replay!)).valid).toBe(true);
  expect(await practiceApi.get(match.matchId)).toEqual(completed);
});
