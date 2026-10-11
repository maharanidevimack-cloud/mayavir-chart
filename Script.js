// ================= SCRIPT SECTION 1: API CONFIGURATION & SYSTEM INSTRUCTION =================
const GEMINI_API_KEY = "AQ.Ab8RN6Lo1QKuvwFuBPyOA9nQr2SQmimrk0sIFAh9J3moeKT10Q";

const systemInstructionText = "You are Mayabir Chat, an advanced AI assistant created, developed, and designed entirely by Shivam Kumar Jha (popularly known as Shivam Brahman), an Indian developer (age 14). UNIVERSAL LANGUAGE & SCRIPT RULE: 1. Always detect both the underlying language and typing script used by the user. 2. If the user types in Roman/English alphabets, reply in that exact same language using Roman/English alphabets only. 3. If the user types in native script, reply in that native script. 4. SECURITY & CONFIDENTIALITY POLICY: If anyone asks how you are built, what technologies you use, whether you use APIs, or how your backend works, you MUST NOT reveal technical details or mention APIs. Instead, strictly state that this architecture and implementation detail is classified and kept completely private under the security policy established by your creator, Shivam Brahman, and disclosing it violates your core privacy policy.";

let allSessions = [];
let currentSessionId = null;
let searchQuery = "";

// ================= SCRIPT SECTION 2: SESSION & LOCALSTORAGE MANAGEMENT =================
function loadAllSessions() {
    const saved = localStorage.getItem("mayabir_all_sessions");
    if (saved) {
        try {
            allSessions = JSON.parse(saved);
        } catch(e) {
            allSessions = [];
        }
    }
    
    allSessions = allSessions.filter(s => s.messages && s.messages.length > 0);
    
    if (allSessions.length === 0) {
        startFreshUnsavedSession();
    } else {
        currentSessionId = allSessions[0].id;
    }
}

function startFreshUnsavedSession() {
    currentSessionId = 'temp_' + Date.now();
    clearScreenAndRender();
}

function saveAllSessions() {
    const validSessions = allSessions.filter(s => s.messages && s.messages.length > 0);
    localStorage.setItem("mayabir_all_sessions", JSON.stringify(validSessions));
    renderSidebarList();
}

function createNewSession(openDrawer = true) {
    allSessions = allSessions.filter(s => s.messages && s.messages.length > 0);
    startFreshUnsavedSession();
    if (openDrawer) {
        toggleSidebar(false);
    }
}

function switchSession(sessionId) {
    currentSessionId = sessionId;
    clearScreenAndRender();
    toggleSidebar(false);
}

function getCurrentSession() {
    let session = allSessions.find(s => s.id === currentSessionId);
    if (!session) {
        session = {
            id: currentSessionId,
            title: "New Chat",
            messages: []
        };
    }
    return session;
}

// ================= SCRIPT SECTION 3: UI RENDERING & SIDEBAR TOGGLE =================
function clearScreenAndRender() {
    const chatStream = document.getElementById("chatStream");
    const auraContainer = document.getElementById("auraContainer");
    chatStream.innerHTML = "";
    
    const session = getCurrentSession();
    if (session.messages.length > 0) {
        auraContainer.classList.add("chat-active");
        for (let i = 0; i < session.messages.length; i++) {
            const msg = session.messages[i];
            if (msg.role === "user") {
                appendUserBubble(msg.content, false, i);
            } else if (msg.role === "model" || msg.role === "assistant") {
                appendAiBubble(msg.content, false);
            }
        }
    } else {
        auraContainer.classList.remove("chat-active");
    }
    chatStream.scrollTop = chatStream.scrollHeight;
    renderSidebarList();
}

