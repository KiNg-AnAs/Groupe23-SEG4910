import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Badge, Spinner, Card } from "react-bootstrap";
import { 
  FaShoppingCart, 
  FaCrown, 
  FaRocket, 
  FaCheckCircle,
  FaTrash,
  FaStar,
  FaBolt,
  FaTimes
} from "react-icons/fa";
import "./Cart.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const plans = [
  { 
    key: "basic", 
    title: "Basic Plan", 
    price: 29, 
    description: "AI Training + Tracking",
    icon: <FaRocket />
  },
  { 
    key: "advanced", 
    title: "Advanced Plan", 
    price: 39, 
    description: "Everything + Nutrition + E-Book",
    icon: <FaCrown />
  },
];

const availableAddOns = [
  { 
    key: "ebook", 
    title: "E-Book", 
    price: 29.99,
    icon: "📚"
  },
  { 
    key: "zoom", 
    title: "1-on-1 Zoom", 
    price: 49.99,
    icon: "🎥"
  },
  { 
    key: "ai", 
    title: "Custom AI Plan", 
    price: 99.99,
    icon: "🤖"
  },
];

const Cart = () => {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState({});
  const [userPlan, setUserPlan] = useState("none");
  const [userAddOns, setUserAddOns] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/user-detail/`);
        setUserPlan(res.subscription_plan || "none");
        setUserAddOns(res.add_ons || {});
      } catch (error) {
        console.error("Failed to load user details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [fetchWithAuth]);

  useEffect(() => {
    const storedPlan = localStorage.getItem("cart_plan");
    const storedAddOns = localStorage.getItem("cart_addons");
    if (storedPlan) setSelectedPlan(JSON.parse(storedPlan));
    if (storedAddOns) setSelectedAddOns(JSON.parse(storedAddOns));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart_plan", JSON.stringify(selectedPlan));
    localStorage.setItem("cart_addons", JSON.stringify(selectedAddOns));
  }, [selectedPlan, selectedAddOns]);

  const handleAddOnChange = (key, value) => {
    setSelectedAddOns((prev) => ({ ...prev, [key]: value }));
  };

  const handlePlanChange = (planKey) => {
    const chosen = plans.find((p) => p.key === planKey);
    // Toggle: if clicking the same plan, deselect it
    if (selectedPlan?.key === planKey) {
      setSelectedPlan(null);
    } else {
      setSelectedPlan(chosen);
    }
  };

  const removePlan = () => {
    setSelectedPlan(null);
  };

  const removeAddOn = (key) => {
    setSelectedAddOns((prev) => ({ ...prev, [key]: 0 }));
  };

  const calculateTotal = () => {
    const planPrice = selectedPlan ? selectedPlan.price : 0;
    const addOnsTotal = Object.entries(selectedAddOns).reduce((sum, [key, qty]) => {
      const addOn = availableAddOns.find((a) => a.key === key);
      return sum + (addOn ? addOn.price * qty : 0);
    }, 0);
    return (planPrice + addOnsTotal).toFixed(2);
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const updatedAddOns = {};
      for (const [key, qty] of Object.entries(selectedAddOns)) {
        if (qty > 0) updatedAddOns[key] = qty;
      }

      const totalAmount = calculateTotal();

      const data = await fetchWithAuth(`${API_URL}/create-checkout-session/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: totalAmount,
          plan: selectedPlan ? selectedPlan.key : "none",
          add_ons: updatedAddOns,
        }),
      });

      if (data.url) {
        localStorage.setItem("cart_in_progress", "true");
        window.location.href = data.url;
      } else {
        alert("Payment session could not be created. Please try again.");
        setProcessing(false);
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Something went wrong during checkout. Please try again.");
      setProcessing(false);
    }
  };

  const alreadyHasEbook = (userAddOns["ebook"] || 0) >= 1;
  const cartItemCount = () => {
    let count = selectedPlan ? 1 : 0;
    count += Object.values(selectedAddOns).reduce((sum, qty) => sum + qty, 0);
    return count;
  };

  const cartHasItems = selectedPlan || Object.values(selectedAddOns).some(qty => qty > 0);

  if (loading) {
    return (
      <section className="cart-wrapper">
        <div className="cart-loading">
          <Spinner animation="border" variant="light" />
          <p>Loading cart...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-wrapper">
      <Container className="cart-container">
        <Row className="g-4">
          {/* Left Side - Available Items */}
          <Col lg={7}>
            <div className="cart-section-card">
              <div className="cart-section-header">
                <h2 className="cart-section-title">
                  <FaShoppingCart className="me-2" />
                  Available Plans & Add-Ons
                </h2>
                <Badge bg="info" className="cart-current-badge">
                  Current: {userPlan === "none" ? "No Plan" : userPlan === "basic" ? "Basic" : "Advanced"}
                </Badge>
              </div>

              {/* Plans Section */}
              <div className="cart-items-section">
                <h4 className="cart-subsection-title">Membership Plans</h4>
                
                {userPlan === "none" && (
                  <div className="cart-plan-options">
                    {plans.map((plan) => (
                      <div
                        key={plan.key}
                        className={`cart-plan-option ${selectedPlan?.key === plan.key ? 'cart-selected' : ''}`}
                        onClick={() => handlePlanChange(plan.key)}
                      >
                        <div className="cart-plan-icon-circle">{plan.icon}</div>
                        <div className="cart-plan-info">
                          <h5>{plan.title}</h5>
                          <p>{plan.description}</p>
                        </div>
                        <div className="cart-plan-price-tag">
                          ${plan.price}<span>/mo</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {userPlan === "basic" && (
                  <div className="cart-plan-options">
                    <div
                      className={`cart-plan-option cart-upgrade-option ${selectedPlan?.key === 'advanced' ? 'cart-selected' : ''}`}
                      onClick={() => handlePlanChange("advanced")}
                    >
                      <Badge bg="success" className="cart-upgrade-label">Upgrade</Badge>
                      <div className="cart-plan-icon-circle"><FaCrown /></div>
                      <div className="cart-plan-info">
                        <h5>Advanced Plan</h5>
                        <p>Unlock all premium features</p>
                      </div>
                      <div className="cart-plan-price-tag">
                        ${plans[1].price}<span>/mo</span>
                      </div>
                    </div>
                  </div>
                )}

                {userPlan === "advanced" && (
                  <div className="cart-plan-maxed-state">
                    <FaCrown className="cart-maxed-icon" />
                    <p>You have the Advanced Plan - all features unlocked!</p>
                  </div>
                )}
              </div>

              {/* Add-Ons Section */}
              <div className="cart-items-section mt-4">
                <h4 className="cart-subsection-title">Premium Add-Ons</h4>
                
                <div className="cart-addon-options">
                  {availableAddOns.map((addon) => {
                    const disabled = addon.key === "ebook" && alreadyHasEbook;
                    const qty = selectedAddOns[addon.key] || 0;

                    return (
                      <div key={addon.key} className={`cart-addon-option ${disabled ? 'cart-disabled' : ''}`}>
                        <div className="cart-addon-left">
                          <span className="cart-addon-emoji">{addon.icon}</span>
                          <div className="cart-addon-info">
                            <h6>{addon.title}</h6>
                            <span className="cart-addon-price-small">${addon.price}</span>
                          </div>
                        </div>
                        
                        {disabled ? (
                          <Badge bg="secondary">Owned</Badge>
                        ) : (
                          <div className="cart-qty-controls">
                            <Button
                              size="sm"
                              variant="outline-light"
                              onClick={() => handleAddOnChange(addon.key, Math.max(0, qty - 1))}
                              disabled={qty === 0}
                            >
                              -
                            </Button>
                            <span className="cart-qty-display">{qty}</span>
                            <Button
                              size="sm"
                              variant="outline-light"
                              onClick={() => {
                                const max = addon.key === "ebook" ? 1 : 1;
                                handleAddOnChange(addon.key, Math.min(qty + 1, max));
                              }}
                            >
                              +
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Col>

          {/* Right Side - Cart Summary */}
          <Col lg={5}>
            <div className="cart-summary-card">
              <div className="cart-summary-header">
                <h3 className="cart-summary-title">Order Summary</h3>
                <Badge bg="warning" className="cart-items-count">
                  {cartItemCount()} {cartItemCount() === 1 ? 'item' : 'items'}
                </Badge>
              </div>

              <div className="cart-summary-body">
                {!cartHasItems ? (
                  <div className="cart-empty-state">
                    <FaShoppingCart className="cart-empty-icon" />
                    <p>Your cart is empty</p>
                    <small>Select a plan or add-ons to continue</small>
                  </div>
                ) : (
                  <>
                    <div className="cart-summary-items">
                      {selectedPlan && (
                        <div className="cart-summary-item">
                          <div className="cart-item-details">
                            <div className="cart-item-icon">
                              {selectedPlan.key === 'basic' ? <FaRocket /> : <FaCrown />}
                            </div>
                            <div className="cart-item-text">
                              <span className="cart-item-name">{selectedPlan.title}</span>
                              <span className="cart-item-period">/month</span>
                            </div>
                          </div>
                          <div className="cart-item-right">
                            <span className="cart-item-price">${selectedPlan.price}</span>
                            <Button
                              size="sm"
                              variant="link"
                              className="cart-remove-btn"
                              onClick={removePlan}
                            >
                              <FaTimes />
                            </Button>
                          </div>
                        </div>
                      )}

                      {Object.entries(selectedAddOns)
                        .filter(([_, qty]) => qty > 0)
                        .map(([key, qty]) => {
                          const addon = availableAddOns.find((a) => a.key === key);
                          return (
                            <div key={key} className="cart-summary-item">
                              <div className="cart-item-details">
                                <div className="cart-item-icon-emoji">{addon.icon}</div>
                                <div className="cart-item-text">
                                  <span className="cart-item-name">{addon.title}</span>
                                  <span className="cart-item-qty">× {qty}</span>
                                </div>
                              </div>
                              <div className="cart-item-right">
                                <span className="cart-item-price">${(addon.price * qty).toFixed(2)}</span>
                                <Button
                                  size="sm"
                                  variant="link"
                                  className="cart-remove-btn"
                                  onClick={() => removeAddOn(key)}
                                >
                                  <FaTimes />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="cart-summary-divider"></div>

                    <div className="cart-summary-total">
                      <span className="cart-total-label">Total</span>
                      <span className="cart-total-amount">${calculateTotal()}</span>
                    </div>

                    <Button
                      className="cart-checkout-btn"
                      onClick={handleCheckout}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FaBolt className="me-2" />
                          Checkout Now
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>


          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Cart;