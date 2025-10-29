import React, { useEffect, useMemo, useState } from "react";
import {
  Container, Row, Col, Button, Table, Modal, Form, InputGroup
} from "react-bootstrap";
import { FaSearch, FaEye, FaTrash, FaUserCircle, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { useAuth } from "../../../../context/AuthContext";
import "./ClientManagement.css";

const ClientManagement = () => {
  const { fetchWithAuth } = useAuth();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const loadClients = async (q = "") => {
    setLoading(true);
    setError("");
    try {
      const url = q
        ? `http://localhost:8000/coach/clients/?q=${encodeURIComponent(q)}&limit=50&offset=0`
        : `http://localhost:8000/coach/clients/?limit=50&offset=0`;
      const data = await fetchWithAuth(url);
      const rows = Array.isArray(data?.results) ? data.results : [];
      setClients(rows);
    } catch (e) {
      console.error("Error fetching clients:", e);
      setError(e.message || "Failed to load clients");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadClients(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleViewProfile = (client) => {
    // Deep copy to allow edits without mutating main array
    setSelectedClient(JSON.parse(JSON.stringify(client)));
    setIsEditing(false);
    setShowProfileModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this client?")) return;
    try {
      await fetchWithAuth(`http://localhost:8000/coach/clients/${id}/`, {
        method: "DELETE",
      });
      await loadClients(searchTerm.trim());
    } catch (e) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedClient || !selectedClient.id) return;

    try {
      const body = selectedClient.profile || {};
      await fetchWithAuth(
        `http://localhost:8000/coach/clients/${selectedClient.id}/profile/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      alert("Profile updated successfully.");
      setIsEditing(false);
      setShowProfileModal(false);
      await loadClients(searchTerm.trim());
    } catch (e) {
      alert(`Update failed: ${e.message}`);
    }
  };

  const fmtPlan = (p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : "None");
  const fmtAddons = (a) =>
    a ? `E-Book×${a.ebook || 0} · AI×${a.ai || 0} · Zoom×${a.zoom || 0}` : "—";

  const filtered = useMemo(() => clients, [clients]);

  const handleFieldChange = (field, value) => {
    setSelectedClient((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
  };

  return (
    <Container className="client-mgmt">
      <div className="page-head">
        <FaUserCircle className="head-icon" />
        <h2>Client Management</h2>
        <p className="sub">View or manage your clients’ training profiles.</p>
      </div>

      <Row className="toolbar">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Search clients by email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading-row">Loading clients…</div>}

      <Table striped bordered hover responsive className="client-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Subscription</th>
            <th>Add-Ons</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={4} className="empty">No clients found.</td>
            </tr>
          )}
          {filtered.map((c) => (
            <tr key={c.id}>
              <td>{c.email}</td>
              <td>{fmtPlan(c.subscription_plan)}</td>
              <td>{fmtAddons(c.addons)}</td>
              <td className="text-center">
                <Button
                  size="sm"
                  variant="info"
                  className="me-2"
                  onClick={() => handleViewProfile(c)}
                >
                  <FaEye />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(c.id)}
                >
                  <FaTrash />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Profile Modal (View/Edit) */}
      <Modal
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Client Profile Details{" "}
            {selectedClient && (
              <Button
                variant={isEditing ? "secondary" : "outline-primary"}
                size="sm"
                className="ms-3"
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? <><FaTimes /> Cancel</> : <><FaEdit /> Edit</>}
              </Button>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClient ? (
            <>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="text"
                      value={selectedClient.email || "—"}
                      disabled
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-2">
                    <Form.Label>Subscription</Form.Label>
                    <Form.Control
                      type="text"
                      value={fmtPlan(selectedClient.subscription_plan)}
                      disabled
                    />
                  </Form.Group>
                </Col>
              </Row>

              {selectedClient.profile ? (
                <>
                  {[
                    ["age", "Age"],
                    ["height_cm", "Height (cm)"],
                    ["weight_kg", "Weight (kg)"],
                    ["fitness_level", "Fitness Level"],
                    ["primary_goal", "Primary Goal"],
                    ["workout_frequency", "Workout Frequency"],
                    ["daily_activity_level", "Daily Activity Level"],
                    ["sleep_hours", "Sleep Hours"],
                    ["body_fat_percentage", "Body Fat (%)"],
                    ["body_type", "Body Type"],
                  ].map(([field, label]) => (
                    <Form.Group key={field} className="mb-2">
                      <Form.Label>{label}</Form.Label>
                      <Form.Control
                        type="text"
                        value={selectedClient.profile[field] ?? ""}
                        onChange={(e) =>
                          handleFieldChange(field, e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </Form.Group>
                  ))}
                </>
              ) : (
                <div>No profile information available for this user.</div>
              )}
            </>
          ) : (
            <div>No data loaded.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {isEditing && (
            <Button variant="primary" onClick={handleSaveProfile}>
              <FaSave className="me-2" /> Save Changes
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ClientManagement;
