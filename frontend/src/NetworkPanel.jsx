import { useEffect, useState } from "react";

export default function NetworkPanel({ onBack }) {
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connections, setConnections] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [actionMessage, setActionMessage] = useState("");


  useEffect(() => {
    loadConnectionData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadMembers, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function loadMembers() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("unite360_token");

      if (!token) {
        throw new Error("Connectez-vous pour accéder au réseau.");
      }

      const response = await fetch(
        `/api/search/members?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Impossible de charger les membres.");
      }

      setMembers(data.members || []);
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }


  async function loadConnectionData() {
    const token = localStorage.getItem("unite360_token");
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [a, b, c] = await Promise.all([
        fetch("/api/connections", { headers }),
        fetch("/api/connections/requests", { headers }),
        fetch("/api/connections/sent", { headers })
      ]);

      const [dataA, dataB, dataC] = await Promise.all([
        a.json(), b.json(), c.json()
      ]);

      if (!a.ok || !b.ok || !c.ok) {
        throw new Error("Impossible de charger les connexions.");
      }

      setConnections(dataA.connections || []);
      setIncomingRequests(dataB.requests || []);
      setOutgoingRequests(dataC.requests || []);
    } catch (err) {
      setActionMessage(err.message);
    }
  }


  async function sendInvitation(memberId) {
    const token = localStorage.getItem("unite360_token");
    setActionMessage("");

    try {
      const response = await fetch("/api/connections/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: memberId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Échec de l'invitation.");

      setActionMessage(data.message);
      await loadConnectionData();
    } catch (err) {
      setActionMessage(err.message);
    }
  }


  async function respondToInvitation(requestId, action) {
    const token = localStorage.getItem("unite360_token");
    setActionMessage("");

    try {
      const response = await fetch(
        `/api/connections/requests/${requestId}/${action}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Opération impossible.");

      setActionMessage(data.message);
      await loadConnectionData();
    } catch (err) {
      setActionMessage(err.message);
    }
  }


  async function removeConnection(connectionId) {
    const token = localStorage.getItem("unite360_token");
    setActionMessage("");

    try {
      const response = await fetch(
        `/api/connections/${connectionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Suppression impossible.");

      setActionMessage(data.message);
      await loadConnectionData();
    } catch (err) {
      setActionMessage(err.message);
    }
  }

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "18px",
    marginBottom: "14px"
  };

  const buttonStyle = {
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: "600"
  };

  return (
    <section style={{
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "24px 16px",
      color: "#1f2937"
    }}>
      <button
        onClick={onBack}
        style={{
          ...buttonStyle,
          background: "#e5e7eb",
          color: "#1f2937",
          marginBottom: "20px"
        }}
      >
        ← Retour à l'accueil
      </button>

      <h1 style={{ fontSize: "30px" }}>Le Réseau</h1>

      <p style={{ color: "#64748b", lineHeight: "1.6" }}>
        Découvrez les membres, leurs compétences et leurs expériences.
        Identifiez des personnes avec lesquelles construire et coopérer.
      </p>


      {actionMessage && (
        <div style={cardStyle}>
          {actionMessage}
        </div>
      )}

      <div style={cardStyle}>
        <h3>Mon réseau</h3>
        <p>Connexions : {connections.length}</p>
        <p>Invitations reçues : {incomingRequests.length}</p>
        <p>Invitations envoyées : {outgoingRequests.length}</p>
      </div>

      <div style={{ marginBottom: "22px" }}>
        <label htmlFor="member-search">
          Rechercher un membre
        </label>
        <input
          id="member-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nom, pseudonyme, profession, compétence..."
          style={{
            width: "100%",
            padding: "14px",
            marginTop: "8px",
            boxSizing: "border-box",
            border: "1px solid #cbd5e1",
            borderRadius: "10px"
          }}
        />
      </div>
      {error && (
        <div style={cardStyle}>
          <p style={{ color: "#b91c1c" }}>{error}</p>
          <button onClick={loadMembers} style={buttonStyle}>
            Réessayer
          </button>
        </div>
      )}

      {loading && <p>Chargement des membres...</p>}


      <div style={cardStyle}>
        <h2>Invitations reçues</h2>
        {incomingRequests.length === 0 && <p>Aucune invitation reçue.</p>}
        {incomingRequests.map((request) => (
          <div key={request.requestId} style={{ marginBottom: "14px" }}>
            <strong>{request.fullName || request.username}</strong>
            <p>@{request.username}</p>
            <button onClick={() => respondToInvitation(request.requestId, "accept")}>
              Accepter
            </button>
            <button onClick={() => respondToInvitation(request.requestId, "reject")}>
              Refuser
            </button>
          </div>
        ))}
      </div>


      <div style={cardStyle}>
        <h2>Invitations envoyées</h2>
        {outgoingRequests.length === 0 && <p>Aucune invitation envoyée.</p>}
        {outgoingRequests.map((request) => (
          <div key={request.requestId} style={{ marginBottom: "14px" }}>
            <strong>{request.fullName || request.username}</strong>
            <p>@{request.username}</p>
            <button onClick={() => removeConnection(request.requestId)}>
              Annuler l'invitation
            </button>
          </div>
        ))}
      </div>


      <div style={cardStyle}>
        <h2>Mes connexions</h2>
        {connections.length === 0 && <p>Aucune connexion pour le moment.</p>}
        {connections.map((member) => (
          <div key={member.connectionId} style={{ marginBottom: "14px" }}>
            <strong>{member.fullName || member.username}</strong>
            <p>@{member.username}</p>
            <button onClick={() => removeConnection(member.connectionId)}>
              Supprimer la connexion
            </button>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "20px", marginTop: "24px" }}>
        Membres de la communauté
      </h2>

      <p style={{ color: "#64748b" }}>
        {members.length} membre(s) affiché(s)
      </p>

      {!loading && !error && members.length === 0 && (
        <p>Aucun membre trouvé.</p>
      )}

      {!loading && !error && members.map((member) => (
        <article
          key={member.id}
          style={cardStyle}
        >
          <h3>
            {member.fullName || member.username}
          </h3>

          <p style={{ color: "#2563eb" }}>
            @{member.username}
          </p>

          {member.profession && (
            <p>
              <strong>Profession :</strong> {member.profession}
            </p>
          )}

          {member.organization && (
            <p>
              <strong>Organisation :</strong> {member.organization}
            </p>
          )}

          {member.location && (
            <p>📍 {member.location}</p>
          )}

          {member.bio && (
            <p style={{ lineHeight: "1.5" }}>
              {member.bio}
            </p>
          )}

          {member.experience && (
            <p>
              <strong>Expérience :</strong> {member.experience}
            </p>
          )}

          {member.skills?.length > 0 && (
            <p>
              <strong>Compétences :</strong>{" "}
              {member.skills.join(", ")}
            </p>
          )}

          <button
            onClick={() => setSelectedMember(member)}
            style={{
              ...buttonStyle,
              background: "#2563eb",
              color: "#ffffff"
            }}
          >
            Voir le profil
          </button>

          <button
            onClick={() => sendInvitation(member.id)}
            style={{
              ...buttonStyle,
              background: "#16a34a",
              color: "#ffffff",
              marginLeft: "8px"
            }}
          >
            + Ajouter au réseau
          </button>
        </article>
      ))}

      {selectedMember && (
        <div style={cardStyle}>
          <button
            onClick={() => setSelectedMember(null)}
            style={buttonStyle}
          >
            ← Retour aux membres
          </button>

          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "50%",
              background: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: "700",
              margin: "20px 0"
            }}
          >
            {(selectedMember.fullName || selectedMember.username)
              .split(" ")
              .map(part => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>

          <h2>
            {selectedMember.fullName || selectedMember.username}
          </h2>

          <p style={{ color: "#64748b", marginTop: "-8px" }}>
            @{selectedMember.username}
          </p>

          <hr style={{
            border: "none",
            borderTop: "1px solid #e5e7eb",
            margin: "20px 0"
          }} />

          <h3 style={{ color: "#1d4ed8" }}>
            Présentation professionnelle
          </h3>

          {selectedMember.profession && (
            <p>
              Profession : {selectedMember.profession}
            </p>
          )}

          {selectedMember.organization && (
            <p>
              Organisation : {selectedMember.organization}
            </p>
          )}

          {selectedMember.location && (
            <p>📍 {selectedMember.location}</p>
          )}

          {selectedMember.experience && (
            <div style={{ margin: "20px 0" }}>
              <h3>Parcours et expérience</h3>
              <p style={{ lineHeight: "1.7", color: "#475569" }}>
                {selectedMember.experience}
              </p>
            </div>
          )}

          {selectedMember.skills?.length > 0 && (
            <div style={{ margin: "18px 0" }}>
              <h3>Compétences</h3>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px"
              }}>
                {selectedMember.skills.map((skill, index) => (
                  <span key={index} style={{
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    padding: "7px 12px",
                    borderRadius: "20px",
                    fontSize: "13px"
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedMember.bio && (
            <div style={{ margin: "20px 0" }}>
              <h3>À propos du membre</h3>
              <p style={{ lineHeight: "1.7", color: "#475569" }}>
                {selectedMember.bio}
              </p>
            </div>
          )}

          {selectedMember.website &&
            /^https?:\/\//i.test(selectedMember.website) && (
              <p>
                <strong>Site web :</strong>{" "}
                <a
                  href={selectedMember.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visiter le site
                </a>
              </p>
          )}

          {selectedMember.createdAt && (
            <p>
              Membre depuis :{" "}
              {new Date(selectedMember.createdAt).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
