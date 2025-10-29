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
import { useAuth } from "../../../../context/AuthContext";
import CoachPrograms from "../CoachPrograms/CoachPrograms";
import AddOns from "../../../Shared/AddOns/AddOns";
import AICoaching from "../AICoaching/AICoaching";
import NutritionGuide from "../NutritionGuide/NutritionGuide";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

/**
 * NOTE TO FUTURE-US:
 * - We intentionally keep this file structure the same as the user's original, just adding:
 *   1) A big title showing current plan & add-ons.
 *   2) Auto-fetch of plan/add-ons from /user-detail/ (we were already calling it).
 *   3) Access gating logic:
 *      - plan=none: everything locked; allow Premium Add-Ons only if the user already owns at least one add-on.
 *      - plan=basic: AI + Coach Programs allowed; Nutrition/Add-Ons only if purchased; otherwise prompt upgrade/cart.
 *      - plan=advanced: everything allowed.
 * - When we split this later, we can move helpers and locked-card overlays out.
 */

const Dashboard = ({ userData, addToCart }) => {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const userName = user?.name?.split(" ")[0] || "User";

  // ---------------------------------------------------------------------------
  // State (kept as-is from your original, plus a few derived helpers)
  // ---------------------------------------------------------------------------
  const [activeSection, setActiveSection] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [lockedSection, setLockedSection] = useState("");

  // User DB row & edit state
  const [userInfo, setUserInfo] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [downgradeModal, setDowngradeModal] = useState(false);
  const [downgrading, setDowngrading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ---------------------------------------------------------------------------
  // Fetch: /user-detail/
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Normalized "effective" plan and add-ons
  // - Back-end returns: subscription_plan (string) and addons (list of records)
  // - We also accept the prop userData?.plan to preserve previous behavior.
  // ---------------------------------------------------------------------------
  const effectivePlan = useMemo(() => {
    // Prefer server truth; fall back to prop (none/basic/advanced)
    const fromServer = userInfo?.subscription_plan;
    const fromProp = userData?.plan;
    return (fromServer || fromProp || "none").toLowerCase();
  }, [userInfo?.subscription_plan, userData?.plan]);

  const normalizedAddOns = useMemo(() => {
    /**
     * We aggregate active add-ons by type into a dictionary, e.g.:
     *   { ebook: 1, ai: 2, zoom: 0 }
     * Using only status === "active".
     */
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

  // ---------------------------------------------------------------------------
  // Save username (unchanged logic)
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Downgrade plan (unchanged semantics)
  // ---------------------------------------------------------------------------
  const handleDowngradePlan = async (targetPlan = "none") => {
    setDowngrading(true);
    setError("");
    try {
      await fetchWithAuth("http://localhost:8000/user-detail/", {
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
  
  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------
  const getPlanDisplay = () => {
    if (effectivePlan === "basic") return "Your plan is: Basic";
    if (effectivePlan === "advanced") return "Your plan is: Advanced";
    return "You don't have a plan yet.";
  };

  // Big banner subtitle with add-on chips (new)
  const renderPlanBanner = () => {
    const chips = [];
    if (normalizedAddOns.ebook > 0) chips.push(<Badge key="ebook" bg="secondary" className="ms-2">E-Book × {normalizedAddOns.ebook}</Badge>);
    if (normalizedAddOns.ai > 0) chips.push(<Badge key="ai" bg="secondary" className="ms-2">AI Plan × {normalizedAddOns.ai}</Badge>);
    if (normalizedAddOns.zoom > 0) chips.push(<Badge key="zoom" bg="secondary" className="ms-2">Zoom × {normalizedAddOns.zoom}</Badge>);

    return (
      <div className="mb-3">
        <h1 className="display-6 fw-semibold" style={{ marginBottom: 8 }}>
          {effectivePlan === "none" ? "No Plan" : effectivePlan === "basic" ? "Basic Plan" : "Advanced Plan"}
        </h1>
        <div className="plan-banner">
          {chips.length > 0 ? <>Active Add-Ons: {chips}</> : <>No add-ons yet.</>}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Access policy (new): section-level authorization
  // Rules you requested:
  // - plan = none:
  //    * lock all sections
  //    * allow Premium Add-Ons ONLY if the user already owns at least 1 add-on
  // - plan = basic:
  //    * allow AI + Coach programs
  //    * for Nutrition Guide & Add-Ons section -> require purchase (i.e., must own at least 1 relevant add-on)
  // - plan = advanced:
  //    * allow everything
  //
  // Mapping decisions:
  //  - "ai-coaching"     -> requires basic OR advanced
  //  - "coach-programs"  -> requires basic OR advanced
  //  - "nutrition-guide" -> advanced
  //  - "add-ons"         -> advanced OR (owns any add-on: ebook/ai/zoom)
  // ---------------------------------------------------------------------------
  const ownsAnyAddon = normalizedAddOns.ebook > 0 || normalizedAddOns.ai > 0 || normalizedAddOns.zoom > 0;

  const canAccess = (section) => {
    if (effectivePlan === "advanced") return true;

    if (effectivePlan === "basic") {
      if (section === "ai-coaching") return true;
      if (section === "coach-programs") return true;
      if (section === "nutrition-guide") return false;
      if (section === "add-ons") return ownsAnyAddon; // can open only if user owns add-ons
      return false;
    }

    // plan = none
    if (section === "add-ons") return ownsAnyAddon; // only if owns any add-on already
    return false;
  };

  const whyLocked = (section) => {
    // Returns "none" (needs plan), "upgrade" (needs advanced), or "purchase" (needs relevant add-on)
    if (effectivePlan === "advanced") return null;

    if (effectivePlan === "basic") {
      if (section === "nutrition-guide") {
        return normalizedAddOns.ebook > 0 ? null : "purchase";
      }
      if (section === "add-ons") {
        return ownsAnyAddon ? null : "purchase";
      }
      return null; // ai/coaching allowed
    }

    // plan = none
    if (section === "add-ons") {
      return ownsAnyAddon ? null : "none";
    }
    return "none";
  };

  // ---------------------------------------------------------------------------
  // Section toggle (changed to call canAccess/whyLocked)
  // ---------------------------------------------------------------------------
  const toggleSection = (section /*, requiredPlan was removed intentionally */) => {
    if (canAccess(section)) {
      setActiveSection((prev) => (prev === section ? null : section));
      return;
    }
    setLockedSection(section);
    const reason = whyLocked(section);
    if (reason === "upgrade") {
      setShowUpgradeModal(true);
    } else if (reason === "purchase") {
      // Send to cart to purchase the needed add-on OR allow message
      setShowPlanModal(true); // reuse plan modal text; we’ll adjust wording below when rendered
    } else {
      // reason === "none" or fallback
      setShowPlanModal(true);
    }
  };

  // ---------------------------------------------------------------------------
  // CTA handlers (unchanged)
  // ---------------------------------------------------------------------------
  const handleUpgrade = () => {
    addToCart("plan", "advanced");
    navigate("/cart");
    setShowUpgradeModal(false);
  };

  const handleViewPlans = () => {
    navigate("/cart");
    setShowPlanModal(false);
  };

  // ---------------------------------------------------------------------------
  // Small helper to show context-aware modal body text (for "plan required" modal)
  // ---------------------------------------------------------------------------
  const planModalBody = () => {
    const reason = whyLocked(lockedSection);
    if (effectivePlan === "basic" && reason === "purchase") {
      // e.g., Nutrition needs ebook; Add-Ons section needs any add-on owned
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

    // Fallback (shouldn’t normally hit)
    return <>Please select/upgrade your plan to unlock this feature.</>;
  };

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <section className="dashboard-container-section">
      <Container className="dashboard-container">
        {/* Big greeting */}
        <h2 className="dashboard-title">Welcome, {userName}!</h2>

        {/* NEW: Big plan banner with add-on chips */}
        {renderPlanBanner()}

        {successMessage && (
          <Alert
            variant="success"
            onClose={() => setSuccessMessage("")}
            dismissible
          >
            {successMessage}
          </Alert>
        )}
        {error && <Alert variant="danger">{error}</Alert>}

        <p className="dashboard-intro">
          Choose an option below to start your personalized fitness journey.
        </p>

        <Row className="dashboard-options">
          {/* AI Coaching */}
          <Col md={4}>
            <Card className="dashboard-card">
              <Card.Body>
                <h4>AI-Powered Coaching</h4>
                <p>
                  Get a personalized AI-generated plan for weight loss & muscle
                  gain.
                </p>
                <Button
                  variant="primary"
                  onClick={() => toggleSection("ai-coaching")}
                  aria-expanded={activeSection === "ai-coaching"}
                  disabled={!canAccess("ai-coaching")}
                >
                  {activeSection === "ai-coaching"
                    ? "Hide AI Coaching"
                    : canAccess("ai-coaching")
                    ? "Start AI Coaching"
                    : "Locked"}
                </Button>
                {!canAccess("ai-coaching") && (
                  <div className="locked-text">
                    Requires <strong>Basic</strong> or <strong>Advanced</strong>{" "}
                    plan.
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Coach Programs */}
          <Col md={4}>
            <Card className="dashboard-card">
              <Card.Body>
                <h4>Coach Programs</h4>
                <p>
                  Access structured training programs designed by Coach Rayane.
                </p>
                <Button
                  variant="success"
                  onClick={() => toggleSection("coach-programs")}
                  aria-expanded={activeSection === "coach-programs"}
                  disabled={!canAccess("coach-programs")}
                >
                  {activeSection === "coach-programs"
                    ? "Hide Programs"
                    : canAccess("coach-programs")
                    ? "Browse Programs"
                    : "Locked"}
                </Button>
                {!canAccess("coach-programs") && (
                  <div className="locked-text">
                    Requires <strong>Basic</strong> or <strong>Advanced</strong>{" "}
                    plan.
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Premium Add-Ons */}
          <Col md={4}>
            <Card className="dashboard-card">
              <Card.Body>
                <h4>Premium Add-Ons</h4>
                <p>Upgrade your training with 1-on-1 coaching, E-Book, and more.</p>
                <Button
                  variant="warning"
                  onClick={() => toggleSection("add-ons")}
                  aria-expanded={activeSection === "add-ons"}
                  disabled={!canAccess("add-ons")}
                >
                  {activeSection === "add-ons"
                    ? "Hide Add-Ons"
                    : canAccess("add-ons")
                    ? "Explore Add-Ons"
                    : "Locked"}
                </Button>
                {!canAccess("add-ons") && (
                  <div className="locked-text">
                    {effectivePlan === "advanced" ? null : effectivePlan === "basic" ? (
                      <>Visible here when you own an add-on (Zoom/AI/E-Book).</>
                    ) : (
                      <>Requires a plan & purchase from Cart.</>
                    )}
                  </div>
                )}
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
                  onClick={() => toggleSection("nutrition-guide")}
                  aria-expanded={activeSection === "nutrition-guide"}
                  disabled={!canAccess("nutrition-guide")}
                >
                  {activeSection === "nutrition-guide"
                    ? "Hide Guide"
                    : canAccess("nutrition-guide")
                    ? "View Nutrition Guide"
                    : "Locked"}
                </Button>
                {!canAccess("nutrition-guide") && (
                  <div className="locked-text">
                    {effectivePlan === "basic" ? (
                      <>
                        Requires <strong>E-Book</strong> add-on or{" "}
                        <strong>Advanced</strong> plan.
                      </>
                    ) : (
                      <>Requires <strong>Advanced</strong> plan.</>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Collapsible Sections (unchanged children) */}
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
          <AddOns
            addToCart={addToCart}
            ownedAddOns={normalizedAddOns || {}}
            showOwnedOnly={true}
            plan={effectivePlan}
          />
          </div>
        </Collapse>

        <Collapse in={activeSection === "nutrition-guide"}>
          <div id="nutrition-guide">
            <NutritionGuide />
          </div>
        </Collapse>

      {/* Plan Management Buttons */}
      {/* ✅ Upgrade button for users with No Plan */}
      {(!effectivePlan || effectivePlan === "none") && (
        <div className="mb-4">
          <Button variant="success" onClick={handleUpgrade}>
            Upgrade to Basic or Advanced
          </Button>
        </div>
      )}

      {effectivePlan === "basic" && (
        <div
          className="mb-4 d-flex justify-content-center align-items-center gap-3"
          style={{ marginTop: "1rem" }}
        >
          <Button variant="success" onClick={handleUpgrade}>
            Upgrade to Advanced
          </Button>
          <Button
            variant="outline-danger"
            onClick={() => setDowngradeModal(true)}
          >
            Downgrade to None
          </Button>
        </div>
      )}

      {effectivePlan === "advanced" && (
        <div className="mb-4">
          <Button
            variant="outline-danger"
            onClick={() => setDowngradeModal(true)}
          >
            Downgrade Plan
          </Button>
        </div>
      )}



        {/* Editable Database Row (unchanged) Testing
        <Card className="mt-5">
          <Card.Body>
            <h4>Your Database Row</h4>

            {loading && <Spinner animation="border" />}
            {error && <Alert variant="danger">{error}</Alert>}

            {userInfo && (
              <>
                <p>
                  <strong>Email:</strong> {userInfo.email}
                </p>
                <p>
                  <strong>Subscription:</strong>{" "}
                  {userInfo.subscription_plan || "none"}
                </p>

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
                  {saving ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </>
            )}
          </Card.Body>
        </Card>*/}
      </Container>

      {/* Downgrade Confirmation Modal (unchanged) */}
      <Modal show={downgradeModal} onHide={() => setDowngradeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Downgrade</Modal.Title>
        </Modal.Header>

        {effectivePlan === "advanced" ? (
          <Modal.Body>
            You are currently on the <strong>Advanced Plan</strong>.  
            Choose how you want to downgrade:
          </Modal.Body>
        ) : (
          <Modal.Body>
            Are you sure you want to downgrade to <strong>None</strong>?  
            You will lose access to all premium features.
          </Modal.Body>
        )}

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDowngradeModal(false)}>
            Cancel
          </Button>

          {effectivePlan === "advanced" ? (
            <>
              <Button
                variant="warning"
                onClick={() => handleDowngradePlan("basic")}
                disabled={downgrading}
              >
                {downgrading ? <Spinner animation="border" size="sm" /> : "Downgrade to Basic"}
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDowngradePlan("none")}
                disabled={downgrading}
              >
                {downgrading ? <Spinner animation="border" size="sm" /> : "Downgrade to None"}
              </Button>
            </>
          ) : (
            <Button
              variant="danger"
              onClick={() => handleDowngradePlan("none")}
              disabled={downgrading}
            >
              {downgrading ? <Spinner animation="border" size="sm" /> : "Confirm Downgrade"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>


      {/* Upgrade Modal*/}
      <Modal
        show={showUpgradeModal}
        onHide={() => setShowUpgradeModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Upgrade Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          This feature is available with the <strong>Advanced Plan</strong>.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowUpgradeModal(false)}
          >
            Cancel
          </Button>
          <Button variant="success" onClick={handleUpgrade}>
            Upgrade
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Plan/Cart Modal (context-aware body) */}
      <Modal
        show={showPlanModal}
        onHide={() => setShowPlanModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Action Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>{planModalBody()}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleViewPlans}>
            Go to Cart
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
};

export default Dashboard;
