document.addEventListener("DOMContentLoaded", () => {
    const inputField = document.getElementById("api-key-input");
    const saveButton = document.getElementById("save-button");
    const statusMessage = document.getElementById("status");
  
    // Load existing API key
    chrome.storage.sync.get("geminiApiKey", (data) => {
      if (data.geminiApiKey) {
        inputField.value = data.geminiApiKey; // Populate input field with saved key
      }
    });
  
    // Save API key
    saveButton.addEventListener("click", () => {
      const apiKey = inputField.value.trim();
      if (apiKey) {
        chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
          statusMessage.textContent = "API key saved successfully!";
          setTimeout(() => (statusMessage.textContent = ""), 3000); // Clear status after 3 seconds
        });
      } else {
        statusMessage.textContent = "Please enter a valid API key.";
        setTimeout(() => (statusMessage.textContent = ""), 3000); // Clear status after 3 seconds
      }
    });
  });
  
