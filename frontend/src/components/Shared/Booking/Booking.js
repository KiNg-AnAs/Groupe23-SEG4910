import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./Booking.css";

//  Available Booking Hours (Coach from 09:00 to 17:00)
const availableHours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

//  Booking Options 
const bookingOptions = [
  { id: "zoom", title: "1-on-1 Zoom Consultation", image: require("../../Assets/img14.jpg") },
  { id: "ai-plan", title: "Coach Custom AI Training Plan", image: require("../../Assets/img15.jpg") },
  { id: "private-coaching", title: "In-Person Private Coaching", image: require("../../Assets/img16.jpg") },
  { id: "group", title: "Exclusive Coaching Group", image: require("../../Assets/img17.jpg") },
];

const Booking = ({ onClose, addToCart }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookedSlots, setBookedSlots] = useState({});
  const [selectedBookingType, setSelectedBookingType] = useState("");

  //  Load existing bookings from local storage
  useEffect(() => {
    const storedBookings = JSON.parse(localStorage.getItem("bookedSlots")) || {};
    setBookedSlots(storedBookings);
  }, []);

  //  Handle Booking Selection
  const handleBookingSelection = (type) => {
    setSelectedBookingType(type);
  };

  //  Handle Time Selection (Ensuring Only One at a Time)
  const handleTimeSelection = (time) => {
    setSelectedTime((prev) => (prev === time ? null : time));
  };

  //  Handle Booking Confirmation
  const handleBooking = () => {
    if (!selectedBookingType || !selectedTime) return;

    const dateKey = selectedDate.toDateString();
    const updatedBookings = {
      ...bookedSlots,
      [dateKey]: [...(bookedSlots[dateKey] || []), selectedTime],
    };

    //  Find selected booking type for the correct image
    const selectedOption = bookingOptions.find((option) => option.title === selectedBookingType);

    //  Save to Local Storage
    localStorage.setItem("bookedSlots", JSON.stringify(updatedBookings));
    setBookedSlots(updatedBookings);

    //  Add to Cart with Image
    addToCart({
      title: `${selectedBookingType} - ${dateKey} at ${selectedTime}`,
      price: "$49.99",
      description: `${selectedBookingType} session scheduled for ${dateKey} at ${selectedTime}.`,
      image: selectedOption?.image || "", 
    });

    //  Reset and Close Modal
    setSelectedTime(null);
    setSelectedBookingType("");
    onClose();
  };

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Book a Training Session</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/*  Booking Type Selection */}
        <h5>Select a Training Option:</h5>
        <div className="booking-options">
          {bookingOptions.map((option) => (
            <Button
              key={option.id}
              variant={selectedBookingType === option.title ? "primary" : "outline-dark"}
              onClick={() => handleBookingSelection(option.title)}
              className="booking-option-btn"
            >
              {option.title}
            </Button>
          ))}
        </div>

        {/*  Calendar */}
        <h5>Select a Date:</h5>
        <div className="calendar-container">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            minDate={new Date()} 
          />
        </div>

        {/*  Time Slot Selection */}
        <h5 className="available-times-title">Available Time Slots:</h5>
        <div className="time-slots">
          {availableHours.map((time) => (
            <Button
              key={time}
              variant={selectedTime === time ? "primary" : bookedSlots[selectedDate.toDateString()]?.includes(time) ? "danger" : "outline-dark"}
              disabled={bookedSlots[selectedDate.toDateString()]?.includes(time)}
              onClick={() => handleTimeSelection(time)}
              className="time-slot-btn"
            >
              {time}
            </Button>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button 
          variant="success" 
          onClick={handleBooking} 
          disabled={!selectedBookingType || !selectedTime} 
        >
          Confirm Booking
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Booking;
