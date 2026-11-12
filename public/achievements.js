export function createCelebration({ getContent, onView }) {
  const dialog = document.getElementById('achievementCelebration'),
    queue = [];
  let active = null,
    timer;
  const title = document.getElementById('achievementTitle'),
    description = document.getElementById('achievementDescription'),
    art = document.getElementById('achievementArt');
  // Uma entrega pode liberar mais de um troféu; mostra as celebrações em sequência.
  function next() {
    if (active || !queue.length) return;
    active = queue.shift();
    title.textContent = active.title;
    description.textContent = active.description;
    art.src = active.image;
    art.alt = `Troféu ${active.title}`;
    document.getElementById('achievementCount').textContent = queue.length
      ? `+${queue.length} conquista(s) na sequência`
      : 'Cada passo constrói sua história.';
    dialog.showModal();
    timer = setTimeout(() => dialog.close(), 8000);
  }
  dialog.addEventListener('close', () => {
    clearTimeout(timer);
    active = null;
    if (queue.length) setTimeout(next, 180);
  });
  document.getElementById('closeAchievement').onclick = () => dialog.close();
  document.getElementById('viewAchievements').onclick = () => {
    dialog.close();
    onView();
  };
  return {
    enqueue(ids) {
      for (const id of ids) {
        const a = getContent().achievements.find((a) => a.id === id);
        if (a && !queue.some((q) => q.id === id) && active?.id !== id) queue.push(a);
      }
      setTimeout(next, 280);
    },
  };
}
