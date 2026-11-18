import { useEffect, useState } from 'react';

export default function ProfilePanel({ onBack }) {
  const [profile, setProfile] = useState({
    bio: '',
    location: '',
    profession: '',
    organization: '',
    experience: '',
    skills: '',
    website: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = localStorage.getItem('unite360_token');
        const res = await fetch('/api/profile/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Chargement impossible');

        const p = data.profile || {};
        setProfile({
          bio: p.bio || '',
          location: p.location || '',
          profession: p.profession || '',
          organization: p.organization || '',
          experience: p.experience || '',
          skills: Array.isArray(p.skills) ? p.skills.join(', ') : '',
          website: p.website || ''
        });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function change(e) {
    setProfile(p => ({ ...p, [e.target.name]: e.target.value }));
    setMessage('');
    setError('');
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('unite360_token');
      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...profile,
          skills: profile.skills.split(',')
            .map(s => s.trim()).filter(Boolean)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Enregistrement impossible');

      const saved = data.profile;

      if (saved) {
        setProfile({
          bio: saved.bio || '',
          location: saved.location || '',
          profession: saved.profession || '',
          organization: saved.organization || '',
          experience: saved.experience || '',
          skills: Array.isArray(saved.skills)
            ? saved.skills.join(', ')
            : '',
          website: saved.website || ''
        });
      }

      setMessage('Profil enregistré avec succès.');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Chargement du profil...</p>;

  return (
    <section style={{ maxWidth: 760, margin: '30px auto', padding: 24 }}>
      <h2>Mon profil UNITÉ 360</h2>
      <p>Présentez votre identité, vos compétences et votre expérience.</p>

      <form onSubmit={save}>
        {[
          ['bio', 'Présentation', 'textarea'],
          ['location', 'Localisation'],
          ['profession', 'Profession'],
          ['organization', 'Organisation'],
          ['experience', 'Expérience'],
          ['skills', 'Compétences (séparées par des virgules)'],
          ['website', 'Site web']
        ].map(([name, label, type]) => (
          <label key={name} style={{ display: 'block', marginBottom: 16 }}>
            <strong>{label}</strong>
            {type === 'textarea' ? (
              <textarea
                name={name}
                value={profile[name]}
                onChange={change}
                rows="4"
                style={fieldStyle}
              />
            ) : (
              <input
                name={name}
                value={profile[name]}
                onChange={change}
                style={fieldStyle}
              />
            )}
          </label>

        ))}

        {error && <p style={{ color: '#c62828' }}>{error}</p>}
        {message && <p style={{ color: '#16834a' }}>{message}</p>}

        <button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer mon profil'}
        </button>

        <button type="button" onClick={onBack}>
          Retour à l’accueil
        </button>
      </form>
    </section>
  );
}

const fieldStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: 12,
  marginTop: 6,
  border: '1px solid #ccc',
  borderRadius: 8,
  font: 'inherit'
};
