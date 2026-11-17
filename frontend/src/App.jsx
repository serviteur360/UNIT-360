import { useState, useEffect } from 'react';

function App() {
  const [status, setStatus] = useState('Connexion...');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);

  const [authMode, setAuthMode] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('unite360_user')) || null;
    } catch {
      return null;
    }
  });

  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });

  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    checkBackend();
    loadPublicData();
  }, []);

  async function checkBackend() {
    try {
      const res = await fetch('/api/health');

      if (!res.ok) {
        throw new Error('Backend indisponible');
      }

      const data = await res.json();

      setStatus(`✅ ${data.status} - ${data.version}`);
    } catch {
      setStatus('❌ Backend hors ligne');
    }
  }

  async function loadPublicData() {
    try {
      const [usersRes, projectsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/projects')
      ]);

      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }

      if (projectsRes.ok) {
        setProjects(await projectsRes.json());
      }
    } catch {
      setUsers([]);
      setProjects([]);
    }
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setAuthError('');
    setAuthMessage('');
  }

  function closeAuth() {
    setAuthMode(null);
    setAuthError('');
    setAuthMessage('');
    setAuthForm({
      username: '',
      email: '',
      password: '',
      fullName: ''
    });
  }

  function handleInput(event) {
    const { name, value } = event.target;

    setAuthForm(prev => ({
      ...prev,
      [name]: value
    }));

    setAuthError('');
    setAuthMessage('');
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    setAuthError('');
    setAuthMessage('');
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === 'register'
          ? '/api/auth/register'
          : '/api/auth/login';

      const body =
        authMode === 'register'
          ? {
              username: authForm.username,
              email: authForm.email,
              password: authForm.password,
              fullName: authForm.fullName
            }
          : {
              email: authForm.email,
              password: authForm.password
            };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Une erreur est survenue.'
        );
      }

      if (data.token && data.user) {
        localStorage.setItem(
          'unite360_token',
          data.token
        );

        localStorage.setItem(
          'unite360_user',
          JSON.stringify(data.user)
        );

        setCurrentUser(data.user);

        await loadPublicData();

        setAuthMessage(
          authMode === 'register'
            ? 'Bienvenue dans UNITÉ 360 ! Votre espace est prêt.'
            : 'Connexion réussie. Heureux de vous retrouver.'
        );

        setTimeout(() => {
          closeAuth();
        }, 700);
      } else {
        throw new Error(
          'Réponse du serveur incomplète.'
        );
      }

    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('unite360_token');
    localStorage.removeItem('unite360_user');

    setCurrentUser(null);
    setAuthMode(null);
    setAuthError('');
    setAuthMessage('');
  }

  return (
    <div style={styles.page}>

      <header style={styles.header}>

        <div>
          <div style={styles.logo}>
            UNITÉ <span style={styles.logoAccent}>360</span>
          </div>

          <div style={styles.tagline}>
            Au sommet repose l’unité
          </div>
        </div>

        <div style={styles.headerRight}>

          <div style={styles.status}>
            {status}
          </div>

          {currentUser ? (
            <div style={styles.userHeader}>

              <span style={styles.userName}>
                {currentUser.fullName}
              </span>

              <button
                onClick={logout}
                style={styles.logoutButton}
              >
                Déconnexion
              </button>

            </div>
          ) : (
            <div style={styles.authButtons}>

              <button
                onClick={() => openAuth('login')}
                style={styles.loginButton}
              >
                Se connecter
              </button>

              <button
                onClick={() => openAuth('register')}
                style={styles.registerButton}
              >
                Créer un compte
              </button>

            </div>
          )}

        </div>

      </header>

      <main>

        {currentUser && (
          <section style={styles.welcomeBar}>

            <div>
              <span style={styles.welcomeEyebrow}>
                ESPACE PERSONNEL
              </span>

              <h2 style={styles.welcomeTitle}>
                Bonjour {currentUser.fullName} 👋
              </h2>

              <p style={styles.welcomeText}>
                Votre identité numérique UNITÉ 360 est active.
                Vous pouvez maintenant rencontrer, coopérer,
                créer et progresser.
              </p>
            </div>

            <div style={styles.identityCard}>
              <strong>@{currentUser.username}</strong>
              <span>{currentUser.email}</span>
              <small>
                Profil {currentUser.role === 'admin'
                  ? 'administrateur'
                  : 'membre'}
              </small>
            </div>

          </section>
        )}

        <section style={styles.hero}>

          <div style={styles.heroContent}>

            <p style={styles.eyebrow}>
              L’ÉCOSYSTÈME HUMAIN INTELLIGENT
            </p>

            <h1 style={styles.heroTitle}>
              Connecter les personnes,
              <br />
              les idées et les compétences.
            </h1>

            <p style={styles.heroText}>
              UNITÉ 360 crée un espace où les personnes peuvent
              se rencontrer, coopérer, créer et progresser
              ensemble pour produire un impact positif.
            </p>

            <div style={styles.buttons}>

              <button
                onClick={() =>
                  currentUser
                    ? window.scrollTo({
                        top: 600,
                        behavior: 'smooth'
                      })
                    : openAuth('register')
                }
                style={styles.primaryButton}
              >
                {currentUser
                  ? 'Entrer dans mon espace'
                  : 'Commencer'}
              </button>

              <button
                onClick={() =>
                  document
                    .getElementById('modules')
                    ?.scrollIntoView({
                      behavior: 'smooth'
                    })
                }
                style={styles.secondaryButton}
              >
                Découvrir UNITÉ 360
              </button>

            </div>

          </div>

        </section>

        <section style={styles.steps}>

          <Step
            number="01"
            title="Rencontrer"
            text="Découvrir des personnes, des idées et des opportunités."
          />

          <Step
            number="02"
            title="Coopérer"
            text="Créer des relations autour de compétences et d’objectifs communs."
          />

          <Step
            number="03"
            title="Créer"
            text="Transformer les idées et les compétences en projets."
          />

          <Step
            number="04"
            title="Progresser"
            text="Apprendre, transmettre et construire un impact durable."
          />

        </section>

        <section id="modules">

          <h2 style={styles.sectionTitle}>
            Un espace pour construire
          </h2>

          <div style={styles.modules}>

            <Module
              icon="👥"
              title="Réseau"
              text="Construisez votre réseau humain et professionnel."
            />

            <Module
              icon="💡"
              title="Idées"
              text="Partagez vos idées et trouvez des personnes capables de les développer."
            />

            <Module
              icon="🤝"
              title="Coopération"
              text="Transformez les connexions en collaborations concrètes."
            />

            <Module
              icon="🚀"
              title="Projets"
              text="Créez et développez des projets avec votre communauté."
            />

            <Module
              icon="🎓"
              title="Académie"
              text="Apprenez, développez vos compétences et transmettez votre savoir."
            />

            <Module
              icon="🛒"
              title="Marketplace"
              text="Valorisez vos produits, services et compétences."
            />

          </div>

        </section>

        <section style={styles.dashboard}>

          <div>

            <p style={styles.eyebrow}>
              UNITÉ 360 EN ACTION
            </p>

            <h2 style={styles.dashboardTitle}>
              Une plateforme qui transforme la connexion
              en capacité d’agir.
            </h2>

          </div>

          <div style={styles.stats}>

            <Stat
              value={users.length}
              label="Utilisateurs"
            />

            <Stat
              value={projects.length}
              label="Projets"
            />

            <Stat
              value="360°"
              label="Vision"
            />

          </div>

        </section>

      </main>

      <footer style={styles.footer}>

        <strong>UNITÉ 360</strong>

        <span>
          Connecter · Coopérer · Créer · Progresser
        </span>

      </footer>

      {authMode && (
        <div
          style={styles.modalOverlay}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeAuth();
            }
          }}
        >

          <div style={styles.modal}>

            <button
              onClick={closeAuth}
              style={styles.closeButton}
              aria-label="Fermer"
            >
              ×
            </button>

            <div style={styles.modalLogo}>
              UNITÉ <span style={styles.logoAccent}>360</span>
            </div>

            <p style={styles.modalEyebrow}>
              {authMode === 'register'
                ? 'REJOINDRE L’ÉCOSYSTÈME'
                : 'RETROUVER VOTRE ESPACE'}
            </p>

            <h2 style={styles.modalTitle}>
              {authMode === 'register'
                ? 'Créer votre identité UNITÉ 360'
                : 'Bienvenue à nouveau'}
            </h2>

            <p style={styles.modalText}>
              {authMode === 'register'
                ? 'Votre parcours commence par une connexion.'
                : 'Connectez-vous pour continuer votre parcours.'}
            </p>

            {authError && (
              <div style={styles.errorBox}>
                ❌ {authError}
              </div>
            )}

            {authMessage && (
              <div style={styles.successBox}>
                ✅ {authMessage}
              </div>
            )}

            <form
              onSubmit={handleAuthSubmit}
              style={styles.form}
            >

              {authMode === 'register' && (
                <>
                  <label style={styles.label}>
                    Nom complet

                    <input
                      name="fullName"
                      type="text"
                      value={authForm.fullName}
                      onChange={handleInput}
                      placeholder="Votre nom complet"
                      style={styles.input}
                      required
                    />
                  </label>

                  <label style={styles.label}>
                    Nom d'utilisateur

                    <input
                      name="username"
                      type="text"
                      value={authForm.username}
                      onChange={handleInput}
                      placeholder="Ex. jonas360"
                      style={styles.input}
                      required
                    />
                  </label>
                </>
              )}

              <label style={styles.label}>
                Adresse email

                <input
                  name="email"
                  type="email"
                  value={authForm.email}
                  onChange={handleInput}
                  placeholder="vous@example.com"
                  style={styles.input}
                  required
                />
              </label>

              <label style={styles.label}>
                Mot de passe

                <input
                  name="password"
                  type="password"
                  value={authForm.password}
                  onChange={handleInput}
                  placeholder="Minimum 6 caractères"
                  style={styles.input}
                  minLength="6"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  ...styles.primaryButton,
                  ...styles.submitButton,
                  opacity: authLoading ? 0.65 : 1
                }}
              >
                {authLoading
                  ? 'Traitement...'
                  : authMode === 'register'
                    ? 'Créer mon compte'
                    : 'Se connecter'}
              </button>

            </form>

            <div style={styles.switchAuth}>

              {authMode === 'register'
                ? 'Vous avez déjà un compte ?'
                : 'Vous n’avez pas encore de compte ?'}

              <button
                onClick={() =>
                  openAuth(
                    authMode === 'register'
                      ? 'login'
                      : 'register'
                  )
                }
                style={styles.switchButton}
              >
                {authMode === 'register'
                  ? 'Se connecter'
                  : 'Créer un compte'}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


