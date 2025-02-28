import React, { useState } from "react";
import { Container, Row, Col, Card, Button, ListGroup, Modal } from "react-bootstrap";
import "./Cart.css";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("your_publishable_key_here");


const Cart = ({ cartItems, cartItem, setCartItem, removeFromCart }) => {
  const [showModal, setShowModal] = useState(false);

  // Function to remove plan
  const removePlan = () => {
    setCartItem(null);
  };

  // Function to handle checkout
  const handleCheckout = () => {
    window.location.href = "https://buy.stripe.com/test_7sI5oabF364n2J2dQR"; // Replace with your Stripe Payment Link
  };
  

  return (
    <section id="cart" className="cart-section">
      <Container className="cart-section-container">
        <h2 className="section-title">Your Cart</h2>

        {/* Display Selected Plan */}
        {cartItem && (
          <Card className="cart-plan-card">
            <Card.Body>
              <h4>{cartItem.title}</h4>
              <p className="cart-item-price">{cartItem.price}</p>
              <Button variant="danger" size="sm" onClick={removePlan}>Remove Plan</Button>
            </Card.Body>
          </Card>
        )}

        {/* Display Add-Ons */}
        {cartItems.length > 0 ? (
          <ListGroup className="cart-list">
            {cartItems.map((item, index) => (
              <ListGroup.Item key={index} className="cart-item">
                <Row className="align-items-center">
                  <Col xs={3} className="cart-img">
                    <img src={item.image} alt={item.title} className="cart-item-image" />
                  </Col>
                  <Col xs={6} className="cart-item-details">
                    <h5>{item.title}</h5>
                    <p className="cart-item-price">{item.price}</p>
                  </Col>
                  <Col xs={3} className="cart-actions">
                    <Button variant="danger" size="sm" onClick={() => removeFromCart(item.title)}>Remove</Button>
                  </Col>
                </Row>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : !cartItem ? <p className="empty-cart">Your cart is empty.</p> : null}

        {/* Checkout Button */}
        {(cartItem || cartItems.length > 0) && (
          <div className="checkout-section">
            <h4 className="total-price">
              Total: <span>
                {(
                  (cartItem ? parseFloat(cartItem.price.replace("$", "")) : 0) +
                  cartItems.reduce((total, item) => total + parseFloat(item.price.replace("$", "")), 0)
                ).toFixed(2)}$
              </span>
            </h4>
            <Button variant="success" className="checkout-btn" onClick={handleCheckout}>Proceed to Checkout</Button>
          </div>
        )}

        {/* Checkout Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Checkout</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Thank you for your purchase! You will receive a confirmation email shortly.</p>
          </Modal.Body>
        </Modal>
      </Container>
    </section>
  );
};

export default Cart;
