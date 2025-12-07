import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Modal, Badge } from "react-bootstrap";
import { useAuth } from "../../../context/AuthContext";
import OnboardingForm from "./OnboardingForm";
import "./Profilecompletedview.css";

import { 
  FaUser, 
  FaRuler, 
  FaWeight, 
  FaDumbbell, 
  FaBullseye, 
  FaCalendar, 
  FaRunning, 
  FaBed, 
  FaCheckCircle,
  FaEdit,
  FaHeartbeat,
  FaFire,
  FaClock
} from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const ProfileCompletedView = () => {
  const { fetchWithAuth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/user-detail/`);
      if (response.profile) {
        setProfile(response.profile);
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedProfile) => {
    // Update the local state immediately with the new profile
    setProfile(updatedProfile);
    setShowEditModal(false);
    
    // Optionally reload from server to ensure sync
    await loadProfile();
  };

  const getTimeSinceUpdate = () => {
    if (!profile?.created_at) return "";
    const lastUpdated = new Date(profile.created_at);
    const daysSince = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0) return "Created today";
    if (daysSince === 1) return "Created yesterday";
    return `Created ${daysSince} days ago`;
  };

  const getBMI = () => {
    if (!profile?.height_cm || !profile?.weight_kg) return null;
    const heightInMeters = profile.height_cm / 100;
    const bmi = (profile.weight_kg / (heightInMeters * heightInMeters)).toFixed(1);
    return bmi;
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { text: "Underweight", variant: "info", color: "#17a2b8" };
    if (bmi < 25) return { text: "Normal", variant: "success", color: "#28a745" };
    if (bmi < 30) return { text: "Overweight", variant: "warning", color: "#ffc107" };
    return { text: "Obese", variant: "danger", color: "#dc3545" };
  };

  const formatGoal = (goal) => {
    if (!goal) return "";
    return goal.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatLevel = (level) => {
    if (!level) return "";
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const formatActivity = (activity) => {
    if (!activity) return "";
    return activity.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="pcv-profile-loading">
        <div className="pcv-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const bmi = getBMI();
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  return (
    <section className="pcv-profile-completed-section">
      <Container className="pcv-profile-container">
        
        {/* Top Bar with Title and Button */}
        <div className="pcv-top-bar">
          <div className="pcv-title-section">
            <h1 className="pcv-page-title">
              <FaCheckCircle className="pcv-title-icon" />
              Your Fitness Profile
            </h1>
            <p className="pcv-page-subtitle">
              <FaClock className="me-2" />
              {getTimeSinceUpdate()}
            </p>
          </div>
          <Button className="pcv-edit-btn" onClick={() => setShowEditModal(true)}>
            <FaEdit className="me-2" />
            Edit Profile
          </Button>
        </div>

        {/* Stats Grid */}
        <Row className="pcv-stats-row g-4">
          
          {/* Left Column - Physical Stats */}
          <Col lg={4} md={6}>
            <Card className="pcv-card pcv-physical-card">
              <Card.Body>
                <div className="pcv-card-header">
                  <div className="pcv-icon-badge pcv-badge-blue">
                    <FaUser />
                  </div>
                  <h3 className="pcv-card-title">Physical Stats</h3>
                </div>

                <div className="pcv-info-list">
                  <div className="pcv-info-row">
                    <div className="pcv-info-label">
                      <FaHeartbeat className="pcv-label-icon" />
                      Age
                    </div>
                    <div className="pcv-info-value">{profile.age} <span>years</span></div>
                  </div>

                  <div className="pcv-info-row">
                    <div className="pcv-info-label">
                      <FaRuler className="pcv-label-icon" />
                      Height
                    </div>
                    <div className="pcv-info-value">{profile.height_cm} <span>cm</span></div>
                  </div>

                  <div className="pcv-info-row">
                    <div className="pcv-info-label">
                      <FaWeight className="pcv-label-icon" />
                      Weight
                    </div>
                    <div className="pcv-info-value">{profile.weight_kg} <span>kg</span></div>
                  </div>

                  {profile.body_fat_percentage && (
                    <div className="pcv-info-row">
                      <div className="pcv-info-label">
                        <FaFire className="pcv-label-icon" />
                        Body Fat
                      </div>
                      <div className="pcv-info-value">{profile.body_fat_percentage} <span>%</span></div>
                    </div>
                  )}

                  {bmi && (
                    <div className="pcv-info-row pcv-bmi-row">
                      <div className="pcv-info-label">
                        <FaHeartbeat className="pcv-label-icon" />
                        BMI
                      </div>
                      <div className="pcv-info-value">
                        {bmi}
                        <Badge 
                          className="ms-2 pcv-bmi-badge" 
                          style={{ backgroundColor: bmiCategory.color }}
                        >
                          {bmiCategory.text}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Middle Column - Fitness Goals */}
          <Col lg={4} md={6}>
            <Card className="pcv-card pcv-goals-card">
              <Card.Body>
                <div className="pcv-card-header">
                  <div className="pcv-icon-badge pcv-badge-purple">
                    <FaDumbbell />
                  </div>
                  <h3 className="pcv-card-title">Fitness Goals</h3>
                </div>

                <div className="pcv-info-list">
                  <div className="pcv-info-row">
                    <div className="pcv-info-label">
                      <FaDumbbell className="pcv-label-icon" />
                      Fitness Level
                    </div>
                    <div className="pcv-info-value">{formatLevel(profile.fitness_level)}</div>
                  </div>

                  <div className="pcv-info-row">
                    <div className="pcv-info-label">
                      <FaBullseye className="pcv-label-icon" />
                      Primary Goal
                    </div>
                    <div className="pcv-info-value">{formatGoal(profile.primary_goal)}</div>
                  </div>

                  <div className="pcv-info-row">
                    <div className="pcv-info-label">
                      <FaCalendar className="pcv-label-icon" />
                      Workout Frequency
                    </div>
                    <div className="pcv-info-value">{profile.workout_frequency}</div>
                  </div>

                  {profile.body_type && (
                    <div className="pcv-info-row">
                      <div className="pcv-info-label">
                        <FaUser className="pcv-label-icon" />
                        Body Type
                      </div>
                      <div className="pcv-info-value">{formatLevel(profile.body_type)}</div>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column - Lifestyle */}
          <Col lg={4} md={12}>
            <Card className="pcv-card pcv-lifestyle-card">
              <Card.Body>
                <div className="pcv-card-header">
                  <div className="pcv-icon-badge pcv-badge-green">
                    <FaBed />
                  </div>
                  <h3 className="pcv-card-title">Lifestyle</h3>
                </div>

                <div className="pcv-info-list">
                  <div className="pcv-info-row">
                    <div className="pcv-info-label">
                      <FaRunning className="pcv-label-icon" />
                      Daily Activity
                    </div>
                    <div className="pcv-info-value">{formatActivity(profile.daily_activity_level)}</div>
                  </div>

                  <div className="pcv-info-row">
                    <div className="pcv-info-label">
                      <FaBed className="pcv-label-icon" />
                      Sleep Hours
                    </div>
                    <div className="pcv-info-value">{profile.sleep_hours} <span>hrs/night</span></div>
                  </div>

                  <div className="pcv-tip-box">
                    <div className="pcv-tip-icon">💡</div>
                    <div className="pcv-tip-content">
                      <strong>Tip:</strong> Aim for 7–9 hours of sleep and stay active daily for optimal results!
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

        </Row>

        {/* Bottom Info Card */}
        <Card className="pcv-bottom-card">
          <Card.Body>
            <div className="pcv-bottom-content">
              <div className="pcv-bottom-icon">
                <FaCheckCircle />
              </div>
              <div className="pcv-bottom-text">
                <h4>Profile Complete!</h4>
                <p>Your profile helps us deliver personalized workout plans and nutrition guidance tailored to your goals.</p>
              </div>
            </div>
          </Card.Body>
        </Card>

      </Container>

      {/* Edit Modal */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        size="lg" 
        centered
        className="pcv-modal"
      >
        <Modal.Header closeButton className="pcv-modal-header">
          <Modal.Title>
            <FaEdit className="me-2" />
            Update Your Profile
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <OnboardingForm
            existingProfile={profile}
            isModal={true}
            onComplete={handleProfileUpdate}
          />
        </Modal.Body>
      </Modal>

    </section>
  );
};

export default ProfileCompletedView;