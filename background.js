// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Listen for a click on the browser action
browserAPI.browserAction.onClicked.addListener((tab) => {
  // Execute the content script immediately in the current tab
  browserAPI.tabs.executeScript(tab.id, {
    file: 'content.js'
  }).catch((error) => {
    console.error('ImgBlock: Failed to execute content script:', error);
  });
});
