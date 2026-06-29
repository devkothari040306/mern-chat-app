const state = {
  token: localStorage.getItem("chatToken") || sessionStorage.getItem("chatToken"),
  currentUser: null,
  selectedUser: null,
  users: [],
  messages: [],
  socket: null,
};

const localHosts = ["localhost", "127.0.0.1"];
const isLocalHost = localHosts.includes(window.location.hostname);
const configuredApiUrl = (window.CHAT_API_URL || "").replace(/\/$/, "");
const isBackendPreview = isLocalHost && window.location.port === "5000";
const API_BASE_URL = isBackendPreview ? "" : isLocalHost ? "http://localhost:5000" : configuredApiUrl;

const els = {
  authView: document.querySelector("#authView"),
  chatView: document.querySelector("#chatView"),
  loginTab: document.querySelector("#loginTab"),
  registerTab: document.querySelector("#registerTab"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  rememberMe: document.querySelector("#rememberMe"),
  forgotPassword: document.querySelector("#forgotPassword"),
  registerAvatar: document.querySelector("#registerAvatar"),
  registerAvatarPreview: document.querySelector("#registerAvatarPreview"),
  registerPassword: document.querySelector("#registerPassword"),
  registerConfirmPassword: document.querySelector("#registerConfirmPassword"),
  passwordStrengthBar: document.querySelector("#passwordStrengthBar"),
  passwordStrengthText: document.querySelector("#passwordStrengthText"),
  authMessage: document.querySelector("#authMessage"),
  currentUserName: document.querySelector("#currentUserName"),
  logoutButton: document.querySelector("#logoutButton"),
  userList: document.querySelector("#userList"),
  userListMessage: document.querySelector("#userListMessage"),
  emptyChatHeader: document.querySelector("#emptyChatHeader"),
  activeChatHeader: document.querySelector("#activeChatHeader"),
  activeAvatar: document.querySelector("#activeAvatar"),
  activeUserName: document.querySelector("#activeUserName"),
  activeUserStatus: document.querySelector("#activeUserStatus"),
  messageArea: document.querySelector("#messageArea"),
  messageForm: document.querySelector("#messageForm"),
  messageInput: document.querySelector("#messageInput"),
  sendButton: document.querySelector("#sendButton"),
};

const api = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { message: text || "Server returned an invalid response" };
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

const setAuthMessage = (message, success = false) => {
  els.authMessage.textContent = message;
  els.authMessage.classList.toggle("success", success);
};

const setButtonLoading = (button, loadingText, loading) => {
  if (!button.dataset.defaultText) {
    button.dataset.defaultText = button.textContent;
  }

  button.disabled = loading;
  button.textContent = loading ? loadingText : button.dataset.defaultText;
};

const initials = (name = "?") => name.trim().charAt(0).toUpperCase() || "?";

const saveToken = (token, remember = true) => {
  const storage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;

  storage.setItem("chatToken", token);
  otherStorage.removeItem("chatToken");
};

const clearToken = () => {
  localStorage.removeItem("chatToken");
  sessionStorage.removeItem("chatToken");
};

const getPasswordStrength = (password) => {
  let score = 0;

  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/i.test(password) && /\d/.test(password)) score += 1;
  if (/[^a-z0-9]/i.test(password)) score += 1;

  if (!password) {
    return { label: "Use at least 6 characters with a mix of letters and numbers.", level: "empty" };
  }

  if (score <= 1) {
    return { label: "Weak password", level: "weak" };
  }

  if (score <= 3) {
    return { label: "Good password", level: "good" };
  }

  return { label: "Strong password", level: "strong" };
};

const updatePasswordStrength = () => {
  const strength = getPasswordStrength(els.registerPassword.value);
  els.passwordStrengthBar.className = strength.level;
  els.passwordStrengthText.textContent = strength.label;
};

const renderAvatar = (target, user) => {
  target.textContent = initials(user.name);
  target.innerHTML = "";

  if (user.avatar) {
    const img = document.createElement("img");
    img.src = user.avatar;
    img.alt = `${user.name} avatar`;
    img.onerror = () => {
      target.innerHTML = "";
      target.textContent = initials(user.name);
    };
    target.appendChild(img);
  } else {
    target.textContent = initials(user.name);
  }
};

