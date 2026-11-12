function render(event) {
  if (event.source !== parent || typeof event.data !== 'string' || event.data.length > 500000)
    return;
  // Este documento já está isolado pelo sandbox do iframe externo.
  document.open();
  document.write(event.data);
  document.close();
  window.onmessage = render;
}
window.onmessage = render;
