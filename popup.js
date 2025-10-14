// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const blockBtn = document.getElementById('blockBtn');
const restoreBtn = document.getElementById('restoreBtn');
const status = document.getElementById('status');

// Get current tab and check its state
browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  
  // Check if this tab already has images blocked
  browserAPI.storage.local.get([`blocked_${currentTab.id}`], (result) => {
    const isBlocked = result[`blocked_${currentTab.id}`] || false;
    
    // Update button states
    blockBtn.disabled = isBlocked;
    restoreBtn.disabled = !isBlocked;
  });
});

// Block images button
blockBtn.addEventListener('click', () => {
  showStatus('Blocking images...', 'success');
  
  browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    
    // Execute content script to block images
    browserAPI.tabs.executeScript(currentTab.id, {
      file: 'content.js'
    }).then(() => {
      // Mark this tab as blocked
      browserAPI.storage.local.set({ [`blocked_${currentTab.id}`]: true });
      
      showStatus('Images blocked!', 'success');
      blockBtn.disabled = true;
      restoreBtn.disabled = false;
      
      // Hide status after 2 seconds
      setTimeout(() => hideStatus(), 2000);
    }).catch((error) => {
      showStatus('Error: ' + error.message, 'error');
      console.error('ImgBlock: Failed to execute content script:', error);
    });
  });
});

// Restore images button
restoreBtn.addEventListener('click', () => {
  showStatus('Restoring images...', 'success');
  
  browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    
    // Send message to content script to restore images
    browserAPI.tabs.sendMessage(currentTab.id, { action: 'restore' }, (response) => {
      if (browserAPI.runtime.lastError) {
        // Content script not loaded, just update state
        browserAPI.storage.local.remove(`blocked_${currentTab.id}`);
        showStatus('Please reload the page', 'error');
        return;
      }
      
      // Mark this tab as not blocked
      browserAPI.storage.local.remove(`blocked_${currentTab.id}`);
      
      showStatus('Images restored!', 'success');
      blockBtn.disabled = false;
      restoreBtn.disabled = true;
      
      // Hide status after 2 seconds
      setTimeout(() => hideStatus(), 2000);
    });
  });
});

function showStatus(message, type) {
  status.textContent = message;
  status.className = type;
}

function hideStatus() {
  status.style.display = 'none';
}

// Clean up storage when tabs are closed
browserAPI.tabs.onRemoved.addListener((tabId) => {
  browserAPI.storage.local.remove(`blocked_${tabId}`);
});
