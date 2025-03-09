import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Modal, Table, Dropdown } from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash, FaClipboardList, FaUserCheck } from "react-icons/fa";
import "./TrainingPrograms.css";

// Dummy Clients & Programs (To be replaced with API integration)
const initialClients = [
  { id: 1, name: "John Doe" },
  { id: 2, name: "Jane Smith" },
  { id: 3, name: "Mike Johnson" }
];

const initialPrograms = [
  {
    id: 1,
    name: "Strength & Hypertrophy",
    description: "A muscle-building program focusing on progressive overload.",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8 },
      { name: "Squats", sets: 4, reps: 10 }
    ],
    assignedClients: [1, 2]
  },
  {
    id: 2,
    name: "Endurance & Conditioning",
    description: "Boost cardiovascular performance and stamina.",
    exercises: [
      { name: "Running", sets: 3, reps: "15 min" },
      { name: "Burpees", sets: 3, reps: 12 }
    ],
    assignedClients: [3]
  }
];

const TrainingPrograms = () => {
  const [programs, setPrograms] = useState(initialPrograms);
  const [clients, setClients] = useState(initialClients);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [newProgram, setNewProgram] = useState({ name: "", description: "", exercises: [], assignedClients: [] });
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  // Open modal to create/edit program
  const handleShowProgramModal = (program = null) => {
    if (program) {
      setEditingProgram(program);
      setNewProgram(program);
    } else {
      setNewProgram({ name: "", description: "", exercises: [], assignedClients: [] });
      setEditingProgram(null);
    }
    setShowProgramModal(true);
  };

  // Add new program or update existing
  const handleSaveProgram = () => {
    if (editingProgram) {
      setPrograms(programs.map((p) => (p.id === editingProgram.id ? newProgram : p)));
    } else {
      setPrograms([...programs, { ...newProgram, id: programs.length + 1 }]);
    }
    setShowProgramModal(false);
  };

  // Delete program
  const handleDeleteProgram = (id) => {
    setPrograms(programs.filter((program) => program.id !== id));
  };

  // Add exercise to a program
  const handleAddExercise = () => {
    setNewProgram({
      ...newProgram,
      exercises: [...newProgram.exercises, { name: "", sets: "", reps: "" }]
    });
  };

  // Update an exercise in the program
  const handleExerciseChange = (index, field, value) => {
    const updatedExercises = newProgram.exercises.map((ex, i) =>
      i === index ? { ...ex, [field]: value } : ex
    );
    setNewProgram({ ...newProgram, exercises: updatedExercises });
  };

  // Remove an exercise from the program
  const handleRemoveExercise = (index) => {
    setNewProgram({
      ...newProgram,
      exercises: newProgram.exercises.filter((_, i) => i !== index)
    });
  };

  // Assign a program to a client
  const handleAssignProgram = () => {
    if (!selectedProgram || !selectedClient) return;
    setPrograms(
      programs.map((program) =>
        program.id === selectedProgram.id
          ? { ...program, assignedClients: [...new Set([...program.assignedClients, selectedClient.id])] }
          : program
      )
    );
  };

  return (
    <Container className="training-programs-container">
      <h2 className="section-title">Training Programs</h2>
      <Row className="programs-header">
        <Col md={6}>
          <Button variant="success" onClick={() => handleShowProgramModal()}>
            <FaPlus /> Create New Program
          </Button>
        </Col>
        <Col md={6} className="text-end">
          <Dropdown>
            <Dropdown.Toggle variant="primary">
              <FaUserCheck /> Assign Program to Client
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {programs.map((program) => (
                <Dropdown.Item key={program.id} onClick={() => setSelectedProgram(program)}>
                  {program.name}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          {selectedProgram && (
            <Dropdown>
              <Dropdown.Toggle variant="info" className="ms-2">
                Assign to...
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {clients.map((client) => (
                  <Dropdown.Item key={client.id} onClick={() => setSelectedClient(client)}>
                    {client.name}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          )}
          {selectedProgram && selectedClient && (
            <Button variant="dark" className="ms-2" onClick={handleAssignProgram}>
              Confirm Assignment
            </Button>
          )}
        </Col>
      </Row>

      <Table striped bordered hover className="programs-table">
        <thead>
          <tr>
            <th>Program Name</th>
            <th>Description</th>
            <th>Clients Assigned</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {programs.map((program) => (
            <tr key={program.id}>
              <td>{program.name}</td>
              <td>{program.description}</td>
              <td>{program.assignedClients.map((id) => clients.find((c) => c.id === id)?.name).join(", ") || "None"}</td>
              <td>
                <Button variant="info" size="sm" onClick={() => handleShowProgramModal(program)}>
                  <FaEdit />
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteProgram(program.id)}>
                  <FaTrash />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal for Adding/Editing Programs */}
      <Modal show={showProgramModal} onHide={() => setShowProgramModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingProgram ? "Edit Program" : "Create Program"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Program Name</Form.Label>
              <Form.Control type="text" value={newProgram.name} onChange={(e) => setNewProgram({ ...newProgram, name: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" value={newProgram.description} onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })} />
            </Form.Group>
            <h5>Exercises</h5>
            {newProgram.exercises.map((exercise, index) => (
              <div key={index} className="exercise-input">
                <Form.Control type="text" value={exercise.name} placeholder="Exercise Name" onChange={(e) => handleExerciseChange(index, "name", e.target.value)} />
                <Button variant="danger" size="sm" onClick={() => handleRemoveExercise(index)}>
                  <FaTrash />
                </Button>
              </div>
            ))}
            <Button variant="secondary" className="mt-2" onClick={handleAddExercise}>
              <FaPlus /> Add Exercise
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={handleSaveProgram}>Save Program</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TrainingPrograms;
