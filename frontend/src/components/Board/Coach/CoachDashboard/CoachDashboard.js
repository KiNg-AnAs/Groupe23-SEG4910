import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { 
  FaUsers, 
  FaDumbbell, 
  FaCalendarAlt, 
  FaChartLine, 
  FaRobot,
  FaVideo,
  FaArrowRight,
  FaStar,
  FaTrophy,
  FaFireAlt
} from "react-icons/fa";
import { useAuth } from "../../../../context/AuthContext";
import "./CoachDashboard.css";

import ClientManagement from "../ClientManagement/ClientManagement";
import TrainingPrograms from "../TrainingPrograms/TrainingPrograms";
import BookingManagement from "../BookingManagement/BookingManagement";

const CoachDashboard = () => {
  const { fetchWithAuth } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalPrograms: 0,
    totalBookings: 0,
    totalSessions: 0
  });

  const handleSectionToggle = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Fetch real stats from APIs
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch clients
        const clientsData = await fetchWithAuth("http://localhost:8000/coach/clients/?limit=1000&offset=0");
        const clientCount = Array.isArray(clientsData?.results) ? clientsData.results.length : 0;

        // Fetch training programs
        const trainingData = await fetchWithAuth("http://localhost:8000/coach/training/");
        const trainingArray = Array.isArray(trainingData) ? trainingData : [];
        const totalTrainingSessions = trainingArray.reduce((sum, t) => sum + (t.quantity || 0), 0);

        // Fetch bookings
        const bookingsData = await fetchWithAuth("http://localhost:8000/coach/bookings/");
        const bookingsArray = Array.isArray(bookingsData) ? bookingsData : [];
        const totalBookingSessions = bookingsArray.reduce((sum, b) => sum + (b.quantity || 0), 0);

        setStats({
          totalClients: clientCount,
          totalPrograms: totalTrainingSessions,
          totalBookings: totalBookingSessions,
          totalSessions: totalTrainingSessions + totalBookingSessions
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchStats();
  }, [fetchWithAuth]);

  return (
    <div className="coach-dashboard-wrapper">
      <Container className="coach-dashboard-container">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <div className="hero-badge">
            <FaStar className="badge-icon" />
            <span>Pro Coach Dashboard</span>
          </div>
          <h1 className="dashboard-title">
            Welcome Back, Coach! 💪
          </h1>
          <p className="dashboard-subtitle">
            Your command center for transforming lives and building champions
          </p>
        </div>

        {/* Quick Stats Bar */}
        <div className="quick-stats-bar">
          <div className="stat-item">
            <div className="stat-icon-wrapper stat-icon-1">
              <FaUsers className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalClients}</div>
              <div className="stat-label">Total Clients</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrapper stat-icon-2">
              <FaFireAlt className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalPrograms}</div>
              <div className="stat-label">Total Programs</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrapper stat-icon-3">
              <FaCalendarAlt className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalBookings}</div>
              <div className="stat-label">Total Bookings</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon-wrapper stat-icon-4">
              <FaFireAlt className="stat-icon" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalSessions}</div>
              <div className="stat-label">Total Sessions</div>
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <Row className="dashboard-cards-row">
          <Col lg={4} md={6} className="dashboard-col">
            <Card 
              className={`modern-dashboard-card card-clients ${activeSection === "clients" ? "active" : ""}`}
              onClick={() => handleSectionToggle("clients")}
            >
              <div className="card-glow card-glow-1"></div>
              <Card.Body>
                <div className="card-icon-wrapper">
                  <FaUsers className="card-icon" />
                </div>
                <h3 className="card-title">Client Management</h3>
                <p className="card-description">
                  View profiles, track progress, and manage your entire client roster
                </p>
                <div className="card-stats">
                  <div className="card-stat">
                    <FaChartLine className="me-1" />
                    <span>{stats.totalClients} Active</span>
                  </div>
                </div>
                <Button className="card-action-btn">
                  <span>{activeSection === "clients" ? "Close" : "Open Dashboard"}</span>
                  <FaArrowRight className="btn-icon" />
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} className="dashboard-col">
            <Card 
              className={`modern-dashboard-card card-training ${activeSection === "training" ? "active" : ""}`}
              onClick={() => handleSectionToggle("training")}
            >
              <div className="card-glow card-glow-2"></div>
              <Card.Body>
                <div className="card-icon-wrapper">
                  <FaRobot className="card-icon" />
                </div>
                <h3 className="card-title">AI Training Programs</h3>
                <p className="card-description">
                  Manage AI-powered workout plans and monitor training progress
                </p>
                <div className="card-stats">
                  <div className="card-stat">
                    <FaDumbbell className="me-1" />
                    <span>{stats.totalPrograms} Sessions</span>
                  </div>
                </div>
                <Button className="card-action-btn">
                  <span>{activeSection === "training" ? "Close" : "Open Dashboard"}</span>
                  <FaArrowRight className="btn-icon" />
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={6} className="dashboard-col">
            <Card 
              className={`modern-dashboard-card card-bookings ${activeSection === "bookings" ? "active" : ""}`}
              onClick={() => handleSectionToggle("bookings")}
            >
              <div className="card-glow card-glow-3"></div>
              <Card.Body>
                <div className="card-icon-wrapper">
                  <FaVideo className="card-icon" />
                </div>
                <h3 className="card-title">Zoom Bookings</h3>
                <p className="card-description">
                  Schedule, manage, and conduct 1-on-1 video coaching sessions
                </p>
                <div className="card-stats">
                  <div className="card-stat">
                    <FaCalendarAlt className="me-1" />
                    <span>{stats.totalBookings} Sessions</span>
                  </div>
                </div>
                <Button className="card-action-btn">
                  <span>{activeSection === "bookings" ? "Close" : "Open Dashboard"}</span>
                  <FaArrowRight className="btn-icon" />
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Dynamic Section Rendering */}
        <div className="dynamic-section-container">
          {activeSection === "clients" && (
            <div className="section-fade-in">
              <ClientManagement />
            </div>
          )}
          {activeSection === "training" && (
            <div className="section-fade-in">
              <TrainingPrograms />
            </div>
          )}
          {activeSection === "bookings" && (
            <div className="section-fade-in">
              <BookingManagement />
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default CoachDashboard;