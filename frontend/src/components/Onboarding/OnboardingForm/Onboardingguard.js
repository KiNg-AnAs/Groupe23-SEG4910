import React, { useState, useEffect } from "react";
import { Modal, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "../../../context/AuthContext";
import OnboardingForm from "./OnboardingForm";
import { FaExclamationTriangle } from "react-icons/fa";
import "./Onboardingguard.css";

const OnboardingGuard = ({ children }) => {
  const { fetchWithAuth } = useAuth();
  const [profileStatus, setProfileStatus] = useState("loading"); // loading, incomplete, complete, update_needed
  const [userProfile, setUserProfile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    checkProfileStatus();
  }, []);

  const checkProfileStatus = async () => {
    try {
      const response = await fetchWithAuth("http://localhost:8000/user-detail/");
      
      if (response.profile) {
        const profile = response.profile;

        const isComplete = 
          profile.age &&
          profile.height_cm &&
          profile.weight_kg &&
          profile.fitness_level &&
          profile.primary_goal &&
          profile.workout_frequency &&
          profile.daily_activity_level &&
          profile.sleep_hours;

        if (isComplete) {
          const lastUpdated = new Date(profile.updated_at || profile.created_at);
          const daysSinceUpdate = Math.floor(
            (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceUpdate >= 7) {
            setProfileStatus("update_needed");
            setUserProfile(profile);
            setShowUpdatePrompt(true);
          } else {
            setProfileStatus("complete");
            setUserProfile(profile);
          }
        } else {
          setProfileStatus("incomplete");
          setUserProfile(profile); // profile exists but incomplete
          setShowModal(true);
        }
      } else {
        // No existing UserProfile in database
        setProfileStatus("incomplete");
        setUserProfile(null); // IMPORTANT -> means never completed before
        setShowModal(false); // modal only opens when clicking the button
      }
    } catch (error) {
      console.error("Failed to check profile status", error);
      setProfileStatus("incomplete");
      setUserProfile(null);
      setShowModal(false);
    }
  };

  const handleProfileComplete = (newProfile) => {
    setUserProfile(newProfile);
    setProfileStatus("complete");
    setShowModal(false);
    setShowUpdatePrompt(false);
    window.location.reload();
  };

  const handleSkipUpdate = () => {
    setShowUpdatePrompt(false);
  };

  // --------------------------
  // LOADING SCREEN
  // --------------------------
  if (profileStatus === "loading") {
    return (
      <div className="onboarding-guard-loading">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading your profile...</p>
      </div>
    );
  }

  // --------------------------
  // INCOMPLETE PROFILE (BLOCKING)
  // --------------------------
  if (profileStatus === "incomplete") {
    const userNeverCompletedForm = !userProfile; // TRUE if no DB row exists

    return (
      <>
        {/* Dim background */}
        <div className="dashboard-overlay">
          <div className="overlay-content">
            <FaExclamationTriangle className="warning-icon" />
            <h3>Profile Required</h3>
            <p>Complete your profile to access your dashboard</p>

            {/* NEW BUTTON — ONLY IF USER NEVER FILLED THE FORM */}
            {userNeverCompletedForm && (
              <button
                className="btn btn-outline-light mt-3"
                onClick={() => setShowModal(true)}
              >
                Go to Onboarding Form
              </button>
            )}
          </div>
        </div>

        {/* Modal for onboarding */}
        <Modal
          show={showModal}
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

  // --------------------------
  // WEEKLY UPDATE PROMPT
  // --------------------------
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
              It's been over a week since you last updated your profile.
              Keeping your stats current helps us provide better recommendations!
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

  // --------------------------
  // PROFILE COMPLETE → RENDER APP
  // --------------------------
  return <>{children}</>;
};

export default OnboardingGuard;
