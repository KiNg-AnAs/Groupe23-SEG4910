import React, { useEffect, useState } from "react";
import { Table, Button, Spinner, Alert, Modal, Form } from "react-bootstrap";
import { FaCheckCircle, FaSync, FaVideo, FaPen } from "react-icons/fa";
import { useAuth } from "../../../../context/AuthContext";
import "./BookingManagement.css";

const BookingManagement = () => {
  const { fetchWithAuth } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalShow, setModalShow] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [confirmShow, setConfirmShow] = useState(false);
  const [confirmBooking, setConfirmBooking] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [editNotes, setEditNotes] = useState("");
  const [editDate, setEditDate] = useState("");

  // --------------------------
  // Fetch all bookings
  // --------------------------
  const loadBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWithAuth("http://localhost:8000/coach/bookings/");
      setBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading bookings:", e);
      setError("Failed to load Zoom bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // --------------------------
  // Open modal for editing
  // --------------------------
  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setEditNotes(booking.notes || "");
    setEditDate(
      booking.scheduled_date
        ? new Date(booking.scheduled_date).toISOString().slice(0, 16)
        : ""
    );
    setModalShow(true);
  };

  const closeEditModal = () => {
    setModalShow(false);
    setSelectedBooking(null);
  };

  // --------------------------
  // Save modal edits
  // --------------------------
  const saveBookingChanges = async () => {
    if (!selectedBooking) return;
    setUpdating(true);
    try {
      await fetchWithAuth(
        `http://localhost:8000/coach/bookings/${selectedBooking.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduled_date: editDate || null,
            notes: editNotes,
          }),
        }
      );

      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id
            ? { ...b, notes: editNotes, scheduled_date: editDate }
            : b
        )
      );
      setModalShow(false);
    } catch (e) {
      console.error("Failed to save booking:", e);
      alert("Failed to save booking changes.");
    } finally {
      setUpdating(false);
    }
  };

  // --------------------------
  // Confirmation modal for completion
  // --------------------------
  const confirmComplete = async () => {
    if (!confirmBooking) return;
    setUpdating(true);
    try {
      const data = await fetchWithAuth(
        `http://localhost:8000/coach/bookings/${confirmBooking.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Completed" }),
        }
      );

      // Update UI immediately based on remaining quantity
      setBookings((prev) =>
        prev
          .map((b) => {
            if (b.id === confirmBooking.id) {
              const newQty =
                typeof data.remaining_quantity === "number"
                  ? data.remaining_quantity
                  : Math.max(b.quantity - 1, 0);
              const newStatus =
                data.status || (newQty > 0 ? "Pending" : "Completed");
              return {
                ...b,
                quantity: newQty,
                status: newStatus,
                last_updated: new Date().toISOString(),
              };
            }
            return b;
          })
          // Remove the row only when quantity reaches 0
          .filter((b) => b.quantity > 0)
      );

      setConfirmShow(false);
    } catch (e) {
      console.error("Failed to complete booking:", e);
      alert("Failed to mark booking as completed.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="booking-container">
      <div className="booking-header">
        <FaVideo className="booking-icon" />
        <h2>Zoom Booking Management</h2>
        <p>Manage and complete your client Zoom session bookings.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="loading-state">
          <Spinner animation="border" />
          <span>Loading Zoom bookings…</span>
        </div>
      ) : bookings.length === 0 ? (
        <p className="empty-msg">No active Zoom bookings found.</p>
      ) : (
        <Table bordered hover responsive className="booking-table">
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
            {bookings.map((b, i) => (
              <tr key={b.id}>
                <td>{i + 1}</td>
                <td>{b.user_email}</td>
                <td>{b.quantity}</td>
                <td>
                  <span
                    className={`status-badge ${
                      b.status === "Completed" ? "done" : "pending"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => openEditModal(b)}
                  >
                    <FaPen /> Edit
                  </Button>
                </td>
                <td>{new Date(b.last_updated).toLocaleString()}</td>
                <td className="text-center">
                  <Button
                    variant="success"
                    size="sm"
                    disabled={updating || b.status === "Completed"}
                    onClick={() => {
                      setConfirmBooking(b);
                      setConfirmShow(true);
                    }}
                  >
                    <FaCheckCircle className="me-1" /> Complete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div className="refresh-btn">
        <Button variant="secondary" onClick={loadBookings} disabled={loading}>
          <FaSync className="me-1" /> Refresh
        </Button>
      </div>

      {/* ---------------------- Notes Modal ---------------------- */}
      <Modal show={modalShow} onHide={closeEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Scheduled Date</Form.Label>
            <Form.Control
              type="datetime-local"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add session details or preparation notes..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeEditModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveBookingChanges} disabled={updating}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ---------------------- Confirmation Modal ---------------------- */}
      <Modal show={confirmShow} onHide={() => setConfirmShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Mark Booking as Completed</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to mark this booking as{" "}
            <strong>Completed</strong>?
          </p>
          <p className="small text-muted">
            This will consume one Zoom add-on from the client’s balance.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmShow(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={confirmComplete} disabled={updating}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BookingManagement;
