import React, { useState, useEffect } from "react";
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
} from "react-bootstrap";
import { useAuth } from "../../../../context/AuthContext";
import CoachPrograms from "../CoachPrograms/CoachPrograms";
import AddOns from "../../../Shared/AddOns/AddOns";
import AICoaching from "../AICoaching/AICoaching";
import NutritionGuide from "../NutritionGuide/NutritionGuide";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

const Dashboard = ({ userData, addToCart }) => {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const userName = user?.name?.split(" ")[0] || "User";
  const plan = userData?.plan; // "basic", "advanced", or "none"

  const [activeSection, setActiveSection] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [lockedSection, setLockedSection] = useState("");

  // ✅ User row data for database read/write test
  const [userInfo, setUserInfo] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [downgradeModal, setDowngradeModal] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ Fetch user row from DB when dashboard loads
  useEffect(() => {
    const fetchUserRow = async () => {
      try {
        const data = await fetchWithAuth("http://localhost:8000/user-detail/");
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

  // ✅ Save username (PATCH request to DB)
  const handleSaveUsername = async () => {
    setSaving(true);
    setError("");
    try {
      await fetchWithAuth("http://localhost:8000/user-detail/", {
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

    // ✅ Downgrade plan
    const handleDowngradePlan = async () => {
      setDowngrading(true);
      setError("");
      try {
        await fetchWithAuth("http://localhost:8000/user-detail/", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription_plan: "none" }),
        });
        setSuccessMessage("Your plan has been downgraded successfully.");
        setUserInfo((prev) => ({ ...prev, subscription_plan: "none" }));
        setDowngradeModal(false);
      } catch (err) {
        console.error("Failed to downgrade plan:", err);
        setError("Failed to downgrade plan. Please try again.");
      } finally {
        setDowngrading(false);
      }
    };

  // ✅ Plan display helper
  const getPlanDisplay = () => {
    if (plan === "basic") return "Your plan is: Basic";
    if (plan === "advanced") return "Your plan is: Advanced";
    return "You don't have a plan yet.";
  };

  const toggleSection = (section, requiredPlan) => {
    if (!plan || plan === "none") {
      setLockedSection(section);
      setShowPlanModal(true);
    } else if (requiredPlan === "advanced" && plan !== "advanced") {
      setLockedSection(section);
      setShowUpgradeModal(true);
    } else {
      setActiveSection((prevSection) =>
        prevSection === section ? null : section
      );
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

  return (
    <section className="dashboard-container-section">
      <Container className="dashboard-container">
        <h2 className="dashboard-title">Welcome, {userName}!</h2>
        <h5 className="dashboard-subtitle text-muted mb-4">
          {getPlanDisplay()}
        </h5>

        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage("")} dismissible>
            {successMessage}
          </Alert>
        )}
        {error && <Alert variant="danger">{error}</Alert>}

        {/* ✅ Downgrade Plan Button */}
                {(plan === "basic" || plan === "advanced") && (
          <div className="mb-4">
            <Button
              variant="outline-danger"
              onClick={() => setDowngradeModal(true)}
            >
              Downgrade Plan
            </Button>
          </div>
        )}

        <p className="dashboard-intro">
          Choose an option below to start your personalized fitness journey.
        </p>

        <Row className="dashboard-options">
          {/* AI Coaching */}
          <Col md={4}>
            <Card className="dashboard-card">
              <Card.Body>
                <h4>AI-Powered Coaching</h4>
                <p>Get a personalized AI-generated plan for weight loss & muscle gain.</p>
                <Button
                  variant="primary"
                  onClick={() => toggleSection("ai-coaching", "basic")}
                  aria-expanded={activeSection === "ai-coaching"}
                >
                  {activeSection === "ai-coaching"
                    ? "Hide AI Coaching"
                    : "Start AI Coaching"}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Coach Programs */}
          <Col md={4}>
            <Card className="dashboard-card">
              <Card.Body>
                <h4>Coach Programs</h4>
                <p>Access structured training programs designed by Coach Rayane.</p>
                <Button
                  variant="success"
                  onClick={() => toggleSection("coach-programs", "basic")}
                  aria-expanded={activeSection === "coach-programs"}
                >
                  {activeSection === "coach-programs"
                    ? "Hide Programs"
                    : "Browse Programs"}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Add-Ons */}
          <Col md={4}>
            <Card className="dashboard-card">
              <Card.Body>
                <h4>Premium Add-Ons</h4>
                <p>Upgrade your training with 1-on-1 coaching, ebooks, and more.</p>
                <Button
                  variant="warning"
                  onClick={() => toggleSection("add-ons", "advanced")}
                  aria-expanded={activeSection === "add-ons"}
                >
                  {activeSection === "add-ons" ? "Hide Add-Ons" : "Explore Add-Ons"}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Nutrition Guide */}
          <Col md={4}>
            <Card className="dashboard-card">
              <Card.Body>
                <h4>Basic Nutrition Guide</h4>
                <p>Get expert nutrition advice to enhance your fitness goals.</p>
                <Button
                  variant="info"
                  onClick={() => toggleSection("nutrition-guide", "advanced")}
                  aria-expanded={activeSection === "nutrition-guide"}
                >
                  {activeSection === "nutrition-guide" ? "Hide Guide" : "View Nutrition Guide"}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Collapsible Sections */}
        <Collapse in={activeSection === "ai-coaching"}><div id="ai-coaching"><AICoaching /></div></Collapse>
        <Collapse in={activeSection === "coach-programs"}><div id="coach-programs"><CoachPrograms /></div></Collapse>
        <Collapse in={activeSection === "add-ons"}><div id="add-ons"><AddOns addToCart={addToCart} /></div></Collapse>
        <Collapse in={activeSection === "nutrition-guide"}><div id="nutrition-guide"><NutritionGuide /></div></Collapse>

        {/* Editable Database Row */}
        <Card className="mt-5">
          <Card.Body>
            <h4>Your Database Row</h4>

            {loading && <Spinner animation="border" />}
            {error && <Alert variant="danger">{error}</Alert>}

            {userInfo && (
              <>
                <p><strong>Email:</strong> {userInfo.email}</p>
                <p><strong>Subscription:</strong> {userInfo.subscription_plan}</p>

                <Form.Group controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  className="mt-3"
                  onClick={handleSaveUsername}
                  disabled={saving}
                >
                  {saving ? <Spinner animation="border" size="sm" /> : "Save Changes"}
                </Button>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* ✅ Downgrade Confirmation Modal */}
      <Modal show={downgradeModal} onHide={() => setDowngradeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Downgrade</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to downgrade your plan? You will lose access to all premium features.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDowngradeModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDowngradePlan} disabled={downgrading}>
            {downgrading ? <Spinner animation="border" size="sm" /> : "Confirm Downgrade"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modals */}
      <Modal show={showUpgradeModal} onHide={() => setShowUpgradeModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Upgrade Required</Modal.Title></Modal.Header>
        <Modal.Body>This feature is available with the <strong>Advanced Plan</strong>.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpgradeModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleUpgrade}>Upgrade</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Plan Required</Modal.Title></Modal.Header>
        <Modal.Body>Please select a plan to unlock this feature.</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleViewPlans}>Go to Cart</Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
};

export default Dashboard;
