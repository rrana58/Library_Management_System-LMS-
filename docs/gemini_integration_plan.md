# Gemini AI Chatbot Integration Plan

This plan details the steps required to complete the chatbot system by integrating Google's Gemini AI. The current system uses a basic rule-based fallback, and we will replace it with a robust AI-powered assistant using the Gemini API key provided.

## User Review Required

> [!IMPORTANT]
> The Gemini API key will be added to `server/config/config.env`. Ensure this file is never committed to public version control.
> We will be installing the `@google/generative-ai` package in the server.

## Proposed Changes

### Backend

---

#### [MODIFY] [config.env](file:///c:/Users/Asus/OneDrive/Desktop/Library%20Management%20System/server/config/config.env)
- Add `GEMINI_API_KEY=AIzaSyDvLs0fkd9eLERHpjF-PI2ig9Tvc40bxAI`.

#### [MODIFY] [chatbotController.js](file:///c:/Users/Asus/OneDrive/Desktop/Library%20Management%20System/server/controllers/chatbotController.js)
- Import `GoogleGenerativeAI` from `@google/generative-ai`.
- Initialize Gemini AI with the API key from environment variables.
- Update `askChatbot` function to:
    - Use Gemini for generating responses.
    - Provide a system prompt to define the chatbot's personality as a library assistant.
    - (Optional) Include brief context about available books to improve recommendation quality.

### Dependencies

#### [NEW] Server Dependency
- Install `@google/generative-ai` in the `server` directory.

---

## Open Questions

- None at this time. The provided API key is valid for Gemini.

## Verification Plan

### Automated Tests
- Test the endpoint `/api/v1/chatbot/ask` using `curl` or a browser script to ensure it returns valid AI-generated responses.

### Manual Verification
- Navigate to the Chatbot page in the frontend dashboard.
- Send several queries (e.g., "What are the library hours?", "Can you recommend a book?") and verify the responses are AI-generated and relevant.
