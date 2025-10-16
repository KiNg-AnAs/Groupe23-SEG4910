import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
import CoachDashboard from "./components/Board/Coach/CoachDashboard/CoachDashboard";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";


const domain = "dev-w3nk36t6hbc8zq2s.us.auth0.com";
const clientId = "ei1rDUHUcXjRgy2PBpTbsfasfQ8f7JIA";

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [cartItem, setCartItem] = useState(null);

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
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "http://localhost:8000"
      }}
    >
      <Router>
        <AuthProvider>
          <AuthSyncer />
          {/* Auto-restore addon or plan after login */}
          <RestoreCartAfterLogin addToCart={addToCart} setCartItem={setCartItem} />

          <NavigationBar cartItems={cartItems} />
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <HeroSection />
                  <AboutSection />
                  <Testimonials />
                  <BestProgramSection />
                  <ProgramsOverview addToCart={addToCart} />
                  <Plans cartItem={cartItem} setCartItem={setCartItem} />
                  <Footer />
                </>
              }
            />
            <Route path="/dashboard" element={<Dashboard addToCart={addToCart} />} />
            <Route path="/add-ons" element={<AddOns addToCart={addToCart} />} />
          <Route path="/add-ons" element={<AddOns addToCart={addToCart} />} /> 
            <Route path="/add-ons" element={<AddOns addToCart={addToCart} />} />
          <Route path="/add-ons" element={<AddOns addToCart={addToCart} />} /> 
            <Route path="/add-ons" element={<AddOns addToCart={addToCart} />} />
            <Route
              path="/cart"
              element={
                <Cart
                  cartItems={cartItems}
                  cartItem={cartItem}
                  removeFromCart={removeFromCart}
                  setCartItem={setCartItem}
                />
              }
            />
            <Route path="/onboarding" element={<OnboardingForm />} />
            <Route path="/coach-dashboard" element={<CoachDashboard />} />
          <Route path="/coach-dashboard" element={<CoachDashboard />} /> 
            <Route path="/coach-dashboard" element={<CoachDashboard />} />
          <Route path="/coach-dashboard" element={<CoachDashboard />} /> 
            <Route path="/coach-dashboard" element={<CoachDashboard />} />
          </Routes>
        </AuthProvider>
      </Router>
    </Auth0Provider>
  );
}

// Used to sync Auth0 user with Django after login
function AuthSyncer() {
  const { isAuthenticated, user, fetchWithAuth } = useAuth();

  useEffect(() => {
    const syncUser = async () => {
      try {
        const res = await fetchWithAuth("http://localhost:8000/auth0-login/", {
          method: "POST",
        });
        console.log("User synced:", res);
      } catch (err) {
        console.error("Sync failed:", err);
      }
    };

    if (isAuthenticated && user) {
      syncUser();
    }
  }, [isAuthenticated, user]);

  return null;
}

// Restores plan or add-on after login (from sessionStorage)
function RestoreCartAfterLogin({ addToCart, setCartItem }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Restore Add-On
    const addonData = sessionStorage.getItem("redirectAddon");
    if (addonData) {
      try {
        const parsed = JSON.parse(addonData);
        addToCart(parsed);
        sessionStorage.removeItem("redirectAddon");
        navigate("/cart");
        return; // Don't restore both at once
      } catch (err) {
        console.error("Failed to restore addon:", err);
      }
    }

    // Restore Plan
    const planData = sessionStorage.getItem("redirectPlan");
    if (planData) {
      try {
        const parsed = JSON.parse(planData);
        setCartItem(parsed);
        sessionStorage.removeItem("redirectPlan");
        navigate("/cart");
      } catch (err) {
        console.error("Failed to restore plan:", err);
      }
    }
  }, [isAuthenticated, addToCart, setCartItem, navigate]);

  return null;
}

export default App;
