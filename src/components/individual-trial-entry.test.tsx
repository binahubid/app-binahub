import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
const role = vi.hoisted(() => vi.fn());
vi.mock('@/lib/supabase', () => ({ supabase: { auth: {} } }));
vi.mock('@/lib/authenticated-role', () => ({ fetchCurrentAuthenticatedRole: role }));
import { IndividualTrialEntry } from './individual-trial-entry';
beforeEach(() => vi.resetAllMocks()); afterEach(cleanup);
describe('public package page admin trial entry', () => {
  it('shows the demo entry only after verified admin role', async () => {
    role.mockResolvedValue({ ok: true, role: 'admin' }); render(<IndividualTrialEntry />);
    expect(await screen.findByRole('link', { name: /Uji coba paket PE & RM/ })).toHaveAttribute('href', '/admin/assessments/individual/trial');
  });
  it.each(['client', 'peserta', 'facilitator', null])('keeps public Coming soon closed for %s', async value => {
    role.mockResolvedValue({ ok: Boolean(value), role: value }); render(<IndividualTrialEntry />);
    await waitFor(() => expect(role).toHaveBeenCalled()); expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
