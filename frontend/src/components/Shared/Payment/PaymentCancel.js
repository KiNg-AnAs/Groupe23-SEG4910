import React from "react";
import { useNavigate } from "react-router-dom";
import "./Payment.css";

const PaymentCancel = () => {
  const navigate = useNavigate();
  return (
    <div className="payment-page">
      <h2>❌ Payment Cancelled</h2>
      <p>Your payment was not completed. You can return to your cart to try again.</p>
      <button className="btn btn-secondary" onClick={() => navigate("/cart")}>
        Return to Cart
      </button>
    </div>
  );
};

export default PaymentCancel;
