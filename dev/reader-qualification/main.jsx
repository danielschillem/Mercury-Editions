import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { openPdfEngine } from '../../resources/js/reader/pdfEngine.js';
import { speechSegments } from '../../resources/js/reader/speechSegments.js';
pdfjs.GlobalWorkerOptions.workerSrc = worker;

function Qualification() {
  const [engine, setEngine] = useState(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const canvas = useRef(null);
  const loadId = useRef(0);
  useEffect(() => () => { engine?.destroy(); window.speechSynthesis?.cancel(); }, [engine]);
  useEffect(() => {
    if (!engine) return;
    let cancelled = false;
    let render;
    setText('');
    window.speechSynthesis?.cancel();
    (async () => {
      const pdfPage = await engine.page(page);
      if (cancelled) return;
      const viewport = pdfPage.getViewport({ scale });
      canvas.current.width = Math.ceil(viewport.width);
      canvas.current.height = Math.ceil(viewport.height);
      render = pdfPage.render({ canvasContext: canvas.current.getContext('2d'), viewport });
      await render.promise;
      const content = await engine.text(page);
      if (!cancelled) setText(content);
    })().catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; render?.cancel(); };
  }, [engine, page, scale]);
  async function selectFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const id = ++loadId.current;
    setBusy(true); setError(''); setEngine(null); setPage(1);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
      const next = await openPdfEngine(pdfjs, bytes, `sha256:${hash}`);
      if (id !== loadId.current) await next.destroy(); else setEngine(next);
    } catch (e) { if (id === loadId.current) setError(e.message); }
    finally { if (id === loadId.current) setBusy(false); }
  }
  function speak() {
    if (!window.speechSynthesis) { setError('Synthèse vocale indisponible'); return; }
    const voice = speechSynthesis.getVoices().find(v => v.localService && v.lang.startsWith('fr'));
    if (!voice) { setError('Aucune voix française locale disponible. Aucun texte envoyé à un moteur distant.'); return; }
    window.speechSynthesis?.cancel();
    // Short utterances reduce platform limits; no synthetic metadata is substituted.
    for (const chunk of speechSegments(text)) {
      const utterance = new SpeechSynthesisUtterance(chunk); utterance.voice = voice; utterance.lang = voice.lang;
      speechSynthesis.speak(utterance);
    }
  }
  return <main style={{ maxWidth: 900, margin: 'auto', padding: 20, fontFamily: 'Arial' }}>
    <h1>Mercury Reader — Qualification privée</h1>
    <p>Fichier local, aucun téléversement. Prototype de rendu uniquement : sans licence serveur, synchronisation ni sauvegarde.</p>
    <label>PDF de qualification <input type="file" accept="application/pdf" onChange={selectFile} /></label>
    {busy && <p role="status">Ouverture du document…</p>}
    {error && <p role="alert">{error}</p>}
    {engine && <><nav aria-label="Navigation des pages" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '20px 0' }}>
      <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}>Précédente</button>
      <span aria-live="polite">Page {page} / {engine.pageCount}</span>
      <button onClick={() => setPage(p => p + 1)} disabled={page >= engine.pageCount}>Suivante</button>
      <label>Zoom <select value={scale} onChange={e => setScale(Number(e.target.value))}><option value="1">100 %</option><option value="1.5">150 %</option><option value="2">200 %</option></select></label>
      <button onClick={speak} disabled={!text}>Écouter la page (voix locale)</button>
      <button onClick={() => window.speechSynthesis?.pause()}>Pause</button><button onClick={() => window.speechSynthesis?.resume()}>Reprendre</button>
      <button onClick={() => window.speechSynthesis?.cancel()}>Arrêter</button>
    </nav><canvas ref={canvas} aria-label={`Rendu de la page ${page}`} style={{ maxWidth: '100%', height: 'auto' }} />
    <details><summary>Texte extrait de la page {page}</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{text}</pre></details></>}
  </main>;
}
createRoot(document.getElementById('root')).render(<Qualification />);
