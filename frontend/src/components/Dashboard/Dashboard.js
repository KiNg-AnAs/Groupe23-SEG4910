import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Collapse } from "react-bootstrap";
import CoachPrograms from "../CoachPrograms/CoachPrograms";
import AddOns from "../AddOns/AddOns";
import AICoaching from "../AICoaching/AICoaching"; 
import "./Dashboard.css";

const Dashboard = ({ userData, addToCart }) => {  
  const userName = userData?.name || "User"; 

  const [showAICoaching, setShowAICoaching] = useState(false);
  const [showPrograms, setShowPrograms] = useState(false);
  const [showAddOns, setShowAddOns] = useState(false);

  useEffect(() => {
    if (showAICoaching) {
      document.getElementById("ai-coaching")?.scrollIntoView({ behavior: "smooth" });
    } else if (showPrograms) {
      document.getElementById("coach-programs")?.scrollIntoView({ behavior: "smooth" });
    } else if (showAddOns) {
      document.getElementById("add-ons")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [showAICoaching, showPrograms, showAddOns]);

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
                  onClick={() => setShowAICoaching(!showAICoaching)}
                  aria-expanded={showAICoaching}
                  aria-controls="ai-coaching"
                >
                  {showAICoaching ? "Hide AI Coaching" : "Start AI Coaching"}
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
                  onClick={() => setShowPrograms(!showPrograms)}
                  aria-expanded={showPrograms}
                  aria-controls="coach-programs"
                >
                  {showPrograms ? "Hide Programs" : "Browse Programs"}
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
                  onClick={() => setShowAddOns(!showAddOns)}
                  aria-expanded={showAddOns}
                  aria-controls="add-ons"
                >
                  {showAddOns ? "Hide Add-Ons" : "Explore Add-Ons"}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Collapse in={showAICoaching}>
          <div id="ai-coaching">
            <AICoaching />
          </div>
        </Collapse>

        <Collapse in={showPrograms}>
          <div id="coach-programs">
            <CoachPrograms />
          </div>
        </Collapse>

        <Collapse in={showAddOns}>
          <div id="add-ons">
            <AddOns addToCart={addToCart} /> 
          </div>
        </Collapse>
      </Container>
    </section>
  );
};

export default Dashboard;
