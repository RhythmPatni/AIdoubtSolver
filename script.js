const aiHelpBtn = document.getElementById('aiHelpBtn');
const chatInterface = document.getElementById('chatInterface');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

const geminiApiKey = 'AIzaSyBi4WgbgA7Nf7CiVpPTEZRVlYG_DEn2Q1Q'; // Replace with your actual Gemini API key

// Show the chat interface when the button is clicked
aiHelpBtn.addEventListener('click', () => {
  chatInterface.style.display = 'flex';
});

// Function to handle sending the message to the Gemini API
sendBtn.addEventListener('click', async () => {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  // Add user message to the chat
  addMessage('You', userMessage, 'user');
  chatInput.value = '';

  // Add AI placeholder response
  addMessage('AI', 'Thinking...', 'ai');

  try {
    // Make a POST request to the Gemini API
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + geminiApiKey,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: userMessage,
                },
              ],
            },
          ],
        }),
      }
    );

    // Parse the API response
    if (response.ok) {
      const data = await response.json();
      console.log(data)
      const aiResponse = data.candidates[0].content.parts[0].text;
      updateLastMessage(aiResponse, 'ai');
    } else {
      updateLastMessage('Error: Unable to get a response from the AI.', 'ai');
    }
  } catch (error) {
    console.error('Error communicating with the Gemini API:', error);
    updateLastMessage('Error: Failed to connect to the server.', 'ai');
  }
});

// Function to add messages to the chat
function addMessage(sender, message, type) {
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.classList.add('message', type);
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to update the last message (useful for AI responses)
function updateLastMessage(message, type) {
  const messages = chatMessages.querySelectorAll(`.message.${type}`);
  const lastMessage = messages[messages.length - 1];
  if (lastMessage) {
    lastMessage.textContent = message;
  }
}