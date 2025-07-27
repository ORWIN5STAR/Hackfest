// KeyAuth Configuration
const KEYAUTH_CONFIG = {
    name: "SSSS",
    ownerid: "zOBkfpmZB1",
    secret: "62bbbd0e42993adeaea5349ac019adef92925183f331159c06130e738ea3e608",
    version: "1.2"
};

// Gemini API Configuration
const GEMINI_API_KEY = "AIzaSyAmdRx514EpwnsbyctOZ8NAk2_S9lwg2z0";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

class ScriptApp {
    constructor() {
        this.authenticated = false;
        this.currentPage = 'chat';
        this.chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
        this.init();
    }

    async init() {
        // Check for existing session first
        const savedSession = localStorage.getItem('keyauth_session');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            // Check if session is less than 24 hours old
            if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
                this.authenticated = true;
                this.user = { username: session.username };
                this.sessionid = session.sessionid;
                console.log('Restored session for:', session.username);
            } else {
                localStorage.removeItem('keyauth_session');
            }
        }
        
        if (!this.authenticated) {
            await this.checkAuth();
        }
        
        this.loadTheme();
        this.setupEventListeners();
        this.animateNavItems();
        this.loadChatHistory();
        
        // Add the GitHub project automatically
        this.addGitHubProject();
    }

    animateNavItems() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('animate-in');
            }, index * 100);
        });
    }

    async checkAuth() {
        // KeyAuth authentication
        try {
            const response = await fetch('https://keyauth.win/api/1.3/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    type: 'init',
                    name: KEYAUTH_CONFIG.name,
                    ownerid: KEYAUTH_CONFIG.ownerid,
                    secret: KEYAUTH_CONFIG.secret,
                    version: KEYAUTH_CONFIG.version
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.sessionid = data.sessionid;
                // Show login modal if not authenticated
                this.showLoginModal();
            } else {
                this.showAuthError('KeyAuth initialization failed: ' + data.message);
            }
        } catch (error) {
            console.error('Auth error:', error);
            this.showAuthError('Connection error');
        }
    }

    showLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal auth-modal">
                <div class="modal-header">
                    <h3>🔐 Authentication Required</h3>
                </div>
                <div class="modal-content">
                    <div class="auth-form">
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input type="text" id="username" placeholder="Enter your username" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" placeholder="Enter your password" required>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn primary" id="loginBtn">Login</button>
                    <button class="modal-btn secondary" id="registerBtn">Register</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup login functionality
        const loginBtn = modal.querySelector('#loginBtn');
        const registerBtn = modal.querySelector('#registerBtn');
        
        loginBtn.addEventListener('click', () => this.performLogin(modal));
        registerBtn.addEventListener('click', () => this.showRegisterModal(modal));
        
        // Focus on username field
        setTimeout(() => {
            modal.querySelector('#username').focus();
        }, 100);
        
        // Handle Enter key
        modal.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performLogin(modal);
            }
        });
    }

    async performLogin(modal) {
        const username = modal.querySelector('#username').value.trim();
        const password = modal.querySelector('#password').value.trim();
        
        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        const loginBtn = modal.querySelector('#loginBtn');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="loading"></span> Logging in...';
        
        try {
            const response = await fetch('https://keyauth.win/api/1.3/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    type: 'login',
                    username: username,
                    pass: password,
                    name: KEYAUTH_CONFIG.name,
                    ownerid: KEYAUTH_CONFIG.ownerid,
                    secret: KEYAUTH_CONFIG.secret,
                    version: KEYAUTH_CONFIG.version,
                    sessionid: this.sessionid || ''
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.authenticated = true;
                this.user = data.info;
                this.sessionid = data.sessionid;
                
                localStorage.setItem('keyauth_session', JSON.stringify({
                    username: username,
                    sessionid: data.sessionid,
                    timestamp: Date.now()
                }));
                
                modal.remove();
                this.showSuccess('Login successful! Welcome back.');
                console.log('User authenticated:', data.info);
            } else {
                this.showError('Login failed: ' + data.message);
                loginBtn.disabled = false;
                loginBtn.innerHTML = 'Login';
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Connection error during login');
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Login';
        }
    }

    showRegisterModal(loginModal) {
        loginModal.remove();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal auth-modal">
                <div class="modal-header">
                    <h3>📝 Create Account</h3>
                </div>
                <div class="modal-content">
                    <div class="auth-form">
                        <div class="form-group">
                            <label for="regUsername">Username</label>
                            <input type="text" id="regUsername" placeholder="Choose a username" required>
                        </div>
                        <div class="form-group">
                            <label for="regPassword">Password</label>
                            <input type="password" id="regPassword" placeholder="Choose a password" required>
                        </div>
                        <div class="form-group">
                            <label for="regEmail">Email</label>
                            <input type="email" id="regEmail" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label for="regLicense">License Key</label>
                            <input type="text" id="regLicense" placeholder="Enter your license key" required>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn primary" id="registerSubmitBtn">Register</button>
                    <button class="modal-btn secondary" id="backToLoginBtn">Back to Login</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const registerSubmitBtn = modal.querySelector('#registerSubmitBtn');
        const backToLoginBtn = modal.querySelector('#backToLoginBtn');
        
        registerSubmitBtn.addEventListener('click', () => this.performRegister(modal));
        backToLoginBtn.addEventListener('click', () => {
            modal.remove();
            this.showLoginModal();
        });
        
        // Focus on username field
        setTimeout(() => {
            modal.querySelector('#regUsername').focus();
        }, 100);
    }

    async performRegister(modal) {
        const username = modal.querySelector('#regUsername').value.trim();
        const password = modal.querySelector('#regPassword').value.trim();
        const email = modal.querySelector('#regEmail').value.trim();
        const license = modal.querySelector('#regLicense').value.trim();
        
        if (!username || !password || !email || !license) {
            this.showError('Please fill in all fields');
            return;
        }
        
        const registerBtn = modal.querySelector('#registerSubmitBtn');
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span class="loading"></span> Creating account...';
        
        try {
            const response = await fetch('https://keyauth.win/api/1.3/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    type: 'register',
                    username: username,
                    pass: password,
                    key: license,
                    email: email,
                    name: KEYAUTH_CONFIG.name,
                    ownerid: KEYAUTH_CONFIG.ownerid,
                    secret: KEYAUTH_CONFIG.secret,
                    version: KEYAUTH_CONFIG.version,
                    sessionid: this.sessionid || ''
                })
            });

            const data = await response.json();
            
            if (data.success) {
                modal.remove();
                this.showSuccess('Registration successful! Please login with your credentials.');
                this.showLoginModal();
            } else {
                this.showError('Registration failed: ' + data.message);
                registerBtn.disabled = false;
                registerBtn.innerHTML = 'Register';
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Connection error during registration');
            registerBtn.disabled = false;
            registerBtn.innerHTML = 'Register';
        }
    }

    setupEventListeners() {
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');

        if (sendBtn && messageInput) {
            sendBtn.addEventListener('click', () => this.sendMessage());
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });

            // Update character count with animation
            messageInput.addEventListener('input', (e) => {
                const charCount = document.querySelector('.char-count');
                const count = e.target.value.length;
                if (charCount) {
                    charCount.textContent = `${count} / 3,000`;
                    
                    // Add color animation based on character count
                    if (count > 2500) {
                        charCount.style.color = '#ff3b30';
                    } else if (count > 2000) {
                        charCount.style.color = '#ff9500';
                    } else {
                        charCount.style.color = '#8e8e93';
                    }
                }
            });
        }

        // Action card clicks with animation
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', () => {
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.transform = '';
                    const action = card.querySelector('span').textContent;
                    this.handleActionCard(action);
                }, 150);
            });
        });

        // Navigation clicks
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const text = item.querySelector('span:last-child').textContent;
                this.handleNavigation(text, item);
            });
        });

        // Right sidebar project navigation - make it clickable
        document.querySelectorAll('.projects-header').forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                // Find the Projects nav item (second nav item)
                const projectsNavItem = document.querySelector('.nav-item:nth-child(2)');
                this.handleNavigation('Projects', projectsNavItem);
            });
        });

        // Make individual project items clickable
        document.querySelectorAll('.project-item').forEach(item => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                const projectsNavItem = document.querySelector('.nav-item:nth-child(2)');
                this.handleNavigation('Projects', projectsNavItem);
            });
        });

        // Make "New Project" button in right sidebar work
        document.querySelectorAll('.right-sidebar .new-project-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showNewProjectModal();
            });
        });
    }

    handleNavigation(text, navItem) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to clicked item
        navItem.classList.add('active');
        
        // Handle navigation based on text
        switch(text) {
            case 'AI Chat':
                this.showChatPage();
                break;
            case 'Projects':
                this.showProjectsPage();
                break;
            case 'History':
                this.showHistoryPage();
                break;
            case 'Settings':
                this.showSettingsPage();
                break;
            case 'Help':
                this.showHelpPage();
                break;
            default:
                console.log('Navigation to:', text);
        }
    }

    showHistoryPage() {
        this.currentPage = 'history';
        const mainContent = document.querySelector('.main-content');
        
        mainContent.innerHTML = `
            <div class="header">
                <h1>Chat History</h1>
                <div class="header-actions">
                    <button class="clear-all-btn" onclick="window.app.clearAllHistory()">🗑️ Clear All</button>
                    <button class="export-btn" onclick="window.app.exportHistory()">📤 Export</button>
                </div>
            </div>
            <div class="history-page active">
                <div class="history-header">
                    <h2>Your Conversations</h2>
                    <div class="history-stats">
                        <span>📊 Total conversations: ${this.chatHistory.length}</span>
                        <span>⏰ Last active: ${this.getLastActiveTime()}</span>
                    </div>
                    <div class="history-search">
                        <input type="text" placeholder="🔍 Search conversations..." id="historySearch">
                    </div>
                </div>
                <div class="history-content">
                    ${this.renderHistoryItems()}
                </div>
            </div>
        `;

        // Add search functionality
        const searchInput = document.getElementById('historySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterHistory(e.target.value);
            });
        }

        // Add click listeners to history items
        document.querySelectorAll('.history-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.loadHistoryConversation(index);
            });
        });
    }

    showChatPage() {
        this.currentPage = 'chat';
        const mainContent = document.querySelector('.main-content');
        
        mainContent.innerHTML = `
            <div class="header">
                <h1>AI Chat</h1>
            </div>

            <div class="welcome-section">
                <h2>Welcome to Script</h2>
                <p>Get started by describing a task and Chat can do the rest. Not sure where to start?</p>

                <div class="action-cards">
                    <div class="action-card orange">
                        <div class="card-icon">✏️</div>
                        <span>Write copy</span>
                        <button class="card-add">+</button>
                    </div>
                    <div class="action-card blue">
                        <div class="card-icon">🖼️</div>
                        <span>Image generation</span>
                        <button class="card-add">+</button>
                    </div>
                    <div class="action-card green">
                        <div class="card-icon">👤</div>
                        <span>Create avatar</span>
                        <button class="card-add">+</button>
                    </div>
                    <div class="action-card pink">
                        <div class="card-icon">💻</div>
                        <span>Write code</span>
                        <button class="card-add">+</button>
                    </div>
                </div>
            </div>

            <div class="chat-input-container">
                <div class="chat-input">
                    <input type="text" placeholder="Ask me anything..." id="messageInput">
                    <button class="send-btn" id="sendBtn">→</button>
                </div>
                <div class="input-actions">
                    <button class="action-btn">📎 Attach</button>
                    <button class="action-btn">🎤 Voice Message</button>
                    <button class="action-btn">💡 Browse Prompts</button>
                    <span class="char-count">0 / 3,000</span>
                </div>
                <p class="disclaimer">Script may generate inaccurate information about people, places, or facts. Model: Script AI v1.3</p>
            </div>
        `;

        // Re-setup event listeners for the new elements
        this.setupChatEventListeners();
        this.setupInputActionButtons();
    }

    setupChatEventListeners() {
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');

        if (sendBtn && messageInput) {
            // Remove existing listeners to prevent duplicates
            const newSendBtn = sendBtn.cloneNode(true);
            sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
            
            const newMessageInput = messageInput.cloneNode(true);
            messageInput.parentNode.replaceChild(newMessageInput, messageInput);

            // Add fresh listeners
            newSendBtn.addEventListener('click', () => this.sendMessage());
            
            newMessageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Character count with proper color coding
            newMessageInput.addEventListener('input', (e) => {
                const charCount = document.querySelector('.char-count');
                const count = e.target.value.length;
                if (charCount) {
                    charCount.textContent = `${count} / 3,000`;
                    
                    // Color coding based on character count
                    if (count > 2500) {
                        charCount.style.color = '#ff3b30';
                        charCount.style.fontWeight = '600';
                    } else if (count > 2000) {
                        charCount.style.color = '#ff9500';
                        charCount.style.fontWeight = '500';
                    } else {
                        charCount.style.color = '#8e8e93';
                        charCount.style.fontWeight = '400';
                    }
                }
                
                // Enable/disable send button based on content
                if (e.target.value.trim()) {
                    newSendBtn.style.opacity = '1';
                    newSendBtn.style.cursor = 'pointer';
                    newSendBtn.disabled = false;
                } else {
                    newSendBtn.style.opacity = '0.5';
                    newSendBtn.style.cursor = 'not-allowed';
                    newSendBtn.disabled = true;
                }
            });

            // Initial state for send button
            newSendBtn.style.opacity = '0.5';
            newSendBtn.style.cursor = 'not-allowed';
            newSendBtn.disabled = true;
        }

        // Re-setup action card listeners with proper animation
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Visual feedback
                card.style.transform = 'scale(0.95)';
                card.style.transition = 'transform 0.15s ease';
                
                setTimeout(() => {
                    card.style.transform = '';
                    const action = card.querySelector('span').textContent;
                    this.handleActionCard(action);
                }, 150);
            });
        });
    }

    setupInputActionButtons() {
        // Attach button
        const attachBtn = document.querySelector('.action-btn:nth-child(1)');
        if (attachBtn && attachBtn.textContent.includes('Attach')) {
            attachBtn.addEventListener('click', () => this.handleAttachFile());
        }

        // Voice Message button
        const voiceBtn = document.querySelector('.action-btn:nth-child(2)');
        if (voiceBtn && voiceBtn.textContent.includes('Voice')) {
            voiceBtn.addEventListener('click', () => this.handleVoiceMessage());
        }

        // Browse Prompts button
        const promptsBtn = document.querySelector('.action-btn:nth-child(3)');
        if (promptsBtn && promptsBtn.textContent.includes('Browse')) {
            promptsBtn.addEventListener('click', () => this.handleBrowsePrompts());
        }
    }

    handleAttachFile() {
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = true;
        fileInput.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.json';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                this.handleFileSelection(files);
            }
            document.body.removeChild(fileInput);
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
    }

    handleFileSelection(files) {
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        const validFiles = [];
        const invalidFiles = [];

        files.forEach(file => {
            if (file.size > maxFileSize) {
                invalidFiles.push(`${file.name} (too large)`);
            } else {
                validFiles.push(file);
            }
        });

        if (invalidFiles.length > 0) {
            this.showError(`Files too large: ${invalidFiles.join(', ')}`);
        }

        if (validFiles.length > 0) {
            this.displayAttachedFiles(validFiles);
            this.attachedFiles = validFiles;
        }
    }

    displayAttachedFiles(files) {
        const chatInput = document.querySelector('.chat-input');
        let attachmentContainer = document.querySelector('.attachment-container');
        
        if (!attachmentContainer) {
            attachmentContainer = document.createElement('div');
            attachmentContainer.className = 'attachment-container';
            chatInput.parentNode.insertBefore(attachmentContainer, chatInput);
        }

        const attachmentHTML = files.map((file, index) => `
            <div class="attachment-item" data-index="${index}">
                <div class="attachment-icon">${this.getFileIcon(file.type)}</div>
                <div class="attachment-info">
                    <div class="attachment-name">${file.name}</div>
                    <div class="attachment-size">${this.formatFileSize(file.size)}</div>
                </div>
                <button class="remove-attachment" onclick="window.app.removeAttachment(${index})">&times;</button>
            </div>
        `).join('');

        attachmentContainer.innerHTML = `
            <div class="attachment-header">
                <span>📎 ${files.length} file(s) attached</span>
                <button class="clear-all-attachments" onclick="window.app.clearAllAttachments()">Clear All</button>
            </div>
            <div class="attachment-list">
                ${attachmentHTML}
            </div>
        `;
    }

    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return '🖼️';
        if (fileType.startsWith('video/')) return '🎥';
        if (fileType.startsWith('audio/')) return '🎵';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('text')) return '📄';
        if (fileType.includes('csv') || fileType.includes('excel')) return '📊';
        return '📁';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeAttachment(index) {
        if (this.attachedFiles && this.attachedFiles.length > index) {
            this.attachedFiles.splice(index, 1);
            if (this.attachedFiles.length > 0) {
                this.displayAttachedFiles(this.attachedFiles);
            } else {
                this.clearAllAttachments();
            }
        }
    }

    clearAllAttachments() {
        this.attachedFiles = [];
        const attachmentContainer = document.querySelector('.attachment-container');
        if (attachmentContainer) {
            attachmentContainer.remove();
        }
    }

    handleVoiceMessage() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showError('Voice recording is not supported in your browser');
            return;
        }

        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.isRecording = true;

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.handleVoiceRecording(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.showRecordingIndicator();
            
        } catch (error) {
            this.showError('Could not access microphone. Please check permissions.');
            console.error('Recording error:', error);
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.hideRecordingIndicator();
        }
    }

    showRecordingIndicator() {
        const voiceBtn = document.querySelector('.action-btn:nth-child(2)');
        if (voiceBtn) {
            voiceBtn.innerHTML = '🔴 Stop Recording';
            voiceBtn.style.background = '#ff3b30';
            voiceBtn.style.color = 'white';
        }

        // Add recording animation
        const recordingIndicator = document.createElement('div');
        recordingIndicator.className = 'recording-indicator';
        recordingIndicator.innerHTML = `
            <div class="recording-pulse"></div>
            <span>Recording... Click to stop</span>
        `;
        
        const chatInput = document.querySelector('.chat-input-container');
        chatInput.insertBefore(recordingIndicator, chatInput.firstChild);
    }

    hideRecordingIndicator() {
        const voiceBtn = document.querySelector('.action-btn:nth-child(2)');
        if (voiceBtn) {
            voiceBtn.innerHTML = '🎤 Voice Message';
            voiceBtn.style.background = '';
            voiceBtn.style.color = '';
        }

        const recordingIndicator = document.querySelector('.recording-indicator');
        if (recordingIndicator) {
            recordingIndicator.remove();
        }
    }

    handleVoiceRecording(audioBlob) {
        const audioFile = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' });
        this.handleFileSelection([audioFile]);
        this.showSuccess('Voice message recorded successfully!');
    }

    handleBrowsePrompts() {
        this.showPromptsModal();
    }

    showPromptsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal prompts-modal">
                <div class="modal-header">
                    <h3>💡 Browse Prompts</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="prompts-search">
                        <input type="text" placeholder="🔍 Search prompts..." id="promptSearch">
                    </div>
                    <div class="prompts-categories">
                        <button class="category-btn active" data-category="all">
                            <span class="category-icon">🌟</span>
                            <span>All</span>
                        </button>
                        <button class="category-btn" data-category="writing">
                            <span class="category-icon">✏️</span>
                            <span>Writing</span>
                        </button>
                        <button class="category-btn" data-category="coding">
                            <span class="category-icon">💻</span>
                            <span>Coding</span>
                        </button>
                        <button class="category-btn" data-category="business">
                            <span class="category-icon">📈</span>
                            <span>Business</span>
                        </button>
                        <button class="category-btn" data-category="creative">
                            <span class="category-icon">🎨</span>
                            <span>Creative</span>
                        </button>
                        <button class="category-btn" data-category="analysis">
                            <span class="category-icon">📊</span>
                            <span>Analysis</span>
                        </button>
                    </div>
                    <div class="prompts-grid" id="promptsGrid">
                        ${this.generatePromptsHTML('all')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal handlers
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        // Search functionality
        const searchInput = modal.querySelector('#promptSearch');
        searchInput.addEventListener('input', (e) => {
            this.filterPrompts(e.target.value, modal);
        });

        // Category filter handlers
        modal.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const category = btn.dataset.category;
                document.getElementById('promptsGrid').innerHTML = this.generatePromptsHTML(category);
                this.setupPromptClickHandlers(modal);
            });
        });

        // Keyboard navigation
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });

        this.setupPromptClickHandlers(modal);
    }

    generatePromptsHTML(category) {
        const prompts = this.getPromptsByCategory(category);
        return prompts.map((prompt, index) => `
            <div class="prompt-card" data-prompt="${prompt.text}" data-title="${prompt.title.toLowerCase()}" data-description="${prompt.description.toLowerCase()}">
                <div class="prompt-card-header">
                    <div class="prompt-icon">${prompt.icon}</div>
                    <div class="prompt-badge">${prompt.category}</div>
                </div>
                <div class="prompt-content">
                    <h4>${prompt.title}</h4>
                    <p>${prompt.description}</p>
                </div>
                <div class="prompt-actions">
                    <button class="use-prompt-btn">
                        <span>Use Prompt</span>
                        <span class="btn-arrow">→</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getPromptsByCategory(category) {
        const allPrompts = [
            { icon: '✏️', title: 'Blog Post Writer', description: 'Create engaging blog posts on any topic', category: 'writing', text: 'Write a comprehensive blog post about [topic]. Include an engaging introduction, main points with examples, and a compelling conclusion.' },
            { icon: '💻', title: 'Code Reviewer', description: 'Review and improve code quality', category: 'coding', text: 'Please review this code and suggest improvements for better performance, readability, and best practices: [paste your code here]' },
            { icon: '📊', title: 'Data Analyzer', description: 'Analyze data and provide insights', category: 'analysis', text: 'Analyze this data and provide key insights, trends, and actionable recommendations: [describe your data]' },
            { icon: '🎨', title: 'Creative Brainstorm', description: 'Generate creative ideas and concepts', category: 'creative', text: 'Help me brainstorm creative ideas for [project/campaign]. Think outside the box and provide unique, innovative concepts.' },
            { icon: '📈', title: 'Business Strategy', description: 'Develop business strategies and plans', category: 'business', text: 'Help me develop a business strategy for [describe your business/idea]. Include market analysis, competitive advantages, and growth opportunities.' },
            { icon: '📝', title: 'Email Writer', description: 'Craft professional emails', category: 'writing', text: 'Write a professional email for [purpose]. Make it clear, concise, and appropriate for the context.' },
            { icon: '🔍', title: 'Research Assistant', description: 'Conduct research on any topic', category: 'analysis', text: 'Research [topic] and provide a comprehensive overview including key facts, recent developments, and reliable sources.' },
            { icon: '🎯', title: 'Marketing Copy', description: 'Create compelling marketing content', category: 'business', text: 'Create compelling marketing copy for [product/service]. Focus on benefits, unique selling points, and call-to-action.' },
            { icon: '🐛', title: 'Debug Helper', description: 'Help debug and fix code issues', category: 'coding', text: 'Help me debug this issue: [describe the problem and include relevant code]. Provide step-by-step troubleshooting.' },
            { icon: '📚', title: 'Learning Plan', description: 'Create structured learning plans', category: 'analysis', text: 'Create a structured learning plan for [skill/topic]. Include resources, timeline, and milestones.' }
        ];

        if (category === 'all') return allPrompts;
        return allPrompts.filter(prompt => prompt.category === category);
    }

    filterPrompts(searchTerm, modal) {
        const promptCards = modal.querySelectorAll('.prompt-card');
        const term = searchTerm.toLowerCase();
        
        promptCards.forEach(card => {
            const title = card.dataset.title;
            const description = card.dataset.description;
            
            if (title.includes(term) || description.includes(term)) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.3s ease-out';
            } else {
                card.style.display = 'none';
            }
        });
    }

    setupPromptClickHandlers(modal) {
        modal.querySelectorAll('.prompt-card').forEach(card => {
            card.addEventListener('click', () => {
                const promptText = card.dataset.prompt;
                const messageInput = document.getElementById('messageInput');
                if (messageInput) {
                    messageInput.value = promptText;
                    messageInput.focus();
                    
                    // Add typing animation effect
                    messageInput.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        messageInput.style.transform = '';
                    }, 200);
                }
                modal.remove();
                this.showSuccess('Prompt added to input!');
            });

            // Hover effect
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }

    renderHistoryItems() {
        if (this.chatHistory.length === 0) {
            return `
                <div class="empty-history">
                    <h3>No conversations yet</h3>
                    <p>Start chatting with AI to see your history here</p>
                </div>
            `;
        }

        return this.chatHistory.map((conversation, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-item-header">
                    <div class="history-timestamp">${this.formatDate(conversation.timestamp)}</div>
                </div>
                <div class="history-question">${conversation.question}</div>
                <div class="history-preview">${conversation.answer.substring(0, 150)}...</div>
            </div>
        `).join('');
    }

    loadHistoryConversation(index) {
        const conversation = this.chatHistory[index];
        if (conversation) {
            // Switch back to chat page
            this.showChatPage();
            
            // Display the conversation
            setTimeout(() => {
                this.displayMessage(conversation.question, conversation.answer);
            }, 300);
        }
    }

    async sendMessage() {
        if (!this.authenticated) {
            this.showAuthError('Please authenticate first');
            return;
        }

        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) {
            this.showError('Please enter a message');
            return;
        }

        // Disable input during processing
        const sendBtn = document.getElementById('sendBtn');
        messageInput.disabled = true;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '⏳';

        try {
            this.showTyping();
            
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: message
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const aiResponse = data.candidates[0].content.parts[0].text;
                this.displayMessage(message, aiResponse);
                this.saveToHistory(message, aiResponse);
            } else {
                throw new Error('Invalid response format from Gemini API');
            }

            // Clear input and reset state
            messageInput.value = '';
            this.updateCharCount(0);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError(`Failed to send message: ${error.message}`);
            this.showChatPage(); // Reset to initial state
        } finally {
            // Re-enable input
            messageInput.disabled = false;
            sendBtn.disabled = false;
            sendBtn.innerHTML = '→';
            messageInput.focus();
        }
    }

    saveToHistory(question, answer) {
        const conversation = {
            question,
            answer,
            timestamp: new Date().toISOString()
        };
        
        this.chatHistory.unshift(conversation); // Add to beginning
        
        // Keep only last 50 conversations
        if (this.chatHistory.length > 50) {
            this.chatHistory = this.chatHistory.slice(0, 50);
        }
        
        localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
    }

    loadChatHistory() {
        const saved = localStorage.getItem('chatHistory');
        if (saved) {
            this.chatHistory = JSON.parse(saved);
        }
    }

    getLastActiveTime() {
        if (this.chatHistory.length === 0) return 'Never';
        const lastConversation = this.chatHistory[0];
        return this.formatDate(lastConversation.timestamp);
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'Today at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else if (diffDays === 2) {
            return 'Yesterday at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else if (diffDays <= 7) {
            return date.toLocaleDateString([], {weekday: 'long'}) + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else {
            return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    getWordCount(text) {
        return text.split(' ').filter(word => word.length > 0).length;
    }

    filterHistory(searchTerm) {
        const historyItems = document.querySelectorAll('.history-item');
        const term = searchTerm.toLowerCase();
        
        historyItems.forEach(item => {
            const question = item.querySelector('.history-question').textContent.toLowerCase();
            const answer = item.querySelector('.history-preview').textContent.toLowerCase();
            
            if (question.includes(term) || answer.includes(term)) {
                item.style.display = 'block';
                item.style.animation = 'fadeIn 0.3s ease-out';
            } else {
                item.style.display = 'none';
            }
        });
    }

    deleteHistoryItem(index) {
        if (confirm('Are you sure you want to delete this conversation?')) {
            this.chatHistory.splice(index, 1);
            localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
            this.showHistoryPage(); // Refresh the page
            this.showSuccess('Conversation deleted successfully');
        }
    }

    clearAllHistory() {
        if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
            this.chatHistory = [];
            localStorage.removeItem('chatHistory');
            this.showHistoryPage(); // Refresh the page
            this.showSuccess('All chat history cleared');
        }
    }

    exportHistory() {
        if (this.chatHistory.length === 0) {
            this.showError('No history to export');
            return;
        }
        
        const exportData = {
            exportDate: new Date().toISOString(),
            totalConversations: this.chatHistory.length,
            conversations: this.chatHistory
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showSuccess('History exported successfully');
    }

    goToChat() {
        const chatNavItem = document.querySelector('.nav-item');
        this.handleNavigation('AI Chat', chatNavItem);
    }

    handleActionCard(action) {
        const prompts = {
            'Write copy': 'Help me write compelling copy for my product',
            'Image generation': 'Describe an image you would like me to help you create',
            'Create avatar': 'Help me design a professional avatar',
            'Write code': 'What programming task can I help you with?'
        };

        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.value = prompts[action] || action;
            messageInput.focus();
            
            // Animate the input
            messageInput.style.transform = 'scale(1.02)';
            setTimeout(() => {
                messageInput.style.transform = '';
            }, 200);
        }
    }

    showTyping() {
        const welcomeSection = document.querySelector('.welcome-section');
        if (welcomeSection) {
            welcomeSection.innerHTML = `
                <div class="typing-indicator">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <p>AI is thinking...</p>
                </div>
            `;
        }
    }

    displayMessage(userMessage, aiResponse) {
        const welcomeSection = document.querySelector('.welcome-section');
        if (welcomeSection) {
            welcomeSection.innerHTML = `
                <div class="chat-messages">
                    <div class="message user-message">
                        <div class="message-content">${this.escapeHtml(userMessage)}</div>
                        <div class="message-time">${this.formatTime(new Date())}</div>
                    </div>
                    <div class="message ai-message">
                        <div class="message-content">${this.formatAIResponse(aiResponse)}</div>
                        <div class="message-time">${this.formatTime(new Date())}</div>
                        <div class="message-actions">
                            <button class="copy-btn" onclick="navigator.clipboard.writeText('${this.escapeHtml(aiResponse)}')">📋 Copy</button>
                            <button class="regenerate-btn" onclick="window.app.regenerateResponse('${this.escapeHtml(userMessage)}')">🔄 Regenerate</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Scroll to bottom smoothly
            setTimeout(() => {
                welcomeSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatAIResponse(text) {
        // Basic markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    regenerateResponse(userMessage) {
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.value = userMessage;
            this.sendMessage();
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff3b30;
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 1000;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    showAuthError(message) {
        console.error('Auth Error:', message);
        this.showError(message);
    }

    toggleTheme(isDark) {
        document.body.classList.toggle('dark-theme', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    updateCharCount(count) {
        const charCount = document.querySelector('.char-count');
        if (charCount) {
            charCount.textContent = `${count} / 3,000`;
        }
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }

    showProjectsPage() {    
        this.currentPage = 'projects';
        const mainContent = document.querySelector('.main-content');
        
        // Get projects from localStorage
        const projects = JSON.parse(localStorage.getItem('userProjects')) || [];
        
        mainContent.innerHTML = `
            <div class="projects-page active">
                <div class="projects-header">
                    <div class="projects-header-content">
                        <h2>Projects</h2>
                        <p>Manage your AI projects and workflows (${projects.length} total)</p>
                    </div>
                    <button class="new-project-btn">+ New Project</button>
                </div>
                <div class="projects-content">
                    <div class="projects-grid">
                        ${this.generateProjectCards(projects)}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for project actions
        this.setupProjectEventListeners();
    }

    generateProjectCards(projects) {
        if (projects.length === 0) {
            return `
                <div class="empty-projects">
                    <div class="empty-icon">📁</div>
                    <h3>No projects yet</h3>
                    <p>Create your first project to get started with AI-powered workflows</p>
                    <button class="create-first-project-btn">Create Your First Project</button>
                </div>
            `;
        }

        return projects.map(project => `
            <div class="project-card ${this.getProjectTypeClass(project.type)}" data-project-id="${project.id}">
                <div class="project-icon">${this.getProjectIcon(project.type)}</div>
                <h3>${project.name}</h3>
                <p>${project.description || 'No description provided'}</p>
                ${project.hasWebsiteLink && project.websiteUrl ? `
                    <div class="project-website">
                        <a href="${project.websiteUrl}" target="_blank" class="website-link">
                            🔗 ${this.getDomainFromUrl(project.websiteUrl)}
                        </a>
                    </div>
                ` : ''}
                <div class="project-stats">
                    <span>📅 Created: ${new Date(project.createdAt).toLocaleDateString()}</span>
                    <span>🔄 Status: ${project.status}</span>
                </div>
                <div class="project-actions">
                    <button class="project-btn" data-action="open">Open</button>
                    ${project.hasWebsiteLink && project.websiteUrl ? `
                        <button class="project-btn website" data-action="visit">Visit Site</button>
                    ` : ''}
                    <button class="project-btn secondary" data-action="edit">Edit</button>
                    <button class="project-btn danger" data-action="delete">Delete</button>
                </div>
            </div>
        `).join('');
    }

    getProjectIcon(type) {
        const icons = {
            'content': '✏️',
            'code': '💻',
            'design': '🎨',
            'automation': '🤖',
            'data': '📊',
            'github': '🔗',
            'website': '🌐'
        };
        return icons[type] || '📁';
    }

    getProjectTypeClass(type) {
        return type === 'github' ? 'github-project' : '';
    }

    setupProjectEventListeners() {
        // New project button
        const newProjectBtn = document.querySelector('.new-project-btn');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                this.showNewProjectModal();
            });
        }

        // Create first project button (for empty state)
        const createFirstBtn = document.querySelector('.create-first-project-btn');
        if (createFirstBtn) {
            createFirstBtn.addEventListener('click', () => {
                this.showNewProjectModal();
            });
        }

        // Project action buttons
        document.querySelectorAll('.project-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const projectCard = btn.closest('.project-card');
                const projectId = projectCard.dataset.projectId;
                this.handleProjectAction(action, projectId);
            });
        });
    }

    handleProjectAction(action, projectId) {
        const projects = JSON.parse(localStorage.getItem('userProjects')) || [];
        const project = projects.find(p => p.id === projectId);
        
        if (!project) {
            this.showError('Project not found');
            return;
        }

        switch(action) {
            case 'open':
                this.openProject(project);
                break;
            case 'visit':
                this.visitProjectWebsite(project);
                break;
            case 'edit':
                this.editProject(project);
                break;
            case 'delete':
                this.deleteProject(projectId);
                break;
            default:
                this.showError(`Action: ${action} on ${project.name}`);
        }
    }

    openProject(project) {
        // Switch to chat and pre-fill with project context
        const chatNavItem = document.querySelector('.nav-item');
        this.handleNavigation('AI Chat', chatNavItem);
        
        setTimeout(() => {
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.value = `I'm working on my ${project.type} project "${project.name}". ${project.description}. How can you help me with this?`;
                messageInput.focus();
            }
        }, 500);
        
        this.showSuccess(`Opened project: ${project.name}`);
    }

    editProject(project) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Edit Project</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="form-group">
                        <label>Project Name</label>
                        <input type="text" id="editProjectName" value="${project.name}">
                    </div>
                    <div class="form-group">
                        <label>Project Type</label>
                        <select id="editProjectType">
                            <option value="content" ${project.type === 'content' ? 'selected' : ''}>Content Writing</option>
                            <option value="code" ${project.type === 'code' ? 'selected' : ''}>Code Generation</option>
                            <option value="design" ${project.type === 'design' ? 'selected' : ''}>Creative Design</option>
                            <option value="automation" ${project.type === 'automation' ? 'selected' : ''}>AI Automation</option>
                            <option value="data" ${project.type === 'data' ? 'selected' : ''}>Data Analysis</option>
                            <option value="github" ${project.type === 'github' ? 'selected' : ''}>GitHub Integration</option>
                            <option value="website" ${project.type === 'website' ? 'selected' : ''}>Website Project</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="editProjectDesc">${project.description || ''}</textarea>
                    </div>
                    <div class="form-group website-link-group" style="display: ${project.hasWebsiteLink ? 'block' : 'none'};">
                        <label>Website URL</label>
                        <input type="url" id="editProjectWebsite" value="${project.websiteUrl || ''}" placeholder="https://example.com">
                        <small class="form-help">Link your project to a website for easy access</small>
                    </div>
                    <div class="project-options">
                        <div class="option-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="editLinkToWebsite" ${project.hasWebsiteLink ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Link to Website
                            </label>
                            <small>Associate this project with a website URL</small>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn secondary" id="cancelEditBtn">Cancel</button>
                    <button class="modal-btn primary" id="saveEditBtn">Save Changes</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show/hide website URL field based on checkbox
        const linkToWebsiteCheckbox = modal.querySelector('#editLinkToWebsite');
        const websiteLinkGroup = modal.querySelector('.website-link-group');
        const projectTypeSelect = modal.querySelector('#editProjectType');
        
        linkToWebsiteCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                websiteLinkGroup.style.display = 'block';
                websiteLinkGroup.style.animation = 'slideInDown 0.3s ease-out';
            } else {
                websiteLinkGroup.style.display = 'none';
            }
        });

        // Auto-check website link when website project type is selected
        projectTypeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'website') {
                linkToWebsiteCheckbox.checked = true;
                websiteLinkGroup.style.display = 'block';
                websiteLinkGroup.style.animation = 'slideInDown 0.3s ease-out';
            }
        });
        
        // Modal event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancelEditBtn').addEventListener('click', () => modal.remove());
        
        modal.querySelector('#saveEditBtn').addEventListener('click', () => {
            this.saveProjectEdit(project.id);
        });
        
        setTimeout(() => {
            modal.querySelector('#editProjectName').focus();
        }, 100);
    }

    saveProjectEdit(projectId) {
        const name = document.getElementById('editProjectName').value.trim();
        const type = document.getElementById('editProjectType').value;
        const desc = document.getElementById('editProjectDesc').value.trim();
        const linkToWebsite = document.getElementById('editLinkToWebsite').checked;
        const websiteUrl = document.getElementById('editProjectWebsite').value.trim();
        
        if (!name) {
            this.showError('Please enter a project name');
            return;
        }

        if (linkToWebsite && websiteUrl && !this.isValidUrl(websiteUrl)) {
            this.showError('Please enter a valid website URL');
            return;
        }
        
        let projects = JSON.parse(localStorage.getItem('userProjects')) || [];
        const projectIndex = projects.findIndex(p => p.id === projectId);
        
        if (projectIndex !== -1) {
            projects[projectIndex] = {
                ...projects[projectIndex],
                name: name,
                type: type,
                description: desc,
                websiteUrl: linkToWebsite ? websiteUrl : null,
                hasWebsiteLink: linkToWebsite,
                lastModified: new Date().toISOString()
            };
            
            localStorage.setItem('userProjects', JSON.stringify(projects));
            this.showSuccess('Project updated successfully!');
            document.querySelector('.modal-overlay').remove();
            this.showProjectsPage();
        }
    }

    deleteProject(projectId) {
        const projects = JSON.parse(localStorage.getItem('userProjects')) || [];
        const project = projects.find(p => p.id === projectId);
        
        if (!project) return;
        
        if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
            const updatedProjects = projects.filter(p => p.id !== projectId);
            localStorage.setItem('userProjects', JSON.stringify(updatedProjects));
            this.showSuccess(`Project "${project.name}" deleted successfully`);
            this.showProjectsPage();
            this.updateProjectCount();
        }
    }

    showNewProjectModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>Create New Project</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-content">
                    <div class="form-group">
                        <label>Project Name</label>
                        <input type="text" id="projectName" placeholder="Enter project name" required>
                    </div>
                    <div class="form-group">
                        <label>Project Type</label>
                        <select id="projectType">
                            <option value="content">Content Writing</option>
                            <option value="code">Code Generation</option>
                            <option value="design">Creative Design</option>
                            <option value="automation">AI Automation</option>
                            <option value="data">Data Analysis</option>
                            <option value="github">GitHub Integration</option>
                            <option value="website">Website Project</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="projectDesc" placeholder="Describe your project (optional)"></textarea>
                    </div>
                    <div class="form-group website-link-group" style="display: none;">
                        <label>Website URL</label>
                        <input type="url" id="projectWebsite" placeholder="https://example.com">
                        <small class="form-help">Link your project to a website for easy access</small>
                    </div>
                    <div class="project-options">
                        <div class="option-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="linkToWebsite">
                                <span class="checkmark"></span>
                                Link to Website
                            </label>
                            <small>Associate this project with a website URL</small>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn secondary" id="cancelProjectBtn">Cancel</button>
                    <button class="modal-btn primary" id="createProjectBtn">Create Project</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show/hide website URL field based on checkbox
        const linkToWebsiteCheckbox = modal.querySelector('#linkToWebsite');
        const websiteLinkGroup = modal.querySelector('.website-link-group');
        const projectTypeSelect = modal.querySelector('#projectType');
        
        linkToWebsiteCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                websiteLinkGroup.style.display = 'block';
                websiteLinkGroup.style.animation = 'slideInDown 0.3s ease-out';
            } else {
                websiteLinkGroup.style.display = 'none';
            }
        });

        // Auto-check website link when website project type is selected
        projectTypeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'website') {
                linkToWebsiteCheckbox.checked = true;
                websiteLinkGroup.style.display = 'block';
                websiteLinkGroup.style.animation = 'slideInDown 0.3s ease-out';
            }
        });
        
        // Close modal handlers
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#cancelProjectBtn').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#createProjectBtn').addEventListener('click', () => {
            this.createProject();
        });
        
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });
        
        setTimeout(() => {
            const firstInput = modal.querySelector('#projectName');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    }

    createProject() {
        const name = document.getElementById('projectName').value.trim();
        const type = document.getElementById('projectType').value;
        const desc = document.getElementById('projectDesc').value.trim();
        const linkToWebsite = document.getElementById('linkToWebsite').checked;
        const websiteUrl = document.getElementById('projectWebsite').value.trim();
        
        if (!name) {
            this.showError('Please enter a project name');
            return;
        }

        if (linkToWebsite && websiteUrl && !this.isValidUrl(websiteUrl)) {
            this.showError('Please enter a valid website URL');
            return;
        }
        
        // Create project object
        const newProject = {
            id: Date.now().toString(),
            name: name,
            type: type,
            description: desc,
            websiteUrl: linkToWebsite ? websiteUrl : null,
            hasWebsiteLink: linkToWebsite,
            createdAt: new Date().toISOString(),
            status: 'Active',
            lastModified: new Date().toISOString(),
            owner: this.user?.email || 'user@example.com'
        };
        
        // Get existing projects from localStorage
        let projects = JSON.parse(localStorage.getItem('userProjects')) || [];
        projects.push(newProject);
        localStorage.setItem('userProjects', JSON.stringify(projects));
        
        this.showSuccess(`Project "${name}" created successfully!`);
        document.querySelector('.modal-overlay').remove();
        
        // Refresh projects page if we're currently on it
        if (this.currentPage === 'projects') {
            setTimeout(() => {
                this.showProjectsPage();
            }, 1000);
        }
        
        // Update right sidebar project count
        this.updateProjectCount();
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    getDomainFromUrl(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch (e) {
            return url;
        }
    }

    visitProjectWebsite(project) {
        if (project.websiteUrl) {
            window.open(project.websiteUrl, '_blank');
            this.showSuccess(`Opening ${project.name} website`);
        } else {
            this.showError('No website URL associated with this project');
        }
    }

    updateProjectCount() {
        const projects = JSON.parse(localStorage.getItem('userProjects')) || [];
        const projectsHeader = document.querySelector('.projects-header h3');
        if (projectsHeader) {
            projectsHeader.textContent = `Projects (${projects.length})`;
        }
    }

    showTemplatesPage() {
        this.currentPage = 'templates';
        const mainContent = document.querySelector('.main-content');
        
        mainContent.innerHTML = `
            <div class="templates-page active">
                <div class="templates-header">
                    <h2>Templates</h2>
                    <p>Pre-built prompts and workflows to get you started</p>
                </div>
                <div class="templates-content">
                    <div class="template-categories">
                        <button class="category-btn active">All</button>
                        <button class="category-btn">Writing</button>
                        <button class="category-btn">Code</button>
                        <button class="category-btn">Business</button>
                        <button class="category-btn">Creative</button>
                    </div>
                    <div class="templates-grid">
                        <div class="template-card">
                            <div class="template-icon">✏️</div>
                            <h3>Blog Post Writer</h3>
                            <p>Generate engaging blog posts on any topic</p>
                            <button class="use-template-btn">Use Template</button>
                        </div>
                        <div class="template-card">
                            <div class="template-icon">📧</div>
                            <h3>Email Marketing</h3>
                            <p>Create compelling email campaigns</p>
                            <button class="use-template-btn">Use Template</button>
                        </div>
                        <div class="template-card">
                            <div class="template-icon">💼</div>
                            <h3>Business Plan</h3>
                            <p>Structure and write business plans</p>
                            <button class="use-template-btn">Use Template</button>
                        </div>
                        <div class="template-card">
                            <div class="template-icon">🔧</div>
                            <h3>Code Debugger</h3>
                            <p>Find and fix bugs in your code</p>
                            <button class="use-template-btn">Use Template</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showDocumentsPage() {
        this.currentPage = 'documents';
        const mainContent = document.querySelector('.main-content');
        
        mainContent.innerHTML = `
            <div class="documents-page active">
                <div class="documents-header">
                    <h2>Documents</h2>
                    <p>Your saved documents and files</p>
                    <button class="new-document-btn">+ New Document</button>
                </div>
                <div class="documents-content">
                    <div class="documents-list">
                        <div class="document-item">
                            <div class="document-icon">📄</div>
                            <div class="document-info">
                                <h3>Marketing Strategy 2024</h3>
                                <p>Comprehensive marketing plan for next year</p>
                                <span class="document-date">Created 3 days ago</span>
                            </div>
                            <div class="document-actions">
                                <button class="action-btn">Edit</button>
                                <button class="action-btn">Share</button>
                            </div>
                        </div>
                        <div class="document-item">
                            <div class="document-icon">📊</div>
                            <div class="document-info">
                                <h3>Q4 Report Analysis</h3>
                                <p>Financial analysis and insights</p>
                                <span class="document-date">Created 1 week ago</span>
                            </div>
                            <div class="document-actions">
                                <button class="action-btn">Edit</button>
                                <button class="action-btn">Share</button>
                            </div>
                        </div>
                        <div class="document-item">
                            <div class="document-icon">📝</div>
                            <div class="document-info">
                                <h3>Product Requirements</h3>
                                <p>Technical specifications and requirements</p>
                                <span class="document-date">Created 2 weeks ago</span>
                            </div>
                            <div class="document-actions">
                                <button class="action-btn">Edit</button>
                                <button class="action-btn">Share</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showCommunityPage() {
        this.currentPage = 'community';
        const mainContent = document.querySelector('.main-content');
        
        mainContent.innerHTML = `
            <div class="community-page active">
                <div class="community-header">
                    <h2>Community</h2>
                    <p>Connect with other Script users and share ideas</p>
                    <span class="new-badge">NEW</span>
                </div>
                <div class="community-content">
                    <div class="community-stats">
                        <div class="stat-card">
                            <h3>12,543</h3>
                            <p>Active Users</p>
                        </div>
                        <div class="stat-card">
                            <h3>2,891</h3>
                            <p>Shared Templates</p>
                        </div>
                        <div class="stat-card">
                            <h3>8,234</h3>
                            <p>Conversations</p>
                        </div>
                    </div>
                    
                    <div class="community-feed">
                        <div class="feed-item">
                            <div class="user-avatar">👤</div>
                            <div class="feed-content">
                                <h4>Sarah Chen shared a template</h4>
                                <p>"Advanced Code Review Assistant" - Perfect for debugging complex applications</p>
                                <div class="feed-actions">
                                    <button class="like-btn">👍 24</button>
                                    <button class="comment-btn">💬 8</button>
                                    <button class="share-btn">🔗 Share</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="feed-item">
                            <div class="user-avatar">👨‍💻</div>
                            <div class="feed-content">
                                <h4>Alex Rodriguez posted an update</h4>
                                <p>Just created an amazing workflow for automated content generation. Check it out!</p>
                                <div class="feed-actions">
                                    <button class="like-btn">👍 18</button>
                                    <button class="comment-btn">💬 5</button>
                                    <button class="share-btn">🔗 Share</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="feed-item">
                            <div class="user-avatar">👩‍🎨</div>
                            <div class="feed-content">
                                <h4>Emma Wilson shared insights</h4>
                                <p>Tips for getting better results from AI prompts - learned these from 100+ conversations</p>
                                <div class="feed-actions">
                                    <button class="like-btn">👍 42</button>
                                    <button class="comment-btn">💬 15</button>
                                    <button class="share-btn">🔗 Share</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showSettingsPage() {
        this.currentPage = 'settings';
        const mainContent = document.querySelector('.main-content');
        
        mainContent.innerHTML = `
            <div class="settings-page active">
                <div class="settings-header">
                    <h2>Settings</h2>
                    <p>Customize your Script experience</p>
                </div>
                <div class="settings-content">
                    <div class="settings-section">
                        <h3>Account</h3>
                        <div class="setting-item">
                            <label>Current User: ${this.user?.username || 'Unknown'}</label>
                            <button class="danger-btn" onclick="window.app.logout()">🚪 Logout</button>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Appearance</h3>
                        <div class="setting-item">
                            <label>Theme</label>
                            <div class="theme-selector">
                                <button class="theme-option ${!document.body.classList.contains('dark-theme') ? 'active' : ''}" data-theme="light">
                                    ☀️ Light
                                </button>
                                <button class="theme-option ${document.body.classList.contains('dark-theme') ? 'active' : ''}" data-theme="dark">
                                    🌙 Dark
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>Chat Settings</h3>
                        <div class="setting-item">
                            <label>Response Length</label>
                            <select class="setting-select">
                                <option value="short">Short</option>
                                <option value="medium" selected>Medium</option>
                                <option value="long">Long</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>Auto-save conversations</label>
                            <input type="checkbox" class="setting-checkbox" checked>
                        </div>
                    </div>

                    <div class="settings-section">
                        <h3>Privacy & Data</h3>
                        <div class="setting-item">
                            <label>Clear chat history</label>
                            <button class="danger-btn" onclick="window.app.clearHistory()">Clear All History</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup theme selector
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.toggleTheme(btn.dataset.theme === 'dark');
            });
        });
    }

    showHelpPage() {
        this.currentPage = 'help';
        const mainContent = document.querySelector('.main-content');
        
        mainContent.innerHTML = `
            <div class="help-page active">
                <div class="help-header">
                    <h2>Help & Support</h2>
                    <p>Get help with Script AI Chat</p>
                </div>
                <div class="help-content">
                    <div class="help-section">
                        <h3>Getting Started</h3>
                        <div class="help-item">
                            <h4>How to start a conversation</h4>
                            <p>Simply type your message in the chat input and press Enter or click the send button.</p>
                        </div>
                        <div class="help-item">
                            <h4>Using action cards</h4>
                            <p>Click on any action card to get started with pre-made prompts for common tasks.</p>
                        </div>
                    </div>

                    <div class="help-section">
                        <h3>Features</h3>
                        <div class="help-item">
                            <h4>File attachments</h4>
                            <p>Click the attach button to upload images, documents, or other files to your conversation.</p>
                        </div>
                        <div class="help-item">
                            <h4>Chat history</h4>
                            <p>All your conversations are automatically saved and can be accessed from the History page.</p>
                        </div>
                    </div>

                    <div class="help-section">
                        <h3>Keyboard Shortcuts</h3>
                        <div class="shortcut-list">
                            <div class="shortcut-item">
                                <kbd>⌘K</kbd>
                                <span>Quick search</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>Enter</kbd>
                                <span>Send message</span>
                            </div>
                            <div class="shortcut-item">
                                <kbd>⌘/</kbd>
                                <span>Show shortcuts</span>
                            </div>
                        </div>
                    </div>

                    <div class="help-section">
                        <h3>Contact Support</h3>
                        <div class="contact-options">
                            <button class="contact-btn" onclick="window.open('https://github.com/ORWIN5STAR', '_blank')">🔗 GitHub</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
            this.chatHistory = [];
            localStorage.removeItem('chatHistory');
            this.showError('Chat history cleared successfully');
        }
    }

    // Add this method to automatically add the GitHub project
    addGitHubProject() {
        const newProject = {
            id: Date.now().toString(),
            name: "ORWIN5STAR",
            type: "github",
            description: "GitHub repository integration and automated code analysis",
            websiteUrl: "https://github.com/ORWIN5STAR",
            hasWebsiteLink: true,
            createdAt: new Date().toISOString(),
            status: "Active",
            lastModified: new Date().toISOString(),
            owner: this.user?.email || 'user@example.com'
        };
        
        // Get existing projects from localStorage
        let projects = JSON.parse(localStorage.getItem('userProjects')) || [];
        
        // Check if project already exists
        const existingProject = projects.find(p => p.websiteUrl === newProject.websiteUrl);
        if (existingProject) {
            this.showError('This GitHub repository is already in your projects');
            return;
        }
        
        projects.push(newProject);
        localStorage.setItem('userProjects', JSON.stringify(projects));
        
        this.showSuccess(`GitHub project "${newProject.name}" added successfully!`);
        
        // Update project count in sidebar
        this.updateProjectCount();
        
        // Refresh projects page if currently viewing it
        if (this.currentPage === 'projects') {
            setTimeout(() => {
                this.showProjectsPage();
            }, 1000);
        }
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear authentication state
            this.authenticated = false;
            this.user = null;
            this.sessionid = null;
            
            // Clear stored session
            localStorage.removeItem('keyauth_session');
            
            // Clear chat history and projects (optional)
            localStorage.removeItem('chatHistory');
            localStorage.removeItem('userProjects');
            
            // Show success message
            this.showSuccess('Logged out successfully');
            
            // Redirect to login
            setTimeout(() => {
                this.checkAuth();
            }, 1000);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ScriptApp();
});

// Add CSS for chat messages and typing indicator
const additionalStyles = `
.chat-messages {
    max-width: 600px;
    width: 100%;
}

.message {
    margin-bottom: 16px;
    padding: 12px 16px;
    border-radius: 12px;
    max-width: 80%;
}

.user-message {
    background: #007AFF;
    color: white;
    margin-left: auto;
}

.ai-message {
    background: #f2f2f7;
    color: #1d1d1f;
}

.typing-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.typing-dots {
    display: flex;
    gap: 4px;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    background: #007AFF;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
}

.error-message {
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}

.dark-theme {
    background: #1d1d1f;
    color: white;
}

.dark-theme .sidebar,
.dark-theme .main-content,
.dark-theme .right-sidebar {
    background: #2d2d2f;
    border-color: #3d3d3f;
}

.dark-theme .nav-item:hover {
    background: #3d3d3f;
}

.dark-theme .chat-input {
    border-color: #3d3d3f;
    background: #2d2d2f;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);












