import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Table, Modal, Form } from "react-bootstrap";
import { FaCheck, FaTimes, FaCalendarAlt, FaPlus } from "react-icons/fa";
import "./BookingManagement.css";

// Dummy API for fetching & confirming bookings
const fetchBookings = () => {
  return JSON.parse(localStorage.getItem("bookings")) || [];
};

const saveBookings = (bookings) => {
  localStorage.setItem("bookings", JSON.stringify(bookings));
};

const sendEmailConfirmation = (clientEmail, sessionDetails) => {
  console.log(`📧 Email sent to ${clientEmail}:`, sessionDetails);
  alert(`Confirmation email sent to ${clientEmail}`);
};

const availableHours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const sessionTypes = ["1-on-1 Zoom Consultation", "AI Training Plan Review", "Private Coaching", "Group Coaching"];

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    clientName: "",
    email: "",
    date: "",
    time: "",
    sessionType: sessionTypes[0],
  });

  //  Fetch bookings on load
  useEffect(() => {
    setBookings(fetchBookings());
  }, []);

  //  Handle Booking Confirmation
  const confirmBooking = (bookingId) => {
    const updatedBookings = bookings.map((booking) =>
      booking.id === bookingId ? { ...booking, confirmed: true } : booking
    );

    setBookings(updatedBookings);
    saveBookings(updatedBookings);

    // Send Email Confirmation (I will Replace with actual email API)
    const confirmedBooking = updatedBookings.find((b) => b.id === bookingId);
    sendEmailConfirmation(confirmedBooking.email, confirmedBooking);
  };

  //  Handle Booking Creation
  const handleCreateBooking = () => {
    if (!newBooking.clientName || !newBooking.email || !newBooking.date || !newBooking.time) {
      alert("Please fill out all fields.");
      return;
    }

    // Check if slot is already booked
    const isSlotTaken = bookings.some(
      (booking) => booking.date === newBooking.date && booking.time === newBooking.time
    );

    if (isSlotTaken) {
      alert("This time slot is already booked. Please choose another time.");
      return;
    }

    const updatedBookings = [
      ...bookings,
      { ...newBooking, id: Date.now(), confirmed: false },
    ];

    setBookings(updatedBookings);
    saveBookings(updatedBookings);
    setShowModal(false);
  };

  return (
    <section className="booking-management-section">
      <Container>
        <h2 className="section-title">
          <FaCalendarAlt /> Manage Client Bookings
        </h2>
        <p className="section-description">View, create, and confirm training sessions.</p>

        {/*  Create Booking Button */}
        <Button variant="primary" className="mb-3" onClick={() => setShowModal(true)}>
          <FaPlus /> Create Booking
        </Button>

        {/*  Booking Table */}
        <Table striped bordered hover variant="dark" responsive className="booking-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Email</th>
              <th>Date</th>
              <th>Time</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.clientName}</td>
                  <td>{booking.email}</td>
                  <td>{booking.date}</td>
                  <td>{booking.time}</td>
                  <td>{booking.sessionType}</td>
                  <td>
                    <span className={booking.confirmed ? "status-confirmed" : "status-pending"}>
                      {booking.confirmed ? "Confirmed" : "Pending"}
                    </span>
                  </td>
                  <td>
                    {!booking.confirmed ? (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => confirmBooking(booking.id)}
                      >
                        <FaCheck /> Confirm
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" disabled>
                        Confirmed
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center">
                  No bookings available.
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        {/*  Create Booking Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Create New Booking</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Client Name</Form.Label>
                <Form.Control
                  type="text"
                  value={newBooking.clientName}
                  onChange={(e) => setNewBooking({ ...newBooking, clientName: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Client Email</Form.Label>
                <Form.Control
                  type="email"
                  value={newBooking.email}
                  onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Session Type</Form.Label>
                <Form.Select
                  value={newBooking.sessionType}
                  onChange={(e) => setNewBooking({ ...newBooking, sessionType: e.target.value })}
                >
                  {sessionTypes.map((type, index) => (
                    <option key={index}>{type}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={newBooking.date}
                  onChange={(e) => setNewBooking({ ...newBooking, date: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Time</Form.Label>
                <Form.Select
                  value={newBooking.time}
                  onChange={(e) => setNewBooking({ ...newBooking, time: e.target.value })}
                >
                  {availableHours.map((time, index) => (
                    <option key={index}>{time}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleCreateBooking}>
              Create Booking
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </section>
  );
};

export default BookingManagement;
