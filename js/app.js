/**
 * Escuela Feminista - Interactive Blog & 3D Carousel
 * Modular JavaScript Engine
 */

// Fallback dataset in case posts.json fetch fails or runs locally without HTTP server
const FALLBACK_POSTS = [
  {
    "id": 1,
    "titulo": "Introducción a la Teoría Feminista",
    "fecha_creacion": "2026-03-01",
    "url_video": "https://escuelafeminista.org/videos/introduccion-teoria-feminista",
    "url_imagen": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    "descripcion_corta": "Un recorrido introductorio sobre los conceptos fundamentales y la historia de las olas del feminismo.",
    "categoria": "Teoría y Historia",
    "tiempo_lectura": "5 min",
    "autor": "Dra. Sofía Mendoza"
  },
  {
    "id": 2,
    "titulo": "Colectividad y Redes de Apoyo",
    "fecha_creacion": "2026-03-15",
    "url_video": "https://escuelafeminista.org/videos/colectividad-redes-apoyo",
    "url_imagen": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
    "descripcion_corta": "Estrategias de organización comunitaria y la importancia de tejer alianzas y espacios seguros.",
    "categoria": "Comunidad",
    "tiempo_lectura": "7 min",
    "autor": "Red de Mujeres Alianza"
  },
  {
    "id": 3,
    "titulo": "Ecofeminismo y Sostenibilidad",
    "fecha_creacion": "2026-04-02",
    "url_video": "https://escuelafeminista.org/videos/ecofeminismo-sostenibilidad",
    "url_imagen": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    "descripcion_corta": "Reflexiones sobre el cuidado de la vida, el medio ambiente y el impacto de los roles de género.",
    "categoria": "Ecología",
    "tiempo_lectura": "6 min",
    "autor": "Camila Ríos"
  },
  {
    "id": 4,
    "titulo": "Feminismos decoloniales e Interseccionalidad",
    "fecha_creacion": "2026-04-20",
    "url_video": "https://escuelafeminista.org/videos/interseccionalidad-y-decolonialidad",
    "url_imagen": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
    "descripcion_corta": "Un análisis sobre las múltiples dimensiones de la opresión y el pensamiento crítico desde el sur global.",
    "categoria": "Interseccionalidad",
    "tiempo_lectura": "8 min",
    "autor": "Dra. Esperanza Morales"
  }
];

// State Manager
const AppState = {
  posts: [],
  filteredPosts: [],
  currentIndex: 0,
  activeCategory: 'todos',
  searchQuery: '',
  isAutoplay: true,
  autoplayTimer: null,
  touchStartX: 0,
  touchEndX: 0
};

/**
 * Clean markdown/link formatting if present in raw string values
 */
function cleanUrl(rawUrl) {
  if (!rawUrl) return '';
  const match = rawUrl.match(/\[(.*?)\]\((.*?)\)/);
  if (match) {
    return match[2] || match[1];
  }
  return rawUrl.trim();
}

/**
 * Format ISO date string into friendly Spanish format
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Fetch posts from JSON or fallback dataset
 */
