import React from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { FaStar, FaDumbbell } from "react-icons/fa";
import "./Plans.css";
import { useAuth } from "../../../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const plans = [
  {
    title: "Basic Plan",
    price: "$29 / month",
    image: "./Assets/img21.jpg",
    icon: <FaDumbbell className="plan-icon" />,
    features: [
      "- AI-Generated Training Plans",
      "- Workout & Progress Tracking",
    ],
    popular: false,
    paymentLink: "https://buy.stripe.com/test_bIY4k6aAZ2Sb83mfZ2",
    planKey: "basic",
  },
  {
    title: "Advanced Plan",
    price: "$39 / month",
    image: "./Assets/img22.jpg",
    icon: <FaStar className="plan-icon" />,
    features: [
      "- All features from the Basic Plan",
      "- Personalized Nutrition Plan",
      "- Access to E-Book",
      "- Access to Coach's Personalized Training Programs",
    ],
    popular: true,
    paymentLink: "https://buy.stripe.com/test_7sI5oaeRf1O76Zi7sv",
    planKey: "advanced",
  },
];

const Plans = ({ cartItem, setCartItem }) => {
  const { isAuthenticated, loginWithRedirect, fetchWithAuth } = useAuth();

  const handleAddToCart = async (plan) => {
    //  Step 1: If not logged in, store plan and redirect to Auth0
    if (!isAuthenticated) {
      sessionStorage.setItem("redirectPlan", JSON.stringify(plan));
      return loginWithRedirect();
    }

    try {
      //  Step 2: Fetch current subscription plan from backend
      const data = await fetchWithAuth(`${API_URL}/subscription/`);
      const currentPlan = data.subscription_plan;

      //  Step 3: Prevent same-plan or downgrade purchase
      const planPriority = { none: 0, basic: 1, advanced: 2 };
      const selectedPriority = planPriority[plan.planKey];
      const userPriority = planPriority[currentPlan];

      if (selectedPriority <= userPriority) {
        alert(`You already have a ${currentPlan} plan or higher.`);
        return;
      }

      //  Step 4: Proceed to checkout (Stripe)
      setCartItem(plan);
      window.location.href = plan.paymentLink;
    } catch (err) {
      console.error("Error fetching subscription plan:", err);
      alert("Something went wrong. Please try again later.");
    }
  };

  return (
    <section id="plans" className="plans-section">
      <Container>
        <h2 className="section-titles">Choose Your Plan</h2>
        <Row className="justify-content-center">
          {plans.map((plan, index) => (
            <Col
              lg={4}
              md={6}
              sm={12}
              key={index}
              className="plan-column"
            >
              <Card
                className={`plan-card ${
                  cartItem?.title === plan.title ? "selected-plan" : ""
                }`}
              >
                <div
                  className="plan-overlay"
                  style={{ backgroundImage: `url(${plan.image})` }}
                >
                  {plan.popular && (
                    <Badge className="popular-badge">Popular</Badge>
                  )}
                  <div className="plan-content">
                    {plan.icon}
                    <h5 className="plan-title">{plan.title}</h5>
                    <p className="plan-price">{plan.price}</p>
                    <ul className="plan-features">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                    <Button
                      variant={
                        cartItem?.title === plan.title ? "secondary" : "danger"
                      }
                      className="buy-now"
                      onClick={() => handleAddToCart(plan)}
                    >
                      {cartItem?.title === plan.title ? "Remove" : "Buy Now"}
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default Plans;
