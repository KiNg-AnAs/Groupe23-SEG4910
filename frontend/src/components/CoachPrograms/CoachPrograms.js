import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Collapse } from "react-bootstrap";
import exercisesData from "./data/exercises.json"; 
import "./CoachPrograms.css";

const CoachPrograms = () => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    const formattedPrograms = Object.entries(exercisesData).map(([title, data]) => ({
      title,
      amateurExercises: data.amateur,
      proExercises: data.pro,
    }));
    setPrograms(formattedPrograms);
  }, []);

  const toggleExercises = (program) => {
    setSelectedProgram(selectedProgram === program ? null : program);
  };

  return (
    <section className="coach-programs-section">
      <Container>
        <h2 className="coach-title">Coach-Specific Training Programs</h2>
        <p className="coach-description">
          Browse structured training programs designed by Coach Rayane. Each program has a set of exercises tailored for both Amateurs and Pros.
        </p>

        <Row className="justify-content-center">
          {programs.map((program, index) => (
            <Col md={6} lg={4} key={index}>
              <Card className="program-cards">
                <Card.Body>
                  <h5>{program.title}</h5>
                  <Button
                    variant="info"
                    onClick={() => toggleExercises(program)}
                    className="view-exercises-btn"
                  >
                    {selectedProgram === program ? "Hide Exercises" : "View Exercises"}
                  </Button>

                  {/* Toggle Exercise Display */}
                  <Collapse in={selectedProgram === program}>
                    <div className="exercise-list">
                      <h6 className="exercise-category">Amateur Level</h6>
                      <ul>
                        {program.amateurExercises.map((exercise, idx) => (
                          <li key={idx}>{exercise}</li>
                        ))}
                      </ul>

                      <h6 className="exercise-category">Pro Level</h6>
                      <ul>
                        {program.proExercises.map((exercise, idx) => (
                          <li key={idx}>{exercise}</li>
                        ))}
                      </ul>
                    </div>
                  </Collapse>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default CoachPrograms;
