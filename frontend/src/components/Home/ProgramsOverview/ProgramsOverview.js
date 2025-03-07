import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Modal, Carousel } from "react-bootstrap";
import AddOns from "../../Shared/AddOns/AddOns";  
import "./ProgramsOverview.css";
import img7 from "../../Assets/img7.jpg";
import img8 from "../../Assets/img8.jpg";
import img9 from "../../Assets/img9.jpg";
import img10 from "../../Assets/img10.jpg";
import img12 from "../../Assets/img12.jpg";
import img18 from "../../Assets/img18.jpg";
import img22 from "../../Assets/img22.jpg";

const programs = [
  { title: "Strength & Hypertrophy", description: "Increase muscle mass and strength.", image: img7, details: "Gain muscle and maximize hypertrophy." },
  { title: "Endurance & Conditioning", description: "Enhance cardiovascular fitness.", image: img8, details: "Boost endurance and maintain strength." },
  { title: "Sport-Specific Training", description: "Improve agility and skills.", image: img9, details: "Tailored for specific sports." },
  { title: "Mobility & Flexibility", description: "Prevent injuries and improve movement.", image: img10, details: "Enhance flexibility and mechanics." },
  { title: "Off-Season & In-Season Training", description: "Optimize performance year-round.", image: img12, details: "Train smart during the season." },
  { title: "Explosiveness & Power", description: "Develop agility, speed, and explosive strength.", image: img18, details: "Focused on increasing power output and speed, ideal for athletes in high-intensity sports." },
  { title: "Injury Prevention & Recovery", description: "Prevent injuries and improve recovery.", image: img22, details: "Rehabilitation and body maintenance program to keep you in peak condition." }
];

const ProgramsOverview = ({ addToCart }) => {
  const [selectedProgram, setSelectedProgram] = useState(null);

  return (
    <section id="programs" className="programs-section">
      <Container>
        <h2 className="section-title">Coach's Personalized Training Programs</h2>

        {/* Programs Carousel */}
        <Carousel indicators={false} interval={null} className="programs-carousel">
          {Array.from({ length: Math.ceil(programs.length / 3) }, (_, i) => (
            <Carousel.Item key={i}>
              <Row className="justify-content-center">
                {programs.slice(i * 3, i * 3 + 3).map((program, index) => (
                  <Col lg={4} md={6} sm={12} key={index} className="d-flex justify-content-center">
                    <Card className="program-card">
                      <Card.Img variant="top" src={program.image} className="program-image" />
                      <Card.Body>
                        <Card.Title>{program.title}</Card.Title>
                        <Card.Text>{program.description}</Card.Text>
                        <Button variant="primary" onClick={() => setSelectedProgram(program)}>Learn More</Button>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Carousel.Item>
          ))}
        </Carousel>

        <p className="highlight-description">
          Each program is crafted by Coach Rayane, combining his expertise with real-time video tutorials
          and customized coaching. You'll receive personalized guidance, ensuring you master every movement
          and achieve your fitness goals effectively.
        </p>

        {/* Reusable Add-Ons Component */}
        <AddOns addToCart={addToCart} />

        {/* Program Details Modal */}
        <Modal show={!!selectedProgram} onHide={() => setSelectedProgram(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{selectedProgram?.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{selectedProgram?.details}</p>
          </Modal.Body>
        </Modal>
      </Container>
    </section>
  );
};

export default ProgramsOverview;
