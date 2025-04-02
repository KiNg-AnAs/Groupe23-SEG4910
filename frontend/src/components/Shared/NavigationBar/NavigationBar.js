import React from "react";
import { Container, Nav, Navbar, Button, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { FaDumbbell, FaShoppingCart } from "react-icons/fa";
import "./NavigationBar.css";

const NavigationBar = ({ cartItems }) => {
  const { isAuthenticated, loginWithRedirect, logout, isCoach } = useAuth();
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  };

  return (
    <Navbar expand="lg" bg="dark" variant="dark" fixed="top" className="navbar-custom">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <FaDumbbell className="nav-logo" />
          <span className="brand-name">PerfoEvolution</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link onClick={() => scrollToSection("hero")}>Home</Nav.Link>
            <Nav.Link onClick={() => scrollToSection("about")}>About</Nav.Link>
            <Nav.Link onClick={() => scrollToSection("testimonials")}>Testimonials</Nav.Link>

            {/* Programs Dropdown */}
            <NavDropdown title="Programs" id="programs-dropdown">
              <NavDropdown.Item onClick={() => scrollToSection("best-program")}>
                AI-Generated Program
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => scrollToSection("programs")}>
                Coach-Specific Training Programs
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => scrollToSection("addons-section")}>
                Premium Add-Ons
              </NavDropdown.Item>
            </NavDropdown>

            <Nav.Link onClick={() => scrollToSection("plans")}>Plans</Nav.Link>

            {/* Show Onboarding & Dashboard for All Authenticated Users */}
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/onboarding">Onboarding</Nav.Link>
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
              </>
            )}

           {/* Show Coach Dashboard only for authenticated coaches */}
            {isAuthenticated && isCoach && (
              <Nav.Link as={Link} to="/coach-dashboard">Coach Dashboard</Nav.Link>
            )}


            {/* Cart Icon */}
            <Nav.Link as={Link} to="/cart" className="cart-icon">
              <FaShoppingCart />
              {cartItems.length > 0 && <span className="cart-badge">{cartItems.length}</span>}
            </Nav.Link>

            {/* Authentication Logic */}
            <Nav className="ms-auto align-items-center d-flex">
              {isAuthenticated ? (
                <>
                  <Button 
                    variant="outline-light" 
                    className="ms-3"
                    onClick={() => logout({ returnTo: window.location.origin })}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button variant="warning" className="ms-3" onClick={loginWithRedirect}>
                  Login
                </Button>
              )}
            </Nav>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