function Step({ number, title, text }) {
  return (
    <div style={styles.step}>

      <div style={styles.stepNumber}>
        {number}
      </div>

      <h3 style={styles.stepTitle}>
        {title}
      </h3>

      <p style={styles.stepText}>
        {text}
      </p>

    </div>
  );
}


function Module({ icon, title, text }) {
  return (
    <div style={styles.module}>

      <div style={styles.moduleIcon}>
        {icon}
      </div>

      <h3 style={styles.moduleTitle}>
        {title}
      </h3>

      <p style={styles.moduleText}>
        {text}
      </p>

    </div>
  );
}


function Stat({ value, label }) {
  return (
    <div style={styles.stat}>

      <strong style={styles.statValue}>
        {value}
      </strong>

      <span style={styles.statLabel}>
        {label}
      </span>

    </div>
  );
}


const styles = {

  page: {
    minHeight: '100vh',
    background: '#0b1020',
    color: '#ffffff',
    fontFamily: 'Arial, sans-serif'
  },

  header: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '25px',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end'
  },

  logo: {
    fontSize: '26px',
    fontWeight: '800',
    letterSpacing: '2px'
  },

  logoAccent: {
    color: '#8ea2ff'
  },

  tagline: {
    marginTop: '5px',
    color: '#9aa4bd',
    fontSize: '13px'
  },

  status: {
    color: '#9aa4bd',
    fontSize: '13px'
  },

  authButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },

  loginButton: {
    border: '1px solid #39415d',
    borderRadius: '9px',
    padding: '10px 15px',
    background: 'transparent',
    color: '#ffffff',
    cursor: 'pointer'
  },

  registerButton: {
    border: 'none',
    borderRadius: '9px',
    padding: '10px 15px',
    background: '#667eea',
    color: '#ffffff',
    fontWeight: '700',
    cursor: 'pointer'
  },

  userHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },

  userName: {
    color: '#dbe1f2',
    fontSize: '14px',
    fontWeight: '700'
  },

  logoutButton: {
    border: '1px solid #39415d',
    borderRadius: '9px',
    padding: '9px 13px',
    background: '#131a2e',
    color: '#ffffff',
    cursor: 'pointer'
  },

  welcomeBar: {
    maxWidth: '1140px',
    margin: '28px auto 0',
    padding: '28px 32px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #121b35, #19152f)',
    border: '1px solid #2b3657',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '25px',
    alignItems: 'center'
  },

  welcomeEyebrow: {
    color: '#8ea2ff',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '2px'
  },

  welcomeTitle: {
    margin: '8px 0',
    fontSize: '28px'
  },

  welcomeText: {
    margin: 0,
    color: '#aeb8cf',
    lineHeight: '1.6'
  },

  identityCard: {
    minWidth: '210px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '18px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)'
  },

  hero: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '90px 30px 80px'
  },

  heroContent: {
    maxWidth: '850px'
  },

  eyebrow: {
    color: '#8ea2ff',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '2px',
    marginBottom: '20px'
  },

  heroTitle: {
    fontSize: 'clamp(42px, 7vw, 78px)',
    lineHeight: '1.05',
    margin: '0 0 28px',
    fontWeight: '800'
  },

  heroText: {
    maxWidth: '720px',
    fontSize: '20px',
    lineHeight: '1.7',
    color: '#b8c0d4',
    marginBottom: '35px'
  },

  buttons: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  },

  primaryButton: {
    border: 'none',
    borderRadius: '10px',
    padding: '15px 28px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer'
  },

  secondaryButton: {
    border: '1px solid #39415d',
    borderRadius: '10px',
    padding: '15px 28px',
    background: 'transparent',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer'
  },

  steps: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 30px 90px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '18px'
  },

  step: {
    padding: '28px',
    background: '#131a2e',
    border: '1px solid #202942',
    borderRadius: '16px'
  },

  stepNumber: {
    color: '#7f91ed',
    fontWeight: '700',
    marginBottom: '20px'
  },

  stepTitle: {
    fontSize: '22px',
    marginBottom: '12px'
  },

  stepText: {
    color: '#9da7bd',
    lineHeight: '1.6'
  },

  sectionTitle: {
    maxWidth: '1200px',
    margin: '0 auto 30px',
    padding: '0 30px',
    fontSize: '36px'
  },

  modules: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 30px 90px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '18px'
  },

  module: {
    padding: '30px',
    background: '#11182b',
    border: '1px solid #202942',
    borderRadius: '16px'
  },

  moduleIcon: {
    fontSize: '32px',
    marginBottom: '18px'
  },

  moduleTitle: {
    fontSize: '21px',
    marginBottom: '10px'
  },

  moduleText: {
    color: '#9da7bd',
    lineHeight: '1.6'
  },

  dashboard: {
    maxWidth: '1140px',
    margin: '0 auto 80px',
    padding: '45px',
    borderRadius: '22px',
    background: 'linear-gradient(135deg, #151e38, #17142d)',
    border: '1px solid #2a3452',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '40px',
    alignItems: 'center'
  },

  dashboardTitle: {
    fontSize: '34px',
    lineHeight: '1.2',
    margin: 0
  },

  stats: {
    display: 'flex',
    gap: '28px',
    flexWrap: 'wrap'
  },

  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },

  statValue: {
    fontSize: '30px'
  },

  statLabel: {
    color: '#9da7bd',
    fontSize: '13px'
  },

  footer: {
    padding: '30px',
    borderTop: '1px solid #202942',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
    color: '#8993aa'
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
    overflowY: 'auto'
  },

  modal: {
    width: '100%',
    maxWidth: '470px',
    position: 'relative',
    padding: '38px',
    borderRadius: '22px',
    background: '#11182b',
    border: '1px solid #2a3452',
    boxShadow: '0 25px 80px rgba(0,0,0,0.5)'
  },

  closeButton: {
    position: 'absolute',
    top: '14px',
    right: '16px',
    border: 'none',
    background: 'transparent',
    color: '#9da7bd',
    fontSize: '30px',
    cursor: 'pointer'
  },

  modalLogo: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '2px',
    marginBottom: '25px'
  },

  modalEyebrow: {
    color: '#8ea2ff',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '2px',
    marginBottom: '10px'
  },

  modalTitle: {
    fontSize: '30px',
    lineHeight: '1.15',
    margin: '0 0 12px'
  },

  modalText: {
    color: '#9da7bd',
    lineHeight: '1.5',
    marginBottom: '22px'
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },

  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    color: '#d8deee',
    fontSize: '14px',
    fontWeight: '600'
  },

  input: {
    width: '100%',
    padding: '13px 14px',
    borderRadius: '10px',
    border: '1px solid #303b5b',
    outline: 'none',
    background: '#0b1020',
    color: '#ffffff',
    fontSize: '15px'
  },

  submitButton: {
    width: '100%',
    marginTop: '6px'
  },

  errorBox: {
    marginBottom: '16px',
    padding: '12px 14px',
    borderRadius: '10px',
    background: 'rgba(255,80,80,0.10)',
    border: '1px solid rgba(255,100,100,0.25)',
    color: '#ffb5b5',
    fontSize: '14px'
  },

  successBox: {
    marginBottom: '16px',
    padding: '12px 14px',
    borderRadius: '10px',
    background: 'rgba(70,200,130,0.10)',
    border: '1px solid rgba(70,200,130,0.25)',
    color: '#a9f0c9',
    fontSize: '14px'
  },

  switchAuth: {
    marginTop: '22px',
    textAlign: 'center',
    color: '#8f9ab2',
    fontSize: '13px'
  },

  switchButton: {
    border: 'none',
    background: 'transparent',
    color: '#8ea2ff',
    fontWeight: '700',
    cursor: 'pointer',
    marginLeft: '5px'
  }

};


export default App;
