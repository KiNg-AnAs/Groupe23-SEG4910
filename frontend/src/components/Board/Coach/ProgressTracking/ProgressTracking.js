import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { Line, Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import "./ProgressTracking.css";

// Dummy Data for Clients and Their Workout Progress
const clients = [
  { id: 1, name: "John Doe", completed: 20, pending: 5 },
  { id: 2, name: "Jane Smith", completed: 15, pending: 10 },
  { id: 3, name: "Michael Johnson", completed: 30, pending: 2 },
  { id: 4, name: "Emily Davis", completed: 10, pending: 15 },
];

const workoutHistory = {
  1: [
    { date: "2024-03-01", completed: 3, uncompleted: 1 },
    { date: "2024-03-02", completed: 4, uncompleted: 0 },
    { date: "2024-03-03", completed: 2, uncompleted: 1 },
  ],
  2: [
    { date: "2024-03-01", completed: 2, uncompleted: 2 },
    { date: "2024-03-02", completed: 3, uncompleted: 1 },
    { date: "2024-03-03", completed: 1, uncompleted: 2 },
  ],
  3: [
    { date: "2024-03-01", completed: 5, uncompleted: 0 },
    { date: "2024-03-02", completed: 4, uncompleted: 1 },
    { date: "2024-03-03", completed: 6, uncompleted: 0 },
  ],
};

const ProgressTracking = () => {
  const [selectedClient, setSelectedClient] = useState(clients[0].id);
  const [feedback, setFeedback] = useState("");

  const clientData = clients.find((client) => client.id === selectedClient);
  const historyData = workoutHistory[selectedClient];

  // Chart Data for Workout Progress Over Time
  const lineChartData = {
    labels: historyData.map((entry) => entry.date),
    datasets: [
      {
        label: "Completed Workouts",
        data: historyData.map((entry) => entry.completed),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      },
      {
        label: "Uncompleted Workouts",
        data: historyData.map((entry) => entry.uncompleted),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
      },
    ],
  };

  // Chart Data for Completed vs. Uncompleted Workouts (Pie Chart)
  const doughnutChartData = {
    labels: ["Completed", "Uncompleted"],
    datasets: [
      {
        data: [clientData.completed, clientData.pending],
        backgroundColor: ["#4CAF50", "#FF5733"],
        hoverBackgroundColor: ["#45a049", "#c0392b"],
      },
    ],
  };

  return (
    <section className="progress-tracking-section">
      <Container>
        <h2 className="progress-title">Client Progress Tracking</h2>
        <p className="progress-description">Monitor client performance and provide guidance.</p>

        {/* Select Client */}
        <Row>
          <Col md={6} className="mx-auto">
            <Form.Group>
              <Form.Label>Select Client</Form.Label>
              <Form.Select
                value={selectedClient}
                onChange={(e) => setSelectedClient(parseInt(e.target.value))}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Workout Completion Stats */}
        <Row className="progress-summary">
          <Col md={6}>
            <Card className="progress-card">
              <Card.Body>
                <h5>Total Workouts Completed</h5>
                <p>{clientData.completed}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="progress-card">
              <Card.Body>
                <h5>Uncompleted Workouts</h5>
                <p>{clientData.pending}</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Graphs */}
        <Row className="progress-graphs">
          <Col md={6}>
            <h5>Progress Over Time</h5>
            <Line data={lineChartData} />
          </Col>
          <Col md={6}>
            <h5>Completed vs. Uncompleted</h5>
            <Doughnut data={doughnutChartData} />
          </Col>
        </Row>

        {/* Feedback Section */}
        <Row className="progress-feedback">
          <Col md={8} className="mx-auto">
            <Form.Group>
              <Form.Label>Provide Feedback</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Leave a message for your client..."
              />
            </Form.Group>
            <Button variant="primary" className="mt-3">Send Feedback</Button>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default ProgressTracking;
