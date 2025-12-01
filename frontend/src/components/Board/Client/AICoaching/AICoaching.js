import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert, Modal, Badge } from "react-bootstrap";
import { useAuth } from "../../../../context/AuthContext";
import { FaDumbbell, FaFire, FaBed, FaCheckCircle, FaTrophy, FaRedo, FaInfoCircle } from "react-icons/fa";
import "./AICoaching.css";

const AICoaching = () => {
  const { fetchWithAuth } = useAuth();
  const [activeProgram, setActiveProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  useEffect(() => {
    loadActiveProgram();
  }, []);

  const loadActiveProgram = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWithAuth("http://localhost:8000/api/program/active");
      setActiveProgram(data);
    } catch (err) {
      if (err.message?.includes("404") || err.message?.includes("No active program")) {
        setActiveProgram(null);
      } else {
        setError(err.message || "Failed to load program");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateProgram = async () => {
    setGenerating(true);
    setError("");
    try {
      const data = await fetchWithAuth("http://localhost:8000/api/program/generate", {
        method: "POST",
      });

      if (data.success) {
        await loadActiveProgram();
        setShowRegenerateModal(false);
      }
    } catch (err) {
      setError(err.message || "Failed to generate program. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const getDayIcon = (focus) => {
    const focusLower = (focus || "").toLowerCase();
    if (focusLower.includes("upper") || focusLower.includes("strength")) return <FaDumbbell />;
    if (focusLower.includes("cardio") || focusLower.includes("core")) return <FaFire />;
    if (focusLower.includes("rest") || focusLower.includes("recovery")) return <FaBed />;
    return <FaCheckCircle />;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner": return "success";
      case "intermediate": return "warning";
      case "advanced": return "danger";
      default: return "secondary";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Created today";
    if (diffDays === 1) return "Created yesterday";
    if (diffDays < 7) return `Created ${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Loading State
  if (loading) {
    return (
      <section className="ai-coaching-section">
        <div className="loading-container">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p>Loading your training program...</p>
        </div>
      </section>
    );
  }

  // No Program State
  if (!activeProgram) {
    return (
      <section className="ai-coaching-section">
        <Container>
          <div className="no-program-container">
            <div className="no-program-icon">
              <FaTrophy />
            </div>
            <h2 className="no-program-title">No Active Training Program</h2>
            <p className="no-program-text">
              Let our AI create a personalized training program based on your fitness profile!
            </p>

            {error && (
              <Alert variant="danger" className="mt-3">
                {error}
              </Alert>
            )}

            <Button
              className="generate-program-btn"
              size="lg"
              onClick={generateProgram}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generating Your Program...
                </>
              ) : (
                <>
                  <FaFire className="me-2" />
                  Generate My AI Program
                </>
              )}
            </Button>

            <p className="info-text mt-3">
              <FaInfoCircle className="me-2" />
              This may take 20-30 seconds as our AI analyzes your profile
            </p>
          </div>
        </Container>
      </section>
    );
  }

  // Active Program Display
  return (
    <section className="ai-coaching-section">
      <Container>
        {/* Header */}
        <div className="program-header-card">
          <div className="header-content">
            <div className="trophy-badge">
              <FaTrophy />
            </div>
            <div>
              <h2 className="program-main-title">Your AI-Generated Weekly Training Plan</h2>
              <p className="program-subtitle">
                Based on your fitness goal, our AI has created a structured weekly training plan.
              </p>
              <p className="program-date">
                {formatDate(activeProgram.created_at)}
              </p>
            </div>
          </div>
          <div className="header-actions">
            <Button
              variant="light"
              className="regenerate-btn"
              onClick={() => setShowRegenerateModal(true)}
            >
              <FaRedo className="me-2" />
              Update Program
            </Button>
          </div>
        </div>

        {/* Program Summary */}
        <Card className="summary-card">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={8}>
                <h3 className="program-goal">
                  <FaTrophy className="me-2 text-warning" />
                  {activeProgram.program_summary.goal}
                </h3>
              </Col>
              <Col md={4} className="text-md-end">
                <Badge
                  bg={getDifficultyColor(activeProgram.program_summary.difficulty)}
                  className="difficulty-badge"
                >
                  {activeProgram.program_summary.difficulty?.toUpperCase()}
                </Badge>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}

        {/* Weekly Training Cards */}
        <Row className="training-week-grid">
          {activeProgram.week_plan.map((day, index) => (
            <Col lg={6} xl={4} key={index} className="mb-4">
              <Card className={`training-day-card ${day.is_rest_day ? "rest-day" : ""}`}>
                <Card.Body>
                  <div className="day-header">
                    <div className="day-icon">
                      {getDayIcon(day.focus)}
                    </div>
                    <div className="day-info">
                      <h4 className="day-name">{day.day_name}</h4>
                      <p className="day-focus">{day.focus}</p>
                    </div>
                  </div>

                  {day.is_rest_day ? (
                    <div className="rest-day-content">
                      <FaBed className="rest-icon" />
                      <p className="rest-title">Rest & Recovery</p>
                      <small className="rest-text">Let your muscles recover and rebuild</small>
                    </div>
                  ) : (
                    <div className="exercises-container">
                      {day.sessions.map((exercise, exIndex) => (
                        <div key={exIndex} className="exercise-item">
                          <div className="exercise-header">
                            <span className="exercise-number">{exIndex + 1}</span>
                            <span className="exercise-name">{exercise.exercise_name}</span>
                          </div>
                          <div className="exercise-details">
                            {exercise.sets > 0 && (
                              <span className="detail-badge sets-badge">
                                {exercise.sets} sets
                              </span>
                            )}
                            <span className="detail-badge reps-badge">
                              {exercise.reps}
                            </span>
                            <span className="detail-badge intensity-badge">
                              {exercise.intensity}
                            </span>
                          </div>
                          {exercise.notes && (
                            <div className="exercise-notes">
                              💡 {exercise.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Regenerate Modal */}
        <Modal
          show={showRegenerateModal}
          onHide={() => setShowRegenerateModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FaRedo className="me-2" />
              Update Your Training Program
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="warning" className="mb-3">
              <FaInfoCircle className="me-2" />
              <strong>Important:</strong> Only regenerate if you've updated your profile information
              (fitness level, goals, etc.). Otherwise, the program will remain similar.
            </Alert>
            <p>This will create a new AI-generated program based on your current profile data.</p>
            <p className="text-muted mb-0">
              <strong>Note:</strong> Generation takes 20-30 seconds.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowRegenerateModal(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={generateProgram}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generating...
                </>
              ) : (
                <>
                  <FaRedo className="me-2" />
                  Generate New Program
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </section>
  );
};

export default AICoaching;