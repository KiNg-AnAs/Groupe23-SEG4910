import React, { useEffect, useState } from "react";
import { Container, Table, Button, Spinner, Alert, Modal, Form, Card, Row, Col, Badge } from "react-bootstrap";
import { FaCheckCircle, FaSync, FaVideo, FaPen, FaCalendarAlt, FaClock, FaUsers } from "react-icons/fa";
import { useAuth } from "../../../../context/AuthContext";
import "./BookingManagement.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

  // Fetch all bookings
  const loadBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchWithAuth(`${API_URL}/coach/bookings/`);
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

  // Open modal for editing
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

  // Save modal edits
  const saveBookingChanges = async () => {
    if (!selectedBooking) return;
    setUpdating(true);
    try {
      await fetchWithAuth(
        `${API_URL}/coach/bookings/${confirmBooking.id}/`,
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

  // Confirmation modal for completion
  const confirmComplete = async () => {
    if (!confirmBooking) return;
    setUpdating(true);
    try {
      const data = await fetchWithAuth(
        `${API_URL}/coach/bookings/${confirmBooking.id}/`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Completed" }),
        }
      );

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

  // Stats calculations
  const totalBookings = bookings.length;
  const totalSessions = bookings.reduce((sum, b) => sum + b.quantity, 0);
  const pendingBookings = bookings.filter(b => b.status !== "Completed").length;

  const getInitials = (email) => {
    if (!email) return "??";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="booking-mgmt-wrapper">
      <Container className="booking-mgmt-container">
        {/* Hero Header */}
        <div className="booking-mgmt-hero">
          <div className="hero-content">
            <div className="hero-icon-wrapper">
              <FaVideo className="hero-icon" />
            </div>
            <h1 className="hero-title">Zoom Booking Management</h1>
            <p className="hero-subtitle">Schedule and manage your client video session bookings</p>
          </div>
        </div>

        {/* Stats Cards */}
        <Row className="stats-row mb-4">
          <Col md={4}>
            <Card className="stat-card stat-card-1">
              <Card.Body>
                <div className="stat-icon-wrapper">
                  <FaCalendarAlt className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{totalBookings}</div>
                  <div className="stat-label">Active Bookings</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card stat-card-2">
              <Card.Body>
                <div className="stat-icon-wrapper">
                  <FaVideo className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{totalSessions}</div>
                  <div className="stat-label">Total Sessions</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card stat-card-3">
              <Card.Body>
                <div className="stat-icon-wrapper">
                  <FaClock className="stat-icon" />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{pendingBookings}</div>
                  <div className="stat-label">Pending Sessions</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Error Banner */}
        {error && (
          <div className="booking-error-banner">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="booking-loading-container">
            <div className="loading-spinner"></div>
            <p>Loading bookings...</p>
          </div>
        )}

        {/* Bookings Table */}
        <Card className="table-card">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table className="modern-booking-table mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Client</th>
                    <th>Sessions</th>
                    <th>Status</th>
                    <th>Scheduled</th>
                    <th>Last Updated</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && bookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        <div className="empty-content">
                          <FaVideo className="empty-icon" />
                          <p>No active bookings</p>
                          <small>Zoom bookings will appear here when clients schedule sessions</small>
                        </div>
                      </td>
                    </tr>
                  )}
                  {bookings.map((b, i) => (
                    <tr key={b.id} className="booking-row">
                      <td>{i + 1}</td>
                      <td>
                        <div className="client-info">
                          <div className="client-avatar">
                            {getInitials(b.user_email)}
                          </div>
                          <div className="client-details">
                            <div className="client-email">{b.user_email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg="info" className="quantity-badge">
                          {b.quantity} remaining
                        </Badge>
                      </td>
                      <td>
                        <Badge 
                          bg={b.status === "Completed" ? "success" : "warning"} 
                          className="status-badge"
                        >
                          {b.status}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="schedule-btn"
                          onClick={() => openEditModal(b)}
                        >
                          <FaCalendarAlt className="me-1" /> 
                          {b.scheduled_date ? "Edit" : "Schedule"}
                        </Button>
                      </td>
                      <td>
                        <div className="timestamp">
                          <FaClock className="me-1" />
                          {new Date(b.last_updated).toLocaleString()}
                        </div>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="success"
                          size="sm"
                          disabled={updating || b.status === "Completed"}
                          className="complete-btn"
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
            </div>
          </Card.Body>
        </Card>

        {/* Refresh Button */}
        <div className="refresh-section">
          <Button 
            variant="outline-light" 
            onClick={loadBookings} 
            disabled={loading}
            className="refresh-btn"
          >
            <FaSync className={`me-2 ${loading ? 'spinning' : ''}`} /> 
            Refresh Data
          </Button>
        </div>

        {/* Edit Booking Modal */}
        <Modal 
          show={modalShow} 
          onHide={closeEditModal} 
          centered
          size="lg"
          className="booking-edit-modal"
        >
          <Modal.Header closeButton className="modal-header-custom">
            <Modal.Title className="modal-title-custom">
              <FaCalendarAlt className="me-2" />
              Edit Booking
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-body-custom">
            <Form.Group className="mb-4 modern-form-group">
              <Form.Label className="form-label-custom">
                <FaClock className="me-2" />
                Scheduled Date & Time
              </Form.Label>
              <Form.Control
                type="datetime-local"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                onClick={(e) => {
                  // Open calendar picker on click
                  if (e.target.showPicker) {
                    e.target.showPicker();
                  }
                }}
                className="modern-input"
              />
              <div className="form-hint">
                Set the date and time for this Zoom session
              </div>
            </Form.Group>
            <Form.Group className="modern-form-group">
              <Form.Label className="form-label-custom">
                <FaPen className="me-2" />
                Session Notes
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add session details, preparation notes, topics to cover..."
                className="notes-textarea"
              />
              <div className="form-hint">
                💡 Include session objectives, topics, or special preparations
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="modal-footer-custom">
            <Button variant="outline-secondary" onClick={closeEditModal} className="cancel-btn">
              Cancel
            </Button>
            <Button variant="primary" onClick={saveBookingChanges} disabled={updating} className="save-booking-btn">
              <FaCheckCircle className="me-2" /> Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Confirmation Modal */}
        <Modal 
          show={confirmShow} 
          onHide={() => setConfirmShow(false)} 
          centered
          className="booking-confirm-modal"
        >
          <Modal.Header closeButton className="modal-header-custom">
            <Modal.Title className="modal-title-custom">
              <FaCheckCircle className="me-2" />
              Confirm Completion
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-body-custom">
            <div className="confirm-content">
              <div className="confirm-icon-wrapper">
                <FaCheckCircle className="confirm-icon" />
              </div>
              <p className="confirm-text">
                Mark this booking as <strong>Completed</strong>?
              </p>
              <p className="confirm-hint">
                This will consume one Zoom session from the client's balance.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer className="modal-footer-custom">
            <Button variant="outline-secondary" onClick={() => setConfirmShow(false)} className="cancel-btn">
              Cancel
            </Button>
            <Button variant="success" onClick={confirmComplete} disabled={updating} className="confirm-complete-btn">
              <FaCheckCircle className="me-2" /> Confirm
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default BookingManagement;