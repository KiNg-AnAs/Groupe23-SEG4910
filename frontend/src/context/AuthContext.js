// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const AuthContext = createContext();
const audience = "http://localhost:8000"; // we will change it once deployed

export const AuthProvider = ({ children }) => {
  const {
    loginWithRedirect,
    logout,
    user,
    isAuthenticated,
    getAccessTokenSilently,
  } = useAuth0();

  const [isCoach, setIsCoach] = useState(false);
  const [userData, setUserData] = useState(null); // plan + add_ons + identity

  /**
   * Authenticated fetch helper:
   * - Always asks for JSON (Accept header)
   * - Merges headers
   * - Throws detailed errors for non-2xx
   * - Parses JSON only when content-type is JSON
   */
  const fetchWithAuth = async (endpoint, options = {}) => {
    try {
      const token = await getAccessTokenSilently({ audience });
      // test for debugging/Postman:
      // console.log("ACCESS TOKEN:", token);

      const resp = await fetch(endpoint, {
        ...options,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });

      if (!resp.ok) {
        const ct = resp.headers.get("content-type") || "";
        const body = ct.includes("application/json")
          ? await resp.json().catch(() => ({}))
          : await resp.text().catch(() => "");
        const msg =
          typeof body === "string"
            ? body
            : body?.detail || body?.error || JSON.stringify(body);
        throw new Error(`HTTP ${resp.status}: ${msg || "Request failed"}`);
      }

      if (resp.status === 204) return null;

      const ct = resp.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        return await resp.json();
      }
      return await resp.text();
    } catch (error) {
      console.error("API Request Failed:", error);
      throw error;
    }
  };

  // Load "is coach" flag
  useEffect(() => {
    const fetchRole = async () => {
      if (!isAuthenticated) return;
      try {
        const token = await getAccessTokenSilently({ audience });
        const resp = await fetch("http://localhost:8000/is-coach/", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!resp.ok) {
          // If backend returns HTML (e.g., 403), avoid .json() crash
          const maybeText = await resp.text().catch(() => "");
          console.error("is-coach error:", resp.status, maybeText);
          setIsCoach(false);
          return;
        }

        const data = await resp.json();
        setIsCoach(!!data?.is_coach);
      } catch (error) {
        console.error("Error fetching coach role:", error);
        setIsCoach(false);
      }
    };

    fetchRole();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Load user detail (plan + add-ons) after login
  const fetchUserData = async () => {
    if (!isAuthenticated) return;

    try {
      const data = await fetchWithAuth("http://localhost:8000/user-detail/");

      // Transform backend add-ons array -> { ebook: 1, ai: 0, zoom: 2 }
      const formattedAddons = {};
      for (const addon of data.addons || []) {
        const { addon_type, quantity } = addon;
        formattedAddons[addon_type] = quantity;
      }

      setUserData({
        plan: data.subscription_plan || "none",
        add_ons: formattedAddons,
        username: data.username,
        email: data.email,
        role: data.role,
      });
    } catch (error) {
      console.error("Failed to fetch user detail:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    } else {
      setUserData(null);
      setIsCoach(false);
    }
  }, [isAuthenticated]); 

  return (
    <AuthContext.Provider
      value={{
        // Auth0
        user,
        isAuthenticated,
        loginWithRedirect,
        logout,
        getAccessTokenSilently,
        // App
        fetchWithAuth,
        isCoach,
        userData,
        fetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
