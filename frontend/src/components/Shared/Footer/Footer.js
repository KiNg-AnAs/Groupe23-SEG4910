import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="footer">
            <Container>
                <Row className="align-items-center">
                    {/* Logo & Description */}
                    <Col lg={4} className="footer-logo">
                        <h2>PerfoEvolution</h2>
                        <p>Unlock your full athletic potential with AI-driven training and expert coaching.</p>
                    </Col>

                    {/* Navigation Links */}
                    <Col lg={4} className="footer-links">
                        <h5>Quick Links</h5>
                        <ul>
                            <li><a href="#hero">Home</a></li>
                            <li><a href="#programs">Programs</a></li>
                            <li><a href="#testimonials">Testimonials</a></li>
                        </ul>
                    </Col>

                    {/* Social Media Links */}
                    <Col lg={4} className="footer-social">
                        <h5>Follow Us</h5>
                        <div className="social-icons">
                            <a href="https://www.tiktok.com/@athletetraining_?_t=ZM-8ttiXUpiyus&_r=1" target="_blank" rel="noopener noreferrer">
                                <FaTiktok />
                            </a>
                            <a href="https://www.facebook.com/rayane.sidahmed?rdid=vh2BKXuBCEk1FzVc&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1B8SNtLtX2%2F#"
                                target="_blank" rel="noopener noreferrer">
                                <FaFacebook />
                            </a>
                            <a href="https://www.instagram.com/perfo_evolution/?igsh=dHFhbHJyZnFnMzhv#" target="_blank" rel="noopener noreferrer">
                                <FaInstagram />
                            </a>
                        </div>

                    </Col>
                </Row>
                <hr />
                <Row>
                    <Col className="text-center">
                        <p>&copy; {new Date().getFullYear()} PerfoEvolution. All Rights Reserved.</p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default Footer;
