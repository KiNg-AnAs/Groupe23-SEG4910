import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Container } from "react-bootstrap";

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <Container>
      <h1>Welcome, {user ? user.name : "User"}!</h1>
      <p>This is your dashboard.</p>
    </Container>
  );
};

export default Dashboard;