const showAuth = () => {
  els.authView.classList.remove("hidden");
  els.chatView.classList.add("hidden");
};

const showChat = () => {
  els.authView.classList.add("hidden");
  els.chatView.classList.remove("hidden");
  els.currentUserName.textContent = state.currentUser.name;
};

const renderUsers = () => {
  els.userList.innerHTML = "";

  if (!state.users.length) {
    els.userListMessage.textContent = "No other users yet.";
    els.userListMessage.classList.remove("hidden");
    return;
  }

  els.userListMessage.classList.add("hidden");

  state.users.forEach((user) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `user-card ${state.selectedUser?._id === user._id ? "active" : ""}`;
    button.dataset.userId = user._id;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    renderAvatar(avatar, user);

    const info = document.createElement("div");
    info.innerHTML = `<h3>${user.name}</h3><p>${user.email}</p>`;

    const dot = document.createElement("span");
    dot.className = `status-dot ${user.online ? "online" : ""}`;
    dot.title = user.online ? "Online" : "Offline";

    button.append(avatar, info, dot);
    button.addEventListener("click", () => openChat(user));
    els.userList.appendChild(button);
  });
};

const renderMessages = () => {
  els.messageArea.innerHTML = "";

  if (!state.selectedUser) {
    els.messageArea.innerHTML = '<div class="empty-state">Your conversation will appear here.</div>';
    return;
  }

  if (!state.messages.length) {
    els.messageArea.innerHTML = '<div class="empty-state">No messages yet.</div>';
    return;
  }

  state.messages.forEach((message) => {
    const isSent = String(message.sender._id || message.sender) === String(state.currentUser._id);
    const bubble = document.createElement("div");
    bubble.className = `bubble ${isSent ? "sent" : "received"}`;
    bubble.textContent = message.text;

    const time = document.createElement("span");
    time.className = "bubble-time";
    time.textContent = new Date(message.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    bubble.appendChild(time);
    els.messageArea.appendChild(bubble);
  });

  els.messageArea.scrollTop = els.messageArea.scrollHeight;
};

const updateActiveHeader = () => {
  if (!state.selectedUser) {
    els.emptyChatHeader.classList.remove("hidden");
    els.activeChatHeader.classList.add("hidden");
    els.messageInput.disabled = true;
    els.sendButton.disabled = true;
    return;
  }

  els.emptyChatHeader.classList.add("hidden");
  els.activeChatHeader.classList.remove("hidden");
  els.activeUserName.textContent = state.selectedUser.name;
  els.activeUserStatus.textContent = state.selectedUser.online ? "Online" : "Offline";
  renderAvatar(els.activeAvatar, state.selectedUser);
  els.messageInput.disabled = false;
  els.sendButton.disabled = false;
};

const fetchUsers = async () => {
  els.userListMessage.textContent = "Loading users...";
  els.userListMessage.classList.remove("hidden");
  const data = await api("/api/users");
  state.users = data.users;
  renderUsers();
};

const openChat = async (user) => {
  state.selectedUser = user;
  state.messages = [];
  updateActiveHeader();
  renderUsers();
  els.messageArea.innerHTML = '<div class="empty-state">Loading messages...</div>';

  try {
    const data = await api(`/api/messages/${user._id}`);
    state.messages = data.messages;
    renderMessages();
  } catch (error) {
    els.messageArea.innerHTML = `<div class="empty-state">${error.message}</div>`;
  }
};

const connectSocket = () => {
  if (state.socket) {
    state.socket.disconnect();
  }

  state.socket = io(API_BASE_URL || undefined, {
    auth: {
      token: state.token,
    },
  });

  state.socket.on("onlineUsers", (onlineUserIds) => {
    state.users = state.users.map((user) => ({
      ...user,
      online: onlineUserIds.includes(user._id),
    }));

    if (state.selectedUser) {
      state.selectedUser = state.users.find((user) => user._id === state.selectedUser._id) || state.selectedUser;
      updateActiveHeader();
    }

    renderUsers();
  });

  state.socket.on("userStatus", ({ userId, online }) => {
    state.users = state.users.map((user) => (user._id === userId ? { ...user, online } : user));

    if (state.selectedUser?._id === userId) {
      state.selectedUser.online = online;
      updateActiveHeader();
    }

    renderUsers();
  });

  state.socket.on("newMessage", (message) => {
    if (state.selectedUser?._id === String(message.sender._id || message.sender)) {
      state.messages.push(message);
      renderMessages();
    }
  });

};

const finishAuth = async (data) => {
  state.token = data.token;
  state.currentUser = data.user;
  saveToken(state.token, els.rememberMe.checked);
  showChat();
  connectSocket();
  await fetchUsers();
};

document.querySelectorAll("[data-toggle-password]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.querySelector(`#${button.dataset.togglePassword}`);
    const shouldShow = input.type === "password";

    input.type = shouldShow ? "text" : "password";
    button.textContent = shouldShow ? "Hide" : "Show";
  });
});

