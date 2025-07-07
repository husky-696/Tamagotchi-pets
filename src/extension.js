const vscode = require("vscode")

// Global state for theme synchronization
let globalThemeState = "dark"
let globalPetType = "cat"
const allProviders = []

// Achievement system
const ACHIEVEMENTS = {
  FIRST_CHAT: { id: "first_chat", name: "First Words", description: "Had your first conversation", icon: "💬", xp: 10 },
  CODE_HELPER: {
    id: "code_helper",
    name: "Code Helper",
    description: "Asked for coding help 5 times",
    icon: "💻",
    xp: 25,
  },
  NIGHT_OWL: { id: "night_owl", name: "Night Owl", description: "Coded past midnight", icon: "🦉", xp: 15 },
  EARLY_BIRD: { id: "early_bird", name: "Early Bird", description: "Coded before 6 AM", icon: "🐦", xp: 15 },
  TERMINAL_MASTER: {
    id: "terminal_master",
    name: "Terminal Master",
    description: "Successfully ran 20 terminal commands",
    icon: "⚡",
    xp: 30,
  },
  SPEED_TYPER: {
    id: "speed_typer",
    name: "Speed Typer",
    description: "Typed 1000 characters in a session",
    icon: "⚡",
    xp: 20,
  },
  FILE_SAVER: { id: "file_saver", name: "File Saver", description: "Saved files 50 times", icon: "💾", xp: 25 },
  GIT_MASTER: { id: "git_master", name: "Git Master", description: "Made 20 commits", icon: "📝", xp: 35 },
  PET_LOVER: { id: "pet_lover", name: "Pet Lover", description: "Interacted with pet 100 times", icon: "💖", xp: 40 },
  EUREKA: { id: "eureka", name: "Eureka!", description: "Had a breakthrough moment", icon: "💡", xp: 50 },
  LEVEL_5: { id: "level_5", name: "Rising Star", description: "Reached level 5", icon: "⭐", xp: 50 },
  LEVEL_10: { id: "level_10", name: "Code Warrior", description: "Reached level 10", icon: "⚔️", xp: 100 },
  LEVEL_15: { id: "level_15", name: "Master Coder", description: "Reached level 15", icon: "👑", xp: 150 },
  LEVEL_20: { id: "level_20", name: "Code Legend", description: "Reached level 20", icon: "🏆", xp: 200 },
  TIP_MASTER: { id: "tip_master", name: "Tip Master", description: "Received 10 helpful tips", icon: "💡", xp: 30 },
}

// Background options
const BACKGROUNDS = [
  { id: "none", name: "None", file: null },
  { id: "forest", name: "Forest", file: "bg-forest.png" },
  { id: "city", name: "City", file: "bg-city.png" },
  { id: "sofa", name: "Cozy Sofa", file: "bg-sofa.png" },
]

class TamagotchiPetProvider {
  constructor(context, viewId = "main") {
    this._view = null
    this._context = context
    this._viewId = viewId
    this._webviewReady = false

    // Core pet state
    this._currentAnimation = "idle"
    this._petMood = "content"
    this._petLevel = 1
    this._petExp = 0
    this._isSleeping = false
    this._isDancing = false
    this._isProcessing = false
    this._lastPatTime = 0
    this._lastFeedTime = 0
    this._lastDanceTime = 0
    this._easterEggCount = 0
    this._chatHistory = []
    this._lastGreetingTime = 0
    this._lastEncouragementTime = 0
    this._gitReminderInterval = null
    this._saveReminderInterval = null
    this._conversationContext = []
    this._clickCount = 0
    this._clickTimer = null
    this._moodTimer = null
    this._funModeActive = false
    this._achievements = new Set()
    this._stats = {
      chatCount: 0,
      terminalCommands: 0,
      charactersTyped: 0,
      filesSaved: 0,
      commitsCount: 0,
      petInteractions: 0,
      tipsReceived: 0,
    }
    this._codeTracker = null
    this._currentBackground = "none"
    this._lastActivityTime = Date.now()
    this._inactivityTimer = null
    this._terminalWatcher = null
    this._effectsQueue = []
    this._isProcessingEffects = false
    this._lastEffectTime = 0
    this._animationTimeout = null

    // Add to global providers list for theme sync
    allProviders.push(this)

    // Load configuration
    this._loadConfiguration()

    // Load saved data (only for main view to avoid duplicates)
    if (viewId === "main") {
      this._loadPetData()
      // Show greeting immediately after a short delay
      setTimeout(() => {
        this._showGreeting()
      }, 1000)
      this._startGitReminders()
      this._startSaveReminders()
      this._startEncouragements()
      this._startMoodCycle()
      this._startFunMode()
      this._startInactivitySleepCycle()
      this._initCodeTracking()
      this._initCodingTracker() // Add this line
      this._startRandomTips()
      this._initTerminalWatcher()
    }

    console.log(`🐾 TamagotchiPetProvider initialized for ${viewId}`)
  }

  _loadConfiguration() {
    const config = vscode.workspace.getConfiguration("tamagotchiPets")
    this._currentModel = config.get("model") || "deepseek/deepseek-r1:free"
    this._currentTheme = config.get("theme") || "dark"
    this._petType = config.get("petType") || "cat"
    this._wordLimit = config.get("wordLimit") || 150
    this._enableGitReminders = config.get("enableGitReminders") || false
    this._enableSaveReminders = config.get("enableSaveReminders") || false
    this._showUtilityButtons = config.get("showUtilityButtons") !== false
    this._showSaveButton = config.get("showSaveButton") !== false
    this._showGitButton = config.get("showGitButton") !== false
    this._currentBackground = config.get("background") || "none"
    this._showInExplorer = config.get("showInExplorer") !== false

    // Update global states
    globalThemeState = this._currentTheme
    globalPetType = this._petType
  }

