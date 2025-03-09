import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useAuth } from "../../../context/AuthContext"; // Import Auth Context
import { useNavigate } from "react-router-dom";
import "./BestProgramSection.css";
import img15 from "../../Assets/img15.jpg"; 
import img13 from "../../Assets/img13.jpg"; 

const BestProgramSection = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth(); // Get Auth State
  const navigate = useNavigate();

  // Handle "Start Your AI Journey" Click
  const handleStartJourney = () => {
    if (isAuthenticated) {
      navigate("/dashboard"); // Redirect to AI Coaching if logged in
    } else {
      loginWithRedirect(); // Redirect to login if not authenticated
    }
  };

  return (
    <section id="best-program" className="best-program-section">
      <Container>
        <Row className="align-items-center">
          {/* Left Side - Text and CTA */}
          <Col lg={6} className="text-content">
            <h2 className="highlight-title">AI-Generated Weight Loss & Lean Muscle Program</h2>
            <p className="highlight-description">
              The first-of-its-kind AI-powered program that adapts to your body type, metabolism, and fitness level 
              to create the perfect balance between weight loss and muscle gain.
            </p>

            <ul className="highlight-features">
              <li>✔️ Personalized AI-generated workout</li>
              <li>✔️ Track progress with real-time insights</li>
              <li>✔️ Science-based approach for optimal results</li>
            </ul>
            <Button variant="primary" className="cta-button" onClick={handleStartJourney}>
              Start Your AI Journey
            </Button>
          </Col>

          {/* Right Side - Image and AI icon */}
          <Col lg={6} className="image-container">
            <div className="image-wrapper">
              <img src={img15} alt="AI-Generated Program" className="best-program-img" />
            </div>
          </Col>
        </Row>

        {/* Video Testimonial Section */}
        <Row className="video-section">
          <Col md={12} className="text-center">
            <h3 className="video-title">See How It Works</h3>
            <p>Watch how our AI transforms your fitness journey.</p>
            <div className="video-wrapper">
              <img src={img13} alt="Video Thumbnail" className="video-thumbnail" />
              <Button variant="danger" className="play-button">▶ Play Video</Button>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default BestProgramSection;
