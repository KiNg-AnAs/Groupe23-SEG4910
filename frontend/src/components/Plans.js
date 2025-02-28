import React from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import { FaStar, FaDumbbell, FaCrown } from "react-icons/fa";
import "./Plans.css";

const plans = [
  {
    title: "Basic Plan",
    price: "$29 / month",
    image: "./Assets/img21.jpg",
    icon: <FaDumbbell className="plan-icon" />,
    features: [
      "AI-Generated Training Plans",
      "Workout & Progress Tracking",
      "Basic Nutrition Guide",
    ],
    popular: false,
    paymentLink: "https://buy.stripe.com/test_bIY4k6aAZ2Sb83mfZ2", // Replace with your Stripe link
  },
  {
    title: "Advanced Plan",
    price: "$49 / month",
    image: "./Assets/img22.jpg",
    icon: <FaStar className="plan-icon" />,
    features: [
      "All features from the Basic Plan",
      "Personalized AI Nutrition Plan updated weekly",
      "1-on-1 Monthly Coaching Session",
    ],
    popular: true,
    paymentLink: "https://buy.stripe.com/test_7sI5oaeRf1O76Zi7sv", // Replace with your Stripe link
  },
  {
    title: "Elite Athlete Plan",
    price: "$99 / month",
    image: "./Assets/img23.jpg",
    icon: <FaCrown className="plan-icon" />,
    features: [
      "All features from the Advanced Plan",
      "Opportunity to train with the coach (Bi-weekly)",
      "Access to Fitness E-Book",
      "Advanced Caloric Burn Prediction Tool",
    ],
    popular: false,
    paymentLink: "https://buy.stripe.com/test_bIY2bY6kJcsL2J23ce", // Replace with your Stripe link
  },
];

const Plans = ({ cartItem, setCartItem }) => {
  const handleAddToCart = (plan) => {
    if (cartItem?.title === plan.title) {
      setCartItem(null);
    } else {
      setCartItem(plan);
      window.location.href = plan.paymentLink; // Redirect user to Stripe Checkout
    }
  };

  return (
    <section id="plans" className="plans-section">
      <Container>
        <h2 className="section-title">Choose Your Plan</h2>
        <Row className="justify-content-center">
          {plans.map((plan, index) => (
            <Col lg={4} md={6} sm={12} key={index} className="plan-column">
              <Card className={`plan-card ${cartItem?.title === plan.title ? "selected-plan" : ""}`}>
                <div className="plan-overlay" style={{ backgroundImage: `url(${plan.image})` }}>
                  {plan.popular && <Badge className="popular-badge">Popular</Badge>}
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
                      variant={cartItem?.title === plan.title ? "secondary" : "danger"}
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
