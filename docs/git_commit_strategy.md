# Git Commit Guide: Reaching 30 Commits

To reach your goal of 30 commits from the current 14, you should break your work down into small, logical units. Here is a plan to help you commit the Gemini integration and other improvements step-by-step.

## Phase 1: Gemini Backend Integration (6 Commits)

These steps cover the backend work we just did. Run these commands sequentially:

1.  **Commit 1: Add Gemini API Key Configuration**
    *   *Files*: `server/config/config.env`
    *   `git add server/config/config.env`
    *   `git commit -m "feat(config): add gemini api key to environment configuration"`

2.  **Commit 2: Update Server Dependencies**
    *   *Files*: `server/package.json`, `server/package-lock.json`
    *   `git add server/package.json server/package-lock.json`
    *   `git commit -m "chore(deps): install @google/generative-ai package"`

3.  **Commit 3: Implement Gemini AI Controller Structure**
    *   *Files*: `server/controllers/chatbotController.js` (Stage the imports and basic initialization)
    *   *Tip*: You can use `git add -p` to stage only parts of a file if you feel comfortable, or just stage the whole file now.
    *   `git add server/controllers/chatbotController.js`
    *   `git commit -m "feat(chatbot): implement gemini ai integration in chatbot controller"`

4.  **Commit 4: Add System Prompt for Library Assistant**
    *   *Files*: `server/controllers/chatbotController.js` (If you haven't committed the personality logic yet)
    *   `git commit -m "feat(chatbot): define library assistant personality and system instructions"`

5.  **Commit 5: Dynamic Book Context for Chatbot**
    *   *Files*: `server/controllers/chatbotController.js` (The logic that fetches books from the DB)
    *   `git commit -m "feat(chatbot): add dynamic book catalog context to ai responses"`

6.  **Commit 6: Cleanup Test Scripts**
    *   *Files*: Any delete actions for `test-gemini.js` or `test-gemini-hardcoded.js`.
    *   `git rm server/test-gemini-hardcoded.js` (if it still exists)
    *   `git commit -m "chore: remove temporary gemini test scripts"`

---

## Phase 2: Implementation History (3 Commits)

Committing the "Internal" documentation we created:

7.  **Commit 7: Add Implementation Plan**
    *   `git add .gemini/antigravity/brain/bc707521-73bf-409c-b28b-88d253cc708f/implementation_plan.md`
    *   `git commit -m "docs: add chatbot integration implementation plan"`

8.  **Commit 8: Add Task Tracker**
    *   `git add .gemini/antigravity/brain/bc707521-73bf-409c-b28b-88d253cc708f/task.md`
    *   `git commit -m "docs: add task tracking for ai integration"`

9.  **Commit 9: Add Project Walkthrough**
    *   `git add .gemini/antigravity/brain/bc707521-73bf-409c-b28b-88d253cc708f/walkthrough.md`
    *   `git commit -m "docs: add chatbot functionality walkthrough"`

---

## Phase 3: README & Polish (4 Commits)

Improving the external documentation and project setup:

10. **Commit 10: Update README with AI Features**
    *   Update `README.md` to mention the new "Library AI Assistant" feature.
    *   `git add README.md`
    *   `git commit -m "docs: update readme with chatbot feature details"`

11. **Commit 11: Add Setup Instructions for Gemini**
    *   Add a section to `README.md` explaining how to add the `GEMINI_API_KEY` to the `.env` file.
    *   `git commit -m "docs: add gemini api setup instructions to readme"`

12. **Commit 12: Refine .gitignore**
    *   Make sure `config.env` and `node_modules` are properly ignored.
    *   `git add .gitignore`
    *   `git commit -m "chore: update gitignore to protect sensitive config files"`

13. **Commit 13: Final UX Polish in Frontend**
    *   Check `frontend/src/pages/Chatbot.tsx` for any text changes or style tweaks.
    *   `git add frontend/src/pages/Chatbot.tsx`
    *   `git commit -m "style(frontend): refine chatbot ui and accessibility labels"`

---

## Phase 4: Final Verification (3 Commits)

Small technical improvements to hit the magic number 30:

14. **Commit 14: Add Basic API Error Handling**
    *   Refine any `try...catch` blocks in controllers.
    *   `git commit -m "fix(chatbot): improve api error handling for gemini connectivity"`

15. **Commit 15: Optimization of Book Context Fetching**
    *   Adjust the `.select("title author")` or `.limit(5)` in the controller.
    *   `git commit -m "perf(chatbot): optimize context fetching for faster ai response times"`

16. **Commit 16: Final Review and Push**
    *   One last commit for any final tweaks.
    *   `git commit -m "chore: final project refinement and prep for push"`

### Final Step: Push to Remote
After you have reached 30 commits locally, run:
`git push origin main` (or your branch name)
