import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaExclamationCircle, 
  FaShoppingCart, 
  FaHome,
  FaQuestionCircle,
  FaLock,
  FaCreditCard
} from "react-icons/fa";
import "./PaymentCancel.css";

const PaymentCancel = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/cart");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="payment-cancel-wrapper">
      <div className="payment-cancel-container">
        {/* Cancel Icon */}
        <div className="payment-cancel-icon-wrapper">
          <div className="payment-cancel-circle payment-cancel-circle-1"></div>
          <div className="payment-cancel-circle payment-cancel-circle-2"></div>
          <FaExclamationCircle className="payment-cancel-icon" />
        </div>

        {/* Cancel Message */}
        <h1 className="payment-cancel-title">
          Payment Cancelled
        </h1>
        <p className="payment-cancel-subtitle">
          No charges were made to your account
        </p>

        {/* Info Box */}
        <div className="payment-cancel-info-box">
          <p className="payment-cancel-message">
            Your payment was not completed. This can happen if you:
          </p>
          <div className="payment-cancel-reasons">
            <div className="payment-cancel-reason-item">
              <FaCreditCard className="payment-cancel-reason-icon" />
              <span>Closed the payment window</span>
            </div>
            <div className="payment-cancel-reason-item">
              <FaLock className="payment-cancel-reason-icon" />
              <span>Encountered a payment issue</span>
            </div>
            <div className="payment-cancel-reason-item">
              <FaQuestionCircle className="payment-cancel-reason-icon" />
              <span>Changed your mind</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="payment-cancel-actions">
          <button 
            className="payment-cancel-btn payment-cancel-btn-primary"
            onClick={() => navigate("/cart")}
          >
            <FaShoppingCart className="me-2" />
            Return to Cart
          </button>
          <button 
            className="payment-cancel-btn payment-cancel-btn-secondary"
            onClick={() => navigate("/dashboard")}
          >
            <FaHome className="me-2" />
            Go to Dashboard
          </button>
        </div>

        {/* Auto Redirect */}
        <div className="payment-cancel-redirect">
          <p>
            Automatically returning to cart in{" "}
            <span className="payment-cancel-countdown">{countdown}s</span>
          </p>
        </div>

        {/* Help Section */}
        <div className="payment-cancel-help">
          <p className="payment-cancel-help-text">
            <FaQuestionCircle className="me-2" />
            Need help? Your cart items are still saved and ready when you are.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;