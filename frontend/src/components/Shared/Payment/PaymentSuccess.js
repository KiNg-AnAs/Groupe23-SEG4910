import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { 
  FaCheckCircle, 
  FaTrophy, 
  FaCrown,
  FaRocket,
  FaArrowRight 
} from "react-icons/fa";
import "./PaymentSuccess.css"; 

const PaymentSuccess = () => {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const refreshUserData = async () => {
      try {
        const res = await fetchWithAuth("http://localhost:8000/user-detail/");
        console.log("Updated user data after payment:", res);
        setUserData(res);
        
        // Clear local cart data
        localStorage.removeItem("cart_plan");
        localStorage.removeItem("cart_addons");
        localStorage.removeItem("cart_in_progress");
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      }
    };
    refreshUserData();
  }, [fetchWithAuth]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoNow = () => {
    navigate("/dashboard");
  };

  return (
    <div className="payment-success-wrapper">
      <div className="payment-success-container">
        {/* Success Animation */}
        <div className="payment-success-icon-wrapper">
          <div className="payment-success-circle payment-circle-1"></div>
          <div className="payment-success-circle payment-circle-2"></div>
          <div className="payment-success-circle payment-circle-3"></div>
          <FaCheckCircle className="payment-success-icon" />
        </div>

        {/* Success Message */}
        <h1 className="payment-success-title">
          Payment Successful!
        </h1>
        <p className="payment-success-subtitle">
          Your account has been upgraded successfully
        </p>

        {/* Features Unlocked */}
        {userData && (
          <div className="payment-features-unlocked">
            <h3 className="payment-features-title">
              <FaTrophy className="me-2" />
              What's Now Available:
            </h3>
            <div className="payment-features-grid">
              {userData.subscription_plan === "basic" && (
                <>
                  <div className="payment-feature-card">
                    <FaRocket className="payment-feature-icon" />
                    <span>AI Training Plans</span>
                  </div>
                  <div className="payment-feature-card">
                    <FaCheckCircle className="payment-feature-icon" />
                    <span>Workout Tracking</span>
                  </div>
                  <div className="payment-feature-card">
                    <FaCheckCircle className="payment-feature-icon" />
                    <span>Coach Programs</span>
                  </div>
                </>
              )}
              {userData.subscription_plan === "advanced" && (
                <>
                  <div className="payment-feature-card">
                    <FaCrown className="payment-feature-icon payment-icon-gold" />
                    <span>All Basic Features</span>
                  </div>
                  <div className="payment-feature-card">
                    <FaCrown className="payment-feature-icon payment-icon-gold" />
                    <span>Nutrition Planning</span>
                  </div>
                  <div className="payment-feature-card">
                    <FaCrown className="payment-feature-icon payment-icon-gold" />
                    <span>E-Book Access</span>
                  </div>
                  <div className="payment-feature-card">
                    <FaCrown className="payment-feature-icon payment-icon-gold" />
                    <span>Custom Coaching</span>
                  </div>
                </>
              )}
              {userData.addons && userData.addons.length > 0 && (
                userData.addons.map((addon, idx) => (
                  <div key={idx} className="payment-feature-card">
                    <FaCheckCircle className="payment-feature-icon" />
                    <span>{addon.addon_type} Add-on</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Redirect Info */}
        <div className="payment-redirect-box">
          <p className="payment-redirect-text">
            Redirecting to your dashboard in <span className="payment-countdown">{countdown}s</span>
          </p>
          <button className="payment-go-now-btn" onClick={handleGoNow}>
            Go to Dashboard Now
            <FaArrowRight className="ms-2" />
          </button>
        </div>

        {/* Celebration Confetti Background */}
        <div className="payment-confetti">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="payment-confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: ['#00c6ff', '#00e676', '#ffd700', '#ff9d00', '#ff5252'][Math.floor(Math.random() * 5)]
            }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;