async function fetchPostsData() {
  try {
    const response = await fetch('data/posts.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const rawData = await response.json();
    AppState.posts = sanitizePosts(rawData);
  } catch (error) {
    console.warn('Cargando dataset desde la memoria interna (fallback):', error);
    AppState.posts = sanitizePosts(FALLBACK_POSTS);
  }
  AppState.filteredPosts = [...AppState.posts];
}

/**
 * Sanitize dataset URLs and add missing metadata defaults
 */
function sanitizePosts(data) {
  return data.map(post => ({
    ...post,
    url_video: cleanUrl(post.url_video),
    url_imagen: cleanUrl(post.url_imagen),
    categoria: post.categoria || 'General',
    tiempo_lectura: post.tiempo_lectura || '5 min',
    autor: post.autor || 'Escuela Feminista'
  }));
}

/* ==========================================================================
   🎡 3D FERRIS WHEEL CAROUSEL ENGINE
   ========================================================================== */

function initCarousel() {
  const wheel = document.getElementById('carousel-wheel');
  const dotsContainer = document.getElementById('carousel-dots');
  if (!wheel || AppState.posts.length === 0) return;

  // Build Carousel DOM Cards
  wheel.innerHTML = AppState.posts.map((post, index) => `
    <div class="carousel-card glass-panel shadow-2xl flex flex-col border border-white/60 group" data-index="${index}">
      <!-- Header Badge & Image -->
      <div class="relative h-40 sm:h-52 overflow-hidden bg-slate-900 shrink-0">
        <img src="${post.url_imagen}" alt="${post.titulo}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onError="this.src='https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
        <span class="absolute top-3 left-3 px-3 py-1 rounded-full bg-pink-500 text-white text-xs font-bold shadow-md tracking-wide">
          <i class="fa-solid fa-sparkles mr-1"></i> ${post.categoria}
        </span>
        <button onclick="event.stopPropagation(); openArticleModal(${post.id})" aria-label="Ver Video" class="absolute bottom-2.5 right-2.5 min-w-[44px] min-h-[44px] rounded-full bg-white/90 text-pink-600 hover:bg-pink-500 hover:text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-110 active:scale-95">
          <i class="fa-solid fa-play text-base ml-0.5"></i>
        </button>
      </div>

      <!-- Card Content -->
      <div class="p-4 sm:p-5 flex flex-col justify-between flex-grow bg-white/80">
        <div>
          <div class="flex items-center gap-2 text-[11px] sm:text-xs text-slate-400 font-medium mb-1">
            <span><i class="fa-regular fa-calendar text-pink-500 mr-1"></i>${formatDate(post.fecha_creacion)}</span>
            <span>•</span>
            <span><i class="fa-regular fa-clock text-purple-500 mr-1"></i>${post.tiempo_lectura}</span>
          </div>
          <h3 class="font-heading font-bold text-base sm:text-xl text-slate-800 line-clamp-2 leading-snug group-hover:text-pink-600 transition-colors">
            ${post.titulo}
          </h3>
          <p class="text-xs sm:text-sm text-slate-600 line-clamp-2 sm:line-clamp-3 mt-1.5 leading-relaxed">
            ${post.descripcion_corta}
          </p>
        </div>

        <div class="pt-2.5 border-t border-pink-100 flex items-center justify-between gap-2 mt-2">
          <span class="text-[11px] sm:text-xs font-semibold text-slate-500 flex items-center gap-1 truncate">
            <i class="fa-regular fa-circle-user text-pink-500 shrink-0"></i> <span class="truncate">${post.autor}</span>
          </span>
          <button onclick="openArticleModal(${post.id})" class="min-h-[44px] px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm shrink-0 flex items-center justify-center gap-1 active:scale-95">
            <span>Ver Módulo</span> <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Build Dot Indicators
  if (dotsContainer) {
    dotsContainer.innerHTML = AppState.posts.map((_, idx) => `
      <button class="dot-btn min-w-[24px] min-h-[24px] p-1.5 flex items-center justify-center focus:outline-none" data-index="${idx}" aria-label="Ir a diapositiva ${idx + 1}">
        <span class="dot-pill block rounded-full transition-all duration-300 ${idx === 0 ? 'bg-pink-500 w-7 h-2.5' : 'bg-pink-200 hover:bg-pink-300 w-2.5 h-2.5'}"></span>
      </button>
    `).join('');

    dotsContainer.querySelectorAll('.dot-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetIdx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
        goToSlide(targetIdx);
      });
    });
  }

  // Event Listeners for Carousel Controls
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const autoplayBtn = document.getElementById('carousel-autoplay');

  if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplayTimer(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplayTimer(); });

  if (autoplayBtn) {
    autoplayBtn.addEventListener('click', toggleAutoplay);
  }

  // Card click navigation or modal launch
  const cards = wheel.querySelectorAll('.carousel-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.getAttribute('data-index'), 10);
      if (idx === AppState.currentIndex) {
        openArticleModal(AppState.posts[idx].id);
      } else {
        goToSlide(idx);
        resetAutoplayTimer();
      }
    });
  });

  // Touch & Swipe Support
  const stage = document.getElementById('carousel-stage');
  if (stage) {
    stage.addEventListener('touchstart', (e) => {
      AppState.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    stage.addEventListener('touchend', (e) => {
      AppState.touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  // Keyboard Arrow Navigation
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('article-modal')?.classList.contains('hidden') === false) return;
    if (e.key === 'ArrowLeft') {
      prevSlide();
      resetAutoplayTimer();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      resetAutoplayTimer();
    }
  });

  // Render initial positions
  updateCarouselPositions();
  startAutoplay();
}

/**
 * Calculate 3D transformation matrix for each card relative to active index
 */
function updateCarouselPositions() {
  const cards = document.querySelectorAll('.carousel-card');
  const dots = document.querySelectorAll('.dot-btn');
  const total = AppState.posts.length;

  if (total === 0) return;

  cards.forEach((card, index) => {
    // Relative offset from current index (-1, 0, 1, etc.)
    let offset = index - AppState.currentIndex;

    // Wrap around calculation for smooth infinite loop geometry
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const absOffset = Math.abs(offset);

    // Dynamic 3D positioning coordinates
    const translateX = offset * 220; // Spread along horizontal X axis
    const translateZ = -absOffset * 180; // Depth offset into 3D space
    const rotateY = offset * -25; // Tilt angle facing center
    const scale = Math.max(0.7, 1 - absOffset * 0.15);
    const opacity = absOffset > 2 ? 0 : (absOffset === 0 ? 1 : 0.75 - absOffset * 0.2);
    const zIndex = 30 - Math.round(absOffset * 10);

    card.style.transform = `translate3d(${translateX}px, 0px, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
    card.style.opacity = opacity;
    card.style.zIndex = zIndex;

    if (absOffset === 0) {
      card.classList.add('ring-4', 'ring-pink-400/50', 'shadow-pink-500/20');
      card.style.pointerEvents = 'auto';
    } else {
      card.classList.remove('ring-4', 'ring-pink-400/50', 'shadow-pink-500/20');
    }
  });

  // Update Dots Active State
  dots.forEach((dot, index) => {
    const pill = dot.querySelector('.dot-pill');
    if (pill) {
      if (index === AppState.currentIndex) {
        pill.className = 'dot-pill block w-7 h-2.5 rounded-full bg-pink-500 transition-all duration-300 shadow-sm';
      } else {
        pill.className = 'dot-pill block w-2.5 h-2.5 rounded-full bg-pink-200 hover:bg-pink-300 transition-all duration-300';
      }
    }
  });
}

function goToSlide(index) {
  const total = AppState.posts.length;
  AppState.currentIndex = (index + total) % total;
  updateCarouselPositions();
}

function nextSlide() {
  goToSlide(AppState.currentIndex + 1);
}

function prevSlide() {
  goToSlide(AppState.currentIndex - 1);
}

function handleSwipe() {
  const diff = AppState.touchEndX - AppState.touchStartX;
  if (Math.abs(diff) > 40) {
    if (diff < 0) {
      nextSlide();
    } else {
      prevSlide();
    }
    resetAutoplayTimer();
  }
}

function startAutoplay() {
  if (AppState.autoplayTimer) clearInterval(AppState.autoplayTimer);
  if (AppState.isAutoplay) {
    AppState.autoplayTimer = setInterval(() => {
      nextSlide();
    }, 4500);
  }
}

function toggleAutoplay() {
  AppState.isAutoplay = !AppState.isAutoplay;
  const icon = document.getElementById('autoplay-icon');
  if (icon) {
    icon.className = AppState.isAutoplay ? 'fa-solid fa-pause text-base' : 'fa-solid fa-play text-base';
  }
  if (AppState.isAutoplay) {
    startAutoplay();
  } else if (AppState.autoplayTimer) {
    clearInterval(AppState.autoplayTimer);
  }
}

function resetAutoplayTimer() {
  if (AppState.isAutoplay) {
    startAutoplay();
  }
}

/* ==========================================================================
   ARTICLE POSTS GRID & MODAL CONTROLS
   ========================================================================== */

function renderPostsGrid(postsToRender) {
  const gridContainer = document.getElementById('posts-grid');
  const emptyState = document.getElementById('empty-state');

  if (!gridContainer) return;

  if (postsToRender.length === 0) {
    gridContainer.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  gridContainer.innerHTML = postsToRender.map(post => `
    <article class="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col cursor-pointer" onclick="openArticleModal(${post.id})">
      <!-- Card Image Header -->
      <div class="relative h-48 overflow-hidden bg-slate-100">
        <img src="${post.url_imagen}" alt="${post.titulo}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" onError="this.src='https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'" />
        <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity"></div>
        <span class="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-pink-600 text-xs font-bold shadow-sm">
          ${post.categoria}
        </span>
      </div>

      <!-- Card Body -->
      <div class="p-5 flex flex-col flex-grow">
        <div class="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <span><i class="fa-regular fa-calendar text-pink-400 mr-1"></i>${formatDate(post.fecha_creacion)}</span>
          <span>•</span>
          <span><i class="fa-regular fa-clock text-purple-400 mr-1"></i>${post.tiempo_lectura}</span>
        </div>

        <h3 class="font-heading font-bold text-lg text-slate-800 group-hover:text-pink-600 transition-colors line-clamp-2 leading-snug mb-2">
          ${post.titulo}
        </h3>

        <p class="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4 flex-grow">
          ${post.descripcion_corta}
        </p>

        <!-- Card Footer Link -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-pink-500 group-hover:text-purple-600 transition-colors">
          <span>Explorar Módulo</span>
          <i class="fa-solid fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i>
        </div>
      </div>
    </article>
  `).join('');
}

// Global scope initialization helper for module script
window.openArticleModal = (id) => {
  const post = AppState.posts.find(p => p.id === id);
  if (!post) return;

  const modal = document.getElementById('article-modal');
  const modalCard = document.getElementById('modal-card');
  const modalImg = document.getElementById('modal-img');
  const modalCategory = document.getElementById('modal-category');
  const modalTitle = document.getElementById('modal-title');
  const modalDate = document.getElementById('modal-date');
  const modalReadtime = document.getElementById('modal-readtime');
  const modalAuthor = document.getElementById('modal-author');
  const modalDesc = document.getElementById('modal-description');
  const modalVideoLink = document.getElementById('modal-video-link');
  const modalVideoBtn = document.getElementById('modal-video-btn');

  if (modalImg) modalImg.src = post.url_imagen;
  if (modalCategory) modalCategory.textContent = post.categoria;
  if (modalTitle) modalTitle.textContent = post.titulo;
  if (modalDate) modalDate.textContent = formatDate(post.fecha_creacion);
  if (modalReadtime) modalReadtime.textContent = post.tiempo_lectura;
  if (modalAuthor) modalAuthor.textContent = post.autor;
  if (modalDesc) modalDesc.textContent = post.descripcion_corta;

  if (modalVideoLink) {
    modalVideoLink.href = post.url_video;
    modalVideoLink.textContent = post.url_video;
  }
  if (modalVideoBtn) {
    modalVideoBtn.href = post.url_video;
  }

  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      if (modalCard) {
        modalCard.classList.remove('scale-95', 'opacity-0');
        modalCard.classList.add('scale-100', 'opacity-100');
      }
    }, 10);
  }
};

