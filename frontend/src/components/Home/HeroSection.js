import React from "react";
import { Carousel, Container, Button, Row, Col } from "react-bootstrap";
import "./HeroSection.css"; // Import CSS file
import img1 from "../Assets/img1.jpg";
import img2 from "../Assets/img2.jpg";
import img3 from "../Assets/img3.jpg";


const HeroSection = () => {
  return (
    <section id="hero" className="hero-section">
      <Container>
        <Row className="align-items-center">
                    <Col lg={6}>
            <Carousel className="hero-carousel">
              <Carousel.Item>
                <img className="d-block w-100" src={img1} alt="Training in Action" />
              </Carousel.Item>
              <Carousel.Item>
                <img className="d-block w-100" src={img2} alt="Athlete Performance" />
              </Carousel.Item>
              <Carousel.Item>
                <img className="d-block w-100" src={img3} alt="Strength & Conditioning" />
              </Carousel.Item>
            </Carousel>
          </Col>
          <Col lg={6} className="hero-text">
            <h1>
              UNLEASH YOUR <span>FULL ATHLETIC POTENTIAL</span>
            </h1>
            <p>
              Elevate your game with AI-powered training. Personalized programs for strength, endurance, mobility, and injury prevention.
            </p>
            <div className="hero-stats">
              <div>
                <h3>+500</h3>
                <p>Elite Athletes Coached</p>
              </div>
              <div>
                <h3>+1,200</h3>
                <p>Customized AI Training Plans</p>
              </div>
              <div>
                <h3>+80%</h3>
                <p>Performance Improvement</p>
              </div>
            </div>
            <div className="hero-buttons">
                <Button variant="warning" className="btn-lg" href="/Login">
                    Get Started
                </Button>
                <Button variant="outline-light" className="btn-lg" href="#programs">
                    Explore Programs
                </Button>
            </div>

          </Col>

        </Row>
      </Container>
    </section>
  );
};

export default HeroSection;

