/**
 * Editor telemetry — V3 events (IMPRESSION / INTERACT / START / END / ERROR),
 * env = 'contenteditor'. Mirrors the player TelemetryService shape so the host
 * can forward both through one pipeline. Events emitted via onEvent; optionally
 * batched + POSTed when a sink is provided.
 */
import type { EditorContext } from '../types';
import type { TelemetryEvent, TelemetryEid } from './telemetry.types';
import { TELEMETRY_VERSION } from '../constants';

let _midCounter = 0;
function mid(): string {
  return `${Date.now()}-${++_midCounter}`;
}

type EventCallback = (event: TelemetryEvent) => void;
type Sink = (events: TelemetryEvent[]) => Promise<void>;

export class TelemetryService {
  private context: EditorContext;
  private onEvent: EventCallback;
  private sink: Sink | null;
  private batch: TelemetryEvent[] = [];
  private batchSize: number;
  private pageid = 'content-editor';
  private objectId = '';
  private appStartTime = Date.now();
  private startTime = 0;

  constructor(context: EditorContext, onEvent: EventCallback, sink: Sink | null = null, batchSize = 20) {
    this.context = context;
    this.onEvent = onEvent;
    this.sink = sink;
    this.batchSize = batchSize;
  }

  /** Bind the current content id so subsequent events reference it. */
  setObject(id: string): void {
    this.objectId = id;
  }

  /** Swap the runtime context (uid/sid/channel/pdata) if the host changes it. */
  updateContext(context: EditorContext): void {
    this.context = context;
  }

  private buildEvent(eid: TelemetryEid, edata: Record<string, unknown>): TelemetryEvent {
    return {
      eid,
      ets: Date.now(),
      ver: TELEMETRY_VERSION,
      mid: mid(),
      actor: { id: this.context.uid, type: 'User' },
      context: {
        channel: this.context.channel,
        pdata: this.context.pdata,
        env: 'contenteditor',
        sid: this.context.sid,
        did: this.context.did,
        cdata: this.context.cdata,
        rollup: this.context.rollup,
      },
      object: { id: this.objectId, type: 'Content' },
      edata,
    };
  }

  private emit(event: TelemetryEvent): void {
    // A host callback throwing must never abort the UI action that emitted the event.
    try {
      this.onEvent(event);
    } catch {
      /* swallow — telemetry is fire-and-forget, like flush() */
    }
    if (this.sink) {
      this.batch.push(event);
      if (this.batch.length >= this.batchSize) this.flush();
    }
  }

  private flush(): void {
    if (!this.sink || this.batch.length === 0) return;
    const toSend = this.batch.splice(0);
    this.sink(toSend).catch(() => {});
  }

  /**
   * START — editor load. Mirrors the old generic editor telemetryService.start():
   * edata { type, mode, pageid, duration(sec since app start), uaspec }.
   */
  start(pageid = 'content-editor', mode = 'edit'): void {
    this.pageid = pageid;
    this.startTime = Date.now();
    this.emit(
      this.buildEvent('START', {
        type: 'content',
        mode,
        pageid,
        duration: Number(((this.startTime - this.appStartTime) / 1000).toFixed(2)),
        uaspec: { agent: typeof navigator !== 'undefined' ? navigator.userAgent : '' },
      }),
    );
  }

  /**
   * END — editor close. Mirrors generic editor telemetryService.end() on unload:
   * edata { type, mode, pageid, duration(sec session length) }.
   */
  end(pageid = this.pageid, mode = 'edit'): void {
    const duration = this.startTime
      ? Math.round((Date.now() - this.startTime) / 1000)
      : 0;
    this.emit(this.buildEvent('END', { type: 'content', mode, pageid, duration }));
    this.flush();
  }

  impression(pageid = 'content-editor'): void {
    this.pageid = pageid;
    this.emit(this.buildEvent('IMPRESSION', { type: 'edit', pageid, uri: '' }));
  }

  /** LOG — generic / api-call instrumentation. Matches generic editor log/apiCall. */
  log(message: string, level: 'INFO' | 'ERROR' = 'INFO', type = 'system'): void {
    this.emit(this.buildEvent('LOG', { type, level, message, pageid: this.pageid }));
  }

  /** type: click | modify ; subtype: upload | save | review | collaborator | ... */
  interact(type: string, id: string, subtype: string, extra?: Record<string, unknown>): void {
    this.emit(
      this.buildEvent('INTERACT', {
        type,
        subtype,
        id,
        pageid: this.pageid,
        extra: extra ? [extra] : [],
      }),
    );
  }

  error(err: string, errtype = 'edit'): void {
    this.emit(this.buildEvent('ERROR', { err, errtype, stacktrace: '' }));
  }

  destroy(): void {
    this.flush();
  }
}
