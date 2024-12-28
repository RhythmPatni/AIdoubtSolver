// Element References
const targetNode = document.body;
const config = { childList: true, subtree: true, characterData: true };

let geminiApiKey = null;

// Fetch the API key from Chrome storage
chrome.storage.sync.get("geminiApiKey", (data) => {
  if (data.geminiApiKey) {
    geminiApiKey = data.geminiApiKey;
    console.log("Gemini API key loaded:", geminiApiKey);
  } else {
    console.warn("Gemini API key not found. Please configure it in the extension popup.");
  }
});


console.log(geminiApiKey);
// Use the geminiApiKey variable in the fetch calls




// Extract Problem ID from URL
function getProblemKey() {
  const url = new URL(window.location.href);
  const pathname = url.pathname;
  const parts = pathname.split('/'); // Split the path by '/'
  const problemIndex = parts.indexOf('problems'); // Find the index of "problems"
  
  if (problemIndex !== -1 && problemIndex + 1 < parts.length) {
    return parts[problemIndex + 1]; // Return the part after "problems"
  }

  return null; // Return null if "problems" is not found or there's no part after it
}


let currentProblemKey = getProblemKey();
let chatContainer = null;

// Function to add the AI Help button
function addAIhelpButton() {
  console.log("Change detected.");
  const targetElement = document.getElementsByClassName("coding_desc_container__gdB9M")[0];

  if (targetElement && !document.getElementById("ai-help-button")) {
    const AIhelpButton = document.createElement("button");
    AIhelpButton.id = "ai-help-button";
    AIhelpButton.textContent = "AI Help";
    AIhelpButton.style.marginTop = "10px";
    AIhelpButton.style.backgroundColor = "rgb(5, 43, 60)";
    AIhelpButton.style.color = "white";
    AIhelpButton.style.border = "none";
    AIhelpButton.style.padding = "10px 20px";
    AIhelpButton.style.borderRadius = "5px";
    AIhelpButton.style.cursor = "pointer";
    AIhelpButton.style.fontSize = "16px";

    AIhelpButton.addEventListener("click", () => {
      const newProblemKey = getProblemKey();
      if (currentProblemKey !== newProblemKey) {
        currentProblemKey = newProblemKey;
        if (chatContainer) {
          chatContainer.remove();
          chatContainer = null;
        }
      }
      if(chatContainer){
        chatContainer.remove();
        chatContainer = null;
      }
      createChatUI();
    });
    targetElement.appendChild(AIhelpButton);
    console.log("AI Help button added.");
  }
}

