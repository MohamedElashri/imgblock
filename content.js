(function() {
  'use strict';
  
  // Prevent multiple executions
  if (window.imgBlockExecuted) {
    return;
  }
  window.imgBlockExecuted = true;
  
  // IMMEDIATE CSS injection to block images before JavaScript processing
  try {
    const immediateStyle = document.createElement('style');
    immediateStyle.id = 'imgblock-immediate';
    immediateStyle.textContent = `
      img:not([class*="icon"]):not([class*="logo"]):not([class*="favicon"]):not([id*="icon"]):not([id*="logo"]) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      picture:not([class*="icon"]):not([class*="logo"]) {
        display: none !important;
        visibility: hidden !important;
      }
    `;
    (document.head || document.documentElement).appendChild(immediateStyle);
  } catch (error) {
    console.error('ImgBlock: Error injecting immediate CSS:', error);
  }
  
  // Function to check if an element is likely an icon
  function isIcon(element) {
    try {
      if (!element) return false;
      
      // Check common icon indicators in classes and IDs
      const classStr = element.className?.toString() || '';
      const idStr = element.id || '';
      const iconKeywords = ['icon', 'logo', 'favicon', 'avatar', 'emoji', 'symbol'];
      
      const hasIconKeyword = iconKeywords.some(keyword => 
        classStr.toLowerCase().includes(keyword) || 
        idStr.toLowerCase().includes(keyword)
      );
      
      if (hasIconKeyword) {
        // Double check dimensions for keyword matches
        if (element.tagName === 'IMG') {
          const width = Math.max(element.naturalWidth || 0, element.width || 0, element.offsetWidth || 0);
          const height = Math.max(element.naturalHeight || 0, element.height || 0, element.offsetHeight || 0);
          // Only treat as icon if it has keyword AND small size (not 0)
          if (width > 0 && height > 0 && width <= 32 && height <= 32) return true;
        } else {
          return true; // Non-img elements with icon keywords are likely icons
        }
      }
      
      // For img elements without keywords, check dimensions strictly
      if (element.tagName === 'IMG') {
        const width = Math.max(element.naturalWidth || 0, element.width || 0, element.offsetWidth || 0);
        const height = Math.max(element.naturalHeight || 0, element.height || 0, element.offsetHeight || 0);
        
        // Only treat as icon if dimensions are small AND not zero
        if (width > 0 && height > 0 && width <= 24 && height <= 24) return true;
      }
      
      return false;
    } catch (error) {
      return false; // On error, assume not an icon (will be removed)
    }
  }
  
  // Function to aggressively block an image element
  function blockImage(img) {
    try {
      if (!isIcon(img)) {
        // Multiple blocking strategies for maximum effectiveness
        img.style.display = 'none !important';
        img.style.visibility = 'hidden !important';
        img.style.opacity = '0 !important';
        img.style.width = '0px !important';
        img.style.height = '0px !important';
        img.style.maxWidth = '0px !important';
        img.style.maxHeight = '0px !important';
        
        // Clear all sources
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        img.srcset = '';
        
        // Clear lazy loading attributes
        if (img.dataset.src) img.dataset.src = '';
        if (img.dataset.srcset) img.dataset.srcset = '';
        if (img.getAttribute('data-lazy-src')) img.setAttribute('data-lazy-src', '');
        if (img.getAttribute('data-original')) img.setAttribute('data-original', '');
        
        // Mark as blocked
        img.setAttribute('data-imgblock-blocked', 'true');
      }
    } catch (error) {
      // Even on error, try basic blocking
      try {
        img.style.display = 'none';
        img.src = '';
      } catch (e) {
        // Complete failure, skip this element
      }
    }
  }
  
  // Block all <img> elements
  try {
    const images = document.querySelectorAll('img');
    images.forEach(blockImage);
  } catch (error) {
    console.error('ImgBlock: Error blocking images:', error);
  }
  
  // Block <picture> elements
  try {
    const pictures = document.querySelectorAll('picture');
    pictures.forEach(picture => {
      try {
        if (!isIcon(picture)) {
          picture.style.display = 'none !important';
          picture.style.visibility = 'hidden !important';
          picture.style.opacity = '0 !important';
          
          // Clear all source elements within
          picture.querySelectorAll('source').forEach(source => {
            source.srcset = '';
            source.media = 'not all';
          });
          
          // Block img within picture too
          picture.querySelectorAll('img').forEach(blockImage);
        }
      } catch (error) {
        // Even on error, try basic blocking
        try {
          picture.style.display = 'none';
        } catch (e) {}
      }
    });
  } catch (error) {
    console.error('ImgBlock: Error blocking pictures:', error);
  }
  
  // Block video posters
  try {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      try {
        if (video.poster) {
          video.poster = '';
          video.removeAttribute('poster');
        }
      } catch (error) {
        // Silently fail for individual elements
      }
    });
  } catch (error) {
    console.error('ImgBlock: Error blocking video posters:', error);
  }
  
  // Block SVG images
  try {
    const svgs = document.querySelectorAll('svg');
    svgs.forEach(svg => {
      try {
        if (!isIcon(svg)) {
          // Check if SVG is large enough to be considered an image
          const rect = svg.getBoundingClientRect();
          const width = svg.width?.baseVal?.value || rect.width || 0;
          const height = svg.height?.baseVal?.value || rect.height || 0;
          
          // Block larger SVGs more aggressively
          if (width > 32 || height > 32) {
            svg.style.display = 'none !important';
            svg.style.visibility = 'hidden !important';
            svg.style.opacity = '0 !important';
          }
        }
      } catch (error) {
        // Silently fail for individual elements
      }
    });
  } catch (error) {
    console.error('ImgBlock: Error blocking SVGs:', error);
  }
  
  // Block background images (element-by-element for precision)
  try {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );
    
    const elementsToProcess = [];
    let node;
    while (node = walker.nextNode()) {
      elementsToProcess.push(node);
    }
    
    elementsToProcess.forEach(element => {
      try {
        const style = window.getComputedStyle(element);
        
        if (style.backgroundImage && style.backgroundImage !== 'none') {
          const isUIElement = 
            element.tagName === 'BUTTON' || 
            element.tagName === 'INPUT' ||
            element.tagName === 'A' ||
            element.getAttribute('role') === 'button' ||
            isIcon(element);
          
          if (!isUIElement) {
            element.style.setProperty('background-image', 'none', 'important');
          }
        }
      } catch (error) {
        // Silently fail for individual elements
      }
    });
  } catch (error) {
    console.error('ImgBlock: Error blocking background images:', error);
  }
  
  // Block object and embed tags that might contain images
  try {
    const objects = document.querySelectorAll('object, embed');
    objects.forEach(obj => {
      try {
        const type = obj.type || '';
        if (type.includes('image')) {
          obj.style.display = 'none !important';
          obj.style.visibility = 'hidden !important';
          obj.data = '';
          if (obj.src) obj.src = '';
        }
      } catch (error) {
        // Silently fail for individual elements
      }
    });
  } catch (error) {
    console.error('ImgBlock: Error blocking objects/embeds:', error);
  }
  
  // Watch for dynamically added images
  try {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            try {
              // Check if the node itself is an image
              if (node.tagName === 'IMG') {
                blockImage(node);
              }
              // Check for images within the node
              if (node.querySelectorAll) {
                node.querySelectorAll('img').forEach(blockImage);
                node.querySelectorAll('picture').forEach(pic => {
                  pic.style.display = 'none !important';
                });
              }
            } catch (error) {
              // Silently fail for individual nodes
            }
          }
        });
        
        // Also watch for attribute changes that might re-enable images
        if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
          const img = mutation.target;
          if (!img.hasAttribute('data-imgblock-blocked')) {
            blockImage(img);
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset', 'style']
    });
  } catch (error) {
    console.error('ImgBlock: Error setting up mutation observer:', error);
  }
})();