function closeArticleModal() {
  const modal = document.getElementById('article-modal');
  const modalCard = document.getElementById('modal-card');

  if (modalCard) {
    modalCard.classList.remove('scale-100', 'opacity-100');
    modalCard.classList.add('scale-95', 'opacity-0');
  }

  setTimeout(() => {
    if (modal) modal.classList.add('hidden');
  }, 200);
}

/* ==========================================================================
   💸 NEQUI DONATION MODAL CONTROLS
   ========================================================================== */

function showToast(message) {
  const toast = document.getElementById('toast-notification');
  const toastMsg = document.getElementById('toast-message');
  if (!toast) return;

  if (toastMsg) toastMsg.textContent = message;

  toast.classList.remove('hidden');
  void toast.offsetWidth; // force reflow
  toast.classList.remove('translate-y-8', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-8', 'opacity-0');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 300);
  }, 3000);
}

function openDonationModal() {
  const modal = document.getElementById('donationModal');
  const card = document.getElementById('donationCard');
  const copyNotice = document.getElementById('copyNotice');

  if (copyNotice) copyNotice.classList.add('hidden');

  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      if (card) {
        card.classList.remove('scale-95', 'opacity-0', 'translate-y-full');
        card.classList.add('scale-100', 'opacity-100', 'translate-y-0');
      }
    }, 10);
  }
}

