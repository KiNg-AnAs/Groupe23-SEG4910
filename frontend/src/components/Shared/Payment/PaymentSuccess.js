import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./PaymentSuccess.css"; 


const PaymentSuccess = () => {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const refreshUserData = async () => {
      try {
        const res = await fetchWithAuth("http://localhost:8000/user-detail/");
        console.log("✅ Updated user data after payment:", res);

        // Clear local cart data
        localStorage.removeItem("cart_plan");
        localStorage.removeItem("cart_addons");
        localStorage.removeItem("cart_in_progress");

        // Redirect to dashboard
        setTimeout(() => navigate("/dashboard"), 2000);
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      }
    };
    refreshUserData();
  }, [fetchWithAuth, navigate]);

  return (
    <div className="payment-page">
      <h2>✅ Payment Successful!</h2>
      <p>Updating your account...</p>
    </div>
  );
};

export default PaymentSuccess;
