import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import { AuthProvider } from "./context/AuthContext";
<<<<<<< HEAD
import NavigationBar from "./components/Shared/NavigationBar/NavigationBar";
import HeroSection from "./components/Home/HeroSection/HeroSection";
import AboutSection from "./components/Home/AboutSection/AboutSection";
import Testimonials from "./components/Home/Testimonials/Testimonials";
import BestProgramSection from "./components/Home/BestProgramSection/BestProgramSection";
import ProgramsOverview from "./components/Home/ProgramsOverview/ProgramsOverview";
import Plans from "./components/Home/Plans/Plans";
import Cart from "./components/Shared/Cart/Cart"; 
import Footer from "./components/Shared/Footer/Footer";
import Dashboard from "./components/Board/Client/Dashboard/Dashboard";
import OnboardingForm from "./components/Onboarding/OnboardingForm/OnboardingForm";
import AddOns from "./components/Shared/AddOns/AddOns";
=======
import NavigationBar from "./components/NavigationBar";
import HeroSection from "./components/Home/HeroSection";
import AboutSection from "./components/AboutSection";
import Testimonials from "./components/Testimonials";
import BestProgramSection from "./components/BestProgramSection";
import ProgramsOverview from "./components/ProgramsOverview";
import Plans from "./components/Plans";
import Cart from "./components/Cart"; 
import Footer from "./components/Footer";
import Dashboard from "./components/Dashboard/Dashboard";
import OnboardingForm from "./components/Onboarding/OnboardingForm";
import AddOns from "./components/AddOns/AddOns";
>>>>>>> main
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";


const domain = "dev-ksjixgafqussk8qf.us.auth0.com";
const clientId = "rt2rlRiahelahO3QhGTtsRIuQr9U5Ajm";

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
      <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{ redirect_uri: window.location.origin }}
    >
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
          <Route path="/dashboard" element={<Dashboard addToCart={addToCart} />} />
          <Route path="/add-ons" element={<AddOns addToCart={addToCart} />} /> 
          <Route path="/cart" element={<Cart cartItems={cartItems} cartItem={cartItem} removeFromCart={removeFromCart} setCartItem={setCartItem} />} /> 
          <Route path="/onboarding" element={<OnboardingForm saveUserData={saveUserData} />} />
        </Routes>
       </AuthProvider>
       </Router>
      </Auth0Provider>
  );
}

export default App;