function closeDonationModal() {
  const modal = document.getElementById('donationModal');
  const card = document.getElementById('donationCard');

  if (card) {
    card.classList.remove('scale-100', 'opacity-100', 'translate-y-0');
    card.classList.add('scale-95', 'opacity-0', 'translate-y-full');
  }

  setTimeout(() => {
    if (modal) modal.classList.add('hidden');
  }, 250);
}

async function copyNequiNumber() {
  const nequiEl = document.getElementById('nequiNumber');
  const numberText = nequiEl ? nequiEl.innerText.trim() : '3176837319';
  const copyNotice = document.getElementById('copyNotice');
  const btnText = document.getElementById('copy-btn-text');

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(numberText);
    } else {
      // Fallback for non-HTTPS or legacy browsers
      const textArea = document.createElement('textarea');
      textArea.value = numberText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    // Floating toast notification feedback
    showToast(`¡Número Nequi ${numberText} copiado al portapapeles!`);

    // Visual feedback confirmation notice inside modal
    if (copyNotice) {
      copyNotice.classList.remove('hidden');
    }

    // Dynamic button feedback
    if (btnText) {
      const originalText = btnText.innerHTML;
      btnText.innerHTML = '¡Copiado!';
      setTimeout(() => {
        btnText.innerHTML = originalText;
      }, 2500);
    }
  } catch (err) {
    console.error('Error al copiar:', err);
    alert(`Número Nequi: ${numberText}`);
  }
}

