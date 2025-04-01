import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import * as yup from "yup";
import { Formik } from "formik";
import "./OnboardingForm.css";
import { useAuth } from "../../../context/AuthContext";


const schema = yup.object().shape({
  age: yup.number().required("Age is required").min(10, "Minimum age is 10"),
  height: yup.number().required("Height is required").min(50, "Height too low"),
  weight: yup.number().required("Weight is required").min(30, "Weight too low"),
  bodyFat: yup.number().min(5, "Too low").max(50, "Too high").nullable(), 
  fitnessLevel: yup.string().required("Please select your fitness level"),
  goal: yup.string().required("Please select your primary goal"),
  frequency: yup.string().required("Please select workout frequency"),
  activityLevel: yup.string().required("Please select daily activity level"),
  sleepHours: yup
    .number()
    .required("Please enter sleep hours per night") 
    .min(3, "Sleep must be at least 3 hours")
    .max(12, "Sleep cannot exceed 12 hours"),
  bodyType: yup.string().nullable(), 
});

const OnboardingForm = ({ }) => {
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();

  

  return (
    <section className="onboarding-container-section">
    <Container className="onboarding-container">
      <h2 className="onboarding-title">Let's Personalize Your Fitness Plan</h2>
      <Formik
        validationSchema={schema}
        onSubmit={async (values) => {
  try {
    const res = await fetchWithAuth("http://localhost:8000/save-profile/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    console.log("Profile Saved:", res);
    navigate("/dashboard");
  } catch (error) {
    console.error("Failed to save profile", error);
  }
}}

        initialValues={{
          age: "",
          height: "",
          weight: "",
          bodyFat: "",
          fitnessLevel: "",
          goal: "",
          frequency: "",
          activityLevel: "",
          sleepHours: "",
          bodyType: "",
        }}
      >
        {({ handleSubmit, handleChange, values, touched, errors }) => (
          <Form noValidate onSubmit={handleSubmit} className="onboarding-form">
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group controlId="age">
                  <Form.Label>Age</Form.Label>
                  <Form.Control
                    type="number"
                    name="age"
                    value={values.age}
                    onChange={handleChange}
                    isInvalid={touched.age && errors.age}
                  />
                  <Form.Control.Feedback type="invalid">{errors.age}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="height">
                  <Form.Label>Height (cm)</Form.Label>
                  <Form.Control
                    type="number"
                    name="height"
                    value={values.height}
                    onChange={handleChange}
                    isInvalid={touched.height && errors.height}
                  />
                  <Form.Control.Feedback type="invalid">{errors.height}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group controlId="weight">
                  <Form.Label>Weight (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    name="weight"
                    value={values.weight}
                    onChange={handleChange}
                    isInvalid={touched.weight && errors.weight}
                  />
                  <Form.Control.Feedback type="invalid">{errors.weight}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="fitnessLevel">
                  <Form.Label>Fitness Level</Form.Label>
                  <Form.Select
                    name="fitnessLevel"
                    value={values.fitnessLevel}
                    onChange={handleChange}
                    isInvalid={touched.fitnessLevel && errors.fitnessLevel}
                  >
                    <option value="">Select your level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.fitnessLevel}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="goal">
                  <Form.Label>Primary Goal</Form.Label>
                  <Form.Select
                    name="goal"
                    value={values.goal}
                    onChange={handleChange}
                    isInvalid={touched.goal && errors.goal}
                  >
                    <option value="">Select your goal</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Fat Loss">Fat Loss</option>
                    <option value="Endurance">Endurance</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.goal}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group controlId="frequency">
                  <Form.Label>Workout Frequency</Form.Label>
                  <Form.Select
                    name="frequency"
                    value={values.frequency}
                    onChange={handleChange}
                    isInvalid={touched.frequency && errors.frequency}
                  >
                    <option value="">Select frequency</option>
                    <option value="1-2 times a week">1-2 times a week</option>
                    <option value="3-4 times a week">3-4 times a week</option>
                    <option value="5+ times a week">5+ times a week</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.frequency}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="activityLevel">
                  <Form.Label>Daily Activity Level</Form.Label>
                  <Form.Select
                    name="activityLevel"
                    value={values.activityLevel}
                    onChange={handleChange}
                    isInvalid={touched.activityLevel && errors.activityLevel}
                  >
                    <option value="">Select activity level</option>
                    <option value="Sedentary">Sedentary (Minimal movement)</option>
                    <option value="Lightly Active">Lightly Active (Some movement daily)</option>
                    <option value="Active">Active (Frequent physical activity)</option>
                    <option value="Very Active">Very Active (Intense training or labor)</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.activityLevel}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="sleepHours">
                  <Form.Label>Sleep Hours Per Night</Form.Label>
                  <Form.Control
                    type="number"
                    name="sleepHours"
                    value={values.sleepHours}
                    onChange={handleChange}
                    isInvalid={touched.sleepHours && errors.sleepHours}
                  />
                  <Form.Control.Feedback type="invalid">{errors.sleepHours}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="bodyFat">
                  <Form.Label>Body Fat % (Optional)</Form.Label>
                  <Form.Control
                    type="number"
                    name="bodyFat"
                    value={values.bodyFat}
                    onChange={handleChange}
                    isInvalid={touched.bodyFat && errors.bodyFat}
                  />
                  <Form.Control.Feedback type="invalid">{errors.bodyFat}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="bodyType">
                  <Form.Label>Body Type (Optional)</Form.Label>
                  <Form.Select
                    name="bodyType"
                    value={values.bodyType}
                    onChange={handleChange}
                  >
                    <option value="">Select your body type</option>
                    <option value="Ectomorph">Ectomorph (Lean & Slim)</option>
                    <option value="Mesomorph">Mesomorph (Athletic & Muscular)</option>
                    <option value="Endomorph">Endomorph (Broad & Higher Fat Storage)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Button type="submit" className="submit-btn">Continue</Button>
              <Button
                  variant="secondary"
                  className="ms-2"
                  onClick={async () => {
                        try {
                            const res = await fetchWithAuth("http://localhost:8000/user-info/");
                            console.log("📡 User Info:", res);
                            alert(`Role: ${res.role}, Username: ${res.username || "not set"}`);
                        } catch (error) {
                          console.error("Failed to fetch user info", error);
                        }
                  }}
              >
                  Test Get User Info
              </Button>

          </Form>
        )}
      </Formik>
    </Container>
    </section>
  );
};

export default OnboardingForm;
