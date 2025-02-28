import React, { createContext, useContext } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth0();

  const fetchWithAuth = async (endpoint, options = {}) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("JWT Token:", token);
      return response.json();

    } catch (error) {
      console.error("API Request Failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loginWithRedirect, logout, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