/* ==========================================================================
   📱 MOBILE NAVIGATION DRAWER CONTROLS
   ========================================================================== */

function openMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (!drawer || !backdrop) return;

  backdrop.classList.remove('hidden');
  // Trigger reflow for CSS transitions
  void backdrop.offsetWidth;
  backdrop.classList.remove('opacity-0');
  backdrop.classList.add('opacity-100');

  drawer.classList.remove('translate-x-full');
  drawer.classList.add('translate-x-0');
  document.body.classList.add('overflow-hidden');
}

function closeMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('mobile-drawer-backdrop');
  if (!drawer || !backdrop) return;

  drawer.classList.remove('translate-x-0');
  drawer.classList.add('translate-x-full');

  backdrop.classList.remove('opacity-100');
  backdrop.classList.add('opacity-0');

  setTimeout(() => {
    backdrop.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }, 300);
}

// Attach functions to global window object
window.openDonationModal = openDonationModal;
window.closeDonationModal = closeDonationModal;
window.copyNequiNumber = copyNequiNumber;
window.openMobileDrawer = openMobileDrawer;
window.closeMobileDrawer = closeMobileDrawer;

/**
 * Filter and Search handler
 */
function applyFilters() {
  AppState.filteredPosts = AppState.posts.filter(post => {
    const matchesCategory = AppState.activeCategory === 'todos' || post.categoria === AppState.activeCategory;
    const matchesSearch = !AppState.searchQuery ||
      post.titulo.toLowerCase().includes(AppState.searchQuery.toLowerCase()) ||
      post.descripcion_corta.toLowerCase().includes(AppState.searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  renderPostsGrid(AppState.filteredPosts);
}

/**
 * Initialize Application
 */
document.addEventListener('DOMContentLoaded', async () => {
  await fetchPostsData();
  initCarousel();
  renderPostsGrid(AppState.filteredPosts);

  // Setup Search Input Event Listener
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value.trim();
      applyFilters();
    });
  }

  // Setup Filter Buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => {
        b.className = 'filter-btn px-4 py-2 rounded-full text-xs font-semibold bg-white text-slate-600 hover:bg-pink-50 border border-slate-200 transition-all';
      });
      e.currentTarget.className = 'filter-btn px-4 py-2 rounded-full text-xs font-semibold bg-pink-500 text-white shadow-sm transition-all';

      AppState.activeCategory = e.currentTarget.getAttribute('data-category');
      applyFilters();
    });
  });

  // Setup Modal Close Handlers
  const modalClose = document.getElementById('modal-close');
  const modalBackdrop = document.getElementById('article-modal');

  if (modalClose) modalClose.addEventListener('click', closeArticleModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeArticleModal();
    });
  }

  // Setup Donation Modal Backdrop Handler & Escape Key Close
  const donationModalBackdrop = document.getElementById('donationModal');
  if (donationModalBackdrop) {
    donationModalBackdrop.addEventListener('click', (e) => {
      if (e.target === donationModalBackdrop) closeDonationModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (document.getElementById('donationModal')?.classList.contains('hidden') === false) {
        closeDonationModal();
      }
      if (document.getElementById('article-modal')?.classList.contains('hidden') === false) {
        closeArticleModal();
      }
    }
  });

  // Like button interaction in modal
  const likeBtn = document.getElementById('btn-like');
  if (likeBtn) {
    likeBtn.addEventListener('click', () => {
      const countSpan = document.getElementById('like-count');
      if (countSpan) {
        let currentLikes = parseInt(countSpan.textContent, 10);
        countSpan.textContent = currentLikes + 1;
        likeBtn.classList.add('text-pink-600', 'bg-pink-100');
      }
    });
  }

  // Mobile drawer button & backdrop handlers
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawerClose = document.getElementById('mobile-drawer-close');
  const mobileBackdrop = document.getElementById('mobile-drawer-backdrop');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileDrawer);
  if (mobileDrawerClose) mobileDrawerClose.addEventListener('click', closeMobileDrawer);
  if (mobileBackdrop) mobileBackdrop.addEventListener('click', closeMobileDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeMobileDrawer);
  });

  // Join community notification demo buttons
  const handleJoinClick = () => {
    alert('¡Bienvenida a la Escuela Feminista! Gracias por ser parte de nuestra red de saberes y apoyo comunitario.');
    closeMobileDrawer();
  };

  const joinBtn = document.getElementById('btn-nueva-reflexion');
  const joinBtnMobile = document.getElementById('btn-nueva-reflexion-mobile');
  if (joinBtn) joinBtn.addEventListener('click', handleJoinClick);
  if (joinBtnMobile) joinBtnMobile.addEventListener('click', handleJoinClick);

  console.log("App initialisation complete.");
});

export { AppState, fetchPostsData, renderPostsGrid, formatDate, initCarousel };
