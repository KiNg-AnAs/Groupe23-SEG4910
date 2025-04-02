import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const AuthContext = createContext();

const audience = "http://localhost:8000";

export const AuthProvider = ({ children }) => {
  const {
    loginWithRedirect,
    logout,
    user,
    isAuthenticated,
    getAccessTokenSilently
  } = useAuth0();

  const [isCoach, setIsCoach] = useState(false);

  const fetchWithAuth = async (endpoint, options = {}) => {
    try {
      const token = await getAccessTokenSilently({ audience });

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

  useEffect(() => {
    const fetchRole = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently({ audience });
          const response = await fetch("http://localhost:8000/is-coach/", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          setIsCoach(data.is_coach);
        } catch (error) {
          console.error("Error fetching coach role:", error);
        }
      }
    };

    fetchRole();
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loginWithRedirect,
        logout,
        fetchWithAuth,
        getAccessTokenSilently,
        isCoach,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