// Function to create the chat interface
function createChatUI() {
  if (chatContainer){
    console.log("Chat container already exists.");
    chatContainer.remove();
  } // Prevent duplicate chat UIs

  const parentContainer = document.getElementsByClassName("coding_desc_container__gdB9M")[0];

  // Chat Container
  chatContainer = document.createElement("div");
  chatContainer.id = "chat-container";
  chatContainer.style = `
    width: 100%; max-width: 400px; height: 500px;
    border: 2px solid rgb(5, 43, 60); border-radius: 10px;
    overflow: hidden; display: flex; flex-direction: column;
    background-color: #f8f9fa; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
  `;

  // Chat Header
  const chatHeader = document.createElement("div");
  chatHeader.textContent = "AI Chat Bot";
  chatHeader.style = `
    background-color:rgb(5, 43, 60); color: white; padding: 10px;
    font-weight: bold; text-align: center; position: relative;
  `;

  // Close Button
  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.style = `
    position: absolute; top: 5px; right: 10px;
    background: none; border: none; color: white;
    font-size: 20px; cursor: pointer;
  `;
  closeButton.addEventListener("click", () => {
    chatContainer.remove();
    chatContainer = null;
  });
  chatHeader.appendChild(closeButton);

  // Chat Area
  const chatArea = document.createElement("div");
  chatArea.id = "chat-area";
  chatArea.style = `
    flex: 1; padding: 10px; overflow-y: auto; color: #333;
  `;

  

  // Load stored chats
  console.log(currentProblemKey);
  if (currentProblemKey) {
    chrome.storage.local.get(currentProblemKey, (data) => {
      const chats = data[currentProblemKey] || [];
      console.log("Loaded chats:", chats); // Debug log
      chats.forEach((chat) => {
        if (chat.sender && chat.message && chat.type) {
          addMessage(chat.sender, chat.message, chat.type);
        } else {
          console.warn("Invalid chat structure:", chat); // Warn if structure is invalid
        }
      });
    });
  }
  

  // Input Container
  const inputContainer = document.createElement("div");
  inputContainer.style = `
    display: flex; padding: 10px; border-top: 1px solid #ddd;
  `;

  const inputField = document.createElement("input");
  inputField.type = "text";
  inputField.id = "chat-input";
  inputField.placeholder = "Type your message...";
  inputField.style = `
    flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px;
  `;

  const sendButton = document.createElement("button");
  sendButton.textContent = "Send";
  sendButton.style = `
    margin-left: 10px; background-color: rgb(5, 43, 60); color: white;
    border: none; padding: 10px 20px; border-radius: 5px;
    cursor: pointer; font-size: 14px;
  `;

  // Event Listener for Sending Messages
  sendButton.addEventListener("click", async () => {
    const userMessage = inputField.value.trim();
    if (userMessage) {
      addMessage("You", userMessage, "user");
      inputField.value = "";

      // Add AI Placeholder Response
      addMessage("AI", "Thinking...", "ai");

      try {
        const response = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiApiKey,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: userMessage },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.candidates[0].content.parts[0].text;
          updateLastMessage(aiResponse, "ai");

          // Store chats
          saveChat({ sender: "You", message: userMessage, type: "user" });
          setTimeout(() => {
            console.log("Waited for 500ms");
          },500);
          saveChat({ sender: "AI", message: aiResponse, type: "ai" });
        } else {
          updateLastMessage("Error: Unable to get a response from the AI.", "ai");
        }
      } catch (error) {
        console.error("Error:", error);
        updateLastMessage("Error: Failed to connect to the server.", "ai");
      }
    }
  });

  // Assemble UI Components
  inputContainer.appendChild(inputField);
  inputContainer.appendChild(sendButton);
  chatContainer.appendChild(chatHeader);
  chatContainer.appendChild(chatArea);
  chatContainer.appendChild(inputContainer);
  parentContainer.appendChild(chatContainer);
}

// Utility Functions
function addMessage(sender, message, type) {
  const chatArea = document.getElementById("chat-area");
  if (!chatArea) return;

  const messageElement = document.createElement("div");
  messageElement.textContent = `${sender}: ${message}`;
  messageElement.style = `
    margin: 5px 0; padding: 10px; border-radius: 5px;
    background-color: ${type === "user" ? "#d1ecf1" : "#e2e3e5"};
    color: ${type === "user" ? "#0c5460" : "#383d41"};
    align-self: ${type === "user" ? "flex-end" : "flex-start"};
    max-width: 80%; word-wrap: break-word;
  `;
  chatArea.appendChild(messageElement);
  chatArea.scrollTop = chatArea.scrollHeight;
}


function updateLastMessage(message, type) {
  const chatArea = document.getElementById("chat-area");
  const messages = Array.from(chatArea.children).filter((msg) =>
    msg.textContent.includes(type === "user" ? "You" : "AI")
  );
  const lastMessage = messages[messages.length - 1];
  if (lastMessage) {
    lastMessage.textContent = `${type === "user" ? "You" : "AI"}: ${message}`;
  }
}

function saveChat(chat) {
  if (!currentProblemKey) return;
  console.log("Saving");
  console.log(chat)
  chrome.storage.local.get(currentProblemKey, (data) => {
    const chats = data[currentProblemKey];
    chats.push({
      sender: chat.sender,
      message: chat.message,
      type: chat.type, // Ensure type is included
    });
    chrome.storage.local.set({ [currentProblemKey]: chats });
    console.log("---");
    console.log(chats);
  });
}


// Monitor URL Changes
let lastUrl = window.location.href;
setInterval(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    currentProblemKey = getProblemKey();
    if (chatContainer) {
      chatContainer.remove();
      chatContainer = null;
    }
  }
}, 1000);

// Mutation Observer
const observer = new MutationObserver(addAIhelpButton);
observer.observe(targetNode, config);
