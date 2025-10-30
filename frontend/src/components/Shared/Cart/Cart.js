import React, { useState, useEffect } from "react";
import { Container, Form, Button } from "react-bootstrap";
import "./Cart.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const plans = [
  { key: "basic", title: "Basic Plan", price: 29, description: "AI-Generated Training Plans + Workout Tracking" },
  { key: "advanced", title: "Advanced Plan", price: 39, description: "Everything in Basic + Nutrition Plan + E-Book + Custom Coaching" },
];

const availableAddOns = [
  { key: "ebook", title: "E-Book", price: 29.99 },
  { key: "zoom", title: "1-on-1 Zoom Consultation", price: 49.99 },
  { key: "ai", title: "Coach Custom AI Training Plan", price: 99.99 },
];

const Cart = () => {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState({});
  const [userPlan, setUserPlan] = useState("none");
  const [userAddOns, setUserAddOns] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ Fetch current user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await fetchWithAuth("http://localhost:8000/user-detail/");
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

  // Load from localStorage (if user previously had items in cart)
  useEffect(() => {
    const storedPlan = localStorage.getItem("cart_plan");
    const storedAddOns = localStorage.getItem("cart_addons");
    if (storedPlan) setSelectedPlan(JSON.parse(storedPlan));
    if (storedAddOns) setSelectedAddOns(JSON.parse(storedAddOns));
  }, []);

  // Save cart state to localStorage
  useEffect(() => {
    localStorage.setItem("cart_plan", JSON.stringify(selectedPlan));
    localStorage.setItem("cart_addons", JSON.stringify(selectedAddOns));
  }, [selectedPlan, selectedAddOns]);

  const handleAddOnChange = (key, value) => {
    setSelectedAddOns((prev) => ({ ...prev, [key]: value }));
  };

  const handlePlanChange = (planKey) => {
    if (planKey === "none") {
      setSelectedPlan(null);
    } else {
      const chosen = plans.find((p) => p.key === planKey);
      setSelectedPlan(chosen);
    }
  };

  const calculateTotal = () => {
    const planPrice = selectedPlan ? selectedPlan.price : 0;
    const addOnsTotal = Object.entries(selectedAddOns).reduce((sum, [key, qty]) => {
      const addOn = availableAddOns.find((a) => a.key === key);
      return sum + (addOn ? addOn.price * qty : 0);
    }, 0);
    return (planPrice + addOnsTotal).toFixed(2);
  };

  // ✅ Stripe checkout
  const handleCheckout = async () => {
    try {
      const updatedAddOns = {};
      for (const [key, qty] of Object.entries(selectedAddOns)) {
        if (qty > 0) updatedAddOns[key] = qty;
      }

      const totalAmount = calculateTotal();

      const data = await fetchWithAuth("http://localhost:8000/create-checkout-session/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: totalAmount,
          plan: selectedPlan ? selectedPlan.key : "none",
          add_ons: updatedAddOns,
        }),
      });

      if (data.url) {
        // Store cart before redirecting
        localStorage.setItem("cart_in_progress", "true");
        window.location.href = data.url;
      } else {
        alert("Payment session could not be created. Please try again.");
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Something went wrong during checkout. Please try again.");
    }
  };

  const alreadyHasEbook = (userAddOns["ebook"] || 0) >= 1;
  const getPlanLabel = (planKey) => {
    const plan = plans.find((p) => p.key === planKey);
    return plan ? plan.title : "None";
  };

  if (loading) {
    return (
      <div className="cart-section">
        <div className="cart-section-container">
          <h3 className="text-center">Loading your cart...</h3>
        </div>
      </div>
    );
  }

  return (
    <section className="cart-section">
      <div className="cart-section-container">
        <h2 className="section-title">🛒 Your Cart</h2>

        <div className="current-plan-display mb-3">
          <strong>Current Plan:</strong> {getPlanLabel(userPlan)}
        </div>

        {/* Step 1: Plan Selection */}
        <div className="step-header" data-step="①">
          Choose Your Plan
        </div>
        <div className="plan-card">
          <Form>
            {userPlan === "none" && (
              <>
                {plans.map((plan) => (
                  <Form.Check
                    key={plan.key}
                    type="radio"
                    label={`${plan.title} - $${plan.price}/month`}
                    name="plan"
                    id={plan.key}
                    checked={selectedPlan?.key === plan.key}
                    onChange={() => handlePlanChange(plan.key)}
                  />
                ))}
                <Form.Check
                  type="radio"
                  label="None (just buy add-ons)"
                  name="plan"
                  id="none"
                  checked={!selectedPlan}
                  onChange={() => handlePlanChange("none")}
                />
              </>
            )}

            {userPlan === "basic" && (
              <>
                <div className="text-success mb-2">You are already a Basic user.</div>
                <Form.Check
                  type="radio"
                  label={`Upgrade to Advanced Plan - $${plans[1].price}/month`}
                  name="plan"
                  id="advanced"
                  checked={selectedPlan?.key === "advanced"}
                  onChange={() => handlePlanChange("advanced")}
                />
              </>
            )}

            {userPlan === "advanced" && (
              <div className="text-success">You are already an Advanced user.</div>
            )}
          </Form>
        </div>

        {/* Step 2: Add-ons */}
        <div className="step-header" data-step="②">
          Add-Ons
        </div>
        <div className="plan-card">
          {availableAddOns.map((addOn) => {
            const disabled = addOn.key === "ebook" && alreadyHasEbook;
            return (
              <div className="addon-item" key={addOn.key}>
                <div className="addon-name">
                  {addOn.title} - <span className="addon-price">${addOn.price}</span>
                </div>
                <Form.Control
                  type="number"
                  min="0"
                  max={addOn.key === "ebook" ? 1 : 5}
                  disabled={disabled}
                  value={selectedAddOns[addOn.key] || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (addOn.key === "ebook" && value > 1) return;
                    handleAddOnChange(addOn.key, value);
                  }}
                  className="addon-quantity"
                />
                {disabled && <div className="addon-note text-warning">Already purchased</div>}
              </div>
            );
          })}
        </div>

        {/* Step 3: Summary */}
        <div className="step-header" data-step="③">
          Summary
        </div>
        <div className="summary-card">
          {selectedPlan ? (
            <p>
              <strong>Plan:</strong> {selectedPlan.title} - ${selectedPlan.price}/month
            </p>
          ) : (
            <p>
              <strong>Plan:</strong> None
            </p>
          )}

          {Object.entries(selectedAddOns)
            .filter(([_, qty]) => qty > 0)
            .map(([key, qty]) => {
              const addOn = availableAddOns.find((a) => a.key === key);
              return (
                <p key={key}>
                  <strong>{addOn.title}</strong> × {qty} = ${(addOn.price * qty).toFixed(2)}
                </p>
              );
            })}

          <div className="summary-total">Total: ${calculateTotal()}</div>

          <Button
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={!selectedPlan && Object.values(selectedAddOns).every((qty) => qty === 0)}
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Cart;
