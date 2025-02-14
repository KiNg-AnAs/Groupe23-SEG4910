import React, { useContext } from "react";
import { Container, Nav, Navbar, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaDumbbell } from "react-icons/fa"; // ✅ Using FontAwesome for the logo
import "./NavigationBar.css"; // Import CSS file


const NavigationBar = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const logout = authContext?.logout;
  const navigate = useNavigate();

  // Function to handle smooth scrolling to sections
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/"); // If not on homepage, navigate first
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  };

  return (
    <Navbar expand="lg" bg="dark" variant="dark" fixed="top" className="navbar-custom">
      <Container>
        {/* ✅ Added Logo with FontAwesome */}
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
            <Nav.Link onClick={() => scrollToSection("programs")}>Programs</Nav.Link>
            <Nav.Link onClick={() => scrollToSection("plans")}>Plans</Nav.Link>
            {user ? (
              <>
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                <Button variant="outline-light" className="ms-3" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="warning" className="ms-3" as={Link} to="/login">
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