els.forgotPassword.addEventListener("click", () => {
  setAuthMessage("Password reset is not available yet. Please create a new account or contact support.");
});

els.loginTab.addEventListener("click", () => {
  els.loginTab.classList.add("active");
  els.registerTab.classList.remove("active");
  els.loginForm.classList.remove("hidden");
  els.registerForm.classList.add("hidden");
  setAuthMessage("");
});

els.registerTab.addEventListener("click", () => {
  els.registerTab.classList.add("active");
  els.loginTab.classList.remove("active");
  els.registerForm.classList.remove("hidden");
  els.loginForm.classList.add("hidden");
  setAuthMessage("");
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.querySelector("#loginButton");
  setButtonLoading(button, "Logging in...", true);
  setAuthMessage("");

  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.querySelector("#loginEmail").value,
        password: document.querySelector("#loginPassword").value,
      }),
    });
    await finishAuth(data);
  } catch (error) {
    setAuthMessage(error.message);
  } finally {
    setButtonLoading(button, "Logging in...", false);
  }
});

els.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.querySelector("#registerButton");
  setButtonLoading(button, "Creating...", true);
  setAuthMessage("");

  try {
    if (els.registerPassword.value !== els.registerConfirmPassword.value) {
      throw new Error("Passwords do not match");
    }

    const data = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: document.querySelector("#registerName").value,
        email: document.querySelector("#registerEmail").value,
        avatar: document.querySelector("#registerAvatar").value,
        password: document.querySelector("#registerPassword").value,
      }),
    });
    await finishAuth(data);
  } catch (error) {
    setAuthMessage(error.message);
  } finally {
    setButtonLoading(button, "Creating...", false);
  }
});

els.messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!state.selectedUser || !els.messageInput.value.trim()) {
    return;
  }

  const text = els.messageInput.value.trim();
  els.messageInput.value = "";
  els.sendButton.disabled = true;

  try {
    const data = await api(`/api/messages/${state.selectedUser._id}`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    state.messages.push(data.data);
    renderMessages();
  } catch (error) {
    alert(error.message);
    els.messageInput.value = text;
  } finally {
    els.sendButton.disabled = false;
    els.messageInput.focus();
  }
});

els.logoutButton.addEventListener("click", () => {
  clearToken();
  state.token = null;
  state.currentUser = null;
  state.selectedUser = null;
  state.users = [];
  state.messages = [];

  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }

  updateActiveHeader();
  renderMessages();
  showAuth();
});

const boot = async () => {
  if (!state.token) {
    showAuth();
    return;
  }

  try {
    const data = await api("/api/auth/me");
    state.currentUser = data.user;
    showChat();
    connectSocket();
    await fetchUsers();
  } catch (error) {
    clearToken();
    state.token = null;
    showAuth();
    setAuthMessage("Please log in again.");
  }
};

els.registerAvatar.addEventListener("input", () => {
  renderAvatar(els.registerAvatarPreview, {
    name: document.querySelector("#registerName").value || "?",
    avatar: els.registerAvatar.value.trim(),
  });
});

document.querySelector("#registerName").addEventListener("input", () => {
  renderAvatar(els.registerAvatarPreview, {
    name: document.querySelector("#registerName").value || "?",
    avatar: els.registerAvatar.value.trim(),
  });
});

els.registerPassword.addEventListener("input", updatePasswordStrength);
updatePasswordStrength();

boot();
