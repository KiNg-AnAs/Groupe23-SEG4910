import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Modal, Badge, Spinner, Alert } from "react-bootstrap";
import { FaEye, FaDumbbell, FaBed, FaFire, FaTrophy, FaSync, FaCalendarAlt } from "react-icons/fa";
import { useAuth } from "../../../../context/AuthContext";
import "./TrainingPrograms.css";

const TrainingPrograms = () => {
  const { fetchWithAuth } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Program viewing modal
  const [showProgram, setShowProgram] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loadingProgram, setLoadingProgram] = useState(false);

  // Load all clients who have AI programs
  const loadClients = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWithAuth("http://localhost:8000/coach/clients/?limit=50&offset=0");
      const clientList = Array.isArray(data?.results) ? data.results : [];
      setClients(clientList);
    } catch (e) {
      console.error("Error loading clients:", e);
      setError("Failed to load client list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // View a client's program
  const handleViewProgram = async (clientId, clientEmail) => {
    setShowProgram(true);
    setLoadingProgram(true);
    setSelectedProgram(null);

    try {
      const url = `http://localhost:8000/api/coach/clients/${clientId}/program/`;
      const program = await fetchWithAuth(url);
      setSelectedProgram({ ...program, client_email: clientEmail });
    } catch (e) {
      console.error("Failed to load program:", e);
      setSelectedProgram({
        error: "This client hasn't generated an AI program yet.",
        client_email: clientEmail
      });
    } finally {
      setLoadingProgram(false);
    }
  };

  const closeProgramModal = () => {
    setShowProgram(false);
    setSelectedProgram(null);
  };

  // Helper functions
  const getInitials = (email) => {
    if (!email) return "??";
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getDayIcon = (focus) => {
    const lowerFocus = focus?.toLowerCase() || "";
    if (lowerFocus.includes("rest") || lowerFocus.includes("recovery")) return <FaBed />;
    if (lowerFocus.includes("cardio") || lowerFocus.includes("hiit")) return <FaFire />;
    return <FaDumbbell />;
  };

  const getDifficultyColor = (difficulty) => {
    const lower = difficulty?.toLowerCase() || "";
    if (lower === "beginner") return "success";
    if (lower === "intermediate") return "warning";
    if (lower === "advanced") return "danger";
    return "info";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="coach-client-programs-wrapper">
      <Container className="coach-client-programs-container">

        {/* Header */}
        <div className="coach-programs-header">
          <div className="coach-header-content">
            <FaTrophy className="coach-header-icon" />
            <div>
              <h1 className="coach-header-title">Client AI Programs</h1>
              <p className="coach-header-subtitle">View and monitor your clients' AI-generated training programs</p>
            </div>
          </div>
          <Button
            variant="outline-light"
            onClick={loadClients}
            disabled={loading}
            className="coach-refresh-btn"
          >
            <FaSync className={loading ? "coach-spinning" : ""} /> Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="coach-error-alert" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="coach-loading-state">
            <Spinner animation="border" variant="primary" />
            <p>Loading clients...</p>
          </div>
        )}

        {/* Client Cards Grid */}
        {!loading && clients.length === 0 && (
          <div className="coach-empty-state">
            <FaTrophy className="coach-empty-icon" />
            <h3>No Clients Yet</h3>
            <p>Clients with AI programs will appear here</p>
          </div>
        )}

        {!loading && clients.length > 0 && (
          <Row className="coach-clients-grid">
            {clients.map((client) => (
              <Col lg={4} md={6} key={client.id} className="mb-4">
                <Card className="coach-client-card">
                  <Card.Body>
                    <div className="coach-client-card-header">
                      <div className="coach-client-avatar-large">
                        {getInitials(client.email)}
                      </div>
                      <div className="coach-client-info">
                        <h5 className="coach-client-name">{client.email}</h5>
                      </div>
                    </div>

                    <div className="coach-client-card-footer">
                      <Button
                        variant="primary"
                        className="coach-view-program-btn"
                        onClick={() => handleViewProgram(client.id, client.email)}
                      >
                        <FaEye className="me-2" /> View AI Program
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Program Modal */}
        <Modal
          show={showProgram}
          onHide={closeProgramModal}
          size="xl"
          centered
          className="coach-program-modal"
        >
          <Modal.Header closeButton className="coach-program-modal-header">
            <Modal.Title>
              <FaTrophy className="me-2" />
              {selectedProgram?.client_email}'s Training Program
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="coach-program-modal-body">
            {loadingProgram && (
              <div className="coach-modal-loading">
                <Spinner animation="border" variant="primary" />
                <p>Loading program...</p>
              </div>
            )}

            {selectedProgram?.error && (
              <Alert variant="warning" className="text-center">
                <FaDumbbell className="mb-3" style={{ fontSize: "3rem" }} />
                <h5>{selectedProgram.error}</h5>
                <p className="mb-0">Ask the client to generate their program from the AI Coaching page.</p>
              </Alert>
            )}

            {selectedProgram && !selectedProgram.error && !loadingProgram && (
              <div className="coach-program-content">

                {/* Program Info */}
                <div className="coach-program-info-card">
                  <Row>
                    <Col md={6}>
                      <div className="coach-info-item">
                        <strong>Goal:</strong>
                        <span className="ms-2">{selectedProgram.program_summary?.goal || "N/A"}</span>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="coach-info-item">
                        <strong>Difficulty:</strong>
                        <Badge
                          bg={getDifficultyColor(selectedProgram.program_summary?.difficulty)}
                          className="ms-2"
                        >
                          {selectedProgram.program_summary?.difficulty || "N/A"}
                        </Badge>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="coach-info-item">
                        <FaCalendarAlt className="me-2" />
                        {formatDate(selectedProgram.created_at)}
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* 7-Day Program */}
                <div className="coach-week-program">
                  <h5 className="coach-week-title">7-Day Training Schedule</h5>
                  <Row>
                    {selectedProgram.week_plan?.map((day, index) => (
                      <Col lg={6} key={index} className="mb-3">
                        <Card className={`coach-day-card ${day.is_rest_day ? "coach-rest-day" : ""}`}>
                          <Card.Body>
                            <div className="coach-day-header">
                              <div className="coach-day-icon">
                                {day.is_rest_day ? <FaBed /> : getDayIcon(day.focus)}
                              </div>
                              <div>
                                <h6 className="coach-day-name">{day.day_name}</h6>
                                <p className="coach-day-focus">{day.focus}</p>
                              </div>
                            </div>

                            {day.is_rest_day ? (
                              <div className="coach-rest-content">
                                <FaBed className="coach-rest-icon" />
                                <p>Rest & Recovery</p>
                              </div>
                            ) : (
                              <div className="coach-exercises-list">
                                {day.sessions?.map((exercise, idx) => (
                                  <div key={idx} className="coach-exercise-item">
                                    <div className="coach-exercise-number">{idx + 1}</div>
                                    <div className="coach-exercise-details">
                                      <div className="coach-exercise-name">{exercise.exercise_name}</div>
                                      <div className="coach-exercise-specs">
                                        <span className="coach-spec-badge">{exercise.sets} sets</span>
                                        <span className="coach-spec-badge">{exercise.reps}</span>
                                        <span className="coach-spec-badge coach-intensity">{exercise.intensity}</span>
                                      </div>
                                      {exercise.notes && (
                                        <div className="coach-exercise-notes">
                                          💡 {exercise.notes}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer className="coach-program-modal-footer">
            <Button variant="secondary" onClick={closeProgramModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

      </Container>
    </div>
  );
};

export default TrainingPrograms;