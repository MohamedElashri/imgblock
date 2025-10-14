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
        // Save original src before blocking (for restore functionality)
        if (img.src && !img.hasAttribute('data-imgblock-blocked')) {
          img.setAttribute('data-imgblock-original-src', img.src);
        }
        if (img.srcset) {
          img.setAttribute('data-imgblock-original-srcset', img.srcset);
        }
        
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
        
        // Clear lazy loading attributes (save them first if they exist)
        if (img.dataset.src) {
          img.setAttribute('data-imgblock-original-data-src', img.dataset.src);
          img.dataset.src = '';
        }
        if (img.dataset.srcset) {
          img.setAttribute('data-imgblock-original-data-srcset', img.dataset.srcset);
          img.dataset.srcset = '';
        }
        if (img.getAttribute('data-lazy-src')) {
          img.setAttribute('data-imgblock-original-lazy-src', img.getAttribute('data-lazy-src'));
          img.setAttribute('data-lazy-src', '');
        }
        if (img.getAttribute('data-original')) {
          img.setAttribute('data-imgblock-original-data-original', img.getAttribute('data-original'));
          img.setAttribute('data-original', '');
        }
        
        // Mark as blocked
        img.setAttribute('data-imgblock-blocked', 'true');
      }
    } catch (error) {
      // Even on error, try basic blocking
      try {
        img.style.display = 'none';
        if (img.src) {
          img.setAttribute('data-imgblock-original-src', img.src);
        }
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
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
          
          // Save and clear all source elements within
          picture.querySelectorAll('source').forEach((source, index) => {
            if (source.srcset && !picture.hasAttribute('data-imgblock-picture-blocked')) {
              source.setAttribute(`data-imgblock-original-srcset`, source.srcset);
              if (source.media) {
                source.setAttribute(`data-imgblock-original-media`, source.media);
              }
            }
            source.srcset = '';
            source.media = 'not all';
          });
          
          // Block img within picture too
          picture.querySelectorAll('img').forEach(blockImage);
          
          // Mark picture as blocked
          picture.setAttribute('data-imgblock-picture-blocked', 'true');
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
    const videos = document.querySelectorAll('video[poster]');
    videos.forEach(video => {
      try {
        if (video.poster) {
          // Save original poster before removing
          video.setAttribute('data-imgblock-original-poster', video.poster);
          video.poster = '';
          video.setAttribute('data-imgblock-poster-blocked', 'true');
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
            // Save original background image before blocking
            if (!element.hasAttribute('data-imgblock-original-bg')) {
              element.setAttribute('data-imgblock-original-bg', style.backgroundImage);
            }
            element.style.setProperty('background-image', 'none', 'important');
            element.setAttribute('data-imgblock-bg-blocked', 'true');
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
  let observer = null;
  try {
    observer = new MutationObserver((mutations) => {
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
  
  // Function to restore all images
  function restoreImages() {
    try {
      // Remove immediate CSS blocker
      const immediateStyle = document.getElementById('imgblock-immediate');
      if (immediateStyle) {
        immediateStyle.remove();
      }
      
      // Restore all img elements
      const images = document.querySelectorAll('img[data-imgblock-blocked]');
      images.forEach(img => {
        try {
          // Clear inline styles
          img.style.display = '';
          img.style.visibility = '';
          img.style.opacity = '';
          img.style.width = '';
          img.style.height = '';
          img.style.maxWidth = '';
          img.style.maxHeight = '';
          
          // Restore original src
          const originalSrc = img.getAttribute('data-imgblock-original-src');
          if (originalSrc) {
            img.src = originalSrc;
            img.removeAttribute('data-imgblock-original-src');
          }
          
          // Restore original srcset
          const originalSrcset = img.getAttribute('data-imgblock-original-srcset');
          if (originalSrcset) {
            img.srcset = originalSrcset;
            img.removeAttribute('data-imgblock-original-srcset');
          }
          
          // Restore lazy loading attributes
          const originalDataSrc = img.getAttribute('data-imgblock-original-data-src');
          if (originalDataSrc) {
            img.dataset.src = originalDataSrc;
            img.removeAttribute('data-imgblock-original-data-src');
          }
          
          const originalDataSrcset = img.getAttribute('data-imgblock-original-data-srcset');
          if (originalDataSrcset) {
            img.dataset.srcset = originalDataSrcset;
            img.removeAttribute('data-imgblock-original-data-srcset');
          }
          
          const originalLazySrc = img.getAttribute('data-imgblock-original-lazy-src');
          if (originalLazySrc) {
            img.setAttribute('data-lazy-src', originalLazySrc);
            img.removeAttribute('data-imgblock-original-lazy-src');
          }
          
          const originalDataOriginal = img.getAttribute('data-imgblock-original-data-original');
          if (originalDataOriginal) {
            img.setAttribute('data-original', originalDataOriginal);
            img.removeAttribute('data-imgblock-original-data-original');
          }
          
          // Remove blocked marker
          img.removeAttribute('data-imgblock-blocked');
        } catch (error) {
          // Silently fail for individual elements
        }
      });
      
      // Restore picture elements
      const pictures = document.querySelectorAll('picture[data-imgblock-picture-blocked]');
      pictures.forEach(picture => {
        try {
          picture.style.display = '';
          picture.style.visibility = '';
          picture.style.opacity = '';
          
          // Restore source elements
          picture.querySelectorAll('source').forEach((source) => {
            const originalSrcset = source.getAttribute('data-imgblock-original-srcset');
            if (originalSrcset) {
              source.srcset = originalSrcset;
              source.removeAttribute('data-imgblock-original-srcset');
            }
            
            const originalMedia = source.getAttribute('data-imgblock-original-media');
            if (originalMedia) {
              source.media = originalMedia;
              source.removeAttribute('data-imgblock-original-media');
            } else {
              source.removeAttribute('media');
            }
          });
          
          picture.removeAttribute('data-imgblock-picture-blocked');
        } catch (error) {
          // Silently fail
        }
      });
      
      // Restore SVG elements
      const svgs = document.querySelectorAll('svg');
      svgs.forEach(svg => {
        try {
          svg.style.display = '';
          svg.style.visibility = '';
          svg.style.opacity = '';
        } catch (error) {
          // Silently fail
        }
      });
      
      // Restore video posters
      const videos = document.querySelectorAll('video[data-imgblock-poster-blocked]');
      videos.forEach(video => {
        try {
          const originalPoster = video.getAttribute('data-imgblock-original-poster');
          if (originalPoster) {
            video.poster = originalPoster;
            video.removeAttribute('data-imgblock-original-poster');
          }
          video.removeAttribute('data-imgblock-poster-blocked');
        } catch (error) {
          // Silently fail
        }
      });
      
      // Restore background images
      const elementsWithBg = document.querySelectorAll('[data-imgblock-bg-blocked]');
      elementsWithBg.forEach(element => {
        try {
          const originalBg = element.getAttribute('data-imgblock-original-bg');
          if (originalBg) {
            element.style.backgroundImage = originalBg;
            element.removeAttribute('data-imgblock-original-bg');
          } else {
            element.style.backgroundImage = '';
          }
          element.removeAttribute('data-imgblock-bg-blocked');
        } catch (error) {
          // Silently fail
        }
      });
      
      // Disconnect mutation observer
      if (observer) {
        observer.disconnect();
      }
      
      // Mark as no longer executed
      window.imgBlockExecuted = false;
      
      return { success: true };
    } catch (error) {
      console.error('ImgBlock: Error restoring images:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Listen for restore message from popup
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'restore') {
      const result = restoreImages();
      sendResponse(result);
    }
  });
})();
