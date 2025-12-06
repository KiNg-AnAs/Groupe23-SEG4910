import React, { useState, useEffect } from "react";
import { Modal, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "../../../context/AuthContext";
import OnboardingForm from "./OnboardingForm";
import { FaExclamationTriangle } from "react-icons/fa";
import "./Onboardingguard.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const OnboardingGuard = ({ children }) => {
  const { fetchWithAuth } = useAuth();
  const [profileStatus, setProfileStatus] = useState("loading");
  const [userProfile, setUserProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    checkProfileStatus();
  }, []);

  const checkProfileStatus = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/user-detail/`);
      
      console.log("📊 User detail response:", response);
      console.log("👤 User ID:", response.id);
      console.log("📋 Profile data:", response.profile);
      
      if (response.profile) {
        const profile = response.profile;
        
        // Check if profile has all required fields
        const isComplete = 
          profile.age &&
          profile.height_cm &&
          profile.weight_kg &&
          profile.fitness_level &&
          profile.primary_goal &&
          profile.workout_frequency &&
          profile.daily_activity_level &&
          profile.sleep_hours;

        console.log("Profile complete:", isComplete);

        if (isComplete) {
          // Check if profile needs weekly update
          const lastUpdated = new Date(profile.created_at);
          const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
          
          console.log("📅 Days since profile creation:", daysSinceUpdate);
          
          if (daysSinceUpdate >= 7) {
            setProfileStatus("update_needed");
            setUserProfile(profile);
            setShowUpdatePrompt(true);
          } else {
            setProfileStatus("complete");
            setUserProfile(profile);
          }
        } else {
          console.log("Profile incomplete - missing required fields");
          setProfileStatus("incomplete");
          setUserProfile(profile);
        }
      } else {
        console.log("No profile found - profile is null");
        setProfileStatus("incomplete");
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Failed to check profile status", error);
      setProfileStatus("incomplete");
      setUserProfile(null);
    }
  };

  const handleProfileComplete = (newProfile) => {
    setUserProfile(newProfile);
    setProfileStatus("complete");
    setShowModal(false);
    setShowUpdatePrompt(false);
    //window.location.reload();
  };

  const handleSkipUpdate = () => {
    setShowUpdatePrompt(false);
  };

  // Loading state
  if (profileStatus === "loading") {
    return (
      <div className="onboarding-guard-loading">
        <Spinner animation="border" variant="light" />
        <p className="mt-3">Loading your profile...</p>
      </div>
    );
  }

  // Incomplete profile - Show overlay OR modal (not both)
  if (profileStatus === "incomplete") {
    return (
      <>
        {/* Show overlay ONLY when modal is NOT open */}
        {!showModal && (
          <div className="dashboard-overlay">
            <div className="overlay-content">
              <FaExclamationTriangle className="warning-icon" />
              <h3>Profile Required</h3>
              <p>You need to complete your fitness profile to access the dashboard</p>
              <button
                className="btn btn-light btn-lg mt-4"
                onClick={() => setShowModal(true)}
              >
                Complete Your Profile Now
              </button>
            </div>
          </div>
        )}

        {/* Onboarding Modal - Shows when button is clicked */}
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          backdrop="static"
          keyboard={false}
          size="lg"
          centered
          className="onboarding-modal"
        >
          <Modal.Body className="p-0">
            <OnboardingForm
              existingProfile={userProfile}
              isModal={true}
              onComplete={handleProfileComplete}
            />
          </Modal.Body>
        </Modal>
      </>
    );
  }

  // Weekly update prompt
  if (showUpdatePrompt) {
    return (
      <>
        {children}
        
        <Modal
          show={showUpdatePrompt}
          onHide={handleSkipUpdate}
          size="md"
          centered
          className="update-prompt-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FaExclamationTriangle className="text-warning me-2" />
              Profile Update Needed
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info">
              It's been over a week since you created your profile. Keeping your stats current helps us provide better recommendations!
            </Alert>
            <div className="d-grid gap-2">
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setShowModal(true)}
              >
                Update My Profile
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={handleSkipUpdate}
              >
                Skip for Now
              </button>
            </div>
          </Modal.Body>
        </Modal>

        {/* Update Modal */}
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="lg"
          centered
          className="onboarding-modal"
        >
          <Modal.Body className="p-0">
            <OnboardingForm
              existingProfile={userProfile}
              isModal={true}
              onComplete={handleProfileComplete}
            />
          </Modal.Body>
        </Modal>
      </>
    );
  }

  // Profile is complete - render dashboard
  return <>{children}</>;
};

export default OnboardingGuard;