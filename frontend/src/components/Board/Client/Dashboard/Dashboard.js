import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Collapse } from "react-bootstrap";
import { useAuth } from "../../../../context/AuthContext"; 
import CoachPrograms from "../CoachPrograms/CoachPrograms";
import AddOns from "../../../Shared/AddOns/AddOns";
import AICoaching from "../AICoaching/AICoaching"; 
import NutritionGuide from "../NutritionGuide/NutritionGuide"; 
import "./Dashboard.css";

const Dashboard = ({ userData, addToCart }) => {  
  const { user } = useAuth(); // Get user from Auth Context
  const userName = user?.name?.split(" ")[0] || "User"; // Extract first name (fallback: "User")

  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    if (activeSection) {
      document.getElementById(activeSection)?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSection]);

  // Function to toggle visibility of sections, ensuring only one is open
  const toggleSection = (section) => {
    setActiveSection((prevSection) => (prevSection === section ? null : section));
  };

  return (
    <section className="dashboard-container-section">
      <Container className="dashboard-container">
        <h2 className="dashboard-title">Welcome, {userName}!</h2>
        <p className="dashboard-intro">
          Choose an option below to start your personalized fitness journey.
        </p>

        <Row className="dashboard-options">
          <Col md={4}>
            <Card className="dashboard-card">
              <Card.Body>
                <h4>AI-Powered Coaching</h4>
                <p>Get a personalized AI-generated plan for weight loss & muscle gain.</p>
                <Button
                  variant="primary"
                  onClick={() => toggleSection("ai-coaching")}
                  aria-expanded={activeSection === "ai-coaching"}
                  aria-controls="ai-coaching"
                >
                  {activeSection === "ai-coaching" ? "Hide AI Coaching" : "Start AI Coaching"}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="dashboard-card">
              <Card.Body>
                <h4>Coach Programs</h4>
                <p>Access structured training programs designed by Coach Rayane.</p>
                <Button
                  variant="success"
                  onClick={() => toggleSection("coach-programs")}
                  aria-expanded={activeSection === "coach-programs"}
                  aria-controls="coach-programs"
                >
                  {activeSection === "coach-programs" ? "Hide Programs" : "Browse Programs"}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="dashboard-card">
              <Card.Body>
                <h4>Premium Add-Ons</h4>
                <p>Upgrade your training with 1-on-1 coaching, ebooks, and more.</p>
                <Button
                  variant="warning"
                  onClick={() => toggleSection("add-ons")}
                  aria-expanded={activeSection === "add-ons"}
                  aria-controls="add-ons"
                >
                  {activeSection === "add-ons" ? "Hide Add-Ons" : "Explore Add-Ons"}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="dashboard-card">
              <Card.Body>
                <h4>Basic Nutrition Guide</h4>
                <p>Get expert nutrition advice to enhance your fitness goals.</p>
                <Button
                  variant="info"
                  onClick={() => toggleSection("nutrition-guide")}
                  aria-expanded={activeSection === "nutrition-guide"}
                  aria-controls="nutrition-guide"
                >
                  {activeSection === "nutrition-guide" ? "Hide Guide" : "View Nutrition Guide"}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Collapse in={activeSection === "ai-coaching"}>
          <div id="ai-coaching">
            <AICoaching />
          </div>
        </Collapse>

        <Collapse in={activeSection === "coach-programs"}>
          <div id="coach-programs">
            <CoachPrograms />
          </div>
        </Collapse>

        <Collapse in={activeSection === "add-ons"}>
          <div id="add-ons">
            <AddOns addToCart={addToCart} /> 
          </div>
        </Collapse>

        <Collapse in={activeSection === "nutrition-guide"}>
          <div id="nutrition-guide">
            <NutritionGuide />
          </div>
        </Collapse>
      </Container>
    </section>
  );
};

export default Dashboard;
