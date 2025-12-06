import React, { useEffect, useMemo, useState } from "react";
import {
  Container, Row, Col, Button, Table, Modal, Form, InputGroup, Badge, Card
} from "react-bootstrap";
import { 
  FaSearch, FaEye, FaTrash, FaUserCircle, FaEdit, FaSave, FaTimes, 
  FaUsers, FaChartLine, FaDumbbell, FaHeartbeat, FaCalendarAlt
} from "react-icons/fa";
import { useAuth } from "../../../../context/AuthContext";
import "./ClientManagement.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
        ? `${API_URL}/coach/clients/?q=${encodeURIComponent(q)}&limit=50&offset=0`
        : `${API_URL}/coach/clients/?limit=50&offset=0`;
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
    setSelectedClient(JSON.parse(JSON.stringify(client)));
    setIsEditing(false);
    setShowProfileModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    try {
      await fetchWithAuth(`${API_URL}/coach/clients/${id}/`, {
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
        `${API_URL}/coach/clients/${selectedClient.id}/profile/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
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

  const getPlanBadgeVariant = (plan) => {
    if (!plan) return "secondary";
    const p = plan.toLowerCase();
    if (p.includes("advanced")) return "warning";
    if (p.includes("basic")) return "info";
    return "primary";
  };

  const getInitials = (email) => {
    if (!email) return "??";
    return email.substring(0, 2).toUpperCase();
  };

  // Stats calculations
  const totalClients = clients.length;
  const premiumClients = clients.filter(c => 
    c.subscription_plan && c.subscription_plan.toLowerCase().includes("advanced")
  ).length;
  const activeClients = clients.filter(c => c.subscription_plan && c.subscription_plan !== "none").length;

  return (
    <div className="client-mgmt-wrapper">
      <Container className="client-mgmt-container">
        {/* Hero Header */}
        <div className="client-mgmt-hero">
          <div className="hero-content">
            <div className="hero-icon-wrapper">
              <FaUsers className="hero-icon" />
            </div>
            <h1 className="hero-title">Client Management</h1>
            <p className="hero-subtitle">Monitor, manage, and engage with your training clients</p>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="stats-row mb-4">
          <Col md={4}>
            <Card className="stat-card stat-card-1">
              <Card.Body>
                <div className="stat-icon-wrapper">
                  <FaUsers className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{totalClients}</div>
                  <div className="stat-label">Total Clients</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card stat-card-2">
              <Card.Body>
                <div className="stat-icon-wrapper">
                  <FaChartLine className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{activeClients}</div>
                  <div className="stat-label">Active Subscriptions</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card stat-card-3">
              <Card.Body>
                <div className="stat-icon-wrapper">
                  <FaDumbbell className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{premiumClients}</div>
                  <div className="stat-label">Advanced Members</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Search Bar */}
        <Card className="search-card mb-4">
          <Card.Body>
            <InputGroup className="search-input-group">
              <InputGroup.Text className="search-icon-wrapper">
                <FaSearch className="search-icon" />
              </InputGroup.Text>
              <Form.Control
                className="search-input"
                placeholder="Search clients by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Card.Body>
        </Card>

        {/* Error Banner */}
        {error && (
          <div className="client-error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="client-loading-container">
            <div className="loading-spinner"></div>
            <p>Loading clients...</p>
          </div>
        )}

        {/* Clients Table */}
        <Card className="table-card">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="modern-client-table mb-0">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Subscription</th>
                    <th>Add-Ons</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="empty-state">
                        <div className="empty-content">
                          <FaUserCircle className="empty-icon" />
                          <p>No clients found</p>
                          <small>Try adjusting your search criteria</small>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filtered.map((c) => (
                    <tr key={c.id} className="client-row">
                      <td>
                        <div className="client-info">
                          <div className="client-avatar">
                            {getInitials(c.email)}
                          </div>
                          <div className="client-details">
                            <div className="client-email">{c.email}</div>
                            <div className="client-meta">ID: {c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge 
                          bg={getPlanBadgeVariant(c.subscription_plan)}
                          className="plan-badge"
                        >
                          {fmtPlan(c.subscription_plan)}
                        </Badge>
                      </td>
                      <td>
                        <span className="addons-text">{fmtAddons(c.addons)}</span>
                      </td>
                      <td className="text-center">
                        <div className="action-buttons">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="action-btn view-btn"
                            onClick={() => handleViewProfile(c)}
                            title="View Profile"
                          >
                            <FaEye />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(c.id)}
                            title="Delete Client"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Profile Modal */}
        <Modal
          show={showProfileModal}
          onHide={() => setShowProfileModal(false)}
          centered
          size="lg"
          className="client-profile-modal"
        >
          <Modal.Header closeButton className="modal-header-custom">
            <Modal.Title className="modal-title-custom">
              <FaUserCircle className="me-2" />
              Client Profile
            </Modal.Title>
            {selectedClient && (
              <Button
                variant={isEditing ? "outline-light" : "outline-primary"}
                size="sm"
                className="edit-toggle-btn"
                onClick={() => setIsEditing((prev) => !prev)}
              >
                {isEditing ? (
                  <>
                    <FaTimes className="me-1" /> Cancel
                  </>
                ) : (
                  <>
                    <FaEdit className="me-1" /> Edit
                  </>
                )}
              </Button>
            )}
          </Modal.Header>
          <Modal.Body className="modal-body-custom">
            {selectedClient ? (
              <>
                {/* Basic Info Section */}
                <div className="profile-section">
                  <h5 className="section-title">
                    <FaUserCircle className="me-2" />
                    Account Information
                  </h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3 modern-form-group">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="text"
                          value={selectedClient.email || "—"}
                          disabled
                          className="modern-input"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3 modern-form-group">
                        <Form.Label>Subscription Plan</Form.Label>
                        <Form.Control
                          type="text"
                          value={fmtPlan(selectedClient.subscription_plan)}
                          disabled
                          className="modern-input"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Profile Details Section */}
                {selectedClient.profile ? (
                  <>
                    <div className="profile-section">
                      <h5 className="section-title">
                        <FaDumbbell className="me-2" />
                        Physical Profile
                      </h5>
                      <Row>
                        {[
                          ["age", "Age", "years"],
                          ["height_cm", "Height", "cm"],
                          ["weight_kg", "Weight", "kg"],
                          ["body_fat_percentage", "Body Fat", "%"],
                          ["body_type", "Body Type", ""],
                          ["sleep_hours", "Sleep Hours", "hrs/night"],
                        ].map(([field, label, unit]) => (
                          <Col md={6} key={field}>
                            <Form.Group className="mb-3 modern-form-group">
                              <Form.Label>{label}</Form.Label>
                              <InputGroup>
                                <Form.Control
                                  type="text"
                                  value={selectedClient.profile[field] ?? ""}
                                  onChange={(e) =>
                                    handleFieldChange(field, e.target.value)
                                  }
                                  disabled={!isEditing}
                                  className="modern-input"
                                />
                                {unit && (
                                  <InputGroup.Text className="unit-label">
                                    {unit}
                                  </InputGroup.Text>
                                )}
                              </InputGroup>
                            </Form.Group>
                          </Col>
                        ))}
                      </Row>
                    </div>

                    <div className="profile-section">
                      <h5 className="section-title">
                        <FaChartLine className="me-2" />
                        Training Information
                      </h5>
                      <Row>
                        {[
                          ["fitness_level", "Fitness Level"],
                          ["primary_goal", "Primary Goal"],
                          ["workout_frequency", "Workout Frequency"],
                          ["daily_activity_level", "Daily Activity Level"],
                        ].map(([field, label]) => (
                          <Col md={6} key={field}>
                            <Form.Group className="mb-3 modern-form-group">
                              <Form.Label>{label}</Form.Label>
                              <Form.Control
                                type="text"
                                value={selectedClient.profile[field] ?? ""}
                                onChange={(e) =>
                                  handleFieldChange(field, e.target.value)
                                }
                                disabled={!isEditing}
                                className="modern-input"
                              />
                            </Form.Group>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </>
                ) : (
                  <div className="no-profile-data">
                    <FaHeartbeat className="no-data-icon" />
                    <p>No profile information available for this client</p>
                  </div>
                )}
              </>
            ) : (
              <div className="no-profile-data">
                <p>No data loaded</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer className="modal-footer-custom">
            {isEditing && (
              <Button 
                variant="success" 
                onClick={handleSaveProfile}
                className="save-btn"
              >
                <FaSave className="me-2" /> Save Changes
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={() => setShowProfileModal(false)}
              className="close-btn"
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default ClientManagement;