// TrainingPrograms.js
import React, { useEffect, useState } from "react";
import { Table, Button, Spinner, Alert, Modal, Form } from "react-bootstrap";
import { FaCheckCircle, FaSync, FaRobot, FaPen } from "react-icons/fa";
import { useAuth } from "../../../../context/AuthContext";
import "./TrainingPrograms.css";

const TrainingPrograms = () => {
  const { fetchWithAuth } = useAuth();

  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  // notes modal
  const [showNotes, setShowNotes] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [notesText, setNotesText] = useState("");

  const openNotes = (row) => {
    setActiveRow(row);
    setNotesText(row.notes || "");
    setShowNotes(true);
  };

  const closeNotes = () => {
    setShowNotes(false);
    setActiveRow(null);
    setNotesText("");
  };

  const loadTrainings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWithAuth("http://localhost:8000/coach/training/");
      setTrainings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading training data:", e);
      setError("Failed to load training progress list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainings();
  }, []);

  const handleMarkDone = async (userId) => {
    // Pretty confirm dialog
    const ok = window.confirm(
      "Confirm completion?\n\nThis will consume 1 AI training unit for this client."
    );
    if (!ok) return;

    setUpdating(true);
    try {
      const resp = await fetchWithAuth(`http://localhost:8000/coach/training/${userId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Done" }),
      });

      const remaining = Number(resp?.remaining_quantity ?? 0);

      if (remaining > 0) {
        // Decrement just the quantity for that row
        setTrainings((prev) =>
          prev.map((t) =>
            t.id === userId ? { ...t, quantity: remaining, last_updated: new Date().toISOString() } : t
          )
        );
      } else {
        // Remove row if none remain
        setTrainings((prev) => prev.filter((t) => t.id !== userId));
      }
    } catch (e) {
      console.error("Update failed:", e);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeRow) return;
    try {
      await fetchWithAuth(`http://localhost:8000/coach/training/${activeRow.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText }),
      });
      setTrainings((prev) =>
        prev.map((t) =>
          t.id === activeRow.id ? { ...t, notes: notesText, last_updated: new Date().toISOString() } : t
        )
      );
      closeNotes();
    } catch (e) {
      console.error("Failed to update notes:", e);
      alert("Failed to save notes.");
    }
  };

  return (
    <div className="training-programs-container">
      <div className="training-header">
        <FaRobot className="training-icon" />
        <h2>AI Training Programs</h2>
        <p>Monitor and manage clients’ AI-based training sessions.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <div className="loading-state">
          <Spinner animation="border" />
          <span>Loading training programs…</span>
        </div>
      ) : trainings.length === 0 ? (
        <p className="empty-msg">No active AI training programs found.</p>
      ) : (
        <Table striped bordered hover responsive className="training-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Client Email</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Last Updated</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trainings.map((t, i) => (
              <tr key={t.id}>
                <td>{i + 1}</td>
                <td>{t.user_email}</td>
                <td>{t.quantity}</td>
                <td>
                  <span className="status-badge pending">Pending</span>
                </td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => openNotes(t)}
                  >
                    <FaPen className="me-1" /> Edit Notes
                  </Button>
                </td>
                <td>{new Date(t.last_updated).toLocaleString()}</td>
                <td className="text-center">
                  <Button
                    variant="success"
                    size="sm"
                    disabled={updating}
                    onClick={() => handleMarkDone(t.id)}
                  >
                    <FaCheckCircle className="me-1" /> Mark Done
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div className="refresh-btn">
        <Button variant="secondary" onClick={loadTrainings} disabled={loading}>
          <FaSync className="me-1" /> Refresh
        </Button>
      </div>

      {/* Notes Modal */}
      <Modal show={showNotes} onHide={closeNotes} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>Coach Notes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Notes for {activeRow?.user_email}</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Write detailed notes or a plan for the client's AI training…"
            />
            <div className="small text-muted mt-2">
              Tips: capture goals, blockers, plan, or anything to remember next time.
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={closeNotes}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveNotes}>
            Save Notes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TrainingPrograms;
