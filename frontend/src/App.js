import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import NavigationBar from "./components/NavigationBar";
import HeroSection from "./components/Home/HeroSection";
import AboutSection from "./components/AboutSection";
import Testimonials from "./components/Testimonials";
import BestProgramSection from "./components/BestProgramSection";
import ProgramsOverview from "./components/ProgramsOverview";
import Plans from "./components/Plans";
import Cart from "./components/Cart"; 
import Footer from "./components/Footer";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Dashboard from "./components/Dashboard/Dashboard";
import OnboardingForm from "./components/Onboarding/OnboardingForm";
import AddOns from "./components/AddOns/AddOns";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";




function App() {
  const [cartItems, setCartItems] = useState([]); 
  const [cartItem, setCartItem] = useState(null); 
  const [userData, setUserData] = useState(null);

  // Function to store onboarding data
  const saveUserData = (data) => {
    setUserData(data);
    console.log("User Data Saved:", data); 
  };


  //  Function to add items to the cart (for add-ons)
  const addToCart = (item) => {
    setCartItems((prevItems) => {
      if (!prevItems.some((cartItem) => cartItem.title === item.title)) {
        return [...prevItems, item];
      }
      return prevItems;
    });
  };

  //  Function to remove an item from the cart
  const removeFromCart = (title) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.title !== title));
  };

  return (
    <Router>
      <AuthProvider>
        <NavigationBar cartItems={cartItems} />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <HeroSection />
                <AboutSection />
                <Testimonials />
                <BestProgramSection/> 
                <ProgramsOverview addToCart={addToCart} /> 
                <Plans cartItem={cartItem} setCartItem={setCartItem} /> 
                <Footer/>
              </>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard addToCart={addToCart} />} />
          <Route path="/add-ons" element={<AddOns addToCart={addToCart} />} /> 
          <Route path="/cart" element={<Cart cartItems={cartItems} cartItem={cartItem} removeFromCart={removeFromCart} setCartItem={setCartItem} />} /> 
          <Route path="/onboarding" element={<OnboardingForm saveUserData={saveUserData} />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;