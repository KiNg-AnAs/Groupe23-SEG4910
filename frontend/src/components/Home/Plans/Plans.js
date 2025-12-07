import React from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { FaStar, FaDumbbell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Plans.css";
import { useAuth } from "../../../context/AuthContext";

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
    planKey: "advanced",
  },
];

const Plans = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect } = useAuth();

  const handleSelectPlan = (plan) => {
    // If not logged in, redirect to login first
    if (!isAuthenticated) {
      sessionStorage.setItem("redirectAfterLogin", "/cart");
      sessionStorage.setItem("selectedPlan", JSON.stringify(plan));
      return loginWithRedirect();
    }

    // Store selected plan in localStorage for cart to pick up
    localStorage.setItem("cart_plan", JSON.stringify({
      key: plan.planKey,
      title: plan.title,
      price: parseInt(plan.price.replace(/[^0-9]/g, '')),
      description: plan.planKey === "basic" ? "AI Training + Tracking" : "Everything + Nutrition + E-Book",
      icon: plan.planKey === "basic" ? "🚀" : "👑"
    }));

    // Navigate to cart
    navigate("/cart");
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
              <Card className="plan-card">
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
                      variant="danger"
                      className="buy-now"
                      onClick={() => handleSelectPlan(plan)}
                    >
                      Select Plan
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