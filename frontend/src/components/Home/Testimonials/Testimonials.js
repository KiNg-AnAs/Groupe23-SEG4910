import React from "react";
import { Container, Carousel } from "react-bootstrap";
import "./Testimonials.css";
import img4 from "../../Assets/img4.jpg";
import img5 from "../../Assets/img5.jpg";
import img6 from "../../Assets/img6.jpg";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Achraf Hakimi",
      text: "Training alongside Rayane during our time with the national team was inspiring. His dedication and work ethic are unmatched.",
      image: img4,
      role: "Professional Footballer - PSG & Morocco National Team",
    },
    {
      name: "Zinedine Zidane",
      text: "I awarded Rayane the Danone World Cup, and I was impressed by his athleticism at such a young age. He has a bright future in sports.",
      image: img5,
      role: "Football Legend & Former Real Madrid Coach",
    },
    {
      name: "Youssef En-Nesyri",
      text: "Rayane and I trained together at the Mohamed VI Academy. His intensity and passion for the game set him apart from others.",
      image: img6,
      role: "Professional Footballer - Sevilla & Morocco National Team",
    },
  ];

  return (
    <section id="testimonials" className="testimonials-section">
      <Container>
        <h2 className="section-titles">What Legends & Peers Say</h2>
        <Carousel
          indicators={false}
          controls={false}
          interval={5000}
          className="testimonials-carousel"
        >
          {testimonials.map((testimonial, index) => (
            <Carousel.Item key={index}>
              <div className="testimonials-wrapper">
                {/* Left Side Testimonial*/}
                <div className="testimonial-card left-testimonial">
                  <img
                    src={testimonials[(index + testimonials.length - 1) % testimonials.length].image}
                    alt={testimonials[(index + testimonials.length - 1) % testimonials.length].name}
                    className="testimonial-image"
                  />
                  <h5 className="testimonial-name">
                    {testimonials[(index + testimonials.length - 1) % testimonials.length].name}
                  </h5>
                  <p className="testimonial-role">
                    {testimonials[(index + testimonials.length - 1) % testimonials.length].role}
                  </p>
                </div>

                {/* Main Centered Testimonial */}
                <div className="testimonial-card main-testimonial">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="testimonial-image"
                  />
                  <h5 className="testimonial-name">{testimonial.name}</h5>
                  <p className="testimonial-role">{testimonial.role}</p>
                  <p className="testimonial-text">"{testimonial.text}"</p>
                </div>

                {/* Right Side Testimonial*/}
                <div className="testimonial-card right-testimonial">
                  <img
                    src={testimonials[(index + 1) % testimonials.length].image}
                    alt={testimonials[(index + 1) % testimonials.length].name}
                    className="testimonial-image"
                  />
                  <h5 className="testimonial-name">
                    {testimonials[(index + 1) % testimonials.length].name}
                  </h5>
                  <p className="testimonial-role">
                    {testimonials[(index + 1) % testimonials.length].role}
                  </p>
                </div>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </Container>
    </section>
  );
};

export default Testimonials;
