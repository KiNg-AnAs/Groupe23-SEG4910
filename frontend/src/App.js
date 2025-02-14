import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";  // Ensure AuthProvider is imported
import NavigationBar from "./components/NavigationBar";
import HeroSection from "./components/HeroSection";
import AboutSection from "./components/AboutSection";
import Testimonials from "./components/Testimonials";
import ProgramsOverview from "./components/ProgramsOverview";
import Plans from "./components/Plans";
import Footer from "./components/Footer";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Dashboard from "./components/Dashboard";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  return (
    <Router>  {/* ✅ Router wraps the entire app */}
      <AuthProvider>  {/* ✅ AuthProvider is now inside Router */}
        <NavigationBar />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <HeroSection />
                <AboutSection />
                <Testimonials />
                <ProgramsOverview />
                <Plans />
                <Footer />
              </>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
