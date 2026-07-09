/// <reference types="vite/client" />
/**
 * Dev harness — NOT production code. Run `npm run dev`.
 * Set VITE_API_PROXY in .env.local to proxy /action to a real backend.
 */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import ContentEditor from './ContentEditor';
import type { EditorEventPayload } from './types';

const params = new URLSearchParams(location.search);
const FRAMEWORK = params.get('framework') ?? (import.meta.env.VITE_FRAMEWORK as string) ?? 'NCF';

function App() {
  const [lang, setLang] = useState(params.get('lang') ?? (import.meta.env.VITE_LANGUAGE as string) ?? 'en');
  const [contentId, setContentId] = useState(params.get('contentId') ?? (import.meta.env.VITE_CONTENT_ID as string) ?? '');
  const [key, setKey] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div id="dev-toolbar">
        <label>Content ID</label>
        <input value={contentId} onChange={(e) => setContentId(e.target.value)} placeholder="(blank = new)" style={{ width: 200 }} />
        <label>Lang</label>
        <select value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="en">English</option>
          <option value="ar">Arabic (RTL)</option>
          <option value="hi">Hindi</option>
          <option value="ta">Tamil</option>
          <option value="fr">Français</option>
          <option value="pt">Português</option>
        </select>
        <button onClick={() => setKey((k) => k + 1)}>Reload</button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ContentEditor
          key={key}
          context={{
            uid: 'dev-user',
            sid: `session-${Date.now()}`,
            did: 'device-001',
            channel: 'sunbird',
            pdata: { id: 'sunbird.content.editor', pid: 'editor', ver: '2.0.0' },
            user: { id: 'dev-user', name: 'Dev User', roles: ['CONTENT_CREATOR'] },
            framework: FRAMEWORK,
          }}
          contentId={contentId || undefined}
          language={lang}
          onEvent={(e: EditorEventPayload) => console.log('[editor]', e.eid, e.edata)}
          onClose={() => console.log('[editor] close')}
        />
      </div>
    </div>
  );
}

createRoot(document.getElementById('editor-root')!).render(<App />);
