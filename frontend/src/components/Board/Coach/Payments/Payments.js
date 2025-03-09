import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import { FaDollarSign, FaUser } from "react-icons/fa";
import "chart.js/auto";
import "./Payments.css";

// Dummy Data (Replace with Backend API Later)
const generateEarningsData = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((month) => ({
    month,
    earnings: Math.floor(Math.random() * 5000) + 1000, // Simulated earnings
  }));
};

// Dummy Client Purchases Data
const generateClientPayments = () => [
  { name: "John Doe", items: ["AI Training Plan", "1-on-1 Coaching"], total: 199.99 },
  { name: "Jane Smith", items: ["Nutrition Plan", "Group Training"], total: 149.99 },
  { name: "David Johnson", items: ["Premium Add-Ons", "Zoom Consultation"], total: 99.99 },
  { name: "Emily Brown", items: ["Custom AI Plan"], total: 79.99 },
];

const Payments = () => {
  const [earningsData, setEarningsData] = useState([]);
  const [clientPayments, setClientPayments] = useState([]);

  useEffect(() => {
    setEarningsData(generateEarningsData());
    setClientPayments(generateClientPayments());
  }, []);

  // Calculate Total Earnings
  const totalEarnings = earningsData.reduce((acc, data) => acc + data.earnings, 0);

  // Chart Data
  const chartData = {
    labels: earningsData.map((data) => data.month),
    datasets: [
      {
        label: "Earnings Over Time ($)",
        data: earningsData.map((data) => data.earnings),
        borderColor: "#ff9d00",
        backgroundColor: "rgba(255, 157, 0, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <section className="payments-section">
      <Container>
        <h2 className="section-title">Payments & Earnings</h2>

        {/* Total Earnings Card */}
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="earnings-card">
              <FaDollarSign className="earnings-icon" />
              <h5>Total Earnings</h5>
              <h3>${totalEarnings.toLocaleString()}</h3>
            </Card>
          </Col>
        </Row>

        {/* Earnings Chart */}
        <Row className="chart-container">
          <Col md={10} className="mx-auto">
            <Card className="chart-card">
              <Card.Body>
                <h5 className="chart-title">Earnings Trend</h5>
                <Line data={chartData} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Client Payment History */}
        <Row className="client-payments-container">
          <Col md={10} className="mx-auto">
            <Card className="client-payments-card">
              <Card.Body>
                <h5 className="client-payments-title">Client Payment History</h5>
                <Table striped bordered hover responsive className="client-payments-table">
                  <thead>
                    <tr>
                      <th><FaUser /> Client</th>
                      <th>Purchased Items</th>
                      <th>Total Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPayments.map((client, index) => (
                      <tr key={index}>
                        <td>{client.name}</td>
                        <td>{client.items.join(", ")}</td>
                        <td>${client.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Payments;