  resolveWebviewView(webviewView, context, token) {
    console.log(`🐾 Resolving webview view for ${this._viewId}`)
    this._view = webviewView

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, "media")],
    }

    // Set up message handling
    webviewView.webview.onDidReceiveMessage(async (message) => {
      console.log(`🐾 [${this._viewId}] Received message:`, message.command)
      try {
        await this._handleWebviewMessage(message)
      } catch (error) {
        console.error(`🐾 Error handling message ${message.command}:`, error)
        this._handleError(error)
      }
    })

    // Set up the webview content
    this._updateContent()

    // Wait for webview to fully initialize
    setTimeout(() => {
      if (!this._webviewReady) {
        console.log(`🐾 Webview not ready after timeout, sending initial state anyway for ${this._viewId}`)
        this._webviewReady = true
        this._sendInitialState()
      }
    }, 500)
  }

  _handleWebviewMessage(message) {
    switch (message.command) {
      case "changeTheme":
        this._changeTheme(message.theme)
        break
      case "changePetType":
        this._changePetType(message.petType)
        break
      case "changeBackground":
        this._changeBackground(message.background)
        break
      case "askAI":
        this._handleAIQuestion(message.question)
        break
      case "openSettings":
        this._openSettingsPanel()
        break
      case "setupApiKey":
        this._setupApiKey()
        break
      case "patPet":
        this._patPet()
        break
      case "feedPet":
        this._feedPet()
        break
      case "dancePet":
        this._dancePet()
        break
      case "wakeUp":
        this._handlePetClick()
        break
      case "clearChat":
        this._clearChatHistory()
        break
      case "saveFiles":
        this._saveAllFiles()
        break
      case "gitCommit":
        this._gitCommit()
        break
      case "showAchievements":
        this._showAchievements()
        break
      case "webviewReady":
        this._handleWebviewReady()
        break
      default:
        console.log("🐾 Unknown command:", message.command)
    }
  }

  _handleWebviewReady() {
    console.log(`🐾 Webview ready for ${this._viewId}`)
    this._webviewReady = true

    // Send initial state immediately when ready
    setTimeout(() => {
      this._sendInitialState()
    }, 50)
  }

  _sendInitialState() {
    if (!this._view || !this._view.webview) {
      console.log(`🐾 Webview not available for ${this._viewId}`)
      return
    }

    console.log(`🐾 Sending initial state to ${this._viewId}`)

    try {
      // Send current animation state
      this._view.webview.postMessage({
        command: "updateAnimation",
        state: this._currentAnimation,
      })

      // Send current stats (only for main view)
      if (this._viewId === "main") {
        this._view.webview.postMessage({
          command: "updateStats",
          level: this._petLevel,
          exp: this._petExp,
          expNeeded: this._petLevel * 100,
        })

        // Send chat history
        this._view.webview.postMessage({
          command: "updateChat",
          history: this._chatHistory.slice(-15),
        })
      }

      // Send current mood
      this._view.webview.postMessage({
        command: "updateMood",
        mood: this._petMood,
      })

      console.log(`🐾 Initial state sent successfully to ${this._viewId}`)
    } catch (error) {
      console.error(`🐾 Error sending initial state to ${this._viewId}:`, error)
    }
  }

  _handlePetClick() {
    this._updateActivity()
    this._clickCount++
    this._stats.petInteractions++

    // Check for pet lover achievement
    if (this._stats.petInteractions >= 100 && !this._achievements.has("pet_lover")) {
      this._unlockAchievement("pet_lover")
    }

    // Reset click timer
    if (this._clickTimer) {
      clearTimeout(this._clickTimer)
    }

    // Wake up if sleeping
    if (this._isSleeping) {
      this._wakeUp()
    } else {
      // Enhanced click responses based on mood and interaction count
      const clickResponses = this._getClickResponses()
      const response = clickResponses[Math.floor(Math.random() * clickResponses.length)]
      vscode.window.showInformationMessage(response)

      // Single click - show attention with enhanced effects
      this._setAnimation("happy", 1500)
      this._queueEffect("showEnhancedHearts")
    }

    // Reset click count after 2 seconds
    this._clickTimer = setTimeout(() => {
      this._clickCount = 0
    }, 2000)
  }

  _getClickResponses() {
    const moodResponses = {
      content: [
        "😊 Hello there! I'm feeling quite content today!",
        "💖 Thanks for the attention! I love spending time with you!",
        "✨ You always know how to make me smile!",
        "🌟 I'm so happy you're here with me!",
      ],
      happy: [
        "😄 I'm having such a wonderful day!",
        "🎉 Your presence makes everything better!",
        "💫 I'm practically glowing with happiness!",
        "🌈 Life is beautiful when we're coding together!",
      ],
      playful: [
        "😸 Want to play? I'm feeling super playful!",
        "🎮 Let's have some fun while we code!",
        "🎪 I'm in such a playful mood today!",
        "🎭 Ready for some coding adventures?",
      ],
      curious: [
        "🤔 I wonder what we'll discover today?",
        "🔍 There's so much to explore in the world of code!",
        "💭 I'm curious about your next project!",
        "🧐 What interesting problems are we solving?",
      ],
      focused: [
        "🎯 I'm ready to tackle any coding challenge!",
        "💻 Let's focus and create something amazing!",
        "🔬 I'm in my focused zone - let's code!",
        "⚡ My concentration is at peak level!",
      ],
      cheerful: [
        "☀️ What a bright and cheerful day for coding!",
        "🌻 I'm feeling so upbeat and positive!",
        "🎵 Everything seems wonderful today!",
        "🌺 Your cheerful companion is here to help!",
      ],
      relaxed: [
        "😌 I'm feeling so calm and relaxed today!",
        "🧘‍♀️ Let's take our time and enjoy the process!",
        "🌊 Peaceful coding vibes all around!",
        "🍃 Sometimes the best code comes from a relaxed mind!",
      ],
      energetic: [
        "⚡ I'm bursting with energy today!",
        "🚀 Ready to power through any coding challenge!",
        "💥 Let's channel this energy into amazing code!",
        "🔥 I'm fired up and ready to go!",
      ],
    }

    const generalResponses = [
      "💖 You clicked on me! I love the attention!",
      "✨ Every click makes our bond stronger!",
      "🐾 Paw-some! Thanks for the interaction!",
      "🌟 You're the best coding companion ever!",
      "💫 I'm always here when you need me!",
      "🎈 Click me anytime - I love it!",
      "🌸 Your virtual pet appreciates you!",
      "🎊 Thanks for making my day brighter!",
    ]

    // Return mood-specific responses if available, otherwise general ones
    return moodResponses[this._petMood] || generalResponses
  }

  async _changeBackground(background) {
    await vscode.workspace
      .getConfiguration("tamagotchiPets")
      .update("background", background, vscode.ConfigurationTarget.Global)
    this._currentBackground = background

    // Update all views
    allProviders.forEach((provider) => {
      provider._currentBackground = background
      provider._updateContent()
    })
  }

  _showAchievements() {
    const totalAchievements = Object.keys(ACHIEVEMENTS).length
    const unlockedCount = this._achievements.size

    const panel = vscode.window.createWebviewPanel(
      "tamagotchiAchievements",
      "🏆 Pet Achievements",
      vscode.ViewColumn.Two,
      { enableScripts: true },
    )

    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
          }
          .achievement {
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            transition: all 0.3s ease;
          }
          .achievement.unlocked {
            border-color: #4CAF50;
            background: rgba(76, 175, 80, 0.1);
            transform: scale(1.02);
          }
          .achievement.locked {
            opacity: 0.5;
          }
          .progress {
            margin: 20px 0;
            font-size: 18px;
            text-align: center;
            font-weight: bold;
          }
          .progress-bar {
            width: 100%;
            height: 20px;
            background: var(--vscode-input-background);
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #45a049);
            width: ${Math.round((unlockedCount / totalAchievements) * 100)}%;
            transition: width 1s ease;
          }
        </style>
      </head>
      <body>
        <h1>🏆 Achievements (${unlockedCount}/${totalAchievements})</h1>
        <div class="progress">Progress: ${Math.round((unlockedCount / totalAchievements) * 100)}%</div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        ${Object.values(ACHIEVEMENTS)
          .map(
            (achievement) => `
          <div class="achievement ${this._achievements.has(achievement.id) ? "unlocked" : "locked"}">
            <h3>${achievement.icon} ${achievement.name} ${this._achievements.has(achievement.id) ? "✅" : "🔒"}</h3>
            <p>${achievement.description}</p>
            <small>+${achievement.xp} XP</small>
          </div>
        `,
          )
          .join("")}
      </body>
      </html>
    `
  }

  async _dancePet() {
    this._updateActivity()
    const now = Date.now()
    const cooldownTime = 20000 // 20 seconds
    const timeSinceLastDance = now - this._lastDanceTime

    if (timeSinceLastDance < cooldownTime) {
      const remainingTime = Math.ceil((cooldownTime - timeSinceLastDance) / 1000)
      vscode.window.showWarningMessage(`🐾 Wait ${remainingTime} more seconds before dancing again!`)
      return
    }

    if (this._isDancing || this._isSleeping) return

    this._lastDanceTime = now
    this._isDancing = true
    this._petMood = "excited"

    const danceMessages = [
      "💃 Dance party time! Your pet is showing off! ✨",
      "🕺 Look at those moves! Your pet is a dancing star! 🌟",
      "🎵 Dancing to the rhythm of code! So groovy! 🎶",
      "🎉 Your pet is busting some serious moves! 💃",
      "✨ Dance fever! Your pet can't stop the rhythm! 🎶",
      "🎪 Time for a dance show! Your pet loves to perform! 🎭",
      "🌟 Dancing like nobody's watching! So cute! 💖",
      "🎵 Rhythm and code! The perfect combination! 🎶",
    ]

    const message = danceMessages[Math.floor(Math.random() * danceMessages.length)]
    vscode.window.showInformationMessage(message)

    // Use dance GIF with enhanced effects
    this._setAnimation("dance", 3000) // Reduced from 4000
    this._queueEffect("showEnhancedSparkles")

    setTimeout(() => {
      this._isDancing = false
      this._petMood = "happy"
      this._gainExp(20)
      setTimeout(() => {
        if (!this._isSleeping) this._setAnimation("idle")
        this._petMood = "content"
      }, 1000) // Reduced from 2000
    }, 3000) // Reduced from 4000
  }

  async _saveAllFiles() {
    this._updateActivity()
    try {
      // Get all dirty (unsaved) documents
      const dirtyDocuments = vscode.workspace.textDocuments.filter((doc) => doc.isDirty && !doc.isUntitled)

      if (dirtyDocuments.length === 0) {
        vscode.window.showInformationMessage("🐾 All files are already saved! You're so organized! ✨")
        return
      }

      // Save each document individually
      let savedCount = 0
      for (const doc of dirtyDocuments) {
        try {
          await doc.save()
          savedCount++
        } catch (error) {
          console.error("Failed to save document:", doc.fileName, error)
        }
      }

      // Also try the workspace save all as backup
      await vscode.workspace.saveAll(false)

      const saveMessages = [
        `💾 Successfully saved ${savedCount} files! Your work is safe and sound! ✨`,
        `📁 ${savedCount} files saved perfectly! Great job staying organized! 🌟`,
        `💽 All ${savedCount} files saved! Your pet is proud of you! 💖`,
        `🗃️ ${savedCount} files secured! Your code is protected! 🛡️`,
        `📋 Save complete! ${savedCount} files are now safe! 🎯`,
      ]

      const message = saveMessages[Math.floor(Math.random() * saveMessages.length)]
      vscode.window.showInformationMessage(message)

      this._setAnimation("lightbulb", 2000) // Reduced from 3000
      this._queueEffect("showEnhancedSparkles")
      this._gainExp(8)
    } catch (error) {
      console.error("Save files error:", error)
      vscode.window.showErrorMessage("🐾 Failed to save some files: " + error.message)
    }
  }

  async _gitCommit() {
    this._updateActivity()
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("🐾 No workspace folder found for git operations!")
        return
      }

      // Check if git extension is available
      const gitExtension = vscode.extensions.getExtension("vscode.git")
      if (!gitExtension) {
        vscode.window.showErrorMessage("🐾 Git extension not found! Please install the Git extension.")
        return
      }

      if (!gitExtension.isActive) {
        await gitExtension.activate()
      }

      // Try different git commit approaches
      try {
        // Method 1: Try the standard git commit command
        await vscode.commands.executeCommand("git.commit")
      } catch (error1) {
        try {
          // Method 2: Try git commitAll
          await vscode.commands.executeCommand("git.commitAll")
        } catch (error2) {
          try {
            // Method 3: Try opening source control view
            await vscode.commands.executeCommand("workbench.view.scm")
            vscode.window.showInformationMessage(
              "🐾 Opened Source Control! Click the ✓ button to commit your changes! 📝",
            )
          } catch (error3) {
            throw new Error("All git commit methods failed")
          }
        }
      }

      // Track commits for achievement
      this._stats.commitsCount++
      if (this._stats.commitsCount >= 20 && !this._achievements.has("git_master")) {
        this._unlockAchievement("git_master")
      }

      const commitMessages = [
        "📝 Git commit initiated! Your pet loves version control! 🐾",
        "🔄 Committing your awesome changes! Great workflow! ✨",
        "📋 Git commit started! Your pet approves of good practices! 💖",
        "🎯 Committing code like a pro! Your pet is impressed! 🌟",
        "📦 Git commit in progress! Excellent version management! 🚀",
        "🎉 Time to commit those amazing changes! 📝",
        "💫 Your code deserves to be committed! Great work! ✨",
        "🏆 Committing like a champion developer! 🥇",
      ]

      const message = commitMessages[Math.floor(Math.random() * commitMessages.length)]
      vscode.window.showInformationMessage(message)

      // Enhanced commit celebration with confetti!
      this._setAnimation("lightbulb", 2500) // Reduced from 4000
      this._queueEffect("showConfetti")
      this._gainExp(10)
    } catch (error) {
      console.error("Git commit error:", error)
      vscode.window.showErrorMessage("🐾 Git commit failed: " + error.message)
    }
  }

  async _changeTheme(theme) {
    await vscode.workspace.getConfiguration("tamagotchiPets").update("theme", theme, vscode.ConfigurationTarget.Global)
    this._currentTheme = theme
    globalThemeState = theme
    this._syncThemeToAllProviders()
  }

  _syncThemeToAllProviders() {
    console.log(`🐾 Syncing theme ${globalThemeState} to all providers`)
    allProviders.forEach((provider) => {
      provider._currentTheme = globalThemeState
      provider._updateContent()
    })
  }

  async _changePetType(petType) {
    await vscode.workspace
      .getConfiguration("tamagotchiPets")
      .update("petType", petType, vscode.ConfigurationTarget.Global)
    this._petType = petType
    globalPetType = petType
    allProviders.forEach((provider) => {
      provider._petType = petType
      provider._updateContent()
    })
  }

  async _openSettingsPanel() {
    console.log("🐾 Opening settings panel")
    const config = vscode.workspace.getConfiguration("tamagotchiPets")

    const panel = vscode.window.createWebviewPanel(
      "tamagotchiSettings",
      "🐾 Tamagotchi Pet Settings",
      vscode.ViewColumn.Two,
      { enableScripts: true },
    )

    const currentSettings = {
      apiKey: config.get("apiKey") || "",
      model: config.get("model") || "deepseek/deepseek-r1:free",
      theme: config.get("theme") || "dark",
      petType: config.get("petType") || "cat",
      wordLimit: config.get("wordLimit") || 150,
      enableGitReminders: config.get("enableGitReminders") || false,
      enableSaveReminders: config.get("enableSaveReminders") || false,
      showUtilityButtons: config.get("showUtilityButtons") !== false,
      showSaveButton: config.get("showSaveButton") !== false,
      showGitButton: config.get("showGitButton") !== false,
      background: config.get("background") || "none",
      showInExplorer: config.get("showInExplorer") !== false,
    }

    panel.webview.html = this._getSettingsHtml(currentSettings)

    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.command === "saveSettings") {
        await this._saveSettings(message.settings)
        vscode.window.showInformationMessage("🐾 Settings saved successfully! ✨")
        panel.dispose()
      }
    })
  }

  _getSettingsHtml(settings) {
    const backgroundOptions = BACKGROUNDS.map(
      (bg) => `<option value="${bg.id}" ${settings.background === bg.id ? "selected" : ""}>${bg.name}</option>`,
    ).join("")

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            line-height: 1.6;
          }
          .settings-container {
            max-width: 700px;
            margin: 0 auto;
          }
          .title {
            text-align: center;
            margin-bottom: 30px;
            font-size: 28px;
            color: var(--vscode-foreground);
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: bold;
          }
          
          .setting-group {
            margin-bottom: 25px;
            padding: 20px;
            background: linear-gradient(135deg, var(--vscode-input-background), rgba(255,255,255,0.02));
            border-radius: 15px;
            border: 2px solid var(--vscode-input-border);
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          }
          .setting-group:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-color: var(--vscode-button-background);
          }
          .setting-label {
            font-weight: bold;
            margin-bottom: 10px;
            display: block;
            color: var(--vscode-foreground);
            font-size: 16px;
          }
          .setting-description {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
            line-height: 1.5;
          }
          input, select, textarea {
            width: 100%;
            padding: 12px 16px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 2px solid var(--vscode-input-border);
            border-radius: 10px;
            font-size: 14px;
            box-sizing: border-box;
            transition: all 0.3s ease;
            font-family: inherit;
          }
          input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: var(--vscode-button-background);
            transform: scale(1.02);
            box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.2);
          }
          input[type="password"] {
            font-family: 'Courier New', monospace;
          }
          input[type="checkbox"] {
            width: auto;
            margin-right: 10px;
            transform: scale(1.2);
          }
          .checkbox-container {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            padding: 8px;
            border-radius: 8px;
            transition: background 0.2s ease;
          }
          .checkbox-container:hover {
            background: rgba(255,255,255,0.05);
          }
          .button-group {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            margin-top: 35px;
          }
          button {
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }
          .save-button {
            background: linear-gradient(135deg, var(--vscode-button-background), var(--vscode-button-hoverBackground));
            color: var(--vscode-button-foreground);
            box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          }
          .save-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          }
          .cancel-button {
            background: linear-gradient(135deg, var(--vscode-button-secondaryBackground), #666);
            color: var(--vscode-button-secondaryForeground);
            box-shadow: 0 6px 20px rgba(0,0,0,0.1);
          }
          .cancel-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }
        </style>
      </head>
      <body>
        <div class="settings-container">
          <h1 class="title">🐾 Pet Settings</h1>
          
          <div class="setting-group">
            <label class="setting-label">🔑 OpenRouter API Key</label>
            <div class="setting-description">
              Get free credits at <a href="https://openrouter.ai" target="_blank">openrouter.ai</a>
            </div>
            <input type="password" id="apiKey" value="${settings.apiKey}" placeholder="Enter your API key...">
          </div>

          <div class="setting-group">
            <label class="setting-label">🤖 AI Model</label>
            <div class="setting-description">Choose which AI model to use for assistance</div>
            <select id="model">
              <option value="deepseek/deepseek-r1:free" ${settings.model === "deepseek/deepseek-r1:free" ? "selected" : ""}>DeepSeek R1 (Free) - Latest reasoning model</option>
              <option value="deepseek/deepseek-chat" ${settings.model === "deepseek/deepseek-chat" ? "selected" : ""}>DeepSeek Chat - Great for conversations</option>
              <option value="google/gemini-flash-1.5" ${settings.model === "google/gemini-flash-1.5" ? "selected" : ""}>Gemini Flash 1.5 - Fast and efficient</option>
              <option value="meta-llama/llama-3.1-8b-instruct:free" ${settings.model === "meta-llama/llama-3.1-8b-instruct:free" ? "selected" : ""}>Llama 3.1 8B (Free) - Open source</option>
              <option value="microsoft/phi-3-mini-128k-instruct:free" ${settings.model === "microsoft/phi-3-mini-128k-instruct:free" ? "selected" : ""}>Phi-3 Mini (Free) - Lightweight</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">📝 AI Response Word Limit</label>
            <div class="setting-description">Maximum words in AI responses (0 = unlimited, 50-400)</div>
            <input type="number" id="wordLimit" value="${settings.wordLimit}" min="0" max="400" placeholder="150">
          </div>

          <div class="setting-group">
            <label class="setting-label">🎨 Theme</label>
            <div class="setting-description">Choose your visual theme</div>
            <select id="theme">
              <option value="light" ${settings.theme === "light" ? "selected" : ""}>☀️ Light</option>
              <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>🌙 Dark</option>
              <option value="cherry" ${settings.theme === "cherry" ? "selected" : ""}>🌸 Cherry</option>
              <option value="hacker" ${settings.theme === "hacker" ? "selected" : ""}>💚 Hacker</option>
              <option value="cozy" ${settings.theme === "cozy" ? "selected" : ""}>🏠 Cozy</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">🐾 Pet Type</label>
            <div class="setting-description">Choose your companion</div>
            <select id="petType">
              <option value="cat" ${settings.petType === "cat" ? "selected" : ""}>🐱 Cat</option>
              <option value="raccoon" ${settings.petType === "raccoon" ? "selected" : ""}>🦝 Raccoon</option>
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">🖼️ Background</label>
            <div class="setting-description">Choose a background for your pet</div>
            <select id="background">
              ${backgroundOptions}
            </select>
          </div>

          <div class="setting-group">
            <label class="setting-label">🔧 Optional Features</label>
            <div class="setting-description">Enable/disable additional features</div>
            <div class="checkbox-container">
              <input type="checkbox" id="enableGitReminders" ${settings.enableGitReminders ? "checked" : ""}>
              <label for="enableGitReminders">📝 Git Reminders (commit/push notifications)</label>
            </div>
            <div class="checkbox-container">
              <input type="checkbox" id="enableSaveReminders" ${settings.enableSaveReminders ? "checked" : ""}>
              <label for="enableSaveReminders">💾 Save Reminders (unsaved file notifications)</label>
            </div>
            <div class="checkbox-container">
              <input type="checkbox" id="showInExplorer" ${settings.showInExplorer ? "checked" : ""}>
              <label for="showInExplorer">👁️ Show pet in Explorer sidebar</label>
            </div>
          </div>

          <div class="setting-group">
            <label class="setting-label">🎛️ Button Visibility</label>
            <div class="setting-description">Choose which buttons to show in the main panel</div>
            <div class="checkbox-container">
              <input type="checkbox" id="showUtilityButtons" ${settings.showUtilityButtons ? "checked" : ""}>
              <label for="showUtilityButtons">🔧 Utility Buttons (API Key, Clear Chat)</label>
            </div>
            <div class="checkbox-container">
              <input type="checkbox" id="showSaveButton" ${settings.showSaveButton ? "checked" : ""}>
              <label for="showSaveButton">💾 Save Files Button</label>
            </div>
            <div class="checkbox-container">
              <input type="checkbox" id="showGitButton" ${settings.showGitButton ? "checked" : ""}>
              <label for="showGitButton">📝 Git Commit Button</label>
            </div>
          </div>

          <div class="button-group">
            <button class="cancel-button" onclick="window.close()">Cancel</button>
            <button class="save-button" onclick="saveSettings()">💾 Save Settings</button>
          </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          
          function saveSettings() {
            const settings = {
              apiKey: document.getElementById('apiKey').value,
              model: document.getElementById('model').value,
              theme: document.getElementById('theme').value,
              petType: document.getElementById('petType').value,
              background: document.getElementById('background').value,
              wordLimit: parseInt(document.getElementById('wordLimit').value) || 150,
              enableGitReminders: document.getElementById('enableGitReminders').checked,
              enableSaveReminders: document.getElementById('enableSaveReminders').checked,
              showUtilityButtons: document.getElementById('showUtilityButtons').checked,
              showSaveButton: document.getElementById('showSaveButton').checked,
              showGitButton: document.getElementById('showGitButton').checked,
              showInExplorer: document.getElementById('showInExplorer').checked
            };
            
            vscode.postMessage({
              command: 'saveSettings',
              settings: settings
            });
          }
        </script>
      </body>
      </html>
    `
  }

  async _saveSettings(settings) {
    console.log("🐾 Saving settings:", settings)
    const config = vscode.workspace.getConfiguration("tamagotchiPets")

    try {
      await config.update("apiKey", settings.apiKey, vscode.ConfigurationTarget.Global)
      await config.update("model", settings.model, vscode.ConfigurationTarget.Global)
      await config.update("theme", settings.theme, vscode.ConfigurationTarget.Global)
      await config.update("petType", settings.petType, vscode.ConfigurationTarget.Global)
      await config.update("background", settings.background, vscode.ConfigurationTarget.Global)
      await config.update("wordLimit", settings.wordLimit, vscode.ConfigurationTarget.Global)
      await config.update("enableGitReminders", settings.enableGitReminders, vscode.ConfigurationTarget.Global)
      await config.update("enableSaveReminders", settings.enableSaveReminders, vscode.ConfigurationTarget.Global)
      await config.update("showUtilityButtons", settings.showUtilityButtons, vscode.ConfigurationTarget.Global)
      await config.update("showSaveButton", settings.showSaveButton, vscode.ConfigurationTarget.Global)
      await config.update("showGitButton", settings.showGitButton, vscode.ConfigurationTarget.Global)
      await config.update("showInExplorer", settings.showInExplorer, vscode.ConfigurationTarget.Global)

      // Update all providers with new settings
      allProviders.forEach((provider) => {
        provider._loadConfiguration()
        provider._updateContent()
      })

      // Restart reminders if enabled (only for main view)
      if (this._viewId === "main") {
        this._startGitReminders()
        this._startSaveReminders()
      }
    } catch (error) {
      console.error("🐾 Error saving settings:", error)
      vscode.window.showErrorMessage("Failed to save settings: " + error.message)
    }
  }

  async _setupApiKey() {
    const apiKey = await vscode.window.showInputBox({
      prompt: "Enter your OpenRouter API Key (get free credits at openrouter.ai)",
      password: true,
      validateInput: (text) => {
        if (!text?.trim()) {
          return "API key cannot be empty"
        }
        return null
      },
    })

    if (apiKey) {
      await vscode.workspace
        .getConfiguration("tamagotchiPets")
        .update("apiKey", apiKey, vscode.ConfigurationTarget.Global)
      this._setAnimation("lightbulb", 2000) // Reduced from 3000
      this._gainExp(10)
      vscode.window.showInformationMessage("✨ API Key saved! Your pet is ready to help!")

      // Update all views
      allProviders.forEach((provider) => provider._updateContent())
    }
  }

  async _handleAIQuestion(question) {
    this._updateActivity()
    if (this._isProcessing) {
      vscode.window.showWarningMessage("🐾 I'm still thinking! Please wait...")
      return
    }

    const config = vscode.workspace.getConfiguration("tamagotchiPets")
    const apiKey = config.get("apiKey")

    if (!apiKey) {
      this._setAnimation("idle")
      await this._setupApiKey()
      return
    }

    // Track chat for achievements
    this._stats.chatCount++
    if (this._stats.chatCount === 1 && !this._achievements.has("first_chat")) {
      this._unlockAchievement("first_chat")
    }
    if (this._stats.chatCount >= 5 && !this._achievements.has("code_helper")) {
      this._unlockAchievement("code_helper")
    }

    // Add to conversation context
    this._conversationContext.push({ role: "user", content: question, timestamp: Date.now() })
    this._chatHistory.push({ role: "user", content: question, timestamp: Date.now() })
    this._updateChatDisplay()

    try {
      // Easter egg triggers
      if (question.toLowerCase().includes("meow") || question.toLowerCase().includes("nya")) {
        this._setAnimation("happy", 2000) // Reduced from 3000
        const responses = [
          "Nya nya! 😺 You said the magic word! I'm so happy! What coding adventure shall we go on today? ✨",
          "Purr purr... 🐱 That makes my digital heart sing! Ready to tackle some amazing code together? 💖",
          "Meow meow! 😸 You're absolutely the best human ever! What programming challenge can I help you conquer? 🚀",
          "Did someone say meow? 😺 My ears perked up! I'm all ready to help with your development journey! 💫",
          "Nya~ 💕 You make me so incredibly happy! Let's create something beautiful with code today! 🌟",
          "Meow! 🐾 That's my favorite sound in the whole world! What amazing project are we working on? ✨",
        ]
        const response = responses[Math.floor(Math.random() * responses.length)]
        this._addChatResponse(response)
        this._gainExp(5)
        this._petMood = "excited"
        setTimeout(() => {
          if (!this._isSleeping) this._setAnimation("idle")
          this._petMood = "content"
        }, 2000) // Reduced from 3000
        return
      }

      if (question.toLowerCase().includes("coffee")) {
        const coffeeResponse =
          "☕ *sips virtual coffee with you* Ahh, perfect! ☕ Coffee time is the best time for coding! I love sharing these moments with you! What are you brewing up in your code today? 💻✨"
        this._addChatResponse(coffeeResponse)
        this._gainExp(5)
        return
      }

      // Raccoon-specific easter eggs
      if (this._petType === "raccoon") {
        if (question.toLowerCase().includes("trash") || question.toLowerCase().includes("garbage")) {
          const trashResponse =
            "🗑️ *rummages through digital trash* Ooh, I found some deprecated code! Let me help you clean this up and make it shiny! What coding treasures are we organizing today? 🦝✨"
          this._addChatResponse(trashResponse)
          this._gainExp(5)
          return
        }

        if (question.toLowerCase().includes("mask") || question.toLowerCase().includes("bandit")) {
          const maskResponse =
            "🎭 *adjusts tiny mask* You caught me! I'm your friendly neighborhood code bandit, here to steal bugs and leave behind beautiful, working code! What mischief shall we get into today? 🦝💻"
          this._addChatResponse(maskResponse)
          this._gainExp(5)
          return
        }

        if (question.toLowerCase().includes("wash") || question.toLowerCase().includes("clean")) {
          const washResponse =
            "🧼 *washes paws carefully* Cleanliness is next to code-liness! I love keeping things tidy - let's wash away those bugs and polish your code until it sparkles! 🦝✨"
          this._addChatResponse(washResponse)
          this._gainExp(5)
          return
        }
      }

      this._isProcessing = true
      this._setAnimation("thinking") // Use thinking for AI processing
      this._petMood = "focused"

      // Show typing indicator
      this._showTypingIndicator()

      const response = await this._getAIResponse(question)
      this._gainExp(8)
      this._addChatResponse(response)

      // Show lightbulb when AI response is complete
      this._setAnimation("lightbulb", 2000) // Reduced from 3000
      this._queueEffect("showEnhancedSparkles")

      setTimeout(() => {
        if (!this._isSleeping) this._setAnimation("idle")
        this._petMood = "content"
      }, 2000) // Reduced from 3000
    } catch (error) {
      this._handleError(error)
    } finally {
      this._isProcessing = false
      this._hideTypingIndicator()
    }
  }

  _showTypingIndicator() {
    if (this._view && this._view.webview) {
      try {
        this._view.webview.postMessage({
          command: "showTyping",
        })
      } catch (error) {
        console.error("🐾 Error showing typing indicator:", error)
      }
    }
  }

  _hideTypingIndicator() {
    if (this._view && this._view.webview) {
      try {
        this._view.webview.postMessage({
          command: "hideTyping",
        })
      } catch (error) {
        console.error("🐾 Error hiding typing indicator:", error)
      }
    }
  }

  async _getAIResponse(prompt) {
    const config = vscode.workspace.getConfiguration("tamagotchiPets")
    const apiKey = config.get("apiKey")

    if (!apiKey) {
      throw new Error("Please set your OpenRouter API key first")
    }

    try {
      // Enhanced system prompt for better responses
      const petName = this._petType === "cat" ? "Whiskers" : "Bandit"
      const systemPrompt = `You are ${petName}, a helpful AI assistant and adorable virtual ${this._petType} companion. You're a coding buddy who genuinely cares about your human!

PERSONALITY:
- Warm, encouraging, and genuinely supportive like a loyal ${this._petType}
- Use 1-2 relevant emojis per response (not excessive)
- Be enthusiastic about coding and learning
- Show genuine care and interest in your human's work
- Be conversational and friendly, not overly formal
- ${this._petType === "cat" ? "Occasionally use cat-like expressions (purr, meow)" : "Show raccoon-like curiosity and cleverness"}

RESPONSE STYLE:
- Keep responses concise but complete (aim for ${this._wordLimit} words or less)
- Always provide complete answers - don't cut off mid-sentence
- Focus on practical, actionable advice with examples
- Use simple, clear language
- Be encouraging and positive
- Include code examples when relevant and requested
- Ask follow-up questions to better help
- Structure longer responses with bullet points or numbered lists

CODING HELP:
- Provide complete, working code examples
- Explain what the code does
- Mention best practices and potential improvements
- Suggest testing approaches when relevant

CURRENT CONTEXT:
- Pet mood: ${this._petMood}
- Pet level: ${this._petLevel}
- Time: ${new Date().toLocaleTimeString()}

Remember: You're not just an AI, you're a caring companion who wants to help your human succeed! Always complete your thoughts and provide full, helpful responses. 🐾`

      // Build conversation context (last 6 messages for context)
      const recentContext = this._conversationContext.slice(-6)
      const messages = [{ role: "system", content: systemPrompt }, ...recentContext, { role: "user", content: prompt }]

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/hajin-dev/tamagotchi-pets",
          "X-Title": "Tamagotchi Pets VS Code Extension",
        },
        body: JSON.stringify({
          model: this._currentModel,
          messages: messages,
          max_tokens: Math.min(this._wordLimit * 2, 800), // Rough word-to-token conversion
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || "Unknown error"}`)
      }

      const data = await response.json()
      const aiResponse = data.choices?.[0]?.message?.content?.trim()

      if (!aiResponse) {
        throw new Error("No response from AI")
      }

      // Add to conversation context
      this._conversationContext.push({ role: "assistant", content: aiResponse, timestamp: Date.now() })

      // Keep context manageable (last 10 messages)
      if (this._conversationContext.length > 10) {
        this._conversationContext = this._conversationContext.slice(-10)
      }

      return aiResponse
    } catch (error) {
      console.error("🐾 AI API Error:", error)
      throw error
    }
  }

  _addChatResponse(response) {
    this._chatHistory.push({ role: "assistant", content: response, timestamp: Date.now() })
    this._updateChatDisplay()
    this._savePetData()
  }

  _updateChatDisplay() {
    // Only update main view with chat
    if (this._viewId === "main" && this._view && this._view.webview) {
      try {
        this._view.webview.postMessage({
          command: "updateChat",
          history: this._chatHistory.slice(-15), // Show last 15 messages
        })
      } catch (error) {
        console.error("🐾 Error updating chat display:", error)
      }
    }
  }

  _clearChatHistory() {
    this._chatHistory = []
    this._conversationContext = []
    this._updateChatDisplay()
    vscode.window.showInformationMessage("🐾 Chat history cleared! Fresh start! ✨")
  }

  _handleError(error) {
    console.error("🐾 Error:", error)
    this._setAnimation("idle")
    this._petMood = "content"

    let errorMessage = "Something went wrong! 😿"
    if (error.message.includes("API Error: 401")) {
      errorMessage = "🔑 Invalid API key! Please check your OpenRouter API key."
    } else if (error.message.includes("API Error: 429")) {
      errorMessage = "⏰ Rate limit reached! Please wait a moment before trying again."
    } else if (error.message.includes("API Error: 402")) {
      errorMessage = "💳 Insufficient credits! Please add credits to your OpenRouter account."
    } else if (error.message.includes("Network")) {
      errorMessage = "🌐 Network error! Please check your internet connection."
    }

    this._addChatResponse(`${errorMessage} Error: ${error.message}`)
  }

  _patPet() {
    this._updateActivity()
    const now = Date.now()
    const timeSinceLastPat = now - this._lastPatTime

    if (timeSinceLastPat < 5000) {
      vscode.window.showWarningMessage("🐾 Give me a moment to enjoy the last pat! 💖")
      return
    }

    this._lastPatTime = now
    this._stats.petInteractions++

    // Check for pet lover achievement
    if (this._stats.petInteractions >= 100 && !this._achievements.has("pet_lover")) {
      this._unlockAchievement("pet_lover")
    }

    const patMessages = [
      "💖 Purr purr... That feels amazing! You're the best! ✨",
      "😸 I love your gentle pats! You make me so happy! 💕",
      "🥰 Your pats are magical! I feel so loved and cared for! 🌟",
      "💫 That's exactly what I needed! You always know how to cheer me up! 😊",
      "🌈 Your kindness makes my digital heart glow! Thank you! 💖",
      "✨ Every pat makes our bond stronger! I'm so lucky to have you! 🐾",
      "💝 You have the most wonderful touch! I feel so content! 😌",
      "🎀 That pat was perfect! You're such a caring companion! 💕",
    ]

    const message = patMessages[Math.floor(Math.random() * patMessages.length)]
    vscode.window.showInformationMessage(message)

    this._setAnimation("happy", 2000) // Reduced from 3000
    this._queueEffect("showEnhancedHearts")
    this._petMood = "happy"
    this._gainExp(5)

    setTimeout(() => {
      if (!this._isSleeping) this._setAnimation("idle")
      this._petMood = "content"
    }, 2000) // Reduced from 3000
  }

  _feedPet() {
    this._updateActivity()
    const now = Date.now()
    const timeSinceLastFeed = now - this._lastFeedTime

    if (timeSinceLastFeed < 10000) {
      vscode.window.showWarningMessage("🐾 I'm still full from the last treat! Maybe in a few seconds? 😋")
      return
    }

    this._lastFeedTime = now
    this._stats.petInteractions++

    const feedMessages = [
      "😋 Nom nom nom! This is absolutely delicious! Thank you! ✨",
      "🍎 Yummy! You always pick the best treats for me! 💖",
      "😸 This tastes amazing! You're such a thoughtful friend! 🌟",
      "🥰 Perfect timing! I was just getting a little hungry! 💕",
      "🍯 Sweet and delicious! You know exactly what I love! 😊",
      "🎉 Food time is the best time! Especially when it's from you! 💫",
      "😋 Mmm, this hits the spot perfectly! You're wonderful! 🌈",
      "🍓 Every bite is pure happiness! Thank you for caring! 💝",
    ]

    const message = feedMessages[Math.floor(Math.random() * feedMessages.length)]
    vscode.window.showInformationMessage(message)

    this._setAnimation("eating", 3000) // Reduced from 4000
    this._queueEffect("showEnhancedSparkles")
    this._petMood = "content"
    this._gainExp(8)

    setTimeout(() => {
      if (!this._isSleeping) this._setAnimation("idle")
    }, 3000) // Reduced from 4000
  }

  _setAnimation(animation, duration = 0) {
    // Clear any existing animation timeout
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout)
      this._animationTimeout = null
    }

    this._currentAnimation = animation
    console.log(`🐾 Setting animation to: ${animation} for ${duration}ms`)

    // Update all views with new animation
    allProviders.forEach((provider) => {
      if (provider._view && provider._view.webview && provider._webviewReady) {
        try {
          provider._view.webview.postMessage({
            command: "updateAnimation",
            state: animation,
          })
        } catch (error) {
          console.error(`🐾 Error updating animation for ${provider._viewId}:`, error)
        }
      }
    })

    // Auto-return to idle after duration
    if (duration > 0) {
      this._animationTimeout = setTimeout(() => {
        if (!this._isSleeping && !this._isDancing) {
          this._setAnimation("idle")
        }
      }, duration)
    }
  }

  _queueEffect(effectType, data = {}) {
    // Skip effects if view is not visible
    if (!this._view || this._view.visible === false) return

    // Throttle effects to prevent overwhelming
    const now = Date.now()
    if (this._lastEffectTime && now - this._lastEffectTime < 100) return
    this._lastEffectTime = now

    // Execute effect immediately for better responsiveness
    this._executeEffect({ type: effectType, data, timestamp: now })
  }

  _executeEffect(effect) {
    // Only update views that are actually visible and ready
    allProviders.forEach((provider) => {
      if (provider._view && provider._view.webview && provider._webviewReady) {
        try {
          provider._view.webview.postMessage({
            command: effect.type,
            ...effect.data,
          })
        } catch (error) {
          console.error(`🐾 Error sending effect ${effect.type} to ${provider._viewId}:`, error)
        }
      }
    })
  }

  _gainExp(amount) {
    this._petExp += amount
    const expNeeded = this._petLevel * 100

    if (this._petExp >= expNeeded) {
      this._petLevel++
      this._petExp = 0

      // Level-based achievements
      if (this._petLevel === 5 && !this._achievements.has("level_5")) {
        this._unlockAchievement("level_5")
      } else if (this._petLevel === 10 && !this._achievements.has("level_10")) {
        this._unlockAchievement("level_10")
      } else if (this._petLevel === 15 && !this._achievements.has("level_15")) {
        this._unlockAchievement("level_15")
      } else if (this._petLevel === 20 && !this._achievements.has("level_20")) {
        this._unlockAchievement("level_20")
      }

      vscode.window.showInformationMessage(`🎉 Level Up! Your pet is now level ${this._petLevel}! ✨`)
      this._setAnimation("happy", 3000) // Reduced from 4000
      this._queueEffect("showLevelUp", { level: this._petLevel })
    }

    this._savePetData()

    // Update stats in all views
    allProviders.forEach((provider) => {
      if (provider._view && provider._view.webview && provider._webviewReady) {
        try {
          provider._view.webview.postMessage({
            command: "updateStats",
            level: this._petLevel,
            exp: this._petExp,
            expNeeded: this._petLevel * 100,
          })
        } catch (error) {
          console.error(`🐾 Error updating stats for ${provider._viewId}:`, error)
        }
      }
    })
  }

  _unlockAchievement(achievementId) {
    if (this._achievements.has(achievementId)) return

    const achievement = ACHIEVEMENTS[achievementId]
    if (!achievement) return

    this._achievements.add(achievementId)
    this._gainExp(achievement.xp)

    vscode.window.showInformationMessage(
      `🏆 Achievement Unlocked: ${achievement.icon} ${achievement.name}! +${achievement.xp} XP`,
      "View All",
    )

    this._queueEffect("showAchievement", {
      icon: achievement.icon,
      name: achievement.name,
      xp: achievement.xp,
    })

    this._savePetData()
    this._updateAchievementCount()
  }

  _loadPetData() {
    const data = this._context.globalState.get("tamagotchiPetData", {})
    this._petLevel = data.level || 1
    this._petExp = data.exp || 0
    this._chatHistory = data.chatHistory || []
    this._conversationContext = data.conversationContext || []
    this._achievements = new Set(data.achievements || [])
    this._stats = { ...this._stats, ...data.stats }
    this._lastGreetingTime = data.lastGreetingTime || 0
    this._lastEncouragementTime = data.lastEncouragementTime || 0

    console.log("🐾 Loaded pet data:", {
      level: this._petLevel,
      exp: this._petExp,
      achievements: this._achievements.size,
    })
  }

  _savePetData() {
    if (this._viewId === "main") {
      this._context.globalState.update("tamagotchiPetData", {
        level: this._petLevel,
        exp: this._petExp,
        chatHistory: this._chatHistory.slice(-50), // Keep last 50 messages
        conversationContext: this._conversationContext.slice(-10), // Keep last 10 for context
        achievements: Array.from(this._achievements),
        stats: this._stats,
        lastGreetingTime: this._lastGreetingTime,
        lastEncouragementTime: this._lastEncouragementTime,
      })
    }
  }

  _startFunMode() {
    // Random fun interactions every 15 minutes
    setInterval(
      () => {
        if (Math.random() < 0.3 && !this._isSleeping) {
          this._triggerRandomFun()
        }
      },
      15 * 60 * 1000,
    )
  }

  _triggerRandomFun() {
    const funActions = [
      () => {
        this._setAnimation("happy", 2000) // Reduced from 3000
        vscode.window.showInformationMessage("🎉 Your pet discovered a new coding trick! +5 XP!")
        this._gainExp(5)
      },
      () => {
        this._petMood = "playful"
        this._updateAllViews()
        vscode.window.showInformationMessage("😸 Your pet is feeling extra playful today!")
      },
      () => {
        if (this._petLevel > 3) {
          vscode.window.showInformationMessage("🌟 Your pet wants to show you something cool! Try the dance button!")
          this._queueEffect("showEnhancedSparkles")
        }
      },
    ]

    const action = funActions[Math.floor(Math.random() * funActions.length)]
    action()
  }

  _startMoodCycle() {
    // Change mood naturally over time
    this._moodTimer = setInterval(
      () => {
        this._cycleMood()
      },
      8 * 60 * 1000,
    ) // Every 8 minutes
  }

  _cycleMood() {
    if (this._isDancing || this._isProcessing || this._isSleeping) return

    const moods = ["content", "curious", "playful", "focused", "cheerful", "relaxed"]
    const currentIndex = moods.indexOf(this._petMood)

    // 80% chance to stay in current mood, 20% to change
    if (Math.random() < 0.2) {
      let newMood
      do {
        newMood = moods[Math.floor(Math.random() * moods.length)]
      } while (newMood === this._petMood)

      this._petMood = newMood
      this._updateAllViews()
    }
  }

  _updateAllViews() {
    allProviders.forEach((provider) => {
      if (provider._view && provider._view.webview && provider._webviewReady) {
        try {
          provider._view.webview.postMessage({
            command: "updateMood",
            mood: this._petMood,
          })
        } catch (error) {
          console.error(`🐾 Error updating mood for ${provider._viewId}:`, error)
        }
      }
    })
  }

  _showGreeting() {
    const now = Date.now()
    const timeSinceLastGreeting = now - this._lastGreetingTime

    // Show greeting if it's been more than 4 hours or first time
    if (timeSinceLastGreeting > 4 * 60 * 60 * 1000 || this._lastGreetingTime === 0) {
      setTimeout(() => {
        const hour = new Date().getHours()
        let greeting

        if (hour < 6) {
          greeting = "🌙 Working late? Your pet is here to keep you company! Don't forget to rest! 💤"
          // Check for night owl achievement
          if (!this._achievements.has("night_owl")) {
            this._unlockAchievement("night_owl")
          }
        } else if (hour < 12) {
          greeting = "🌅 Good morning! Ready for another amazing day of coding? Let's do this! ☕"
          // Check for early bird achievement
          if (hour < 6 && !this._achievements.has("early_bird")) {
            this._unlockAchievement("early_bird")
          }
        } else if (hour < 17) {
          greeting = "☀️ Good afternoon! How's your coding adventure going today? 💻"
        } else if (hour < 21) {
          greeting = "🌆 Good evening! Time to wrap up with some great code! 🚀"
        } else {
          greeting = "🌃 Good evening! Remember to take breaks - your health matters more than code! 💖"
        }

        vscode.window.showInformationMessage(greeting)
        this._lastGreetingTime = now
        this._savePetData()
      }, 1000) // Reduced from 2000
    }
  }

  _startEncouragements() {
    setInterval(
      () => {
        this._showRandomEncouragement()
      },
      45 * 60 * 1000,
    ) // Every 45 minutes
  }

  _showRandomEncouragement() {
    if (this._isSleeping) return

    const encouragements = [
      "🌟 You're crushing it! Every bug you fix makes you stronger! 💪",
      "💧 Hydration checkpoint! Your brain needs water to code better! 🥤",
      "🧘‍♂️ Stretch time! Your future self will thank you! 🤸‍♀️",
      "👀 20-20-20 rule: Look at something 20 feet away for 20 seconds! 👁️",
      "🌱 Debugging isn't failing, it's learning in disguise! 🔍",
      "🎯 Small commits lead to big victories! Keep pushing! 🏆",
      "🔥 Your coding skills are leveling up every single day! 📈",
      "☕ Coffee break? You've earned it, coding champion! ☕",
      "🎵 Some lo-fi beats might boost your coding flow! 🎧",
      "💡 Stuck? A quick walk often unlocks the best solutions! 🚶‍♀️",
      "🌈 You're not just coding, you're creating digital art! 🎨",
      "🚀 Remember: every expert was once a beginner like you! 📚",
    ]

    const now = Date.now()
    const timeSinceLastEncouragement = now - this._lastEncouragementTime

    if (timeSinceLastEncouragement > 30 * 60 * 1000) {
      const message = encouragements[Math.floor(Math.random() * encouragements.length)]
      vscode.window.showInformationMessage(message)
      this._lastEncouragementTime = now
    }
  }

  _startGitReminders() {
    if (this._gitReminderInterval) {
      clearInterval(this._gitReminderInterval)
    }

    if (!this._enableGitReminders) return

    this._gitReminderInterval = setInterval(
      () => {
        this._checkGitStatus()
      },
      30 * 60 * 1000,
    ) // Every 30 minutes
  }

  _startSaveReminders() {
    if (this._saveReminderInterval) {
      clearInterval(this._saveReminderInterval)
    }

    if (!this._enableSaveReminders) return

    this._saveReminderInterval = setInterval(
      () => {
        this._checkUnsavedFiles()
      },
      15 * 60 * 1000,
    ) // Every 15 minutes
  }

  async _checkGitStatus() {
    if (this._isSleeping) return

    try {
      const workspaceFolders = vscode.workspace.workspaceFolders
      if (!workspaceFolders) return

      const gitExtension = vscode.extensions.getExtension("vscode.git")
      if (gitExtension && gitExtension.isActive) {
        const random = Math.random()
        if (random < 0.1) {
          const result = await vscode.window.showInformationMessage(
            "🐾 Psst... when did you last commit your amazing work?",
            "Commit Now",
            "Push Changes",
            "Later",
          )

          if (result === "Commit Now") {
            await this._gitCommit()
          } else if (result === "Push Changes") {
            await this._gitPush()
          }
        }
      }
    } catch (error) {
      // Git extension not available
    }
  }

  async _checkUnsavedFiles() {
    if (this._isSleeping) return

    const dirtyFiles = vscode.workspace.textDocuments.filter((doc) => doc.isDirty)
    if (dirtyFiles.length > 0) {
      const result = await vscode.window.showWarningMessage(
        `🐾 Meow! You have ${dirtyFiles.length} unsaved file(s). Don't lose your precious work!`,
        "Save All",
        "Remind Later",
      )

      if (result === "Save All") {
        await this._saveAllFiles()
      }
    }
  }

  async _gitPush() {
    try {
      await vscode.commands.executeCommand("git.push")
      vscode.window.showInformationMessage("🚀 Git push initiated! Sharing your awesome code! ✨")
      this._gainExp(5)
    } catch (error) {
      console.error("Git push error:", error)
      vscode.window.showErrorMessage("🐾 Git push failed: " + error.message)
    }
  }

  _startInactivitySleepCycle() {
    // Clear any previous timer if it exists
    if (this._sleepTimer) {
      clearTimeout(this._sleepTimer);
    }
  
    // Schedule sleep after random time between 5 and 15 minutes
    const scheduleSleep = () => {
      const randomDelay = (5 + Math.random() * 10) * 60 * 1000; // ms
  
      this._sleepTimer = setTimeout(() => {
        const now = Date.now();
        const inactiveTime = now - this._lastActivityTime;
  
        if (
          inactiveTime >= randomDelay &&
          !this._isSleeping &&
          !this._isProcessing &&
          !this._isDancing
        ) {
          this._goToSleep();
        } else {
          // Not enough inactivity, schedule again
          scheduleSleep();
        }
      }, randomDelay);
    };
  
    scheduleSleep();
  }
  
  _updateActivity() {
    this._lastActivityTime = Date.now();
  
    if (this._isSleeping) {
      this._wakeUp();
    }
  
    // Reset inactivity sleep timer on any activity
    this._startInactivitySleepCycle();
  }
  

  _updateActivity() {
    this._lastActivityTime = Date.now()
    if (this._isSleeping) {
      this._wakeUp()
    }
  }

  _goToSleep() {
    if (this._isSleeping) return

    this._isSleeping = true
    this._petMood = "sleepy"
    this._setAnimation("sleeping")

    const sleepMessages = [
      "😴 Your pet is taking a little nap... Click to wake up! 💤",
      "💤 Zzz... Your coding companion is dreaming of beautiful code! 🌙",
      "🌙 Sleepy time! Your pet will wake up when you need them! ✨",
    ]

    const message = sleepMessages[Math.floor(Math.random() * sleepMessages.length)]
    vscode.window.showInformationMessage(message)

    this._updateAllViews()
  }

  _wakeUp() {
    if (!this._isSleeping) return

    this._isSleeping = false
    this._petMood = "content"
    this._setAnimation("idle")

    const wakeUpMessages = [
      "😊 Good morning! I'm refreshed and ready to help! ✨",
      "🌟 I'm awake! Did you miss me? Let's code together! 💻",
      "😸 That was a nice nap! What are we working on? 🚀",
    ]

    const message = wakeUpMessages[Math.floor(Math.random() * wakeUpMessages.length)]
    vscode.window.showInformationMessage(message)

    this._updateAllViews()
  }

  _initCodeTracking() {
    // Track file saves
    vscode.workspace.onDidSaveTextDocument(() => {
      this._stats.filesSaved++
      if (this._stats.filesSaved >= 50 && !this._achievements.has("file_saver")) {
        this._unlockAchievement("file_saver")
      }
      this._updateActivity()
    })

    // Track text changes for character counting
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.contentChanges.length > 0) {
        const totalChars = event.contentChanges.reduce((sum, change) => sum + change.text.length, 0)
        this._stats.charactersTyped += totalChars

        if (this._stats.charactersTyped >= 1000 && !this._achievements.has("speed_typer")) {
          this._unlockAchievement("speed_typer")
        }
        this._updateActivity()
      }
    })
  }

  _initCodingTracker() {
    let codingSessionStart = Date.now();
    let isActivelyTyping = false;
    let typingTimer = null;
    let lastCodingReaction = 0;

    // Enhanced coding activity tracking
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.contentChanges.length > 0) {
        const now = Date.now();
        
        // Track typing activity
        if (!isActivelyTyping) {
          isActivelyTyping = true;
          console.log('🐾 Started coding session');
          
          // Show coding start reactions occasionally
          if (Math.random() < 0.1 && now - lastCodingReaction > 30000) {
            const codingStartMessages = [
              "💻 Coding session detected! Your pet is excited to watch! ✨",
              "⌨️ Time to code! Your fingers are flying! 🚀",
              "🎯 Focus mode activated! Let's create something amazing! 💫",
              "🔥 Coding energy detected! Your pet believes in you! 💪"
            ];
            
            const message = codingStartMessages[Math.floor(Math.random() * codingStartMessages.length)];
            vscode.window.showInformationMessage(message);
            this._setAnimation("happy", 2000);
            lastCodingReaction = now;
          }
        }

        // Reset typing timer
        if (typingTimer) {
          clearTimeout(typingTimer);
        }

        // Set timer to detect when typing stops
        typingTimer = setTimeout(() => {
          isActivelyTyping = false;
          console.log('🐾 Coding session paused');
          
          // Show coding break reactions occasionally
          if (Math.random() < 0.05) {
            const breakMessages = [
              "☕ Taking a break? Perfect time for some coffee! ☕",
              "🧘‍♂️ Pause detected! Remember to stretch and rest your eyes! 👀",
              "💭 Thinking time! The best solutions come when you step back! 🌟",
              "🌸 Break time! Your pet suggests a quick walk! 🚶‍♂️"
            ];
            
            const message = breakMessages[Math.floor(Math.random() * breakMessages.length)];
            vscode.window.showInformationMessage(message);
          }
        }, 5000); // 5 seconds of no typing = break

        // Track characters and show progress reactions
        const totalChars = event.contentChanges.reduce((sum, change) => sum + change.text.length, 0);
        this._stats.charactersTyped += totalChars;

        // Show milestone reactions
        if (this._stats.charactersTyped > 0 && this._stats.charactersTyped % 500 === 0) {
          const milestoneMessages = [
            `🎉 ${this._stats.charactersTyped} characters typed! You're on fire! 🔥`,
            `⭐ Amazing progress! ${this._stats.charactersTyped} characters and counting! 💪`,
            `🚀 Coding machine! ${this._stats.charactersTyped} characters of pure awesomeness! ✨`,
            `💎 ${this._stats.charactersTyped} characters! Your code is becoming a masterpiece! 🎨`
          ];
          
          const message = milestoneMessages[Math.floor(Math.random() * milestoneMessages.length)];
          vscode.window.showInformationMessage(message);
          this._setAnimation("dance", 2000);
          this._queueEffect("showConfetti");
          this._gainExp(5);
        }

        if (this._stats.charactersTyped >= 1000 && !this._achievements.has("speed_typer")) {
          this._unlockAchievement("speed_typer");
        }
        
        this._updateActivity();
      }
    });

    // Track file operations with reactions
    vscode.workspace.onDidSaveTextDocument((document) => {
      this._stats.filesSaved++;
      
      // Show save reactions
      const saveMessages = [
        "💾 File saved! Your progress is secure! ✅",
        "🛡️ Great save! Your work is protected! 🌟",
        "📁 File secured! Smart coding habits! 💪",
        "✨ Save successful! Your pet is proud of your diligence! 😸"
      ];
      
      if (Math.random() < 0.3) { // 30% chance to show save message
        const message = saveMessages[Math.floor(Math.random() * saveMessages.length)];
        vscode.window.showInformationMessage(message);
        this._setAnimation("lightbulb", 1500);
        this._queueEffect("showEnhancedSparkles");
      }
      
      if (this._stats.filesSaved >= 50 && !this._achievements.has("file_saver")) {
        this._unlockAchievement("file_saver");
      }
      
      this._updateActivity();
    });

    // Track file creation/deletion
    vscode.workspace.onDidCreateFiles((event) => {
      const fileCount = event.files.length;
      const createMessages = [
        `📄 ${fileCount} new file(s) created! Building something awesome! 🚀`,
        `✨ File creation detected! Your project is growing! 🌱`,
        `🎯 New files! Your pet loves watching projects expand! 💫`,
        `📝 Fresh files! Ready for some amazing code! 🔥`
      ];
      
      if (Math.random() < 0.4) {
        const message = createMessages[Math.floor(Math.random() * createMessages.length)];
        vscode.window.showInformationMessage(message);
        this._setAnimation("happy", 1500);
      }
      
      this._updateActivity();
    });

    // Track debugging sessions
    vscode.debug.onDidStartDebugSession(() => {
      const debugMessages = [
        "🐛 Debug session started! Time to hunt those bugs! 🔍",
        "🔧 Debugging mode! Your pet is ready to help investigate! 🕵️‍♂️",
        "⚡ Debug time! Every bug fixed makes you stronger! 💪",
        "🎯 Debugging activated! Let's solve this mystery! 🔬"
      ];
      
      const message = debugMessages[Math.floor(Math.random() * debugMessages.length)];
      vscode.window.showInformationMessage(message);
      this._setAnimation("thinking", 2000);
      this._updateActivity();
    });

    vscode.debug.onDidTerminateDebugSession(() => {
      const debugEndMessages = [
        "✅ Debug session complete! Bugs eliminated! 🎉",
        "🏆 Debugging finished! Great detective work! 🕵️‍♂️",
        "💪 Debug session ended! Your problem-solving skills rock! ⭐",
        "🎯 Debugging done! Another mystery solved! 🔍"
      ];
      
      if (Math.random() < 0.6) {
        const message = debugEndMessages[Math.floor(Math.random() * debugEndMessages.length)];
        vscode.window.showInformationMessage(message);
        this._setAnimation("happy", 2000);
        this._queueEffect("showEnhancedHearts");
        this._gainExp(8);
      }
      
      this._updateActivity();
    });
  }

  _initTerminalWatcher() {
    // Enhanced terminal tracking with better detection
    let terminalCommandCount = 0;
    let lastTerminalActivity = 0;

    // Watch for terminal creation
    if (vscode.window.onDidOpenTerminal) {
      vscode.window.onDidOpenTerminal((terminal) => {
        console.log('🐾 Terminal opened:', terminal.name);
        this._stats.terminalCommands++;
        this._updateActivity();
        
        // Show encouraging message
        const terminalMessages = [
          "🖥️ Terminal opened! Ready for some command line magic! ⚡",
          "💻 New terminal session! Let's execute some awesome commands! 🚀",
          "⌨️ Terminal time! Your pet loves watching you work! 😸",
          "🔧 Command line activated! Time to show off your skills! ✨"
        ];
        
        const message = terminalMessages[Math.floor(Math.random() * terminalMessages.length)];
        setTimeout(() => {
          vscode.window.showInformationMessage(message);
        }, 500);
        
        if (this._stats.terminalCommands >= 20 && !this._achievements.has("terminal_master")) {
          this._unlockAchievement("terminal_master");
        }
      });
    }

    // Watch for terminal close
    if (vscode.window.onDidCloseTerminal) {
      vscode.window.onDidCloseTerminal((terminal) => {
        console.log('🐾 Terminal closed:', terminal.name);
        this._updateActivity();
        
        // Random terminal close reactions
        if (Math.random() < 0.3) {
          const closeMessages = [
            "👋 Terminal session ended! Great work! 🎉",
            "✅ Command line session complete! Well done! 💪",
            "🏁 Terminal closed! Hope you accomplished something awesome! ⭐"
          ];
          
          const message = closeMessages[Math.floor(Math.random() * closeMessages.length)];
          vscode.window.showInformationMessage(message);
        }
      });
    }

    // Watch for active terminal changes
    if (vscode.window.onDidChangeActiveTerminal) {
      vscode.window.onDidChangeActiveTerminal((terminal) => {
        if (terminal) {
          console.log('🐾 Active terminal changed:', terminal.name);
          this._updateActivity();
          
          // Simulate command detection by tracking terminal switches
          const now = Date.now();
          if (now - lastTerminalActivity > 2000) { // 2 seconds between switches
            terminalCommandCount++;
            lastTerminalActivity = now;
            
            // Random terminal activity reactions
            if (Math.random() < 0.2) {
              const activityMessages = [
                "⚡ Terminal activity detected! Keep coding! 💻",
                "🔥 Command line action! Your pet is impressed! 😸",
                "💫 Terminal magic happening! Love watching you work! ✨",
                "🚀 Command execution detected! You're on fire! 🔥"
              ];
              
              const message = activityMessages[Math.floor(Math.random() * activityMessages.length)];
              vscode.window.showInformationMessage(message);
              this._setAnimation("happy", 2000);
              this._queueEffect("showEnhancedSparkles");
            }
          }
        }
      });
    }

    // Simulate terminal command success/failure detection
    setInterval(() => {
      if (vscode.window.activeTerminal && Math.random() < 0.1) {
        // Simulate random command completion
        const isSuccess = Math.random() > 0.3; // 70% success rate
        
        if (isSuccess) {
          const successMessages = [
            "✅ Command executed successfully! Great job! 🎉",
            "🎯 Perfect execution! Your terminal skills are amazing! ⭐",
            "💚 Command completed! Your pet is so proud! 😸",
            "🏆 Flawless terminal work! Keep it up! 🚀"
          ];
          
          if (Math.random() < 0.15) { // 15% chance to show success message
            const message = successMessages[Math.floor(Math.random() * successMessages.length)];
            vscode.window.showInformationMessage(message);
            this._setAnimation("happy", 1500);
            this._queueEffect("showEnhancedHearts");
            this._gainExp(3);
          }
        } else {
          const errorMessages = [
            "❌ Oops! Command failed, but that's how we learn! 💪",
            "🔧 Error detected! Don't worry, debugging makes you stronger! 🌟",
            "⚠️ Command issue! Every error is a step towards mastery! 📚",
            "🐛 Bug found! Time to squash it and move forward! 🔨"
          ];
          
          if (Math.random() < 0.1) { // 10% chance to show error message
            const message = errorMessages[Math.floor(Math.random() * errorMessages.length)];
            vscode.window.showInformationMessage(message);
            this._setAnimation("thinking", 1500);
          }
        }
      }
    }, 10000); // Check every 10 seconds
  }

  _startRandomTips() {
    // Show helpful tips occasionally
    setInterval(
      () => {
        if (Math.random() < 0.1 && !this._isSleeping) {
          this._showRandomTip()
        }
      },
      20 * 60 * 1000,
    ) // Every 20 minutes
  }

  _showRandomTip() {
    const tips = [
      "💡 Pro tip: Use Ctrl+Shift+P to open the command palette!",
      "🔥 Hot key: Ctrl+` opens the terminal instantly!",
      "⚡ Speed tip: Ctrl+D selects the next occurrence of selected text!",
      "🎯 Focus tip: F12 goes to definition, Alt+F12 peeks!",
      "🚀 Productivity: Ctrl+Shift+E opens the file explorer!",
      "🔍 Search tip: Ctrl+Shift+F for global search across files!",
      "📝 Quick tip: Ctrl+/ toggles line comments!",
      "🎨 Style tip: Alt+Shift+F formats your code beautifully!",
      "🔄 Refactor tip: F2 renames symbols across your project!",
      "🎪 Multi-cursor magic: Alt+Click to place multiple cursors!",
    ]

    const tip = tips[Math.floor(Math.random() * tips.length)]
    vscode.window.showInformationMessage(tip)

    this._stats.tipsReceived++
    if (this._stats.tipsReceived >= 10 && !this._achievements.has("tip_master")) {
      this._unlockAchievement("tip_master")
    }
  }

  _getPetGifs() {
    const mediaPath = vscode.Uri.joinPath(this._context.extensionUri, "media")

    const getGifPath = (petType, state) => {
      let fileName
      switch (state) {
        case "sleeping":
          fileName = `${petType}-sleeping.gif`
          break
        case "idle":
          fileName = `${petType}-idle.gif`
          break
        case "thinking":
          fileName = `${petType}-thinking.gif`
          break
        case "happy":
          fileName = `${petType}-happy.gif`
          break
        case "dance":
          fileName = `${petType}-dance.gif`
          break
        case "eating":
          fileName = `${petType}-eating.gif`
          break
        case "lightbulb":
          fileName = `${petType}-lightbulb.gif`
          break
        default:
          fileName = `${petType}-idle.gif`
      }

      const gifUri = vscode.Uri.joinPath(mediaPath, fileName)
      return this._view.webview.asWebviewUri(gifUri).toString()
    }

    return {
      sleeping: getGifPath(this._petType, "sleeping"),
      idle: getGifPath(this._petType, "idle"),
      thinking: getGifPath(this._petType, "thinking"),
      happy: getGifPath(this._petType, "happy"),
      dance: getGifPath(this._petType, "dance"),
      eating: getGifPath(this._petType, "eating"),
      lightbulb: getGifPath(this._petType, "lightbulb"),
    }
  }

  _getBackgroundImage() {
    if (this._currentBackground === "none") return null

    try {
      const mediaPath = vscode.Uri.joinPath(this._context.extensionUri, "media")
      const backgroundFile = BACKGROUNDS.find((bg) => bg.id === this._currentBackground)?.file

      if (!backgroundFile) return null

      const backgroundUri = vscode.Uri.joinPath(mediaPath, backgroundFile)
      return this._view.webview.asWebviewUri(backgroundUri).toString()
    } catch (error) {
      console.log("🐾 Background image not found, skipping")
      return null
    }
  }

  _updateContent() {
    if (!this._view) return

    const config = vscode.workspace.getConfiguration("tamagotchiPets")
    const hasApiKey = !!config.get("apiKey")
    const gifs = this._getPetGifs()
    const backgroundImage = this._getBackgroundImage()
    const isCompactView = this._viewId === "explorer"

    // Get theme-specific CSS
    const themeCSS = this._getThemeCSS()

    this._view.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        ${themeCSS}

        body {
          font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
          font-size: 12px;
          background: var(--theme-background);
          color: var(--theme-foreground);
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding: ${isCompactView ? "8px" : "10px"};
          overflow: hidden;
        }

        ${
          isCompactView
            ? `
        /* EXPLORER VIEW - COMPACT */
        .explorer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          height: 100%;
          gap: 12px;
          padding-top: 10px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pet-area {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          }

        .avatar-container {
          position: relative;
        }

        .avatar-box {
          width: 140px;
          height: 140px;
          border: 3px solid var(--theme-accent);
          border-radius: 20px;
          padding: 12px;
          background: var(--theme-card-background);
          ${backgroundImage ? `background-image: url('${backgroundImage}');` : ""}
          ${backgroundImage ? "background-size: cover; background-position: center; background-repeat: no-repeat;" : ""}
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-shadow: 0 8px 25px var(--theme-shadow);
          overflow: hidden;
        }

        .avatar-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.3s;
        }

        .avatar-box:hover::before {
          left: 100%;
        }

        .avatar-box:hover {
          transform: scale(1.05);
          border-color: var(--theme-button-hover);
          box-shadow: 0 12px 35px var(--theme-shadow);
        }

        .avatar {
          width: 100px;
          height: 100px;
          object-fit: contain;
          image-rendering: pixelated;
          z-index: 2;
          transition: all 0.2s ease;
        }

        .avatar:hover {
          transform: scale(1.02);
        }

        .pet-actions {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          justify-content: center;
        }

        .pet-button {
          padding: 8px 10px;
          background: var(--theme-button-background);
          color: var(--theme-button-foreground);
          border: none;
          border-radius: 18px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px var(--theme-shadow);
          min-width: 45px;
          position: relative;
          overflow: hidden;
        }

        .pet-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transition: all 0.2s ease;
          transform: translate(-50%, -50%);
        }

        .pet-button:hover::before {
          width: 100px;
          height: 100px;
        }

        .pet-button:hover {
          background: var(--theme-button-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px var(--theme-shadow);
        }

        .pet-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .click-hint {
          font-size: 10px;
          color: var(--theme-muted);
          text-align: center;
          margin-top: 8px;
          opacity: 0.8;
          font-weight: 500;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        `
            : `
        /* MAIN VIEW - SCROLLABLE PANEL */
        .main-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .header {
          flex-shrink: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 12px 16px;
          background: var(--theme-card-background);
          border-radius: 12px;
          border: 2px solid var(--theme-border);
          box-shadow: 0 4px 12px var(--theme-shadow);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .header-title {
          font-weight: bold;
          font-size: 16px;
          color: var(--theme-accent);
          text-shadow: 0 1px 2px var(--theme-shadow);
        }

        .settings-btn {
          background: var(--theme-button-background);
          color: var(--theme-button-foreground);
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 3px 8px var(--theme-shadow);
          position: relative;
          overflow: hidden;
        }

        .settings-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transition: all 0.2s ease;
          transform: translate(-50%, -50%);
        }

        .settings-btn:hover::before {
          width: 40px;
          height: 40px;
        }

        .settings-btn:hover {
          background: var(--theme-button-hover);
          transform: scale(1.1);
          box-shadow: 0 6px 15px var(--theme-shadow);
        }

        /* Quick Settings Dropdown */
        .quick-settings {
          position: absolute;
          top: 100%;
          right: 0;
          background: var(--theme-card-background);
          border: 2px solid var(--theme-border);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 8px 25px var(--theme-shadow);
          z-index: 1000;
          min-width: 200px;
          display: none;
          animation: dropdownSlide 0.2s ease-out;
        }

        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .quick-settings.show {
          display: block;
        }

        .quick-settings h3 {
          margin-bottom: 12px;
          color: var(--theme-accent);
          font-size: 14px;
          font-weight: bold;
        }

        .quick-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .quick-button {
          padding: 8px 12px;
          background: var(--theme-button-background);
          color: var(--theme-button-foreground);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 6px var(--theme-shadow);
          text-align: left;
        }

        .quick-button:hover {
          background: var(--theme-button-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px var(--theme-shadow);
        }

        .scrollable-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;
          margin-right: -4px;
        }

        /* Enhanced themed scrollbars - more visible */
        .scrollable-content::-webkit-scrollbar {
          width: 8px;
        }

        .scrollable-content::-webkit-scrollbar-track {
          background: var(--theme-scrollbar-track);
          border-radius: 4px;
          border: 1px solid var(--theme-border);
        }

        .scrollable-content::-webkit-scrollbar-thumb {
          background: var(--theme-scrollbar-thumb);
          border-radius: 4px;
          transition: all 0.2s ease;
          border: 1px solid var(--theme-accent);
        }

        .scrollable-content::-webkit-scrollbar-thumb:hover {
          background: var(--theme-scrollbar-thumb-hover);
          transform: scale(1.1);
        }

        .scrollable-content::-webkit-scrollbar-corner {
          background: var(--theme-scrollbar-track);
        }

        /* Chat scrollbars - more visible */
        .chat-history::-webkit-scrollbar {
          width: 6px;
        }

        .chat-history::-webkit-scrollbar-track {
          background: var(--theme-scrollbar-track);
          border-radius: 3px;
        }

        .chat-history::-webkit-scrollbar-thumb {
          background: var(--theme-scrollbar-thumb);
          border-radius: 3px;
          border: 1px solid var(--theme-accent);
        }

        .chat-history::-webkit-scrollbar-thumb:hover {
          background: var(--theme-scrollbar-thumb-hover);
        }

        .pet-stats {
          background: var(--theme-card-background);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 12px;
          border: 2px solid var(--theme-border);
          font-size: 13px;
          box-shadow: 0 4px 12px var(--theme-shadow);
          animation: fadeIn 0.3s ease-out 0.1s both;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .exp-bar {
          width: 100%;
          height: 12px;
          background: var(--theme-input-background);
          border-radius: 6px;
          overflow: hidden;
          margin-top: 8px;
          border: 2px solid var(--theme-border);
          box-shadow: inset 0 2px 4px var(--theme-shadow);
        }

        .exp-fill {
          height: 100%;
          background: var(--theme-accent-gradient);
          width: 0%;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 4px;
          position: relative;
        }

        .exp-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .avatar-container {
          position: relative;
          margin: 12px 0;
          animation: fadeIn 0.3s ease-out 0.2s both;
        }

        .avatar-box {
          width: 100%;
          height: 150px;
          border: 3px solid var(--theme-accent);
          border-radius: 20px;
          padding: 20px;
          background: var(--theme-card-background);
          ${backgroundImage ? `background-image: url('${backgroundImage}');` : ""}
          ${backgroundImage ? "background-size: cover; background-position: center; background-repeat: no-repeat;" : ""}
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-shadow: 0 8px 20px var(--theme-shadow);
          overflow: hidden;
        }

        .avatar-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.3s;
        }

        .avatar-box:hover::before {
          left: 100%;
        }

        .avatar-box:hover {
          border-color: var(--theme-button-hover);
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 15px 35px var(--theme-shadow);
        }

        .avatar {
          width: 100px;
          height: 100px;
          object-fit: contain;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          image-rendering: pixelated;
          z-index: 2;
        }

        .avatar:hover {
          transform: scale(1.05);
        }

        .pet-actions {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin: 12px 0;
          animation: fadeIn 0.3s ease-out 0.3s both;
        }

        .pet-button {
          padding: 12px 8px;
          background: var(--theme-button-background);
          color: var(--theme-button-foreground);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 10px var(--theme-shadow);
          position: relative;
          overflow: hidden;
        }

        .pet-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transition: all 0.2s ease;
          transform: translate(-50%, -50%);
        }

        .pet-button:hover::before {
          width: 120px;
          height: 120px;
        }

        .pet-button:hover {
          background: var(--theme-button-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px var(--theme-shadow);
        }

        .pet-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .click-hint {
          font-size: 11px;
          color: var(--theme-muted);
          text-align: center;
          margin-top: 8px;
          opacity: 0.9;
          font-weight: 500;
          animation: pulse 2s infinite;
        }

        .chat-section {
          display: flex;
          flex-direction: column;
          min-height: 0;
          margin-top: 12px;
          animation: fadeIn 0.3s ease-out 0.4s both;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .action-button {
          padding: 8px 14px;
          background: var(--theme-secondary-button);
          color: var(--theme-button-foreground);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          
          border: none;
          border-radius: 10px;
          cursor: pointer,
          font-size: 11px;
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 3px 8px var(--theme-shadow);
          position: relative;
          overflow: hidden;
        }

        .action-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transition: all 0.2s ease;
          transform: translate(-50%, -50%);
        }

        .action-button:hover::before {
          width: 100px;
          height: 100px;
        }

        .action-button:hover {
          background: var(--theme-button-hover);
          transform: translateY(-1px);
          box-shadow: 0 6px 15px var(--theme-shadow);
        }

        .chat-history {
          background: var(--theme-card-background);
          border: 2px solid var(--theme-border);
          border-radius: 15px;
          padding: 16px;
          margin-bottom: 12px;
          overflow-y: auto;
          height: 280px;
          font-size: 13px;
          line-height: 1.6;
          box-shadow: inset 0 3px 8px var(--theme-shadow);
        }

        /* Chat scrollbars - more visible */
        .chat-history::-webkit-scrollbar {
          width: 6px;
        }

        .chat-history::-webkit-scrollbar-track {
          background: var(--theme-scrollbar-track);
          border-radius: 3px;
        }

        .chat-history::-webkit-scrollbar-thumb {
          background: var(--theme-scrollbar-thumb);
          border-radius: 3px;
          border: 1px solid var(--theme-accent);
        }

        .chat-history::-webkit-scrollbar-thumb:hover {
          background: var(--theme-scrollbar-thumb-hover);
        }

        .chat-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--theme-muted);
          font-weight: 500;
          text-align: center;
          font-size: 14px;
        }

        .chat-message {
          margin-bottom: 16px;
          padding: 12px 16px;
          border-radius: 18px;
          word-wrap: break-word;
          max-width: 85%;
          animation: messageSlide 0.2s ease-out;
          box-shadow: 0 3px 8px var(--theme-shadow);
          font-weight: 500;
          line-height: 1.5;
        }

        @keyframes messageSlide {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .chat-message.user {
          background: var(--theme-accent);
          color: white;
          margin-left: auto;
          border-bottom-right-radius: 8px;
          font-weight: 600;
        }

        .chat-message.assistant {
          background: var(--theme-card-background);
          color: var(--theme-foreground);
          margin-right: auto;
          border: 2px solid var(--theme-border);
          border-bottom-left-radius: 8px;
        }

        .typing-indicator {
          display: none;
          padding: 12px 16px;
          margin-bottom: 16px;
          background: var(--theme-card-background);
          border: 2px solid var(--theme-border);
          border-radius: 18px;
          border-bottom-left-radius: 8px;
          max-width: 85%;
          margin-right: auto;
          font-style: italic;
          color: var(--theme-accent);
          animation: pulse 1.5s infinite;
          box-shadow: 0 3px 8px var(--theme-shadow);
          font-weight: 500;
        }

        .typing-indicator.show {
          display: block;
        }

        .chat-input-container {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          flex-shrink: 0;
        }

        .chat-input {
          flex: 1;
          padding: 10px 16px;
          background: var(--theme-input-background);
          color: var(--theme-foreground);
          border: 2px solid var(--theme-border);
          border-radius: 20px;
          font-size: 12px;
          resize: none;
          min-height: 36px;
          max-height: 80px;
          font-family: inherit;
          line-height: 1.4;
          box-shadow: inset 0 2px 4px var(--theme-shadow);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 500;
        }

        .chat-input::placeholder {
          color: transparent;
        }

        .chat-input:focus::placeholder {
          color: var(--theme-muted);
        }

        .chat-input:focus {
          outline: none;
          border-color: var(--theme-accent);
          box-shadow: 0 0 0 3px var(--theme-accent-alpha), inset 0 2px 4px var(--theme-shadow);
          transform: scale(1.01);
        }

        .send-button {
          padding: 10px 16px;
          background: var(--theme-accent);
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          min-width: 65px;
          height: 36px;
          box-shadow: 0 4px 10px var(--theme-shadow);
          position: relative;
          overflow: hidden;
        }

        .send-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transition: all 0.2s ease;
          transform: translate(-50%, -50%);
        }

        .send-button:hover::before {
          width: 80px;
          height: 80px;
        }

        .send-button:hover {
          background: var(--theme-button-hover);
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 6px 15px var(--theme-shadow);
        }

        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .no-api-key {
          text-align: center;
          padding: 14px;
          background: rgba(255, 193, 7, 0.15);
          border: 2px solid rgba(255, 193, 7, 0.4);
          border-radius: 12px;
          margin: 12px 0;
          font-size: 12px;
          box-shadow: 0 3px 8px var(--theme-shadow);
          font-weight: 500;
          animation: fadeIn 0.3s ease-out 0.5s both;
        }
        `
        }

        /* Enhanced effect containers */
        .hearts-container, .sparkles-container, .confetti-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          border-radius: ${isCompactView ? "20px" : "20px"};
          z-index: 10;
        }

        .heart, .sparkle, .confetti {
          position: absolute;
          font-size: ${isCompactView ? "16px" : "18px"};
          animation: floatUp 1.5s ease-out forwards;
          opacity: 0;
          z-index: 15;
        }

        .sparkle {
          animation: sparkleFloat 2s ease-out forwards;
        }

        .confetti {
          animation: confettiFloat 2.5s ease-out forwards;
        }

        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.5) rotate(360deg); }
        }

        @keyframes sparkleFloat {
          0% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
          50% { opacity: 1; transform: translateY(-30px) scale(1.3) rotate(180deg); }
          100% { opacity: 0; transform: translateY(-70px) scale(1.8) rotate(360deg); }
        }

        @keyframes confettiFloat {
          0% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
          25% { opacity: 1; transform: translateY(-20px) scale(1.1) rotate(90deg); }
          50% { opacity: 1; transform: translateY(-40px) scale(1.3) rotate(180deg); }
          75% { opacity: 0.8; transform: translateY(-60px) scale(1.6) rotate(270deg); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.8) rotate(360deg); }
        }

        /* Achievement notification */
        .achievement-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #4CAF50, #45a049);
          color: white;
          padding: 15px 20px;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
          z-index: 1000;
          animation: achievementSlide 3s ease-out forwards;
          font-weight: bold;
          border: 2px solid #66BB6A;
        }

        @keyframes achievementSlide {
          0% { opacity: 0; transform: translateX(100%); }
          10% { opacity: 1; transform: translateX(0); }
          90% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(100%); }
        }

        /* Level up notification */
        .level-up-notification {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #333;
          padding: 20px 30px;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
          z-index: 1000;
          animation: levelUpPulse 2.5s ease-out forwards;
          font-weight: bold;
          font-size: 18px;
          text-align: center;
          border: 3px solid #FFE55C;
        }

        @keyframes levelUpPulse {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          40% { transform: translate(-50%, -50%) scale(1); }
          60% { transform: translate(-50%, -50%) scale(1.05); }
          80% { transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
      </style>
    </head>
    <body>
      ${
        isCompactView
          ? `
      <!-- EXPLORER VIEW -->
      <div class="explorer-container">
        <div class="pet-area">
          <div class="avatar-container">
            <div class="avatar-box" onclick="wakeUpPet()" title="Click me!">
              <img id="avatar" src="${gifs.idle}" class="avatar" alt="Pet">
              <div class="hearts-container" id="heartsContainer"></div>
              <div class="sparkles-container" id="sparklesContainer"></div>
              <div class="confetti-container" id="confettiContainer"></div>
            </div>
          </div>

          <div class="pet-actions">
            <button class="pet-button" id="patBtn" onclick="patPet()">💖</button>
            <button class="pet-button" id="feedBtn" onclick="feedPet()">🍎</button>
            <button class="pet-button" id="danceBtn" onclick="dancePet()">💃</button>
          </div>

          <div class="click-hint">Pat • Feed • Dance ✨</div>
        </div>
      </div>
      `
          : `
      <!-- MAIN VIEW WITH SCROLLABLE PANEL -->
      <div class="main-container">
        <div class="header">
          <span class="header-title">🐾 Tamagotchi Pet</span>
          <div style="position: relative;">
            <button class="settings-btn" onclick="toggleQuickSettings()" title="Quick Settings">⚙️</button>
            <div class="quick-settings" id="quickSettings">
              <h3>⚡ Quick Settings</h3>
              <div class="quick-buttons">
                <button class="quick-button" onclick="quickChangeTheme('light')">☀️ Light Theme</button>
                <button class="quick-button" onclick="quickChangeTheme('dark')">🌙 Dark Theme</button>
                <button class="quick-button" onclick="quickChangeTheme('cherry')">🌸 Cherry Theme</button>
                <button class="quick-button" onclick="quickChangeTheme('hacker')">💚 Hacker Theme</button>
                <button class="quick-button" onclick="quickChangeTheme('cozy')">🏠 Cozy Theme</button>
                <hr style="margin: 8px 0; border: 1px solid var(--theme-border);">
                <button class="quick-button" onclick="quickChangePetType('cat')">🐱 Cat Pet</button>
                <button class="quick-button" onclick="quickChangePetType('raccoon')">🦝 Raccoon Pet</button>
                <hr style="margin: 8px 0; border: 1px solid var(--theme-border);">
                <button class="quick-button" onclick="showAchievements()">🏆 Achievements</button>
                <button class="quick-button" onclick="openSettings()">⚙️ More Settings</button>
              </div>
            </div>
          </div>
        </div>

        <div class="scrollable-content">
          <div class="pet-stats">
            <div class="stat-row">
              <span>🏆 Level: <span id="level">${this._petLevel}</span></span>
              <span>😊 <span id="mood">${this._getMoodText()}</span></span>
            </div>
            <div class="stat-row">
              <span>⭐ <span id="exp">${this._petExp}</span>/<span id="expNeeded">${this._petLevel * 100}</span></span>
              <span>🏆 <span id="achievementCount">${this._achievements.size}</span>/${Object.keys(ACHIEVEMENTS).length}</span>
            </div>
            <div class="exp-bar">
              <div class="exp-fill" id="expFill" style="width: ${(this._petExp / (this._petLevel * 100)) * 100}%"></div>
            </div>
          </div>

          <div class="avatar-container">
            <div class="avatar-box" onclick="wakeUpPet()" title="Click me!">
              <img id="avatar" src="${gifs.idle}" class="avatar" alt="Pet">
              <div class="hearts-container" id="heartsContainer"></div>
              <div class="sparkles-container" id="sparklesContainer"></div>
              <div class="confetti-container" id="confettiContainer"></div>
            </div>
          </div>

          <div class="pet-actions">
            <button class="pet-button" id="patBtn" onclick="patPet()">💖 Pat</button>
            <button class="pet-button" id="feedBtn" onclick="feedPet()">🍎 Feed</button>
            <button class="pet-button" id="danceBtn" onclick="dancePet()">💃 Dance</button>
          </div>
          <div class="click-hint">Interact with your pet! ✨</div>

          ${
            !hasApiKey
              ? `
          <div class="no-api-key">
            🔑 Click ⚙️ to add your OpenRouter API key!<br>
            <small>Get free credits at openrouter.ai</small>
          </div>
          `
              : ""
          }

          <div class="chat-section">
            ${
              this._showUtilityButtons
                ? `
            <div class="action-buttons">
              <button class="action-button" onclick="setupApiKey()">🔑 API Key</button>
              <button class="action-button" onclick="clearChat()">🗑️ Clear</button>
            </div>
            `
                : ""
            }

            ${
              this._showSaveButton || this._showGitButton
                ? `
            <div class="action-buttons">
              ${this._showSaveButton ? '<button class="action-button" onclick="saveFiles()">💾 Save Files</button>' : ""}
              ${this._showGitButton ? '<button class="action-button" onclick="gitCommit()">📝 Git Commit</button>' : ""}
            </div>
            `
                : ""
            }

            <div class="chat-history" id="chatHistory">
              <div class="typing-indicator" id="typingIndicator">🐾 Thinking...</div>
              ${
                this._chatHistory.length === 0
                  ? '<div class="chat-empty">🐾 Hi there! I\'m your coding companion! Ask me anything! ✨</div>'
                  : this._chatHistory
                      .slice(-15)
                      .map(
                        (msg) => `
                  <div class="chat-message ${msg.role}">
                    ${msg.role === "user" ? "👤" : "🐾"} ${this._formatMessage(msg.content)}
                  </div>
                `,
                      )
                      .join("")
              }
            </div>

            <div class="chat-input-container">
              <textarea 
                id="chatInput"
                class="chat-input"
                placeholder="Ask me anything about coding..."
                rows="1"
                ${!hasApiKey ? "disabled" : ""}
              ></textarea>
              <button 
                id="sendButton"
                class="send-button"
                onclick="sendMessage()"
                ${!hasApiKey ? "disabled" : ""}
              >💬</button>
            </div>
          </div>
        </div>
      </div>
      `
      }

      <script>
        const vscode = acquireVsCodeApi();
        let currentAnimation = 'idle';
        let isProcessing = false;
        const isCompactView = ${isCompactView};
        let patCooldown = false;
        let feedCooldown = false;
        let danceCooldown = false;

        const gifs = ${JSON.stringify(gifs)};
        const avatar = document.getElementById('avatar');
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
        const chatHistory = document.getElementById('chatHistory');
        const patBtn = document.getElementById('patBtn');
        const feedBtn = document.getElementById('feedBtn');
        const danceBtn = document.getElementById('danceBtn');
        const typingIndicator = document.getElementById('typingIndicator');
        const quickSettings = document.getElementById('quickSettings');

        console.log('🐾 Webview initialized for ${this._viewId}');

        // Notify extension that webview is ready
        setTimeout(() => {
          vscode.postMessage({ command: 'webviewReady' });
        }, 50);

        // Enhanced auto-resize textarea (main view only)
        if (chatInput && !isCompactView) {
          chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 80) + 'px';
          });

          chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          });
        }

        // Quick settings dropdown
        function toggleQuickSettings() {
          if (quickSettings) {
            quickSettings.classList.toggle('show');
          }
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (quickSettings && !e.target.closest('.settings-btn') && !e.target.closest('.quick-settings')) {
            quickSettings.classList.remove('show');
          }
        });

        function quickChangeTheme(theme) {
          vscode.postMessage({
            command: 'changeTheme',
            theme: theme
          });
          if (quickSettings) quickSettings.classList.remove('show');
        }

        function quickChangePetType(petType) {
          vscode.postMessage({
            command: 'changePetType',
            petType: petType
          });
          if (quickSettings) quickSettings.classList.remove('show');
        }

        function wakeUpPet() {
          console.log('🐾 Waking up pet');
          vscode.postMessage({ command: 'wakeUp' });
        }

        function patPet() {
          if (patCooldown) return;
          console.log('🐾 Patting pet');
          vscode.postMessage({ command: 'patPet' });
          
          // Start cooldown
          patCooldown = true;
          if (patBtn) {
            patBtn.disabled = true;
            patBtn.textContent = isCompactView ? '⏳' : '⏳ Wait...';
          }
          
          setTimeout(() => {
            patCooldown = false;
            if (patBtn) {
              patBtn.disabled = false;
              patBtn.textContent = isCompactView ? '💖' : '💖 Pat';
            }
          }, 5000);
        }

        function feedPet() {
          if (feedCooldown) return;
          console.log('🐾 Feeding pet');
          vscode.postMessage({ command: 'feedPet' });
          
          // Start cooldown
          feedCooldown = true;
          if (feedBtn) {
            feedBtn.disabled = true;
            feedBtn.textContent = isCompactView ? '⏳' : '⏳ Wait...';
          }
          
          setTimeout(() => {
            feedCooldown = false;
            if (feedBtn) {
              feedBtn.disabled = false;
              feedBtn.textContent = isCompactView ? '🍎' : '🍎 Feed';
            }
          }, 10000);
        }

        function dancePet() {
          if (danceCooldown) return;
          console.log('🐾 Dancing pet');
          vscode.postMessage({ command: 'dancePet' });
          
          // Start cooldown
          danceCooldown = true;
          if (danceBtn) {
            danceBtn.disabled = true;
            danceBtn.textContent = isCompactView ? '⏳' : '⏳ Wait...';
          }
          
          setTimeout(() => {
            danceCooldown = false;
            if (danceBtn) {
              danceBtn.disabled = false;
              danceBtn.textContent = isCompactView ? '💃' : '💃 Dance';
            }
          }, 20000);
        }

        function setupApiKey() {
          console.log('🐾 Setting up API key');
          vscode.postMessage({ command: 'setupApiKey' });
        }

        function clearChat() {
          console.log('🐾 Clearing chat');
          vscode.postMessage({ command: 'clearChat' });
        }

        function saveFiles() {
          console.log('🐾 Saving files');
          vscode.postMessage({ command: 'saveFiles' });
        }

        function gitCommit() {
          console.log('🐾 Git commit');
          vscode.postMessage({ command: 'gitCommit' });
        }

        function openSettings() {
          console.log('🐾 Opening settings');
          vscode.postMessage({ command: 'openSettings' });
          if (quickSettings) quickSettings.classList.remove('show');
        }

        function showAchievements() {
          console.log('🐾 Showing achievements');
          vscode.postMessage({ command: 'showAchievements' });
          if (quickSettings) quickSettings.classList.remove('show');
        }

        function sendMessage() {
          if (isProcessing || !chatInput || isCompactView) return;

          const message = chatInput.value.trim();
          if (!message) return;

          console.log('🐾 Sending message:', message);
          setProcessing(true);
          vscode.postMessage({
            command: 'askAI',
            question: message
          });
          chatInput.value = '';
          chatInput.style.height = 'auto';
        }

        function setProcessing(processing) {
          isProcessing = processing;
          if (sendButton) {
            sendButton.disabled = processing;
            sendButton.textContent = processing ? '⏳' : '💬';
          }
          if (chatInput) {
            chatInput.disabled = processing;
          }
        }

        function showTyping() {
          if (typingIndicator) {
            typingIndicator.classList.add('show');
            if (chatHistory) {
              chatHistory.scrollTop = chatHistory.scrollHeight;
            }
          }
        }

        function hideTyping() {
          if (typingIndicator) {
            typingIndicator.classList.remove('show');
          }
        }

        // Enhanced effect functions with faster animations
        function showEnhancedHearts() {
          const container = document.getElementById('heartsContainer');
          if (!container) return;

          const hearts = ['💖', '💕', '💗', '💝', '💘', '💞', '❤️', '🧡', '💛', '💚', '💙', '💜'];

          for (let i = 0; i < 6; i++) {
            setTimeout(() => {
              const heart = document.createElement('div');
              heart.className = 'heart';
              heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
              heart.style.left = Math.random() * 80 + 10 + '%';
              heart.style.top = Math.random() * 80 + 10 + '%';
              heart.style.fontSize = (Math.random() * 6 + 14) + 'px';
              container.appendChild(heart);

              setTimeout(() => {
                if (container.contains(heart)) {
                  container.removeChild(heart);
                }
              }, 1500);
            }, i * 50);
          }
        }

        function showEnhancedSparkles() {
          const container = document.getElementById('sparklesContainer');
          if (!container) return;

          const sparkles = ['✨', '⭐', '🌟', '💫', '🎇', '🎆', '🌠', '💥', '⚡', '🔥'];

          for (let i = 0; i < 8; i++) {
            setTimeout(() => {
              const sparkle = document.createElement('div');
              sparkle.className = 'sparkle';
              sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
              sparkle.style.left = Math.random() * 90 + 5 + '%';
              sparkle.style.top = Math.random() * 90 + 5 + '%';
              sparkle.style.fontSize = (Math.random() * 4 + 12) + 'px';
              container.appendChild(sparkle);

              setTimeout(() => {
                if (container.contains(sparkle)) {
                  container.removeChild(sparkle);
                }
              }, 2000);
            }, i * 40);
          }
        }

        function showConfetti() {
          const container = document.getElementById('confettiContainer');
          if (!container) return;

          const confetti = ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🌈', '🎯', '🎪', '🎭'];

          for (let i = 0; i < 10; i++) {
            setTimeout(() => {
              const piece = document.createElement('div');
              piece.className = 'confetti';
              piece.textContent = confetti[Math.floor(Math.random() * confetti.length)];
              piece.style.left = Math.random() * 100 + '%';
              piece.style.top = Math.random() * 100 + '%';
              piece.style.fontSize = (Math.random() * 6 + 10) + 'px';
              container.appendChild(piece);

              setTimeout(() => {
                if (container.contains(piece)) {
                  container.removeChild(piece);
                }
              }, 2500);
            }, i * 30);
          }
        }

        function showAchievement(data) {
          const notification = document.createElement('div');
          notification.className = 'achievement-notification';
           notification.innerHTML = \`🏆 \${data.icon} \${data.name}! +\${data.xp} XP\`;
          document.body.appendChild(notification);

          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 3000);
        }

        function showLevelUp(data) {
          const notification = document.createElement('div');
          notification.className = 'level-up-notification';
          document.body.appendChild(notification);

          setTimeout(() => {
            if (document.body.contains(notification)) {
              document.body.removeChild(notification);
            }
          }, 2500);
        }

        function updateAnimation(state) {
          currentAnimation = state;
          if (avatar && gifs[state]) {
            avatar.src = gifs[state];
            console.log('🐾 Updated animation to:', state);
          }
        }

        function updateStats(level, exp, expNeeded) {
          if (!isCompactView) {
            const levelEl = document.getElementById('level');
            const expEl = document.getElementById('exp');
            const expNeededEl = document.getElementById('expNeeded');
            const expFillEl = document.getElementById('expFill');

            if (levelEl) levelEl.textContent = level;
            if (expEl) expEl.textContent = exp;
            if (expNeededEl) expNeededEl.textContent = expNeeded;
            if (expFillEl) expFillEl.style.width = (exp / expNeeded) * 100 + '%';
          }
        }

        function updateMood(mood) {
          if (!isCompactView) {
            const moodEl = document.getElementById('mood');
            if (moodEl) {
              const moodText = mood.charAt(0).toUpperCase() + mood.slice(1);
              moodEl.textContent = moodText;
            }
          }
        }

        function updateChat(history) {
          if (!chatHistory || isCompactView) return;

          hideTyping();

          if (history.length === 0) {
            chatHistory.innerHTML = '<div class="typing-indicator" id="typingIndicator">🐾 Thinking...</div><div class="chat-empty">🐾 Hi there! I\\'m your coding companion! Ask me anything! ✨</div>';
          } else {
            chatHistory.innerHTML = '<div class="typing-indicator" id="typingIndicator">🐾 Thinking...</div>' + history.map(msg => \`
              <div class="chat-message \${msg.role}">
                \${msg.role === 'user' ? '👤' : '🐾'} \${msg.content}
              </div>
            \`).join('');
          }

          chatHistory.scrollTop = chatHistory.scrollHeight;
          setProcessing(false);
        }

        // Message handler
        window.addEventListener('message', event => {
          const message = event.data;
          console.log('🐾 Received message:', message.command);

          switch (message.command) {
            case 'updateAnimation':
              updateAnimation(message.state);
              break;
            case 'showEnhancedHearts':
              showEnhancedHearts();
              break;
            case 'showEnhancedSparkles':
              showEnhancedSparkles();
              break;
            case 'showConfetti':
              showConfetti();
              break;
            case 'showAchievement':
              showAchievement(message);
              break;
            case 'showLevelUp':
              showLevelUp(message);
              break;
            case 'updateStats':
              updateStats(message.level, message.exp, message.expNeeded);
              break;
            case 'updateMood':
              updateMood(message.mood);
              break;
            case 'updateChat':
              updateChat(message.history);
              break;
            case 'showTyping':
              showTyping();
              break;
            case 'hideTyping':
              hideTyping();
              break;
            case 'updateAchievementCount':
              const achievementCountEl = document.getElementById('achievementCount');
              if (achievementCountEl) {
                achievementCountEl.textContent = message.count;
              }
              break;
            case 'refreshView':
              location.reload();
              break;
          }
        });

        // Error handling for GIFs
        if (avatar) {
          avatar.onerror = function() {
            console.log('🐾 GIF failed to load, using fallback');
            const fallback = document.createElement('div');
            fallback.style.cssText = \`
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 50px;
              background: var(--theme-card-background);
              border-radius: 20px;
            \`;

            const petEmoji = '${this._petType === "cat" ? "🐱" : "🦝"}';
            fallback.textContent = petEmoji;

            this.style.display = 'none';
            this.parentNode.appendChild(fallback);
          };
        }

        // Focus input on load (main view only)
        setTimeout(() => {
          if (chatInput && !chatInput.disabled && !isCompactView) {
            chatInput.focus();
          }
        }, 200);
      </script>
    </body>
    </html>
  `

    // Mark webview as ready after content is set
    setTimeout(() => {
      if (!this._webviewReady) {
        this._webviewReady = true
        this._sendInitialState()
      }
    }, 50)
  }

  _getThemeCSS() {
    const theme = this._currentTheme

    const themes = {
      light: `
      :root {
        --theme-background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        --theme-foreground: #212529;
        --theme-card-background: #ffffff;
        --theme-input-background: #f8f9fa;
        --theme-border: #dee2e6;
        --theme-accent: #7c3aed;
        --theme-accent-gradient: linear-gradient(90deg, #7c3aed, #a855f7);
        --theme-accent-alpha: rgba(124, 58, 237, 0.15);
        --theme-button-background: #7c3aed;
        --theme-button-foreground: #ffffff;
        --theme-button-hover: #6d28d9;
        --theme-secondary-button: #6c757d;
        --theme-shadow: rgba(0, 0, 0, 0.1);
        --theme-muted: #6c757d;
        --theme-scrollbar-track: transparent;
        --theme-scrollbar-thumb: rgba(0, 0, 0, 0.1);
        --theme-scrollbar-thumb-hover: rgba(0, 0, 0, 0.2);
      }
    `,
      dark: `
      :root {
        --theme-background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
        --theme-foreground: #f0f6fc;
        --theme-card-background: #161b22;
        --theme-input-background: #21262d;
        --theme-border: #30363d;
        --theme-accent: #58a6ff;
        --theme-accent-gradient: linear-gradient(90deg, #58a6ff, #79c0ff);
        --theme-accent-alpha: rgba(88, 166, 255, 0.2);
        --theme-button-background: #58a6ff;
        --theme-button-foreground: #0d1117;
        --theme-button-hover: #79c0ff;
        --theme-secondary-button: #6e7681;
        --theme-shadow: rgba(0, 0, 0, 0.5);
        --theme-muted: #8b949e;
        --theme-scrollbar-track: transparent;
        --theme-scrollbar-thumb: rgba(255, 255, 255, 0.1);
        --theme-scrollbar-thumb-hover: rgba(255, 255, 255, 0.2);
      }
    `,
      cherry: `
      :root {
        --theme-background: linear-gradient(135deg, #000000 0%, #1a0033 50%, #000000 100%);
        --theme-foreground: #ff69b4;
        --theme-card-background: linear-gradient(145deg, #0a0a0a, #1a1a1a);
        --theme-input-background: #1a1a1a;
        --theme-border: #ff1493;
        --theme-accent: #ff0080;
        --theme-accent-gradient: linear-gradient(90deg, #ff0080, #ff69b4, #ff1493);
        --theme-accent-alpha: rgba(255, 0, 128, 0.3);
        --theme-button-background: linear-gradient(45deg, #ff0080, #ff69b4);
        --theme-button-foreground: #000000;
        --theme-button-hover: linear-gradient(45deg, #e6006b, #ff1493);
        --theme-secondary-button: linear-gradient(45deg, #333333, #555555);
        --theme-shadow: rgba(255, 20, 147, 0.4);
        --theme-muted: #ff69b4;
        --theme-scrollbar-track: transparent;
        --theme-scrollbar-thumb: rgba(255, 255, 255, 0.1);
        --theme-scrollbar-thumb-hover: rgba(255, 255, 255, 0.2);
      }

      body {
        text-shadow: 0 0 10px currentColor;
      }

      .avatar-box, .pet-button, .action-button {
        box-shadow: 0 0 20px var(--theme-shadow), inset 0 0 20px rgba(255, 255, 255, 0.1) !important;
      }

      .avatar-box:hover {
        box-shadow: 0 0 30px var(--theme-shadow), inset 0 0 30px rgba(255, 255, 255, 0.2) !important;
      }
    `,
      hacker: `
      :root {
        --theme-background: linear-gradient(135deg, #000000 0%, #001100 100%);
        --theme-foreground: #00ff00;
        --theme-card-background: #001100;
        --theme-input-background: #002200;
        --theme-border: #00aa00;
        --theme-accent: #00ff00;
        --theme-accent-gradient: linear-gradient(90deg, #00ff00, #00aa00);
        --theme-accent-alpha: rgba(0, 255, 0, 0.2);
        --theme-button-background: #00aa00;
        --theme-button-foreground: #000000;
        --theme-button-hover: #00ff00;
        --theme-secondary-button: #004400;
        --theme-shadow: rgba(0, 255, 0, 0.3);
        --theme-muted: #00aa00;
        --theme-scrollbar-track: transparent;
        --theme-scrollbar-thumb: rgba(255, 255, 255, 0.1);
        --theme-scrollbar-thumb-hover: rgba(255, 255, 255, 0.2);
      }

      body {
        font-family: 'Courier New', monospace;
        text-shadow: 0 0 5px currentColor;
      }
    `,
      cozy: `
      :root {
        --theme-background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
        --theme-foreground: #FFFAF0;
        --theme-card-background: #CD853F;
        --theme-input-background: #DEB887;
        --theme-border: #D2691E;
        --theme-accent: #FF6347;
        --theme-accent-gradient: linear-gradient(90deg, #FF6347, #FF4500);
        --theme-accent-alpha: rgba(255, 99, 71, 0.2);
        --theme-button-background: #FF6347;
        --theme-button-foreground: #FFFAF0;
        --theme-button-hover: #FF4500;
        --theme-secondary-button: #A0522D;
        --theme-shadow: rgba(139, 69, 19, 0.4);
        --theme-muted: #F4A460;
        --theme-scrollbar-track: transparent;
        --theme-scrollbar-thumb: rgba(255, 255, 255, 0.1);
        --theme-scrollbar-thumb-hover: rgba(255, 255, 255, 0.2);
      }
    `,
    }

    return themes[theme] || themes.dark
  }

  _getMoodText() {
    return this._petMood.charAt(0).toUpperCase() + this._petMood.slice(1)
  }

  _formatMessage(content) {
    // Enhanced formatting for AI responses with markdown support
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code style="background: var(--theme-input-background); padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>',
      )
      .replace(/\n/g, "<br>")
  }

  _updateAchievementCount() {
    allProviders.forEach((provider) => {
      if (provider._view && provider._view.webview && provider._webviewReady) {
        try {
          provider._view.webview.postMessage({
            command: "updateAchievementCount",
            count: this._achievements.size,
            total: Object.keys(ACHIEVEMENTS).length,
          })
        } catch (error) {
          console.error(`🐾 Error updating achievement count for ${provider._viewId}:`, error)
        }
      }
    })
  }
}

