const id = location.hash.slice(1);
if (/^[a-f0-9-]{36}$/.test(id)) {
  const channel = new BroadcastChannel('devlife-preview-' + id);
  channel.onmessage = ({ data }) => {
    if (typeof data === 'string') renderProjectPreview(document.querySelector('iframe'), data);
  };
  channel.postMessage({ ready: true });
  window.addEventListener('pagehide', () => channel.close());
}
import { renderProjectPreview } from './exercise-preview.js';
