// TrainingPrograms.js
import React, { useEffect, useState } from "react";
import { Container, Table, Button, Spinner, Alert, Modal, Form, Card, Row, Col, Badge } from "react-bootstrap";
import { FaCheckCircle, FaSync, FaRobot, FaPen, FaDumbbell, FaChartLine, FaClock, FaBrain } from "react-icons/fa";
import { useAuth } from "../../../../context/AuthContext";
import "./CustomizedTrainingPrograms.css";

const TrainingPrograms = () => {
  const { fetchWithAuth } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  
  // notes modal
  const [showNotes, setShowNotes] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [notesText, setNotesText] = useState("");

  const openNotes = (row) => {
    setActiveRow(row);
    setNotesText(row.notes || "");
    setShowNotes(true);
  };

  const closeNotes = () => {
    setShowNotes(false);
    setActiveRow(null);
    setNotesText("");
  };

  const loadTrainings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWithAuth("http://localhost:8000/coach/training/");
      setTrainings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading training data:", e);
      setError("Failed to load training progress list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
  }, []);

  const handleMarkDone = async (userId) => {
    const ok = window.confirm(
      "Confirm completion?\n\nThis will consume 1 AI training unit for this client."
    );
    if (!ok) return;

    setUpdating(true);
    try {
      const resp = await fetchWithAuth(`http://localhost:8000/coach/training/${userId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Done" }),
      });
      const remaining = Number(resp?.remaining_quantity ?? 0);
      if (remaining > 0) {
        setTrainings((prev) =>
          prev.map((t) =>
            t.id === userId ? { ...t, quantity: remaining, last_updated: new Date().toISOString() } : t
          )
        );
      } else {
        setTrainings((prev) => prev.filter((t) => t.id !== userId));
      }
    } catch (e) {
      console.error("Update failed:", e);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeRow) return;
    try {
      await fetchWithAuth(`http://localhost:8000/coach/training/${activeRow.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText }),
      });
      setTrainings((prev) =>
        prev.map((t) =>
          t.id === activeRow.id ? { ...t, notes: notesText, last_updated: new Date().toISOString() } : t
        )
      );
      closeNotes();
    } catch (e) {
      console.error("Failed to update notes:", e);
      alert("Failed to save notes.");
    }
  };

  // Stats calculations
  const totalPrograms = trainings.length;
  const totalSessions = trainings.reduce((sum, t) => sum + t.quantity, 0);
  const activeClients = new Set(trainings.map(t => t.user_email)).size;

  const getInitials = (email) => {
    if (!email) return "??";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="training-mgmt-wrapper">
      <Container className="training-mgmt-container">
        {/* Hero Header */}
        <div className="training-mgmt-hero">
          <div className="hero-content">
            <div className="hero-icon-wrapper">
              <FaRobot className="hero-icon" />
            </div>
            <h1 className="hero-title">AI Training Programs</h1>
            <p className="hero-subtitle">Monitor and manage clients' AI-powered training sessions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="stats-row mb-4">
          <Col md={4}>
            <Card className="stat-card stat-card-1">
              <Card.Body>
                <div className="stat-icon-wrapper">
                  <FaBrain className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{totalPrograms}</div>
                  <div className="stat-label">Active Programs</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card stat-card-2">
              <Card.Body>
                <div className="stat-icon-wrapper">
                  <FaDumbbell className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{totalSessions}</div>
                  <div className="stat-label">Total Sessions</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card stat-card-3">
              <Card.Body>
                <div className="stat-icon-wrapper">
                  <FaChartLine className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{activeClients}</div>
                  <div className="stat-label">Active Clients</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Error Banner */}
        {error && (
          <div className="training-error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="training-loading-container">
            <div className="loading-spinner"></div>
            <p>Loading training programs...</p>
          </div>
        )}

        {/* Training Programs Table */}
        <Card className="table-card">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="modern-training-table mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Client</th>
                    <th>Sessions</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Last Updated</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && trainings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        <div className="empty-content">
                          <FaRobot className="empty-icon" />
                          <p>No active training programs</p>
                          <small>Training programs will appear here when clients start AI sessions</small>
                        </div>
                      </td>
                    </tr>
                  )}
                  {trainings.map((t, i) => (
                    <tr key={t.id} className="training-row">
                      <td>{i + 1}</td>
                      <td>
                        <div className="client-info">
                          <div className="client-avatar">
                            {getInitials(t.user_email)}
                          </div>
                          <div className="client-details">
                            <div className="client-email">{t.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg="info" className="quantity-badge">
                          {t.quantity} remaining
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="warning" className="status-badge">
                          Pending
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="notes-btn"
                          onClick={() => openNotes(t)}
                        >
                          <FaPen className="me-1" /> Edit
                        </Button>
                      </td>
                      <td>
                        <div className="timestamp">
                          <FaClock className="me-1" />
                          {new Date(t.last_updated).toLocaleString()}
                        </div>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="success"
                          size="sm"
                          disabled={updating}
                          className="complete-btn"
                          onClick={() => handleMarkDone(t.id)}
                        >
                          <FaCheckCircle className="me-1" /> Complete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>

        {/* Refresh Button */}
        <div className="refresh-section">
          <Button 
            variant="outline-light" 
            onClick={loadTrainings} 
            disabled={loading}
            className="refresh-btn"
          >
            <FaSync className={`me-2 ${loading ? 'spinning' : ''}`} /> 
            Refresh Data
          </Button>
        </div>

        {/* Notes Modal */}
        <Modal 
          show={showNotes} 
          onHide={closeNotes} 
          centered 
          size="lg"
          className="training-notes-modal"
        >
          <Modal.Header closeButton className="modal-header-custom">
            <Modal.Title className="modal-title-custom">
              <FaPen className="me-2" />
              Coach Notes
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-body-custom">
            <Form.Group>
              <Form.Label className="notes-label">
                Notes for {activeRow?.user_email}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Write detailed notes or a plan for the client's AI training…"
                className="notes-textarea"
              />
              <div className="notes-hint">
                💡 Tips: capture goals, blockers, progress, or anything to remember for next session
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="modal-footer-custom">
            <Button variant="outline-secondary" onClick={closeNotes} className="cancel-btn">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveNotes} className="save-notes-btn">
              <FaPen className="me-2" /> Save Notes
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default TrainingPrograms;