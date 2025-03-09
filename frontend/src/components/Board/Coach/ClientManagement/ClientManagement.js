import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Table, Modal, Form, InputGroup } from "react-bootstrap";
import { FaUserPlus, FaSearch, FaEdit, FaTrash, FaChartLine, FaCalendarAlt, FaCommentDots } from "react-icons/fa";
import "./ClientManagement.css";

// Dummy client data (Replace with API later)
const initialClients = [
  {
    id: 1,
    name: "John Doe",
    age: 28,
    weight: 75,
    height: 180,
    goal: "Muscle Gain",
    activityLevel: "Active",
    nutritionPlan: "High-Protein",
    workoutPlan: "Strength & Hypertrophy",
    sessionsCompleted: 10,
    messages: 3,
  },
  {
    id: 2,
    name: "Jane Smith",
    age: 25,
    weight: 65,
    height: 170,
    goal: "Fat Loss",
    activityLevel: "Moderate",
    nutritionPlan: "Balanced",
    workoutPlan: "Endurance & Conditioning",
    sessionsCompleted: 15,
    messages: 5,
  }
];

const ClientManagement = () => {
  const [clients, setClients] = useState(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState(clients);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClient, setNewClient] = useState({
    name: "",
    age: "",
    weight: "",
    height: "",
    goal: "",
    activityLevel: "",
    nutritionPlan: "",
    workoutPlan: "",
    sessionsCompleted: 0,
    messages: 0,
  });

  // Filter clients based on search term
  useEffect(() => {
    setFilteredClients(
      clients.filter((client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, clients]);

  // Handle adding a new client
  const handleAddClient = () => {
    if (!newClient.name || !newClient.age || !newClient.weight || !newClient.height) return;
    setClients([...clients, { ...newClient, id: clients.length + 1 }]);
    setShowAddModal(false);
    setNewClient({
      name: "",
      age: "",
      weight: "",
      height: "",
      goal: "",
      activityLevel: "",
      nutritionPlan: "",
      workoutPlan: "",
      sessionsCompleted: 0,
      messages: 0,
    });
  };

  // Handle editing client details
  const handleEditClient = () => {
    setClients(clients.map(client => client.id === selectedClient.id ? selectedClient : client));
    setShowEditModal(false);
    setSelectedClient(null);
  };

  // Handle deleting a client
  const handleDeleteClient = (id) => {
    setClients(clients.filter(client => client.id !== id));
  };

  return (
    <Container className="client-management-container">
      <h2 className="section-title">Client Management</h2>
      <Row className="search-add-row">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={4} className="text-end">
          <Button variant="success" onClick={() => setShowAddModal(true)}>
            <FaUserPlus /> Add Client
          </Button>
        </Col>
      </Row>

      <Table striped bordered hover responsive className="client-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
            <th>Weight (kg)</th>
            <th>Height (cm)</th>
            <th>Goal</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.map((client) => (
            <tr key={client.id}>
              <td>{client.name}</td>
              <td>{client.age}</td>
              <td>{client.weight}</td>
              <td>{client.height}</td>
              <td>{client.goal}</td>
              <td>
                <Button variant="info" size="sm" onClick={() => { setSelectedClient(client); setShowEditModal(true); }}>
                  <FaEdit />
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteClient(client.id)}>
                  <FaTrash />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Add Client Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Age</Form.Label>
              <Form.Control type="number" value={newClient.age} onChange={(e) => setNewClient({ ...newClient, age: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Weight (kg)</Form.Label>
              <Form.Control type="number" value={newClient.weight} onChange={(e) => setNewClient({ ...newClient, weight: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Height (cm)</Form.Label>
              <Form.Control type="number" value={newClient.height} onChange={(e) => setNewClient({ ...newClient, height: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleAddClient}>Add Client</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ClientManagement;
