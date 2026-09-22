import { useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "./supabase"
import "./App.css"

const avatars = ["🌟", "🦁", "🐼", "🦋", "🚀", "🌈", "🐯", "🐸"]

const isValidEmail = (value) => {
  // Basic RFC-5322-ish check: catches missing @, missing domain, spaces, etc.
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  return pattern.test(value.trim())
}

const gameData = {
  find: {
    title: "Find It",
    icon: "🔎",
    description: "Find the picture you hear.",
    colour: "yellow",
    rounds: 5,
    items: [
      { id: "apple", emoji: "🍎", label: "apple" },
      { id: "dog", emoji: "🐶", label: "dog" },
      { id: "car", emoji: "🚗", label: "car" },
      { id: "ball", emoji: "⚽", label: "ball" },
    ],
  },

  matching: {
    title: "Emoji Match",
    icon: "🎯",
    description: "Match the picture with the target.",
    colour: "purple",
    rounds: 5,
    items: [
      { id: "apple", emoji: "🍎", label: "apple" },
      { id: "dog", emoji: "🐶", label: "dog" },
      { id: "cat", emoji: "🐱", label: "cat" },
      { id: "car", emoji: "🚗", label: "car" },
    ],
  },

  colours: {
    title: "Colour Pop",
    icon: "🎨",
    description: "Find the colour that is named.",
    colour: "blue",
    rounds: 5,
    items: [
      { id: "red", label: "red", colour: "#ff6b6b" },
      { id: "yellow", label: "yellow", colour: "#ffd93d" },
      { id: "blue", label: "blue", colour: "#64b5f6" },
      { id: "green", label: "green", colour: "#72d572" },
    ],
  },

  feelings: {
    title: "Feelings",
    icon: "😊",
    description: "Learn different feelings.",
    colour: "pink",
    rounds: 5,
    items: [
      { id: "happy", emoji: "😀", label: "happy" },
      { id: "sad", emoji: "😢", label: "sad" },
      { id: "excited", emoji: "🤩", label: "excited" },
      { id: "calm", emoji: "😌", label: "calm" },
    ],
  },

  letters: {
    title: "Letter Fun",
    icon: "🔤",
    description: "Learn letters and sounds.",
    colour: "green",
    rounds: 5,
    items: [
      { id: "a", emoji: "🅰️", label: "A" },
      { id: "b", emoji: "🅱️", label: "B" },
      { id: "c", emoji: "©️", label: "C" },
      { id: "d", emoji: "🔤", label: "D" },
    ],
  },

  numbers: {
    title: "Number Fun",
    icon: "🔢",
    description: "Learn numbers one to five.",
    colour: "orange",
    rounds: 5,
    items: [
      { id: "1", emoji: "1️⃣", label: "one" },
      { id: "2", emoji: "2️⃣", label: "two" },
      { id: "3", emoji: "3️⃣", label: "three" },
      { id: "4", emoji: "4️⃣", label: "four" },
      { id: "5", emoji: "5️⃣", label: "five" },
    ],
  },

  animals: {
    title: "Animal World",
    icon: "🐾",
    description: "Discover friendly animals.",
    colour: "teal",
    rounds: 5,
    items: [
      { id: "dog", emoji: "🐶", label: "dog" },
      { id: "cat", emoji: "🐱", label: "cat" },
      { id: "lion", emoji: "🦁", label: "lion" },
      { id: "monkey", emoji: "🐵", label: "monkey" },
    ],
  },

  shapes: {
    title: "Shape Safari",
    icon: "🔷",
    description: "Learn simple shapes.",
    colour: "indigo",
    rounds: 5,
    items: [
      { id: "circle", emoji: "🔴", label: "circle" },
      { id: "square", emoji: "🟦", label: "square" },
      { id: "triangle", emoji: "🔺", label: "triangle" },
      { id: "star", emoji: "⭐", label: "star" },
    ],
  },
}

const achievements = [
  {
    id: "first-game",
    icon: "🌱",
    title: "First Step",
    description: "Complete your first game.",
    requirement: (activities) => activities.length >= 1,
  },
  {
    id: "five-games",
    icon: "🎮",
    title: "Game Explorer",
    description: "Complete 5 games.",
    requirement: (activities) => activities.length >= 5,
  },
  {
    id: "ten-games",
    icon: "🏆",
    title: "Super Learner",
    description: "Complete 10 games.",
    requirement: (activities) => activities.length >= 10,
  },
  {
    id: "perfect",
    icon: "💯",
    title: "Perfect Score",
    description: "Get every answer correct in a game.",
    requirement: (activities) =>
      activities.some((item) => item.score === item.total),
  },
  {
    id: "three-perfect",
    icon: "👑",
    title: "Bright Star",
    description: "Get 3 perfect scores.",
    requirement: (activities) =>
      activities.filter((item) => item.score === item.total).length >= 3,
  },
]

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const [screen, setScreen] = useState("home")

  const [authMode, setAuthMode] = useState("signin")
  const [authMessage, setAuthMessage] = useState("")
  const [parentName, setParentName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [children, setChildren] = useState([])
  const [activeChild, setActiveChild] = useState(null)

  const [newChildName, setNewChildName] = useState("")
  const [newChildAvatar, setNewChildAvatar] = useState("🌟")

  const [activities, setActivities] = useState([])

  const [activeGame, setActiveGame] = useState("")
  const [challenge, setChallenge] = useState(null)
  const [round, setRound] = useState(1)
  const [score, setScore] = useState(0)

  const [feedback, setFeedback] = useState("")
  const [locked, setLocked] = useState(false)

  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("brightsteps-sound") !== "false"
  })

  const [showSettings, setShowSettings] = useState(false)

  const [dailyGoal, setDailyGoal] = useState(() => {
    return Number(localStorage.getItem("brightsteps-goal")) || 3
  })

  const timerRef = useRef(null)

  const currentGame = activeGame ? gameData[activeGame] : null

  const shuffle = (array) => {
    return [...array].sort(() => Math.random() - 0.5)
  }

  const randomItem = (array) => {
    return array[Math.floor(Math.random() * array.length)]
  }

  const speak = (text) => {
    if (!soundEnabled) return

    if (!("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()

    const speech = new SpeechSynthesisUtterance(text)

    speech.rate = 0.82
    speech.pitch = 1.05
    speech.volume = 1

    window.speechSynthesis.speak(speech)
  }

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const loadChildren = async () => {
    const { data, error } = await supabase
      .from("child_profiles")
      .select("*")
      .order("created_at", { ascending: true })

    if (!error) {
      setChildren(data || [])

      if (data?.length && !activeChild) {
        setActiveChild(data[0])
      }
    }
  }

  const loadActivities = async (childId) => {
    if (!childId) return

    const { data, error } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("child_id", childId)
      .order("played_at", { ascending: false })

    if (!error) {
      setActivities(data || [])
    }
  }

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      setSession(currentSession)

      if (currentSession) {
        await loadChildren()
      }

      setLoading(false)
    }

    initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession)

        if (currentSession) {
          loadChildren()
        } else {
          setChildren([])
          setActiveChild(null)
          setActivities([])
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimer()
    }
  }, [])

  useEffect(() => {
    if (activeChild) {
      loadActivities(activeChild.id)
    }
  }, [activeChild])

  useEffect(() => {
    localStorage.setItem(
      "brightsteps-sound",
      String(soundEnabled)
    )
  }, [soundEnabled])

  useEffect(() => {
    localStorage.setItem(
      "brightsteps-goal",
      String(dailyGoal)
    )
  }, [dailyGoal])

  const createChallenge = (gameKey) => {
    const game = gameData[gameKey]

    const target = randomItem(game.items)

    let choices = shuffle(game.items)

    if (game.items.length > 4) {
      choices = choices.slice(0, 4)

      if (!choices.some((item) => item.id === target.id)) {
        choices[0] = target
        choices = shuffle(choices)
      }
    }

    let prompt = ""

    if (gameKey === "find") {
      prompt = `Find the ${target.label}.`
    } else if (gameKey === "matching") {
      prompt = `Match the ${target.label}.`
    } else if (gameKey === "colours") {
      prompt = `Find the colour ${target.label}.`
    } else if (gameKey === "feelings") {
      prompt = `Find the ${target.label} face.`
    } else if (gameKey === "letters") {
      prompt = `Find the letter ${target.label}.`
    } else if (gameKey === "numbers") {
      prompt = `Find the number ${target.label}.`
    } else if (gameKey === "animals") {
      prompt = `Find the ${target.label}.`
    } else if (gameKey === "shapes") {
      prompt = `Find the ${target.label}.`
    }

    return {
      target,
      choices,
      prompt,
    }
  }

  const handleAuth = async (event) => {
    event.preventDefault()

    setAuthMessage("")

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail || !password) {
      setAuthMessage("Please enter an email and password.")
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      setAuthMessage(
        "Please enter a valid email address (e.g. name@example.com)."
      )
      return
    }

    if (password.length < 6) {
      setAuthMessage("Password must be at least 6 characters.")
      return
    }

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            display_name: parentName || "Parent",
          },
        },
      })

      if (error) {
        setAuthMessage(error.message)
        return
      }

      if (!data.session) {
        setAuthMessage(
          `Account created! We've sent a confirmation link to ${trimmedEmail} — please check your inbox (and spam folder) to activate your account.`
        )
      } else {
        setAuthMessage("Account created! Welcome to BrightSteps 🎉")
      }

      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })

    if (error) {
      setAuthMessage(error.message)
    }
  }

  const signOut = async () => {
    clearTimer()

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }

    await supabase.auth.signOut()

    setScreen("home")
  }

  const createChild = async (event) => {
    event.preventDefault()

    const nickname = newChildName.trim()

    if (!nickname || !session) return

    const { data, error } = await supabase
      .from("child_profiles")
      .insert({
        parent_id: session.user.id,
        nickname,
        avatar: newChildAvatar,
      })
      .select()
      .single()

    if (error) {
      alert(error.message)
      return
    }

    setChildren((current) => [...current, data])
    setActiveChild(data)
    setNewChildName("")
    setNewChildAvatar("🌟")
    setScreen("home")

    speak(`Hello ${nickname}! Welcome to BrightSteps.`)
  }

  const chooseChild = (child) => {
    setActiveChild(child)
    setScreen("home")
    speak(`Hello ${child.nickname}!`)
  }

  const goHome = () => {
    clearTimer()

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }

    setFeedback("")
    setLocked(false)
    setScreen("home")
  }

  const startGame = (gameKey) => {
    if (!activeChild) {
      setScreen("children")
      return
    }

    clearTimer()

    const firstChallenge = createChallenge(gameKey)

    setActiveGame(gameKey)
    setChallenge(firstChallenge)
    setRound(1)
    setScore(0)
    setFeedback("")
    setLocked(false)

    setScreen("play")

    speak(
      `${gameData[gameKey].title}. ${firstChallenge.prompt}`
    )
  }

  const saveActivity = async (finalScore) => {
    if (!activeChild) return

    const { error } = await supabase
      .from("game_sessions")
      .insert({
        child_id: activeChild.id,
        game_key: activeGame,
        score: finalScore,
        total: gameData[activeGame].rounds,
      })

    if (error) {
      console.error("Could not save activity:", error)
    } else {
      await loadActivities(activeChild.id)
    }
  }

  const finishGame = async (finalScore) => {
    await saveActivity(finalScore)

    clearTimer()

    timerRef.current = window.setTimeout(() => {
      setScreen("result")

      const total = gameData[activeGame].rounds

      if (finalScore === total) {
        speak(
          `Amazing! You got ${finalScore} out of ${total}! You are a superstar!`
        )
      } else if (finalScore >= Math.ceil(total / 2)) {
        speak(
          `Great job! You got ${finalScore} out of ${total}! Keep learning!`
        )
      } else {
        speak(
          `Nice try! You got ${finalScore} out of ${total}. Every time you play, you learn more!`
        )
      }
    }, 900)
  }

  const answerChallenge = (chosenAnswer) => {
    if (locked || !challenge) return

    const correct =
      chosenAnswer.id === challenge.target.id

    if (correct) {
      const newScore = score + 1

      setScore(newScore)
      setLocked(true)
      setFeedback("correct")

      speak("Correct! Great job! ⭐")

      if (round === currentGame.rounds) {
        finishGame(newScore)
      } else {
        timerRef.current = window.setTimeout(() => {
          const nextChallenge = createChallenge(activeGame)

          setRound((currentRound) => currentRound + 1)
          setChallenge(nextChallenge)
          setFeedback("")
          setLocked(false)

          speak(nextChallenge.prompt)
        }, 850)
      }
    } else {
      setLocked(true)
      setFeedback("wrong")

      speak("Try again! You can do it!")

      timerRef.current = window.setTimeout(() => {
        setFeedback("")
        setLocked(false)
      }, 800)
    }
  }

  const totalActivities = activities.length

  const totalCorrect = activities.reduce(
    (total, activity) => total + Number(activity.score || 0),
    0
  )

  const totalQuestions = activities.reduce(
    (total, activity) => total + Number(activity.total || 0),
    0
  )

  const overallAccuracy = totalQuestions
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0

  const totalStars = totalCorrect

  const gameProgress = Object.entries(gameData).map(
    ([gameKey, game]) => {
      const sessions = activities.filter(
        (activity) => activity.game_key === gameKey
      )

      const correct = sessions.reduce(
        (total, activity) =>
          total + Number(activity.score || 0),
        0
      )

      const total = sessions.reduce(
        (total, activity) =>
          total + Number(activity.total || 0),
        0
      )

      return {
        gameKey,
        ...game,
        sessions: sessions.length,
        correct,
        total,
        percent: total
          ? Math.round((correct / total) * 100)
          : 0,
        hasActivity: total > 0,
      }
    }
  )

  const strongestGame = useMemo(() => {
    return [...gameProgress]
      .filter((game) => game.hasActivity)
      .sort((a, b) => b.percent - a.percent)[0]
  }, [activities])

  const unlockedAchievements = achievements.filter(
    (achievement) =>
      activeChild &&
      achievement.requirement(activities)
  )

  const today = new Date().toDateString()

  const todayActivities = activities.filter((activity) => {
    return (
      new Date(activity.played_at).toDateString() === today
    )
  })

  const dailyProgress = Math.min(
    100,
    Math.round(
      (todayActivities.length / dailyGoal) * 100
    )
  )

  const streak = useMemo(() => {
    if (!activities.length) return 0

    const dates = [
      ...new Set(
        activities.map((activity) =>
          new Date(activity.played_at).toDateString()
        )
      ),
    ]

    let current = new Date()
    let count = 0

    for (;;) {
      const dateString = current.toDateString()

      if (dates.includes(dateString)) {
        count++
        current.setDate(current.getDate() - 1)
      } else {
        break
      }
    }

    return count
  }, [activities])

  if (loading) {
    return (
      <main className="app-shell">
        <section className="app-card loading-card">
          <div className="loading-icon">🌈</div>
          <h1>BrightSteps</h1>
          <p>Getting everything ready…</p>
          <div className="loading-dots">•••</div>
        </section>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="app-shell">
        <div className="cloud cloud-one">☁️</div>
        <div className="cloud cloud-two">☁️</div>

        <section className="app-card auth-card">
          <div className="auth-hero">🌈</div>

          <h1>BrightSteps</h1>

          <p className="subtitle">
            A happy little learning space where every step
            counts.
          </p>

          <div className="feature-mini-row">
            <span>🎮 Games</span>
            <span>⭐ Rewards</span>
            <span>🔊 Audio</span>
          </div>

          <div className="auth-tabs">
            <button
              className={
                authMode === "signin" ? "active" : ""
              }
              onClick={() => {
                setAuthMode("signin")
                setAuthMessage("")
              }}
            >
              Sign In
            </button>

            <button
              className={
                authMode === "signup" ? "active" : ""
              }
              onClick={() => {
                setAuthMode("signup")
                setAuthMessage("")
              }}
            >
              Create Account
            </button>
          </div>

          <form
            className="auth-form"
            onSubmit={handleAuth}
          >
            {authMode === "signup" && (
              <>
                <label>Parent or caregiver name</label>

                <input
                  value={parentName}
                  placeholder="Your name"
                  onChange={(event) =>
                    setParentName(event.target.value)
                  }
                />
              </>
            )}

            <label>Email address</label>

            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />

            <label>Password</label>

            <input
              type="password"
              minLength="6"
              value={password}
              placeholder="At least 6 characters"
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />

            <button
              className="primary-button"
              type="submit"
            >
              {authMode === "signup"
                ? "Create Account ✨"
                : "Sign In →"}
            </button>

            {authMessage && (
              <p className="auth-message">
                {authMessage}
              </p>
            )}
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <div className="cloud cloud-one">☁️</div>
      <div className="cloud cloud-two">☁️</div>
      <div className="cloud cloud-three">☁️</div>

      <section className="app-card">
        <header className="site-header">
          <button
            className="brand"
            onClick={goHome}
          >
            🌈 BrightSteps
          </button>

          <div className="header-actions">
            <button
              className="sound-button"
              onClick={() => {
                speak(
                  "Welcome to BrightSteps! You can learn, play and grow."
                )
              }}
            >
              🔊
            </button>

            <button
              className="settings-button"
              onClick={() =>
                setShowSettings((value) => !value)
              }
            >
              ⚙️
            </button>
          </div>
        </header>

        {showSettings && (
          <div className="settings-panel">
            <div className="settings-header">
              <h2>Settings ⚙️</h2>

              <button
                className="close-button"
                onClick={() => setShowSettings(false)}
              >
                ×
              </button>
            </div>

            <div className="setting-row">
              <div>
                <strong>Voice helper</strong>
                <p>Hear questions and encouragement.</p>
              </div>

              <button
                className={`toggle ${
                  soundEnabled ? "on" : ""
                }`}
                onClick={() =>
                  setSoundEnabled((value) => !value)
                }
              >
                {soundEnabled ? "ON" : "OFF"}
              </button>
            </div>

            <div className="setting-row">
              <div>
                <strong>Daily game goal</strong>
                <p>Choose how many games to aim for.</p>
              </div>

              <select
                value={dailyGoal}
                onChange={(event) =>
                  setDailyGoal(Number(event.target.value))
                }
              >
                <option value="1">1 game</option>
                <option value="2">2 games</option>
                <option value="3">3 games</option>
                <option value="5">5 games</option>
                <option value="10">10 games</option>
              </select>
            </div>
          </div>
        )}

        {screen === "home" && (
          <section className="home-screen">
            <div className="hero-section">
              <div className="hero-icon">🌟</div>

              <div>
                <p className="eyebrow">
                  WELCOME TO YOUR LEARNING SPACE
                </p>

                <h1>
                  Learning can be
                  <span> fun!</span>
                </h1>

                <p className="subtitle">
                  One gentle step at a time. 🌱
                </p>
              </div>
            </div>

            {activeChild ? (
              <div className="welcome-player">
                <span className="player-avatar">
                  {activeChild.avatar}
                </span>

                <div>
                  <p className="small-label">
                    TODAY'S LEARNER
                  </p>

                  <h2>
                    Hi, {activeChild.nickname}! 👋
                  </h2>
                </div>

                <button
                  className="text-button"
                  onClick={() =>
                    setScreen("children")
                  }
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="welcome-player no-player">
                <span className="player-avatar">
                  👋
                </span>

                <div>
                  <p className="small-label">
                    LET'S GET STARTED
                  </p>

                  <h2>Choose a player</h2>
                </div>

                <button
                  className="text-button"
                  onClick={() =>
                    setScreen("children")
                  }
                >
                  Choose
                </button>
              </div>
            )}

            {activeChild && (
              <div className="quick-stats">
                <div>
                  <span>⭐</span>
                  <strong>{totalStars}</strong>
                  <small>Stars</small>
                </div>

                <div>
                  <span>🔥</span>
                  <strong>{streak}</strong>
                  <small>Day streak</small>
                </div>

                <div>
                  <span>🏆</span>
                  <strong>
                    {unlockedAchievements.length}
                  </strong>
                  <small>Badges</small>
                </div>
              </div>
            )}

            <div className="daily-card">
              <div className="daily-top">
                <div>
                  <p className="small-label">
                    TODAY'S GOAL
                  </p>
                  <h2>
                    {todayActivities.length} / {dailyGoal} games
                  </h2>
                </div>

                <span className="daily-icon">
                  {dailyProgress >= 100
                    ? "🏆"
                    : "🌱"}
                </span>
              </div>

              <div className="daily-track">
                <div
                  className="daily-fill"
                  style={{
                    width: `${dailyProgress}%`,
                  }}
                />
              </div>

              <p>
                {dailyProgress >= 100
                  ? "Amazing! You reached today's goal! 🎉"
                  : "Every little step counts!"}
              </p>
            </div>

            <div className="home-actions">
              <button
                className="primary-button large"
                onClick={() => setScreen("games")}
              >
                🎮 Play & Learn
              </button>

              <div className="secondary-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    setScreen("dashboard")
                  }
                >
                  📊 Progress
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    setScreen("achievements")
                  }
                >
                  🏆 Rewards
                </button>
              </div>
            </div>
          </section>
        )}

        {screen === "children" && (
          <section className="profiles-screen">
            <button
              className="back-button"
              onClick={goHome}
            >
              ← Home
            </button>

            <div className="page-heading">
              <p className="eyebrow">BRIGHTSTEPS FAMILY</p>
              <h1>Who is playing?</h1>
              <p className="subtitle">
                Choose a learner or create a new player.
              </p>
            </div>

            <div className="profile-list">
              {children.map((child) => (
                <button
                  className={`profile-button ${
                    activeChild?.id === child.id
                      ? "selected"
                      : ""
                  }`}
                  key={child.id}
                  onClick={() =>
                    chooseChild(child)
                  }
                >
                  <span>{child.avatar}</span>

                  <div>
                    <strong>{child.nickname}</strong>
                    <small>
                      {activeChild?.id === child.id
                        ? "Currently selected"
                        : "Choose player"}
                    </small>
                  </div>

                  <b>→</b>
                </button>
              ))}
            </div>

            <form
              className="new-profile-form"
              onSubmit={createChild}
            >
              <h2>✨ Create a new player</h2>

              <label>Child nickname</label>

              <input
                value={newChildName}
                placeholder="Type a nickname"
                maxLength="30"
                onChange={(event) =>
                  setNewChildName(event.target.value)
                }
              />

              <p className="avatar-label">
                Choose an avatar
              </p>

              <div className="avatar-picker">
                {avatars.map((avatar) => (
                  <button
                    type="button"
                    key={avatar}
                    className={
                      newChildAvatar === avatar
                        ? "avatar active"
                        : "avatar"
                    }
                    onClick={() =>
                      setNewChildAvatar(avatar)
                    }
                  >
                    {avatar}
                  </button>
                ))}
              </div>

              <button
                className="primary-button"
                type="submit"
              >
                Create Player ✨
              </button>
            </form>
          </section>
        )}

        {screen === "games" && (
          <section className="games-screen">
            <div className="screen-topbar">
              <button
                className="back-button"
                onClick={goHome}
              >
                ← Home
              </button>

              <span className="current-player">
                {activeChild
                  ? `${activeChild.avatar} ${activeChild.nickname}`
                  : "Choose player"}
              </span>
            </div>

            <div className="page-heading">
              <p className="eyebrow">
                LEARN • PLAY • GROW
              </p>

              <h1>Choose a game 🎮</h1>

              <p className="subtitle">
                Pick something fun to practise today.
              </p>
            </div>

            <div className="games-grid">
              {Object.entries(gameData).map(
                ([gameKey, game]) => {
                  const progress = gameProgress.find(
                    (item) =>
                      item.gameKey === gameKey
                  )

                  return (
                    <button
                      className={`game-tile ${game.colour}`}
                      key={gameKey}
                      onClick={() =>
                        startGame(gameKey)
                      }
                    >
                      <span className="game-icon">
                        {game.icon}
                      </span>

                      <span className="game-title">
                        {game.title}
                      </span>

                      <span className="game-description">
                        {game.description}
                      </span>

                      <div className="game-tile-bottom">
                        <span>
                          {progress?.hasActivity
                            ? `${progress.percent}%`
                            : "New"}
                        </span>

                        <span>→</span>
                      </div>
                    </button>
                  )
                }
              )}
            </div>
          </section>
        )}

        {screen === "play" &&
          challenge &&
          currentGame && (
            <section className="play-screen">
              <div className="screen-topbar">
                <button
                  className="back-button"
                  onClick={() =>
                    setScreen("games")
                  }
                >
                  ← Games
                </button>

                <span className="score-pill">
                  ⭐ {score}
                </span>
              </div>

              <div className="progress-track">
                <div
                  className={`progress-bar ${currentGame.colour}`}
                  style={{
                    width: `${
                      (round / currentGame.rounds) *
                      100
                    }%`,
                  }}
                />
              </div>

              <p className="round-text">
                {currentGame.icon}{" "}
                {currentGame.title} · Round {round} of{" "}
                {currentGame.rounds}
              </p>

              <h1>
                {challenge.prompt}
              </h1>

              <button
                className="hear-question"
                onClick={() =>
                  speak(challenge.prompt)
                }
              >
                🔊 Hear question
              </button>

              <div
                className={`target-box ${activeGame}`}
              >
                {activeGame === "colours" ? (
                  <span
                    className="colour-target"
                    style={{
                      backgroundColor:
                        challenge.target.colour,
                    }}
                  />
                ) : (
                  <span>
                    {challenge.target.emoji}
                  </span>
                )}
              </div>

              <div className="answers">
                {challenge.choices.map(
                  (choice) => (
                    <button
                      key={choice.id}
                      disabled={locked}
                      className={`answer-button ${
                        feedback
                      } ${
                        activeGame === "colours"
                          ? "colour-answer"
                          : ""
                      }`}
                      style={
                        activeGame === "colours"
                          ? {
                              backgroundColor:
                                choice.colour,
                            }
                          : {}
                      }
                      onClick={() =>
                        answerChallenge(choice)
                      }
                    >
                      {activeGame === "colours" ? (
                        <span className="colour-name">
                          {choice.label}
                        </span>
                      ) : (
                        <>
                          <span>
                            {choice.emoji}
                          </span>

                          {activeGame === "letters" && (
                            <small>
                              Letter {choice.label}
                            </small>
                          )}

                          {activeGame === "numbers" && (
                            <small>
                              {choice.label}
                            </small>
                          )}
                        </>
                      )}
                    </button>
                  )
                )}
              </div>

              <p
                className={`feedback ${feedback}`}
              >
                {feedback === "correct" &&
                  "Correct! 🎉⭐"}

                {feedback === "wrong" &&
                  "Try again! 💛"}

                {!feedback &&
                  "Take your time. You can do it! 🌱"}
              </p>
            </section>
          )}

        {screen === "result" &&
          currentGame && (
            <section className="result-screen">
              <div className="celebration">
                {score === currentGame.rounds
                  ? "🏆"
                  : "🎉"}
              </div>

              <p className="eyebrow">
                GAME COMPLETE
              </p>

              <h1>Wonderful work!</h1>

              <p className="result-message">
                You finished{" "}
                <strong>
                  {currentGame.title}
                </strong>
              </p>

              <div className="big-score">
                <span>{score}</span>
                <small>
                  / {currentGame.rounds}
                </small>
              </div>

              <div className="reward-box">
                <span>⭐</span>
                <div>
                  <strong>
                    +{score} BrightStars
                  </strong>
                  <p>
                    Every correct answer is a
                    learning step!
                  </p>
                </div>
              </div>

              <div className="result-actions">
                <button
                  className="primary-button"
                  onClick={() =>
                    startGame(activeGame)
                  }
                >
                  🔄 Play Again
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    setScreen("games")
                  }
                >
                  🎮 Other Games
                </button>

                <button
                  className="secondary-button"
                  onClick={goHome}
                >
                  🏠 Home
                </button>
              </div>
            </section>
          )}

        {screen === "dashboard" && (
          <section className="dashboard-screen">
            <button
              className="back-button"
              onClick={goHome}
            >
              ← Home
            </button>

            <div className="page-heading">
              <p className="eyebrow">
                CAREGIVER VIEW
              </p>

              <h1>Learning Progress 📊</h1>

              <p className="subtitle">
                A simple overview of the learning
                journey.
              </p>
            </div>

            {!activeChild ? (
              <div className="empty-dashboard">
                <span>👋</span>

                <h2>No player selected</h2>

                <p>
                  Choose a player to view their
                  progress.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    setScreen("children")
                  }
                >
                  Choose Player
                </button>
              </div>
            ) : (
              <>
                <div className="dashboard-player">
                  <span className="dashboard-avatar">
                    {activeChild.avatar}
                  </span>

                  <div>
                    <p className="small-label">
                      LEARNING JOURNEY FOR
                    </p>

                    <h2>
                      {activeChild.nickname}
                    </h2>
                  </div>

                  <button
                    className="text-button"
                    onClick={() =>
                      setScreen("children")
                    }
                  >
                    Change
                  </button>
                </div>

                <div className="stats-grid">
                  <div className="stat-card purple-stat">
                    <span>🎮</span>
                    <strong>
                      {totalActivities}
                    </strong>
                    <p>Games played</p>
                  </div>

                  <div className="stat-card yellow-stat">
                    <span>⭐</span>
                    <strong>
                      {totalCorrect}
                    </strong>
                    <p>Correct answers</p>
                  </div>

                  <div className="stat-card blue-stat">
                    <span>📈</span>
                    <strong>
                      {totalQuestions
                        ? `${overallAccuracy}%`
                        : "—"}
                    </strong>
                    <p>Success rate</p>
                  </div>

                  <div className="stat-card pink-stat">
                    <span>🔥</span>
                    <strong>
                      {streak}
                    </strong>
                    <p>Day streak</p>
                  </div>
                </div>

                {strongestGame && (
                  <div className="insight-card">
                    <span>🌟</span>

                    <div>
                      <strong>
                        Lovely progress!
                      </strong>

                      <p>
                        {activeChild.nickname} is
                        doing especially well in{" "}
                        {strongestGame.title}.
                      </p>
                    </div>
                  </div>
                )}

                <h2 className="activity-heading">
                  Game progress
                </h2>

                <div className="progress-summary">
                  {gameProgress.map((game) => (
                    <div
                      className="game-progress-row"
                      key={game.gameKey}
                    >
                      <div className="game-progress-top">
                        <span>
                          {game.icon}{" "}
                          {game.title}
                        </span>

                        <strong>
                          {game.hasActivity
                            ? `${game.percent}%`
                            : "Not played"}
                        </strong>
                      </div>

                      <div className="game-progress-track">
                        <div
                          className={`game-progress-fill ${game.colour}`}
                          style={{
                            width: `${game.percent}%`,
                          }}
                        />
                      </div>

                      <p>
                        {game.hasActivity
                          ? `${game.sessions} completed game${
                              game.sessions ===
                              1
                                ? ""
                                : "s"
                            }`
                          : "Play this game to start tracking."}
                      </p>
                    </div>
                  ))}
                </div>

                <h2 className="activity-heading">
                  Recent activity
                </h2>

                {activities.length === 0 ? (
                  <div className="empty-activity">
                    <span>🌱</span>
                    <p>
                      Play a game and activity
                      will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="activity-list">
                    {activities
                      .slice(0, 10)
                      .map((activity) => (
                        <div
                          className="activity-item"
                          key={activity.id}
                        >
                          <span className="activity-icon">
                            {gameData[
                              activity.game_key
                            ]?.icon || "🎮"}
                          </span>

                          <div>
                            <strong>
                              {gameData[
                                activity.game_key
                              ]?.title ||
                                "Game"}
                            </strong>

                            <p>
                              {new Date(
                                activity.played_at
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          <span className="activity-score">
                            {activity.score} /{" "}
                            {activity.total}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {screen === "achievements" && (
          <section className="achievements-screen">
            <button
              className="back-button"
              onClick={goHome}
            >
              ← Home
            </button>

            <div className="page-heading">
              <p className="eyebrow">
                YOUR REWARDS
              </p>

              <h1>Achievements 🏆</h1>

              <p className="subtitle">
                Keep learning and unlock new badges!
              </p>
            </div>

            <div className="achievement-summary">
              <span>🏆</span>

              <div>
                <strong>
                  {unlockedAchievements.length} /{" "}
                  {achievements.length}
                </strong>

                <p>badges unlocked</p>
              </div>
            </div>

            <div className="achievements-grid">
              {achievements.map((achievement) => {
                const unlocked =
                  activeChild &&
                  achievement.requirement(
                    activities
                  )

                return (
                  <div
                    className={`achievement-card ${
                      unlocked ? "unlocked" : "locked"
                    }`}
                    key={achievement.id}
                  >
                    <span className="achievement-icon">
                      {unlocked
                        ? achievement.icon
                        : "🔒"}
                    </span>

                    <div>
                      <h2>
                        {achievement.title}
                      </h2>

                      <p>
                        {achievement.description}
                      </p>

                      <strong>
                        {unlocked
                          ? "Unlocked! ✨"
                          : "Keep going!"}
                      </strong>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <footer className="site-footer">
          <span>🌈 BrightSteps</span>
          <span>Every step matters. 💜</span>

          <button
            className="text-button"
            onClick={signOut}
          >
            Sign out
          </button>
        </footer>
      </section>
    </main>
  )
}

export default App
