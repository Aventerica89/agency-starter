// VaporForge Inspector Overlay
// Injected in dev mode only. Enables click-to-edit in iframe.
(function() {
  // Only run inside iframe
  if (window === window.top) return;

  // Create overlay elements
  var hoverOverlay = document.createElement('div');
  hoverOverlay.id = 'vf-hover-overlay';
  Object.assign(hoverOverlay.style, {
    position: 'fixed',
    pointerEvents: 'none',
    border: '2px solid #3b82f6',
    borderRadius: '4px',
    zIndex: '99999',
    display: 'none',
    transition: 'all 0.15s ease',
  });

  var selectOverlay = document.createElement('div');
  selectOverlay.id = 'vf-select-overlay';
  Object.assign(selectOverlay.style, {
    position: 'fixed',
    pointerEvents: 'none',
    border: '2px solid #8b5cf6',
    borderRadius: '4px',
    zIndex: '99998',
    display: 'none',
    boxShadow: '0 0 0 4px rgba(139,92,246,0.2)',
  });

  var label = document.createElement('div');
  label.id = 'vf-label';
  Object.assign(label.style, {
    position: 'fixed',
    pointerEvents: 'none',
    background: '#3b82f6',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'system-ui, sans-serif',
    zIndex: '100000',
    display: 'none',
    whiteSpace: 'nowrap',
  });

  document.body.appendChild(hoverOverlay);
  document.body.appendChild(selectOverlay);
  document.body.appendChild(label);

  var selectedComponent = null;

  function findVfParent(el) {
    var node = el;
    while (node && node !== document.body) {
      if (node.hasAttribute && node.hasAttribute('data-vf-component')) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  function positionOverlay(overlay, rect) {
    Object.assign(overlay.style, {
      top: rect.top + 'px',
      left: rect.left + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      display: 'block',
    });
  }

  // Hover: show blue outline
  document.addEventListener('mousemove', function(e) {
    var comp = findVfParent(e.target);
    if (comp && comp !== selectedComponent) {
      var rect = comp.getBoundingClientRect();
      positionOverlay(hoverOverlay, rect);
      label.textContent = comp.getAttribute('data-vf-component');
      label.style.top = (rect.top - 24) + 'px';
      label.style.left = rect.left + 'px';
      label.style.display = 'block';
    } else if (!comp) {
      hoverOverlay.style.display = 'none';
      label.style.display = 'none';
    }
  });

  // Click: select component, post message to parent
  document.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    var comp = findVfParent(e.target);
    if (comp) {
      selectedComponent = comp;
      var rect = comp.getBoundingClientRect();
      positionOverlay(selectOverlay, rect);
      hoverOverlay.style.display = 'none';

      window.parent.postMessage({
        type: 'vf-select',
        component: comp.getAttribute('data-vf-component'),
        file: comp.getAttribute('data-vf-file'),
        boundingRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
      }, '*');
    } else {
      selectedComponent = null;
      selectOverlay.style.display = 'none';
      window.parent.postMessage({ type: 'vf-deselect' }, '*');
    }
  }, true);

  // Report component tree on load
  function reportTree() {
    var components = [];
    document.querySelectorAll('[data-vf-component]').forEach(function(el) {
      components.push({
        component: el.getAttribute('data-vf-component'),
        file: el.getAttribute('data-vf-file'),
      });
    });
    window.parent.postMessage({
      type: 'vf-tree',
      components: components,
    }, '*');
  }

  // Report on load and after HMR updates
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reportTree);
  } else {
    reportTree();
  }

  // Re-report after Astro HMR
  if (import.meta.hot) {
    import.meta.hot.on('astro:update', function() {
      setTimeout(reportTree, 500);
    });
  }
})();
