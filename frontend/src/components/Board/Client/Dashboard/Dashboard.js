import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Collapse,
  Modal,
  Spinner,
  Form,
  Alert,
  Badge,
} from "react-bootstrap";
import { 
  FaRocket, 
  FaDumbbell, 
  FaStar, 
  FaAppleAlt, 
  FaLock, 
  FaCrown,
  FaCheckCircle,
  FaBolt,
  FaTrophy
} from "react-icons/fa";
import { useAuth } from "../../../../context/AuthContext";
import CoachPrograms from "../CoachPrograms/CoachPrograms";
import AddOns from "../../../Shared/AddOns/AddOns";
import AICoaching from "../AICoaching/AICoaching";
import NutritionGuide from "../NutritionGuide/NutritionGuide";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import OnboardingGuard from "../../../Onboarding/OnboardingForm/Onboardingguard";
import ProfileCompletedView from "../../../Onboarding/OnboardingForm/Profilecompletedview";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const Dashboard = ({ userData, addToCart }) => {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const userName = user?.name?.split(" ")[0] || "User";
  
  const [activeSection, setActiveSection] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [lockedSection, setLockedSection] = useState("");
  
  const [userInfo, setUserInfo] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [downgradeModal, setDowngradeModal] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchUserRow = async () => {
      try {
        const data = await fetchWithAuth(`${API_URL}/user-detail/`);
        setUserInfo(data);
        setUsername(data.username || "");
      } catch (err) {
        console.error("Failed to fetch user detail:", err);
        setError("Failed to load user info from database.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserRow();
  }, [fetchWithAuth]);

  const effectivePlan = useMemo(() => {
    const fromServer = userInfo?.subscription_plan;
    const fromProp = userData?.plan;
    return (fromServer || fromProp || "none").toLowerCase();
  }, [userInfo?.subscription_plan, userData?.plan]);

  const normalizedAddOns = useMemo(() => {
    const map = { ebook: 0, ai: 0, zoom: 0 };
    const list = Array.isArray(userInfo?.addons) ? userInfo.addons : [];
    for (const a of list) {
      const type = (a?.addon_type || "").toLowerCase();
      const qty = Number(a?.quantity || 0);
      const status = (a?.status || "").toLowerCase();
      if ((type === "ebook" || type === "ai" || type === "zoom") && status === "active" && qty > 0) {
        map[type] += qty;
      }
    }
    return map;
  }, [userInfo?.addons]);

  const handleSaveUsername = async () => {
    setSaving(true);
    setError("");
    try {
      await fetchWithAuth(`${API_URL}/user-detail/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      setUserInfo((prev) => ({ ...prev, username }));
    } catch (err) {
      console.error("Failed to update username:", err);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDowngradePlan = async (targetPlan = "none") => {
    setDowngrading(true);
    setError("");
    try {
      await fetchWithAuth(`${API_URL}/user-detail/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_plan: targetPlan }),
      });
  
      setSuccessMessage(
        `Your plan has been downgraded to ${targetPlan.toUpperCase()} successfully.`
      );
      setUserInfo((prev) => ({ ...prev, subscription_plan: targetPlan }));
      setDowngradeModal(false);
    } catch (err) {
      console.error("Failed to downgrade plan:", err);
      setError("Failed to downgrade plan. Please try again.");
    } finally {
      setDowngrading(false);
    }
  };

  const ownsAnyAddon = normalizedAddOns.ebook > 0 || normalizedAddOns.ai > 0 || normalizedAddOns.zoom > 0;

  const canAccess = (section) => {
    if (effectivePlan === "advanced") return true;
    if (effectivePlan === "basic") {
      if (section === "ai-coaching") return true;
      if (section === "coach-programs") return true;
      if (section === "nutrition-guide") return false;
      if (section === "add-ons") return ownsAnyAddon;
      return false;
    }
    if (section === "add-ons") return ownsAnyAddon;
    return false;
  };

  const whyLocked = (section) => {
    if (effectivePlan === "advanced") return null;
    if (effectivePlan === "basic") {
      if (section === "nutrition-guide") {
        return normalizedAddOns.ebook > 0 ? null : "purchase";
      }
      if (section === "add-ons") {
        return ownsAnyAddon ? null : "purchase";
      }
      return null;
    }
    if (section === "add-ons") {
      return ownsAnyAddon ? null : "none";
    }
    return "none";
  };

  const toggleSection = (section) => {
    if (canAccess(section)) {
      setActiveSection((prev) => (prev === section ? null : section));
      return;
    }
    setLockedSection(section);
    const reason = whyLocked(section);
    if (reason === "upgrade") {
      setShowUpgradeModal(true);
    } else if (reason === "purchase") {
      setShowPlanModal(true);
    } else {
      setShowPlanModal(true);
    }
  };

  const handleUpgrade = () => {
    addToCart("plan", "advanced");
    navigate("/cart");
    setShowUpgradeModal(false);
  };

  const handleViewPlans = () => {
    navigate("/cart");
    setShowPlanModal(false);
  };

  const getPlanBadgeColor = () => {
    if (effectivePlan === "advanced") return "client-badge-advanced";
    if (effectivePlan === "basic") return "client-badge-basic";
    return "client-badge-none";
  };

  const planModalBody = () => {
    const reason = whyLocked(lockedSection);
    if (effectivePlan === "basic" && reason === "purchase") {
      if (lockedSection === "nutrition-guide") {
        return (
          <>
            This feature is available if you own the <strong>E-Book</strong>.
            You can purchase it from the Cart.
          </>
        );
      }
      if (lockedSection === "add-ons") {
        return (
          <>
            Premium Add-Ons will be visible here when you own at least one add-on (Zoom / AI / E-Book). You can purchase
            add-ons from the Cart.
          </>
        );
      }
      return <>Please complete the required purchase from the Cart.</>;
    }
    if (effectivePlan === "none") {
      if (lockedSection === "add-ons") {
        return (
          <>
            Premium Add-Ons are visible here only if you already own an add-on.
            To acquire add-ons, please choose a plan and purchase from the Cart.
          </>
        );
      }
      return (
        <>
          Please select a plan to unlock this feature. You can choose
          <strong> Basic</strong> or <strong>Advanced</strong> from the Cart.
        </>
      );
    }
    return <>Please select/upgrade your plan to unlock this feature.</>;
  };

  return (
    
    <section className="client-dashboard-wrapper">
      <Container className="client-dashboard-container">
        {/* Hero Section */}
        <div className="client-dashboard-hero">
          <div className="client-hero-badge">
            <FaTrophy className="client-badge-icon" />
            <span>Member Dashboard</span>
          </div>
          <h1 className="client-dashboard-title">
            Welcome Back, {userName}! 💪
          </h1>
          <p className="client-dashboard-subtitle">
            Your personalized fitness journey starts here
          </p>
        </div>

        {/* Plan Status Banner */}
        <div className="client-plan-banner">
          <div className={`client-plan-badge ${getPlanBadgeColor()}`}>
            <FaCrown className="me-2" />
            {effectivePlan === "none" ? "No Active Plan" : effectivePlan === "basic" ? "Basic Plan" : "Advanced Plan"}
          </div>
          {(normalizedAddOns.ebook > 0 || normalizedAddOns.ai > 0 || normalizedAddOns.zoom > 0) && (
            <div className="client-addons-chips">
              <span className="client-addons-label">Active Add-Ons:</span>
              {normalizedAddOns.ebook > 0 && (
                <Badge bg="secondary" className="client-addon-chip">
                  📚 E-Book × {normalizedAddOns.ebook}
                </Badge>
              )}
              {normalizedAddOns.ai > 0 && (
                <Badge bg="secondary" className="client-addon-chip">
                  🤖 AI × {normalizedAddOns.ai}
                </Badge>
              )}
              {normalizedAddOns.zoom > 0 && (
                <Badge bg="secondary" className="client-addon-chip">
                  🎥 Zoom × {normalizedAddOns.zoom}
                </Badge>
              )}
            </div>
          )}
        </div>

        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage("")} dismissible className="client-alert">
            {successMessage}
          </Alert>
        )}
        {error && <Alert variant="danger" className="client-alert">{error}</Alert>}

        {/* Feature Cards */}
        <Row className="client-dashboard-cards-row">
          {/* AI Coaching */}
          <Col lg={6} className="client-dashboard-col">
            <Card className={`client-feature-card ${!canAccess("ai-coaching") ? "client-card-locked" : ""} ${activeSection === "ai-coaching" ? "client-card-active" : ""}`}>
              <div className="client-card-glow client-card-glow-1"></div>
              <Card.Body onClick={() => toggleSection("ai-coaching")} style={{ cursor: "pointer" }}>
                <div className="client-card-icon-wrapper client-icon-ai">
                  {canAccess("ai-coaching") ? <FaRocket className="client-card-icon" /> : <FaLock className="client-card-icon" />}
                </div>
                <h3 className="client-card-title">AI-Powered Coaching</h3>
                <p className="client-card-description">
                  Get a personalized AI-generated plan for weight loss & muscle gain
                </p>
                {canAccess("ai-coaching") && (
                  <div className="client-card-features">
                    <div className="client-feature-item">
                      <FaCheckCircle className="client-feature-icon" />
                      <span>Custom Workouts</span>
                    </div>
                    <div className="client-feature-item">
                      <FaCheckCircle className="client-feature-icon" />
                      <span>Progress Tracking</span>
                    </div>
                  </div>
                )}
                {!canAccess("ai-coaching") && (
                  <div className="client-locked-badge">
                    <FaLock className="me-2" />
                    Requires Basic or Advanced Plan
                  </div>
                )}
                <Button className="client-card-action-btn" disabled={!canAccess("ai-coaching")}>
                  {activeSection === "ai-coaching" ? "Close" : "Launch AI Coach"}
                  <FaBolt className="client-btn-icon" />
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Coach Programs */}
          <Col lg={6} className="client-dashboard-col">
            <Card className={`client-feature-card ${!canAccess("coach-programs") ? "client-card-locked" : ""} ${activeSection === "coach-programs" ? "client-card-active" : ""}`}>
              <div className="client-card-glow client-card-glow-2"></div>
              <Card.Body onClick={() => toggleSection("coach-programs")} style={{ cursor: "pointer" }}>
                <div className="client-card-icon-wrapper client-icon-coach">
                  {canAccess("coach-programs") ? <FaDumbbell className="client-card-icon" /> : <FaLock className="client-card-icon" />}
                </div>
                <h3 className="client-card-title">Coach Programs</h3>
                <p className="client-card-description">
                  Access structured training programs designed by Coach Rayane
                </p>
                {canAccess("coach-programs") && (
                  <div className="client-card-features">
                    <div className="client-feature-item">
                      <FaCheckCircle className="client-feature-icon" />
                      <span>Expert Designed</span>
                    </div>
                    <div className="client-feature-item">
                      <FaCheckCircle className="client-feature-icon" />
                      <span>Proven Results</span>
                    </div>
                  </div>
                )}
                {!canAccess("coach-programs") && (
                  <div className="client-locked-badge">
                    <FaLock className="me-2" />
                    Requires Basic or Advanced Plan
                  </div>
                )}
                <Button className="client-card-action-btn" disabled={!canAccess("coach-programs")}>
                  {activeSection === "coach-programs" ? "Close" : "Browse Programs"}
                  <FaBolt className="client-btn-icon" />
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Premium Add-Ons */}
          <Col lg={6} className="client-dashboard-col">
            <Card className={`client-feature-card ${!canAccess("add-ons") ? "client-card-locked" : ""} ${activeSection === "add-ons" ? "client-card-active" : ""}`}>
              <div className="client-card-glow client-card-glow-3"></div>
              <Card.Body onClick={() => toggleSection("add-ons")} style={{ cursor: "pointer" }}>
                <div className="client-card-icon-wrapper client-icon-addons">
                  {canAccess("add-ons") ? <FaStar className="client-card-icon" /> : <FaLock className="client-card-icon" />}
                </div>
                <h3 className="client-card-title">Premium Add-Ons</h3>
                <p className="client-card-description">
                  Upgrade your training with 1-on-1 coaching, E-Book, and more
                </p>
                {canAccess("add-ons") && (
                  <div className="client-card-features">
                    <div className="client-feature-item">
                      <FaCheckCircle className="client-feature-icon" />
                      <span>Zoom Sessions</span>
                    </div>
                    <div className="client-feature-item">
                      <FaCheckCircle className="client-feature-icon" />
                      <span>Exclusive Content</span>
                    </div>
                  </div>
                )}
                {!canAccess("add-ons") && (
                  <div className="client-locked-badge">
                    <FaLock className="me-2" />
                    {effectivePlan === "basic" ? "Purchase Add-Ons to Unlock" : "Requires Plan"}
                  </div>
                )}
                <Button className="client-card-action-btn" disabled={!canAccess("add-ons")}>
                  {activeSection === "add-ons" ? "Close" : "Explore Add-Ons"}
                  <FaBolt className="client-btn-icon" />
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Nutrition Guide */}
          <Col lg={6} className="client-dashboard-col">
            <Card className={`client-feature-card ${!canAccess("nutrition-guide") ? "client-card-locked" : ""} ${activeSection === "nutrition-guide" ? "client-card-active" : ""}`}>
              <div className="client-card-glow client-card-glow-4"></div>
              <Card.Body onClick={() => toggleSection("nutrition-guide")} style={{ cursor: "pointer" }}>
                <div className="client-card-icon-wrapper client-icon-nutrition">
                  {canAccess("nutrition-guide") ? <FaAppleAlt className="client-card-icon" /> : <FaLock className="client-card-icon" />}
                </div>
                <h3 className="client-card-title">Nutrition Guide</h3>
                <p className="client-card-description">
                  Get expert nutrition advice to enhance your fitness goals
                </p>
                {canAccess("nutrition-guide") && (
                  <div className="client-card-features">
                    <div className="client-feature-item">
                      <FaCheckCircle className="client-feature-icon" />
                      <span>Meal Plans</span>
                    </div>
                    <div className="client-feature-item">
                      <FaCheckCircle className="client-feature-icon" />
                      <span>Macro Tracking</span>
                    </div>
                  </div>
                )}
                {!canAccess("nutrition-guide") && (
                  <div className="client-locked-badge">
                    <FaLock className="me-2" />
                    {effectivePlan === "basic" ? "Requires E-Book or Advanced" : "Requires Advanced Plan"}
                  </div>
                )}
                <Button className="client-card-action-btn" disabled={!canAccess("nutrition-guide")}>
                  {activeSection === "nutrition-guide" ? "Close" : "View Guide"}
                  <FaBolt className="client-btn-icon" />
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Plan Management Buttons */}
        <div className="client-plan-actions">
          {(!effectivePlan || effectivePlan === "none") && (
            <Button variant="success" size="lg" onClick={handleUpgrade} className="client-upgrade-btn">
              <FaCrown className="me-2" /> Upgrade to Premium
            </Button>
          )}
          {effectivePlan === "basic" && (
            <>
              <Button variant="success" size="lg" onClick={handleUpgrade} className="client-upgrade-btn">
                <FaCrown className="me-2" /> Upgrade to Advanced
              </Button>
              <Button variant="outline-danger" onClick={() => setDowngradeModal(true)} className="client-downgrade-btn">
                Downgrade Plan
              </Button>
            </>
          )}
          {effectivePlan === "advanced" && (
            <Button variant="outline-danger" onClick={() => setDowngradeModal(true)} className="client-downgrade-btn">
              Downgrade Plan
            </Button>
          )}
        </div>

        {/* Collapsible Sections */}
        <div className="client-sections-container">
          <Collapse in={activeSection === "ai-coaching"}>
            <div className="client-section-content">
              <AICoaching />
            </div>
          </Collapse>
          <Collapse in={activeSection === "coach-programs"}>
            <div className="client-section-content">
              <CoachPrograms />
            </div>
          </Collapse>
          <Collapse in={activeSection === "add-ons"}>
            <div className="client-section-content">
              <AddOns
                addToCart={addToCart}
                ownedAddOns={normalizedAddOns || {}}
                showOwnedOnly={true}
                plan={effectivePlan}
              />
            </div>
          </Collapse>
          <Collapse in={activeSection === "nutrition-guide"}>
            <div className="client-section-content">
              <NutritionGuide />
            </div>
          </Collapse>
        </div>
      </Container>

      {/* Modals */}
      <Modal show={downgradeModal} onHide={() => setDowngradeModal(false)} centered className="client-modal">
        <Modal.Header closeButton className="client-modal-header">
          <Modal.Title>Confirm Downgrade</Modal.Title>
        </Modal.Header>
        <Modal.Body className="client-modal-body">
          {effectivePlan === "advanced" ? (
            <>You are currently on the <strong>Advanced Plan</strong>. Choose how you want to downgrade:</>
          ) : (
            <>Are you sure you want to downgrade to <strong>None</strong>? You will lose access to all premium features.</>
          )}
        </Modal.Body>
        <Modal.Footer className="client-modal-footer">
          <Button variant="secondary" onClick={() => setDowngradeModal(false)}>Cancel</Button>
          {effectivePlan === "advanced" ? (
            <>
              <Button variant="warning" onClick={() => handleDowngradePlan("basic")} disabled={downgrading}>
                {downgrading ? <Spinner animation="border" size="sm" /> : "Downgrade to Basic"}
              </Button>
              <Button variant="danger" onClick={() => handleDowngradePlan("none")} disabled={downgrading}>
                {downgrading ? <Spinner animation="border" size="sm" /> : "Downgrade to None"}
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => handleDowngradePlan("none")} disabled={downgrading}>
              {downgrading ? <Spinner animation="border" size="sm" /> : "Confirm Downgrade"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <Modal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} centered className="client-modal">
        <Modal.Header closeButton className="client-modal-header">
          <Modal.Title>Upgrade Required</Modal.Title>
        </Modal.Header>
        <Modal.Body className="client-modal-body">
          This feature is available with the <strong>Advanced Plan</strong>.
        </Modal.Body>
        <Modal.Footer className="client-modal-footer">
          <Button variant="secondary" onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleUpgrade}>Upgrade</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)} centered className="client-modal">
        <Modal.Header closeButton className="client-modal-header">
          <Modal.Title>Action Required</Modal.Title>
        </Modal.Header>
        <Modal.Body className="client-modal-body">{planModalBody()}</Modal.Body>
        <Modal.Footer className="client-modal-footer">
          <Button variant="primary" onClick={handleViewPlans}>Go to Cart</Button>
        </Modal.Footer>
      </Modal>

      <ProfileCompletedView />
    </section>
  );
};

export default Dashboard;