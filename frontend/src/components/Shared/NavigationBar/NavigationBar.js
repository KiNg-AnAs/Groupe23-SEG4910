import React, { useState, useEffect } from "react";
import { Container, Nav, Navbar, Button, NavDropdown } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { 
  FaDumbbell, 
  FaShoppingCart, 
  FaUser,
  FaHome,
  FaInfoCircle,
  FaStar,
  FaListAlt,
  FaCreditCard,
  FaTachometerAlt,
  FaChalkboardTeacher,
  FaRocket,
  FaGem
} from "react-icons/fa";
import "./NavigationBar.css";

const NavigationBar = ({ cartItems }) => {
  const { isAuthenticated, loginWithRedirect, logout, isCoach, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll for navbar background effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const isActive = (path) => location.pathname === path;

  return (
    <Navbar 
      expand="lg" 
      fixed="top" 
      className={`navbar-custom ${scrolled ? 'navbar-scrolled' : ''}`}
    >
      <Container>
        {/* Brand Logo */}
        <Navbar.Brand as={Link} to="/" className="navbar-brand-custom">
          <div className="navbar-logo-wrapper">
            <FaDumbbell className="navbar-logo-icon" />
            <div className="navbar-logo-glow"></div>
          </div>
          <span className="navbar-brand-name">
            Perfo<span className="navbar-brand-highlight">Evolution</span>
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" className="navbar-toggler-custom">
          <span></span>
          <span></span>
          <span></span>
        </Navbar.Toggle>

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="navbar-nav-custom mx-auto">
            {/* Home */}
            <Nav.Link 
              onClick={() => scrollToSection("hero")}
              className="navbar-link-custom"
            >
              <FaHome className="navbar-link-icon" />
              <span>Home</span>
            </Nav.Link>

            {/* About */}
            <Nav.Link 
              onClick={() => scrollToSection("about")}
              className="navbar-link-custom"
            >
              <FaInfoCircle className="navbar-link-icon" />
              <span>About</span>
            </Nav.Link>

            {/* Testimonials */}
            <Nav.Link 
              onClick={() => scrollToSection("testimonials")}
              className="navbar-link-custom"
            >
              <FaStar className="navbar-link-icon" />
              <span>Testimonials</span>
            </Nav.Link>

            {/* Programs Dropdown */}
            <NavDropdown 
              title={
                <span className="navbar-dropdown-title">
                  <FaListAlt className="navbar-link-icon" />
                  <span>Programs</span>
                </span>
              }
              id="programs-dropdown"
              className="navbar-dropdown-custom"
            >
              <NavDropdown.Item 
                onClick={() => scrollToSection("best-program")}
                className="navbar-dropdown-item-custom"
              >
                <FaRocket className="me-2" />
                AI-Generated Program
              </NavDropdown.Item>
              <NavDropdown.Item 
                onClick={() => scrollToSection("programs")}
                className="navbar-dropdown-item-custom"
              >
                <FaChalkboardTeacher className="me-2" />
                Coach Programs
              </NavDropdown.Item>
              <NavDropdown.Item 
                onClick={() => scrollToSection("addons-section")}
                className="navbar-dropdown-item-custom"
              >
                <FaGem className="me-2" />
                Premium Add-Ons
              </NavDropdown.Item>
            </NavDropdown>

            {/* Plans */}
            <Nav.Link 
              onClick={() => scrollToSection("plans")}
              className="navbar-link-custom"
            >
              <FaCreditCard className="navbar-link-icon" />
              <span>Plans</span>
            </Nav.Link>

            {/* Authenticated User Links */}
            {isAuthenticated && (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/onboarding"
                  className={`navbar-link-custom ${isActive('/onboarding') ? 'active' : ''}`}
                >
                  <FaUser className="navbar-link-icon" />
                  <span>Onboarding</span>
                </Nav.Link>

                <Nav.Link 
                  as={Link} 
                  to="/dashboard"
                  className={`navbar-link-custom ${isActive('/dashboard') ? 'active' : ''}`}
                >
                  <FaTachometerAlt className="navbar-link-icon" />
                  <span>Dashboard</span>
                </Nav.Link>
              </>
            )}

            {/* Coach Dashboard */}
            {isAuthenticated && isCoach && (
              <Nav.Link 
                as={Link} 
                to="/coach-dashboard"
                className={`navbar-link-custom navbar-link-coach ${isActive('/coach-dashboard') ? 'active' : ''}`}
              >
                <FaChalkboardTeacher className="navbar-link-icon" />
                <span>Coach</span>
              </Nav.Link>
            )}
          </Nav>

          {/* Right Side Actions */}
          <Nav className="navbar-actions-custom">
            {/* Cart Icon */}
            {isAuthenticated && (
              <Nav.Link 
                as={Link} 
                to="/cart" 
                className={`navbar-cart-link ${isActive('/cart') ? 'active' : ''}`}
              >
                <div className="navbar-cart-wrapper">
                  <FaShoppingCart className="navbar-cart-icon" />
                  {cartItems.length > 0 && (
                    <span className="navbar-cart-badge">
                      {cartItems.length}
                    </span>
                  )}
                </div>
              </Nav.Link>
            )}

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="navbar-user-section">
                <div className="navbar-user-info">
                  <FaUser className="navbar-user-avatar-icon" />
                  <span className="navbar-user-name">
                    {user?.name?.split(" ")[0] || "User"}
                  </span>
                </div>
                <Button 
                  variant="outline-light" 
                  className="navbar-logout-btn"
                  onClick={() => logout({ returnTo: window.location.origin })}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button 
                className="navbar-login-btn" 
                onClick={loginWithRedirect}
              >
                <FaUser className="me-2" />
                Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;