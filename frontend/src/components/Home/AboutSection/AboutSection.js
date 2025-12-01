import React, { useState } from "react";
import { Container, Row, Col, Button, Image } from "react-bootstrap";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import "./AboutSection.css";
import img7 from "../../Assets/img7.1.jpg";


const AboutSection = () => {
    const [expanded, setExpanded] = useState(false);

    return (
        <section id="about" className="about-section">
            <Container>
                <Row className="align-items-center">
                    {/* Left Side - Coach Image */}
                    <Col lg={6} className="about-image">
                        <Image src={img7} alt="Rayane Sid Ahmed" fluid rounded />

                    </Col>

                    {/* Right Side - Coach Details */}
                    <Col lg={6} className="about-text">
                        <h2>Meet Rayane Sid Ahmed</h2>
                        <p className="about-description">
                            Founder of <strong>PerfoEvolution</strong>, professional athlete, and sports performance specialist,
                            Rayane Sid Ahmed helps athletes unlock their full potential through cutting-edge, AI-enhanced training.
                        </p>

                        {expanded ? (
                            <>
                                <p className="about-description">
                                    With experience competing at the national level and holding degrees in Performance Training & Sports Science,
                                    Rayane has developed elite training methodologies to optimize physical performance.
                                </p>

                                <ul className="achievements-list">
                                    <li>⚽ Former National Team Player & Performance Coach</li>
                                    <li>📚 Degree in Sport & Exercise Sciences – U.S.</li>
                                    <li>🏋️‍♂️ Certified Strength & Conditioning Expert</li>
                                    <li>🔬 AI-Based Training Innovator</li>
                                </ul>

                                <p className="about-description">
                                    His training philosophy combines scientific research, technology, and real-world experience, ensuring athletes
                                    train smarter, recover faster, and perform at their peak.
                                </p>

                                <Button variant="outline-light" className="btn-lg" onClick={() => setExpanded(false)}>
                                    Show Less
                                </Button>
                            </>
                        ) : (
                            <Button variant="warning" className="btn-lg" onClick={() => setExpanded(true)}>
                                Read More
                            </Button>
                        )}

                        {/* Social Media Icons */}
                        <div className="social-icons">
                            <a href="https://www.facebook.com/rayane.sidahmed?rdid=vh2BKXuBCEk1FzVc&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1B8SNtLtX2%2F#"
                                target="_blank" rel="noopener noreferrer">
                                <FaFacebook />
                            </a>
                            <a href="https://www.instagram.com/perfo_evolution/?igsh=dHFhbHJyZnFnMzhv#"
                                target="_blank" rel="noopener noreferrer">
                                <FaInstagram />
                            </a>
                            <a href="https://www.tiktok.com/@athletetraining_?_t=ZM-8ttiXUpiyus&_r=1"
                                target="_blank" rel="noopener noreferrer">
                                <FaTiktok />
                            </a>
                        </div>

                    </Col>
                </Row>
            </Container>
        </section>
    );
};

export default AboutSection;
