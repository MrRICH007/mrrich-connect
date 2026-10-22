Replace the existing handlePageTouchMove and handlePageTouchEnd functions in app/page.tsx with the code below. Keep handlePageTouchStart and all other code unchanged.

  function handlePageTouchMove(e: TouchEvent<HTMLElement>) {
    const start = pageSwipeStart.current;
    const touch = e.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.15) return;

    // Hard-stop page gestures at the first and last navigation pages.
    if (start.kind === 'page') {
      const currentIndex = NAV_ITEMS.findIndex(item => item.name === tab);
      if ((currentIndex === 0 && dx > 0) ||
          (currentIndex === NAV_ITEMS.length - 1 && dx < 0)) {
        setPageSwipeOffset(0);
        return;
      }
    }
    const limit = Math.max(180, window.innerWidth * 0.82);
    setPageSwipeOffset(Math.max(-limit, Math.min(limit, dx)));
  }

  function handlePageTouchEnd(e: TouchEvent<HTMLElement>) {
    const start = pageSwipeStart.current;
    pageSwipeStart.current = null;
    const touch = e.changedTouches[0];
    if (!start || !touch) { setPageSwipeOffset(0); return; }
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const horizontal = Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.15;
    if (!horizontal) { setPageSwipeOffset(0); return; }

    if (start.kind === 'chat' && dx > 0) {
      setPageSwipeAnimating(true);
      setPageSwipeOffset(Math.max(window.innerWidth, dx + 60));
      window.setTimeout(() => {
        closeConversationWithMotion();
        setPageSwipeOffset(0);
        setPageSwipeAnimating(false);
      }, 100);
      return;
    }

    const currentIndex = NAV_ITEMS.findIndex(item => item.name === tab);
    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    // At either outer edge, do not move or change pages.
    if (nextIndex < 0 || nextIndex >= NAV_ITEMS.length) {
      setPageSwipeOffset(0);
      setPageSwipeAnimating(false);
      return;
    }

    // Avoid sending the only rendered page fully off-screen before changing tabs.
    const limit = Math.max(180, window.innerWidth * 0.82);
    setPageSwipeAnimating(true);
    setPageSwipeOffset(Math.max(-limit, Math.min(limit, dx)));
    setTab(NAV_ITEMS[nextIndex].name);
    setShowProfile(false);
    setShowGroup(false);
    setShowEmojiPicker(false);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setPageSwipeOffset(0);
        window.setTimeout(() => setPageSwipeAnimating(false), 170);
      });
    });
  }