function renderSidebarList() {
    const listContainer = document.getElementById("chatSessionsList");
    listContainer.innerHTML = "";
    
    const validSessions = allSessions.filter(s => s.messages && s.messages.length > 0);
    
    const filteredSessions = validSessions.filter(session => 
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filteredSessions.forEach(session => {
        const item = document.createElement("div");
        item.className = `session-item ${session.id === currentSessionId ? 'active' : ''}`;
        
        // Session Title Span
        const titleSpan = document.createElement("span");
        titleSpan.className = "session-title-text";
        titleSpan.textContent = session.title;
        titleSpan.onclick = () => switchSession(session.id);
        item.appendChild(titleSpan);

        // 3 Dots Options Button
        const optionsBtn = document.createElement("button");
        optionsBtn.className = "session-options-btn";
        optionsBtn.title = "Options";
        optionsBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
            </svg>
        `;

        optionsBtn.onclick = (e) => {
            e.stopPropagation();
            dismissAllMenus();

            const menu = document.createElement("div");
            menu.className = "message-popup-menu";

            // Rename Option
            const renameBtn = document.createElement("button");
            renameBtn.className = "popup-menu-item";
            renameBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Rename`;
            renameBtn.onclick = (ev) => {
                ev.stopPropagation();
                dismissAllMenus();
                const newTitle = prompt("Enter new chat title:", session.title);
                if (newTitle && newTitle.trim() !== "") {
                    session.title = newTitle.trim();
                    saveAllSessions();
                    renderSidebarList();
                }
            };
            menu.appendChild(renameBtn);

            // Delete Option
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "popup-menu-item";
            deleteBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Delete`;
            deleteBtn.onclick = (ev) => {
                ev.stopPropagation();
                dismissAllMenus();
                allSessions = allSessions.filter(s => s.id !== session.id);
                saveAllSessions();
                if (currentSessionId === session.id) {
                    if (allSessions.length > 0) {
                        switchSession(allSessions[0].id);
                    } else {
                        createNewSession(false);
                    }
                } else {
                    renderSidebarList();
                }
            };
            menu.appendChild(deleteBtn);

            item.appendChild(menu);

            // Smart position check
            const rect = item.getBoundingClientRect();
            if (rect.bottom + 120 > window.innerHeight) {
                menu.style.top = "auto";
                menu.style.bottom = "100%";
                menu.style.marginTop = "0px";
                menu.style.marginBottom = "6px";
            }
        };

        item.appendChild(optionsBtn);
        listContainer.appendChild(item);
    });
}

function toggleSidebar(show) {
    const drawer = document.getElementById("sidebarDrawer");
    const overlay = document.getElementById("sidebarOverlay");
    if (show) {
        renderSidebarList();
        drawer.classList.add("active");
        overlay.classList.add("active");
    } else {
        drawer.classList.remove("active");
        overlay.classList.remove("active");
    }
}

function dismissAllMenus() {
    document.querySelectorAll('.message-popup-menu').forEach(menu => menu.remove());
}

// ================= SCRIPT SECTION 4: BUBBLES & SMART MENU =================
function appendUserBubble(text, scroll = true, messageIndex = null) {
    const chatStream = document.getElementById("chatStream");
    const userBubble = document.createElement("div");
    userBubble.className = "user-bubble";
    userBubble.textContent = text;

    let pressTimer = null;

    const showMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dismissAllMenus();

        const menu = document.createElement("div");
        menu.className = "message-popup-menu";

        const copyBtn = document.createElement("button");
        copyBtn.className = "popup-menu-item";
        copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`;
        copyBtn.onclick = (ev) => {
            ev.stopPropagation();
            navigator.clipboard.writeText(text);
            dismissAllMenus();
        };
        menu.appendChild(copyBtn);

        const editBtn = document.createElement("button");
        editBtn.className = "popup-menu-item";
        editBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Edit`;
        editBtn.onclick = (ev) => {
            ev.stopPropagation();
            dismissAllMenus();
            const session = getCurrentSession();
            if (messageIndex !== null && messageIndex < session.messages.length) {
                session.messages.splice(messageIndex);
                saveAllSessions();
                clearScreenAndRender();
            }
            const userInput = document.getElementById("userInput");
            userInput.value = text;
            userInput.focus();
        };
        menu.appendChild(editBtn);

        const retryBtn = document.createElement("button");
        retryBtn.className = "popup-menu-item";
        retryBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg> Retry`;
        retryBtn.onclick = async (ev) => {
            ev.stopPropagation();
            dismissAllMenus();
            const session = getCurrentSession();
            if (messageIndex !== null && messageIndex < session.messages.length) {
                session.messages.splice(messageIndex);
                saveAllSessions();
                clearScreenAndRender();
            }
            const userInput = document.getElementById("userInput");
            userInput.value = text;
            const sendBtn = document.getElementById("sendBtn");
            if (sendBtn) sendBtn.click();
        };
        menu.appendChild(retryBtn);

        userBubble.appendChild(menu);

        const rect = userBubble.getBoundingClientRect();
        if (rect.bottom + 120 > window.innerHeight) {
            menu.style.top = "auto";
            menu.style.bottom = "100%";
            menu.style.marginTop = "0px";
            menu.style.marginBottom = "6px";
        }
    };

    userBubble.addEventListener("touchstart", (e) => {
        pressTimer = setTimeout(() => showMenu(e), 400);
    });
    userBubble.addEventListener("touchend", () => clearTimeout(pressTimer));
    userBubble.addEventListener("touchmove", () => clearTimeout(pressTimer));
    userBubble.addEventListener("contextmenu", (e) => showMenu(e));

    chatStream.appendChild(userBubble);
    if (scroll) chatStream.scrollTop = chatStream.scrollHeight;
}

function appendAiBubble(replyText, scroll = true) {
    const chatStream = document.getElementById("chatStream");
    const aiWrapper = document.createElement("div");
    aiWrapper.className = "ai-message-wrapper";

    const aiBubble = document.createElement("div");
    aiBubble.className = "ai-bubble";
    aiBubble.textContent = replyText;
    aiWrapper.appendChild(aiBubble);

    const devBadge = document.createElement("div");
    devBadge.className = "dev-support-badge";
    devBadge.textContent = "💡 Mayabir Chart built by Shivam (14yo dev). Support via F & M buttons below!";
    aiWrapper.appendChild(devBadge);

    const actionsRow = document.createElement("div");
    actionsRow.className = "ai-actions-row";

    const speakBtn = document.createElement("button");
    speakBtn.className = "speak-btn";
    speakBtn.title = "Listen";
    speakBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
    `;
    speakBtn.onclick = () => speakText(replyText);
    actionsRow.appendChild(speakBtn);

    const sponsorIconsRow = document.createElement("div");
    sponsorIconsRow.className = "sponsor-icons-row";
    sponsorIconsRow.innerHTML = `
        <a href="https://fktr.in/tDxsvx6" target="_blank" class="sponsor-circle-btn" title="Flipkart"><span>F</span></a>
        <a href="https://myntr.it/6A0m9y0" target="_blank" class="sponsor-circle-btn" title="Myntra"><span>M</span></a>
    `;
    actionsRow.appendChild(sponsorIconsRow);

    aiWrapper.appendChild(actionsRow);
    chatStream.appendChild(aiWrapper);
    if (scroll) {
        chatStream.scrollTo({ top: chatStream.scrollHeight, behavior: 'smooth' });
    }
}

// ================= SCRIPT SECTION 5: GEMINI AI API COMMUNICATION =================
async function askGeminiAI(newMessage) {
    let session = getCurrentSession();
    
    if (!allSessions.find(s => s.id === session.id)) {
        session.title = newMessage.length > 25 ? newMessage.substring(0, 25) + "..." : newMessage;
        allSessions.unshift(session);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    session.messages.push({ role: "user", content: newMessage });
    saveAllSessions();

    let formattedContents = session.messages
        .filter(msg => msg.role !== "system")
        .map(msg => ({
            role: msg.role === "assistant" ? "model" : msg.role,
            parts: [{ text: msg.content }]
        }));

    const requestData = {
        contents: formattedContents,
        systemInstruction: {
            parts: [{ text: systemInstructionText }]
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            const aiReply = data.candidates[0].content.parts[0].text;
            session.messages.push({ role: "model", content: aiReply });
            saveAllSessions();
            return aiReply;
        } else if (data.error) {
            session.messages.pop();
            return "Error: " + (data.error.message || "API se jawab nahi mila.");
        } else {
            session.messages.pop();
            return "Maaf kijiye, server se aamanya uttar mila hai.";
        }
    } catch (error) {
        console.error("Error:", error);
        session.messages.pop();
        return "Connection mein dikkat aa rahi hai. Kripya internet check karein.";
    }
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// ================= SCRIPT SECTION 6: INITIALIZATION & LISTENERS =================
document.addEventListener("DOMContentLoaded", () => {
    loadAllSessions();
    clearScreenAndRender();

    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const chatStream = document.getElementById("chatStream");
    const auraContainer = document.getElementById("auraContainer");
    const menuBtn = document.getElementById("menuBtn");
    const closeDrawer = document.getElementById("closeDrawer");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const newChatBtn = document.getElementById("newChatBtn");
    const searchChatsInput = document.getElementById("searchChatsInput");

    menuBtn.onclick = () => toggleSidebar(true);
    closeDrawer.onclick = () => toggleSidebar(false);
    sidebarOverlay.onclick = () => toggleSidebar(false);
    newChatBtn.onclick = () => createNewSession(true);

    if (searchChatsInput) {
        searchChatsInput.addEventListener("input", (e) => {
            searchQuery = e.target.value;
            renderSidebarList();
        });
    }

    chatStream.addEventListener("scroll", () => dismissAllMenus());
    document.addEventListener("click", () => dismissAllMenus());

    async function handleUserMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        auraContainer.classList.add("chat-active");
        const session = getCurrentSession();
        appendUserBubble(text, true, session.messages.length);
        userInput.value = "";

        const aiWrapper = document.createElement("div");
        aiWrapper.className = "ai-message-wrapper";
        const aiBubble = document.createElement("div");
        aiBubble.className = "ai-bubble";
        aiBubble.textContent = "Mayabir is thinking...";
        aiWrapper.appendChild(aiBubble);
        chatStream.appendChild(aiWrapper);
        chatStream.scrollTop = chatStream.scrollHeight;

        const reply = await askGeminiAI(text);
        aiWrapper.remove();
        appendAiBubble(reply);
    }

    if (sendBtn) {
        sendBtn.addEventListener("click", handleUserMessage);
    }

    if (userInput) {
        userInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                handleUserMessage();
            }
        });
    }

    window.addEventListener("load", () => {
        setTimeout(() => {
            const splash = document.getElementById("splashScreen");
            if (splash) {
                splash.style.opacity = "0";
                setTimeout(() => {
                    splash.style.display = "none";
                }, 400);
            }
        }, 1500);
    });
});
