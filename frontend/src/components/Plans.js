import React from "react";
import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import "./Plans.css";

const plans = [
  {
    title: "Basic Plan",
    price: "$29 / month",
    image: "./Assets/img21.jpg",
    features: [
      "AI-Generated Training Plans",
      "Workout & Progress Tracking",
      "Basic Nutrition Guide",
      "Monthly Fitness Assessments"
    ],
    popular: false
  },
  {
    title: "Advanced Plan",
    price: "$49 / month",
    image: "./Assets/img22.jpg",
    features: [
      "Everything in Basic Plan",
      "Personalized AI Nutrition Plan",
      "Exclusive Weekly Video Workouts",
      "1-on-1 Coach Check-In (Monthly)"
    ],
    popular: true
  },
  {
    title: "Elite Athlete Plan",
    price: "$99 / month",
    image: "./Assets/img23.jpg",
    features: [
      "Everything in Advanced Plan",
      "Exclusive Live Group Training Sessions",
      "In-Depth Performance Analysis",
      "Direct Access to a Personal Coach"
    ],
    popular: false
  }
];

const Plans = () => {
  return (
    <section id="plans" className="plans-section">
      <Container>
        <h2 className="section-title">Choose Your Plan</h2>
        <Row className="justify-content-center">
          {plans.map((plan, index) => (
            <Col lg={4} md={6} sm={12} key={index} className="plan-column">
              <Card className="plan-card">
                <div className="plan-overlay" style={{ backgroundImage: `url(${plan.image})` }}>
                  {plan.popular && <Badge className="popular-badge">Popular</Badge>}
                  <div className="plan-content">
                    <h5 className="plan-title">{plan.title}</h5>
                    <p className="plan-price">{plan.price}</p>
                    <ul className="plan-features">
                      {plan.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                    <Button variant="danger" className="buy-now" href="/Login">Buy Now</Button>
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
