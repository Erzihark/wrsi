import { describe, expect, it } from 'vitest';
import { functionErrorMessage } from './entities';

/**
 * `functionErrorMessage` unwraps the server-sent `{ error }` body from a Supabase
 * Edge Function failure (delivered as a Response on `error.context`) so the UI can
 * show a meaningful message instead of "non-2xx status code".
 */
describe('functionErrorMessage', () => {
  it('extracts the server { error } from the Response in error.context', async () => {
    const error = {
      message: 'Edge Function returned a non-2xx status code',
      context: new Response(JSON.stringify({ error: 'email already registered' }), {
        status: 400,
      }),
    };
    expect(await functionErrorMessage(error, 'Create failed')).toBe(
      'email already registered',
    );
  });

  it('falls back to error.message when the body has no error field', async () => {
    const error = {
      message: 'boom',
      context: new Response(JSON.stringify({ nope: true }), { status: 500 }),
    };
    expect(await functionErrorMessage(error, 'Create failed')).toBe('boom');
  });

  it('falls back to error.message when the body is not JSON', async () => {
    const error = {
      message: 'boom',
      context: new Response('not json', { status: 500 }),
    };
    expect(await functionErrorMessage(error, 'Create failed')).toBe('boom');
  });

  it('falls back to error.message when there is no context', async () => {
    expect(await functionErrorMessage(new Error('network down'), 'Create failed')).toBe(
      'network down',
    );
  });

  it('uses the provided fallback when nothing else is available', async () => {
    expect(await functionErrorMessage({}, 'Create failed')).toBe('Create failed');
  });
});
