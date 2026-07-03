import { describe, it, expect, vi } from 'vitest';
import { TelemetryService } from './TelemetryService';
import type { EditorContext } from '../types';
import type { TelemetryEvent } from './telemetry.types';

const ctx: EditorContext = {
  uid: 'u1', sid: 's1', did: 'd1', channel: 'ch1',
  pdata: { id: 'p', pid: 'pid', ver: '1.0' },
};

describe('TelemetryService', () => {
  it('emits well-formed events with actor/context/object', () => {
    const events: TelemetryEvent[] = [];
    const svc = new TelemetryService(ctx, (e) => events.push(e));
    svc.setObject('do_9');
    svc.impression('content-editor');

    expect(events).toHaveLength(1);
    const e = events[0];
    expect(e.eid).toBe('IMPRESSION');
    expect(e.ver).toBe('3.0');
    expect(e.actor).toEqual({ id: 'u1', type: 'User' });
    expect(e.context.env).toBe('contenteditor');
    expect(e.context.channel).toBe('ch1');
    expect(e.object).toEqual({ id: 'do_9', type: 'Content' });
    expect(typeof e.mid).toBe('string');
  });

  it('emits the expected eids for each action', () => {
    const eids: string[] = [];
    const svc = new TelemetryService(ctx, (e) => eids.push(e.eid));
    svc.start();
    svc.interact('click', 'saveButton', 'save');
    svc.error('boom');
    svc.end();
    expect(eids).toEqual(['START', 'INTERACT', 'ERROR', 'END']);
  });

  it('wraps interact extra into an array', () => {
    const events: TelemetryEvent[] = [];
    const svc = new TelemetryService(ctx, (e) => events.push(e));
    svc.interact('click', 'x', 'upload', { mimeType: 'video/mp4' });
    expect(events[0].edata.extra).toEqual([{ mimeType: 'video/mp4' }]);
  });

  it('batches to the sink and flushes when batchSize is reached', () => {
    const sink = vi.fn().mockResolvedValue(undefined);
    const svc = new TelemetryService(ctx, () => {}, sink, 2);
    svc.impression();        // batch = 1, no flush
    expect(sink).not.toHaveBeenCalled();
    svc.interact('click', 'a', 'save'); // batch = 2 → flush
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0][0]).toHaveLength(2);
  });

  it('flushes remaining events on end/destroy (negative: no sink is a no-op)', () => {
    const sink = vi.fn().mockResolvedValue(undefined);
    const svc = new TelemetryService(ctx, () => {}, sink, 100);
    svc.impression();
    svc.end();               // end() flushes the tail
    expect(sink).toHaveBeenCalled();

    // No sink → destroy must not throw.
    const noSink = new TelemetryService(ctx, () => {});
    expect(() => noSink.destroy()).not.toThrow();
  });
});
