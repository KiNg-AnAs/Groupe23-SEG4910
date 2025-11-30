import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge, Modal } from "react-bootstrap";
import exercisesData from "./data/exercises.json";
import "./CoachPrograms.css";

const CoachPrograms = () => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("amateur");
  const [programs, setPrograms] = useState([]);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [animateCards, setAnimateCards] = useState(false);

  useEffect(() => {
    const formattedPrograms = Object.entries(exercisesData).map(([title, data]) => ({
      title,
      icon: data.icon,
      color: data.color,
      description: data.description,
      category: data.category,
      amateurExercises: data.amateur,
      proExercises: data.pro,
    }));
    setPrograms(formattedPrograms);
    
    // Trigger animation
    setTimeout(() => setAnimateCards(true), 100);
  }, []);

  const openProgramModal = (program) => {
    setSelectedProgram(program);
    setSelectedLevel("amateur");
    setShowProgramModal(true);
  };

  const handleExerciseClick = (exercise) => {
    setSelectedExercise(exercise);
    setShowExerciseModal(true);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "success";
      case "Intermediate":
        return "warning";
      case "Advanced":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "strength":
        return "💪";
      case "cardio":
        return "❤️";
      case "athletic":
        return "⚽";
      case "recovery":
        return "🧘";
      case "periodization":
        return "📅";
      case "power":
        return "💥";
      default:
        return "🏋️";
    }
  };

  return (
    <section className="coach-programs-wrapper">
      <Container className="coach-programs-container">
        {/* Hero Header */}
        <div className="coach-hero-header">
          <div className="coach-hero-content">
            <h1 className="coach-main-title">
              <span className="title-icon">🏆</span>
              Elite Training Programs
              <span className="title-icon">🏆</span>
            </h1>
            <p className="coach-main-subtitle">
              Professional-grade programs designed by Coach Rayane
            </p>
            <div className="coach-stats-bar">
              <div className="stat-item">
                <span className="stat-number">{programs.length}</span>
                <span className="stat-label">Programs</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {programs.reduce((acc, p) => acc + p.amateurExercises.length + p.proExercises.length, 0)}
                </span>
                <span className="stat-label">Exercises</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">2</span>
                <span className="stat-label">Levels</span>
              </div>
            </div>
          </div>
        </div>

        {/* Programs Grid */}
        <Row className="programs-grid">
          {programs.map((program, index) => (
            <Col xs={12} md={6} lg={4} key={index} className="program-col">
              <Card 
                className={`modern-program-card ${animateCards ? 'card-animate' : ''}`}
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  background: program.color
                }}
              >
                <div className="card-glow"></div>
                
                <Card.Body className="modern-card-body">
                  {/* Card Header */}
                  <div className="card-header-section">
                    <div className="program-icon-large">{program.icon}</div>
                    <h3 className="program-title-modern">{program.title}</h3>
                    <p className="program-description">{program.description}</p>
                    
                    <Badge bg="dark" className="category-badge">
                      {getCategoryIcon(program.category)} {program.category}
                    </Badge>
                  </div>

                  {/* Exercise Count */}
                  <div className="exercise-count-section">
                    <div className="count-item">
                      <span className="count-emoji">🎯</span>
                      <span className="count-text">{program.amateurExercises.length} Amateur</span>
                    </div>
                    <div className="count-item">
                      <span className="count-emoji">🔥</span>
                      <span className="count-text">{program.proExercises.length} Pro</span>
                    </div>
                  </div>

                  {/* View Button */}
                  <Button
                    className="view-program-btn"
                    onClick={() => openProgramModal(program)}
                  >
                    <span>View Exercises</span> 👁️
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Program Exercises Modal */}
      <Modal 
        show={showProgramModal} 
        onHide={() => setShowProgramModal(false)}
        size="xl"
        centered
        className="program-exercises-modal"
      >
        {selectedProgram && (
          <>
            <Modal.Header closeButton className="program-modal-header">
              <Modal.Title className="program-modal-title">
                <span className="program-modal-icon">{selectedProgram.icon}</span>
                {selectedProgram.title}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="program-modal-body">
              {/* Level Selector */}
              <div className="modal-level-selector">
                <button
                  className={`modal-level-btn ${selectedLevel === "amateur" ? "active" : ""}`}
                  onClick={() => setSelectedLevel("amateur")}
                >
                  🎯 Amateur Level ({selectedProgram.amateurExercises.length} exercises)
                </button>
                <button
                  className={`modal-level-btn ${selectedLevel === "pro" ? "active" : ""}`}
                  onClick={() => setSelectedLevel("pro")}
                >
                  🔥 Pro Level ({selectedProgram.proExercises.length} exercises)
                </button>
              </div>

              {/* Exercises Grid */}
              <Row className="modal-exercises-grid g-3">
                {(selectedLevel === "amateur" ? selectedProgram.amateurExercises : selectedProgram.proExercises).map((exercise, idx) => (
                  <Col xs={12} sm={6} md={4} lg={3} key={idx}>
                    <div 
                      className="modal-exercise-card"
                      onClick={() => handleExerciseClick(exercise)}
                    >
                      <div className="modal-exercise-image-container">
                        <img 
                          src={exercise.image} 
                          alt={exercise.name}
                          className="modal-exercise-image"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop";
                          }}
                        />
                        <div className="modal-exercise-overlay">
                          <span className="modal-view-text">👁️ Details</span>
                        </div>
                      </div>
                      
                      <div className="modal-exercise-info">
                        <h6 className="modal-exercise-title">{exercise.name}</h6>
                        <div className="modal-exercise-meta">
                          <Badge bg={getDifficultyColor(exercise.difficulty)} className="modal-mini-badge">
                            {exercise.difficulty}
                          </Badge>
                        </div>
                        <div className="modal-exercise-details">
                          <span className="modal-detail-item">📊 {exercise.sets}</span>
                          <span className="modal-detail-item">💪 {exercise.muscle}</span>
                        </div>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Modal.Body>
          </>
        )}
      </Modal>

      {/* Exercise Detail Modal */}
      <Modal 
        show={showExerciseModal} 
        onHide={() => setShowExerciseModal(false)}
        size="lg"
        centered
        className="exercise-detail-modal"
      >
        {selectedExercise && (
          <>
            <Modal.Header closeButton className="modal-header-custom">
              <Modal.Title className="modal-title-custom">
                <span className="modal-title-icon">💪</span>
                {selectedExercise.name}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-body-custom">
              <Row>
                <Col md={6}>
                  <div className="modal-image-container">
                    <img 
                      src={selectedExercise.image} 
                      alt={selectedExercise.name}
                      className="modal-exercise-image"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop";
                      }}
                    />
                  </div>
                  
                  {selectedExercise.videoUrl && (
                    <a 
                      href={selectedExercise.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="video-link-btn"
                    >
                      📹 Watch Tutorial Video
                    </a>
                  )}
                </Col>
                
                <Col md={6}>
                  <div className="exercise-details-section">
                    <div className="detail-row">
                      <span className="detail-label">📊 Sets & Reps:</span>
                      <span className="detail-value">{selectedExercise.sets}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">⏱️ Rest Time:</span>
                      <span className="detail-value">{selectedExercise.rest}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">💪 Target Muscle:</span>
                      <span className="detail-value">{selectedExercise.muscle}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">⚡ Difficulty:</span>
                      <Badge bg={getDifficultyColor(selectedExercise.difficulty)} className="detail-badge">
                        {selectedExercise.difficulty}
                      </Badge>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">🏋️ Equipment:</span>
                      <span className="detail-value">{selectedExercise.equipment}</span>
                    </div>
                    
                    <div className="detail-row">
                      <span className="detail-label">🔥 Calories:</span>
                      <span className="detail-value">{selectedExercise.calories} kcal</span>
                    </div>
                    
                    <div className="tips-section">
                      <h6 className="tips-title">💡 Pro Tips:</h6>
                      <p className="tips-text">{selectedExercise.tips}</p>
                    </div>
                  </div>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="modal-footer-custom">
              <Button variant="secondary" onClick={() => setShowExerciseModal(false)} className="close-modal-btn">
                Close
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </section>
  );
};

export default CoachPrograms;