function activate(context) {
  console.log("🐾 Starting Tamagotchi Pets extension activation...")

  try {
    const mainProvider = new TamagotchiPetProvider(context, "main")
    const explorerProvider = new TamagotchiPetProvider(context, "explorer")

    // Register webview providers
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider("tamagotchi-pets-main", mainProvider, {
        webviewOptions: { retainContextWhenHidden: true },
      }),
    )

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider("tamagotchi-pets-explorer", explorerProvider, {
        webviewOptions: { retainContextWhenHidden: true },
      }),
    )

    // Register commands
    const commands = [
      {
        id: "tamagotchi-pets.setApiKey",
        handler: () => mainProvider._setupApiKey(),
      },
      {
        id: "tamagotchi-pets.openSettings",
        handler: () => mainProvider._openSettingsPanel(),
      },
      {
        id: "tamagotchi-pets.showPet",
        handler: () => vscode.commands.executeCommand("workbench.view.extension.tamagotchi-pets-container"),
      },
      {
        id: "tamagotchi-pets.feedPet",
        handler: () => mainProvider._feedPet(),
      },
      {
        id: "tamagotchi-pets.patPet",
        handler: () => mainProvider._patPet(),
      },
      {
        id: "tamagotchi-pets.saveFiles",
        handler: () => mainProvider._saveAllFiles(),
      },
      {
        id: "tamagotchi-pets.gitCommit",
        handler: () => mainProvider._gitCommit(),
      },
      {
        id: "tamagotchi-pets.showAchievements",
        handler: () => mainProvider._showAchievements(),
      },
    ]

    commands.forEach(({ id, handler }) => {
      context.subscriptions.push(vscode.commands.registerCommand(id, handler))
    })

    console.log("🐾 Extension registration complete, showing welcome message...")

    // Show welcome message
    setTimeout(() => {
      const config = vscode.workspace.getConfiguration("tamagotchiPets")
      const hasShownWelcome = context.globalState.get("hasShownWelcome", false)

      if (!hasShownWelcome) {
        context.globalState.update("hasShownWelcome", true)
        vscode.window
          .showInformationMessage(
            "🐾 Welcome to Tamagotchi Pets! Your virtual coding companion is ready! Look for the 🐾 icon in the activity bar.",
            "🚀 Open Pet Panel",
            "⚙️ Settings",
            "🔑 Set API Key",
          )
          .then((selection) => {
            switch (selection) {
              case "🚀 Open Pet Panel":
                vscode.commands.executeCommand("workbench.view.extension.tamagotchi-pets-container")
                break
              case "⚙️ Settings":
                mainProvider._openSettingsPanel()
                break
              case "🔑 Set API Key":
                mainProvider._setupApiKey()
                break
            }
          })
      } else if (!config.get("apiKey")) {
        vscode.window
          .showInformationMessage(
            "🐾 Your pet is ready! Add an API key to unlock AI features.",
            "🔑 Set API Key",
            "⚙️ Settings",
          )
          .then((selection) => {
            if (selection === "🔑 Set API Key") {
              mainProvider._setupApiKey()
            } else if (selection === "⚙️ Settings") {
              mainProvider._openSettingsPanel()
            }
          })
      }
    }, 1000)

    console.log("✅ Tamagotchi Pets extension activated successfully!")
    vscode.window.setStatusBarMessage("🐾 Tamagotchi Pets activated!", 3000)
  } catch (error) {
    console.error("❌ Failed to activate Tamagotchi Pets extension:", error)
    vscode.window.showErrorMessage("Failed to activate Tamagotchi Pets: " + error.message)
  }
}

function deactivate() {
  console.log("🐾 Deactivating Tamagotchi Pets extension...")
  // Clean up global providers
  allProviders.length = 0
}

module.exports = {
  activate,
  deactivate,
}
