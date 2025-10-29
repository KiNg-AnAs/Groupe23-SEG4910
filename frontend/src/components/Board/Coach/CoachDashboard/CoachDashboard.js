import React, { useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { FaUsers, FaDumbbell, FaCalendarAlt, FaChartLine, FaUtensils, FaCommentsDollar, FaComment } from "react-icons/fa";
import "./CoachDashboard.css";

// // Placeholder Components (To Be Developed)
import ClientManagement from "../ClientManagement/ClientManagement";
import TrainingPrograms from "../TrainingPrograms/TrainingPrograms";
import BookingManagement from "../BookingManagement/BookingManagement";

const CoachDashboard = () => {
  const [activeSection, setActiveSection] = useState(null);

  // Function to show only one section at a time
  const handleSectionToggle = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <section className="coach-dashboard-section">
      <Container>
        <h2 className="dashboard-title">Welcome, Coach!</h2>
        <p className="dashboard-intro">
          Manage your clients, training programs, bookings, and more.
        </p>

        {/* Dashboard Navigation */}
        <Row className="dashboard-options">
          <Col md={3}>
            <Card className="dashboard-card">
              <Card.Body>
                <FaUsers className="dashboard-icon" />
                <h4>Client Management</h4>
                <p>View and manage your clients' profiles & progress.</p>
                <Button
                  variant="primary"
                  onClick={() => handleSectionToggle("clients")}
                >
                  {activeSection === "clients" ? "Hide" : "View Clients"}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="dashboard-card">
              <Card.Body>
                <FaDumbbell className="dashboard-icon" />
                <h4>Training Programs</h4>
                <p>Create and assign structured workout plans.</p>
                <Button
                  variant="success"
                  onClick={() => handleSectionToggle("training")}
                >
                  {activeSection === "training" ? "Hide" : "Manage Workouts"}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3}>
            <Card className="dashboard-card">
              <Card.Body>
                <FaCalendarAlt className="dashboard-icon" />
                <h4>Bookings</h4>
                <p>Schedule and manage 1-on-1 coaching sessions.</p>
                <Button
                  variant="warning"
                  onClick={() => handleSectionToggle("bookings")}
                >
                  {activeSection === "bookings" ? "Hide" : "Manage Bookings"}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Dynamic Section Rendering */}
       {activeSection === "clients" && <ClientManagement />}
       {activeSection === "training" && <TrainingPrograms />}
       {activeSection === "bookings" && <BookingManagement />}
      </Container>
    </section>
  );
};

export default CoachDashboard;
