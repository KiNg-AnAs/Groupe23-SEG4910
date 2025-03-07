import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import workoutsData from "./data/aiWorkouts.json";
import "./AICoaching.css";

const AICoaching = ({ userData }) => {
  const navigate = useNavigate();
  const [trainingPlan, setTrainingPlan] = useState([]);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);

  useEffect(() => {
    if (!userData) {
      return;
    }

    const { goal, frequency } = userData;
    const selectedPlan = workoutsData[goal] || workoutsData["General Fitness"];
    const weeklyPlan = selectedPlan[frequency] || selectedPlan["3-4 times a week"];
    
    setTrainingPlan(weeklyPlan);
  }, [userData, navigate]);

  const toggleWorkoutCompletion = (day) => {
    setCompletedWorkouts((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <section className="ai-coaching-section">
      <Container>
        <h2 className="ai-title">Your AI-Generated Weekly Training Plan</h2>
        <p className="ai-description">
          Based on your fitness goal, our AI has created a structured weekly training plan.
        </p>

        <Row className="justify-content-center">
          {trainingPlan.map((day, index) => (
            <Col md={6} lg={4} key={index}>
              <Card className={`training-card ${completedWorkouts.includes(day.day) ? "completed" : ""}`}>
                <Card.Body>
                  <h5>{day.day}</h5>
                  <p className="workout-type">{day.type}</p>
                  <ul className="exercise-list">
                    {day.exercises.map((exercise, idx) => (
                      <li key={idx}>
                        {exercise.name} - {exercise.sets} sets x {exercise.reps} reps
                        <div className="video-container">
                          <iframe
                            width="100%"
                            height="150"
                            src={exercise.video}
                            title={exercise.name}
                            frameBorder="0"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Form.Check
                    type="checkbox"
                    label="Workout Completed"
                    checked={completedWorkouts.includes(day.day)}
                    onChange={() => toggleWorkoutCompletion(day.day)}
                  />
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default AICoaching;
