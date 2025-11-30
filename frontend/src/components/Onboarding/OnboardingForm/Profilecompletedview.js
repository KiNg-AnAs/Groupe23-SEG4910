import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Modal, Badge } from "react-bootstrap";
import { useAuth } from "../../../context/AuthContext";
import OnboardingForm from "./OnboardingForm";
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
  FaEdit
} from "react-icons/fa";

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
      const response = await fetchWithAuth("http://localhost:8000/user-detail/");
      if (response.profile) {
        setProfile(response.profile);
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile(updatedProfile);
    setShowEditModal(false);
    // Reload to refresh all components
    window.location.reload();
  };

  const getTimeSinceUpdate = () => {
    if (!profile?.updated_at && !profile?.created_at) return "";
    const lastUpdated = new Date(profile.updated_at || profile.created_at);
    const daysSince = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSince === 0) return "Updated today";
    if (daysSince === 1) return "Updated yesterday";
    return `Updated ${daysSince} days ago`;
  };

  const getBMI = () => {
    if (!profile?.height_cm || !profile?.weight_kg) return null;
    const heightInMeters = profile.height_cm / 100;
    const bmi = (profile.weight_kg / (heightInMeters * heightInMeters)).toFixed(1);
    return bmi;
  };

  const getBMICategory = (bmi) => {
    if (bmi < 18.5) return { text: "Underweight", variant: "info" };
    if (bmi < 25) return { text: "Normal", variant: "success" };
    if (bmi < 30) return { text: "Overweight", variant: "warning" };
    return { text: "Obese", variant: "danger" };
  };

  if (loading) {
    return <div className="text-center p-5">Loading profile...</div>;
  }

  if (!profile) {
    return null;
  }

  const bmi = getBMI();
  const bmiCategory = bmi ? getBMICategory(bmi) : null;

  return (
    <section className="profile-completed-section">
      <Container>
        <div className="profile-header">
          <div>
            <h2 className="profile-title">
              <FaCheckCircle className="me-2 text-success" />
              Your Fitness Profile
            </h2>
            <p className="profile-subtitle">{getTimeSinceUpdate()}</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowEditModal(true)}
            className="edit-profile-btn"
          >
            <FaEdit className="me-2" />
            Update Profile
          </Button>
        </div>

        <Row className="g-4">
          {/* Physical Stats Card */}
          <Col md={6} lg={4}>
            <Card className="profile-stat-card">
              <Card.Body>
                <h5 className="stat-card-title">
                  <FaUser className="me-2" />
                  Physical Stats
                </h5>
                
                <div className="stat-item">
                  <div className="stat-label">
                    <FaUser className="me-2 text-primary" />
                    Age
                  </div>
                  <div className="stat-value">{profile.age} years</div>
                </div>

                <div className="stat-item">
                  <div className="stat-label">
                    <FaRuler className="me-2 text-info" />
                    Height
                  </div>
                  <div className="stat-value">{profile.height_cm} cm</div>
                </div>

                <div className="stat-item">
                  <div className="stat-label">
                    <FaWeight className="me-2 text-warning" />
                    Weight
                  </div>
                  <div className="stat-value">{profile.weight_kg} kg</div>
                </div>

                {profile.body_fat_percentage && (
                  <div className="stat-item">
                    <div className="stat-label">Body Fat</div>
                    <div className="stat-value">{profile.body_fat_percentage}%</div>
                  </div>
                )}

                {bmi && (
                  <div className="stat-item bmi-item">
                    <div className="stat-label">BMI</div>
                    <div className="stat-value">
                      {bmi}
                      {bmiCategory && (
                        <Badge bg={bmiCategory.variant} className="ms-2">
                          {bmiCategory.text}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Fitness Goals Card */}
          <Col md={6} lg={4}>
            <Card className="profile-stat-card">
              <Card.Body>
                <h5 className="stat-card-title">
                  <FaDumbbell className="me-2" />
                  Fitness Goals
                </h5>

                <div className="stat-item">
                  <div className="stat-label">
                    <FaDumbbell className="me-2 text-danger" />
                    Fitness Level
                  </div>
                  <div className="stat-value">
                    <Badge bg="secondary" className="level-badge">
                      {profile.fitness_level}
                    </Badge>
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-label">
                    <FaBullseye className="me-2 text-success" />
                    Primary Goal
                  </div>
                  <div className="stat-value">{profile.primary_goal}</div>
                </div>

                <div className="stat-item">
                  <div className="stat-label">
                    <FaCalendar className="me-2 text-primary" />
                    Workout Frequency
                  </div>
                  <div className="stat-value">{profile.workout_frequency}</div>
                </div>

                {profile.body_type && (
                  <div className="stat-item">
                    <div className="stat-label">Body Type</div>
                    <div className="stat-value">{profile.body_type}</div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Lifestyle Card */}
          <Col md={12} lg={4}>
            <Card className="profile-stat-card">
              <Card.Body>
                <h5 className="stat-card-title">
                  <FaBed className="me-2" />
                  Lifestyle
                </h5>

                <div className="stat-item">
                  <div className="stat-label">
                    <FaRunning className="me-2 text-info" />
                    Daily Activity
                  </div>
                  <div className="stat-value">{profile.daily_activity_level}</div>
                </div>

                <div className="stat-item">
                  <div className="stat-label">
                    <FaBed className="me-2 text-primary" />
                    Sleep Hours
                  </div>
                  <div className="stat-value">{profile.sleep_hours} hours/night</div>
                </div>

                <div className="lifestyle-tips">
                  <small className="text-muted">
                    💡 Tip: Aim for 7-9 hours of sleep and stay active throughout the day for optimal results!
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Additional Info */}
        <Card className="profile-summary-card mt-4">
          <Card.Body>
            <h5 className="mb-3">
              <FaCheckCircle className="me-2 text-success" />
              Profile Complete!
            </h5>
            <p className="mb-2">
              Your profile is helping us deliver personalized workout plans and nutrition guidance tailored to your goals.
            </p>
            <small className="text-muted">
              We recommend updating your profile weekly to track your progress and adjust recommendations.
            </small>
          </Card.Body>
        </Card>
      </Container>

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        centered
        className="profile-edit-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Update Your Profile</Modal.Title>
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