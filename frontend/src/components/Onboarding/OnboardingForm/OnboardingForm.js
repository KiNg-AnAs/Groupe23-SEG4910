import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button, Card, ProgressBar } from "react-bootstrap";
import * as yup from "yup";
import { Formik } from "formik";
import "./OnboardingForm.css";
import { useAuth } from "../../../context/AuthContext";
import { FaUser, FaDumbbell, FaBed, FaCheckCircle, FaArrowRight, FaArrowLeft, FaFire } from "react-icons/fa";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// VALIDATION SCHEMA
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

const OnboardingForm = ({ existingProfile = null, isModal = false, onComplete = null }) => {
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Calculate progress percentage
  const getProgress = () => {
    return (currentStep / totalSteps) * 100;
  };

  // Step validation
  const isStep1Valid = (values, errors) => {
    return values.age && values.height && values.weight && !errors.age && !errors.height && !errors.weight;
  };

  const isStep2Valid = (values, errors) => {
    return values.fitnessLevel && values.goal && values.frequency && 
           !errors.fitnessLevel && !errors.goal && !errors.frequency;
  };

  const stepTitles = [
    { number: 1, title: "Physical Stats", icon: <FaUser /> },
    { number: 2, title: "Fitness Goals", icon: <FaDumbbell /> },
    { number: 3, title: "Lifestyle", icon: <FaBed /> }
  ];

  return (
    <section className="onboarding-container-section">
      <Container className="onboarding-container">
        <div className="onboarding-header">
          <h2 className="onboarding-title">
            <FaFire className="fire-icon" />
            Let's Personalize Your Fitness Plan
          </h2>
          <p className="onboarding-subtitle">Complete your profile to unlock personalized workouts and nutrition</p>
        </div>

        <Formik
          validationSchema={schema}
          onSubmit={async (values) => {
            try {
              const res = await fetchWithAuth(`${API_URL}/save-profile/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values)
              });
              console.log("Profile Saved:", res);
              
              if (onComplete) {
                onComplete(res); // Call callback if in modal mode
              } else {
                navigate("/dashboard");
              }
            } catch (error) {
              console.error("Failed to save profile", error);
            }
          }}
          initialValues={{
            age: existingProfile?.age || "",
            height: existingProfile?.height_cm || "",
            weight: existingProfile?.weight_kg || "",
            bodyFat: existingProfile?.body_fat_percentage || "",
            fitnessLevel: existingProfile?.fitness_level || "",
            goal: existingProfile?.primary_goal || "",
            frequency: existingProfile?.workout_frequency || "",
            activityLevel: existingProfile?.daily_activity_level || "",
            sleepHours: existingProfile?.sleep_hours || "",
            bodyType: existingProfile?.body_type || "",
          }}
        >
          {({ handleSubmit, handleChange, values, touched, errors, setTouched }) => (
            <div className="onboarding-wizard">
              {/* Progress Bar */}
              <div className="progress-section">
                <div className="step-indicators">
                  {stepTitles.map((step) => (
                    <div
                      key={step.number}
                      className={`step-indicator ${currentStep >= step.number ? 'active' : ''} ${currentStep === step.number ? 'current' : ''}`}
                    >
                      <div className="step-circle">
                        {currentStep > step.number ? <FaCheckCircle /> : step.icon}
                      </div>
                      <span className="step-label">{step.title}</span>
                    </div>
                  ))}
                </div>
                <ProgressBar 
                  now={getProgress()} 
                  className="wizard-progress" 
                  variant="success"
                />
              </div>

              <Form noValidate onSubmit={handleSubmit} className="onboarding-form">
                <Card className="step-card">
                  <Card.Body>
                    {/* STEP 1: Physical Stats */}
                    {currentStep === 1 && (
                      <div className="step-content animate-step">
                        <h3 className="step-title">
                          <FaUser className="me-2" />
                          Tell us about yourself
                        </h3>
                        <p className="step-description">We need your basic physical stats to create your personalized plan</p>
                        
                        <Row className="mb-3">
                          <Col md={4}>
                            <Form.Group controlId="age">
                              <Form.Label>Age *</Form.Label>
                              <Form.Control
                                type="number"
                                name="age"
                                placeholder="25"
                                value={values.age}
                                onChange={handleChange}
                                isInvalid={touched.age && errors.age}
                                className="form-input"
                              />
                              <Form.Control.Feedback type="invalid">{errors.age}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group controlId="height">
                              <Form.Label>Height (cm) *</Form.Label>
                              <Form.Control
                                type="number"
                                name="height"
                                placeholder="175"
                                value={values.height}
                                onChange={handleChange}
                                isInvalid={touched.height && errors.height}
                                className="form-input"
                              />
                              <Form.Control.Feedback type="invalid">{errors.height}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group controlId="weight">
                              <Form.Label>Weight (kg) *</Form.Label>
                              <Form.Control
                                type="number"
                                name="weight"
                                placeholder="70"
                                value={values.weight}
                                onChange={handleChange}
                                isInvalid={touched.weight && errors.weight}
                                className="form-input"
                              />
                              <Form.Control.Feedback type="invalid">{errors.weight}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row className="mb-3">
                          <Col md={12}>
                            <Form.Group controlId="bodyFat">
                              <Form.Label>Body Fat % <span className="optional-badge">(Optional)</span></Form.Label>
                              <Form.Control
                                type="number"
                                name="bodyFat"
                                placeholder="15"
                                value={values.bodyFat}
                                onChange={handleChange}
                                isInvalid={touched.bodyFat && errors.bodyFat}
                                className="form-input"
                              />
                              <Form.Control.Feedback type="invalid">{errors.bodyFat}</Form.Control.Feedback>
                              <Form.Text className="text-muted">Don't know? You can skip this for now.</Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>
                    )}

                    {/* STEP 2: Fitness Goals */}
                    {currentStep === 2 && (
                      <div className="step-content animate-step">
                        <h3 className="step-title">
                          <FaDumbbell className="me-2" />
                          What are your fitness goals?
                        </h3>
                        <p className="step-description">Help us understand your objectives and current fitness level</p>

                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group controlId="fitnessLevel">
                              <Form.Label>Fitness Level *</Form.Label>
                              <Form.Select
                                name="fitnessLevel"
                                value={values.fitnessLevel}
                                onChange={handleChange}
                                isInvalid={touched.fitnessLevel && errors.fitnessLevel}
                                className="form-input"
                              >
                                <option value="">Select your level</option>
                                <option value="Beginner">🌱 Beginner</option>
                                <option value="Intermediate">💪 Intermediate</option>
                                <option value="Advanced">🔥 Advanced</option>
                              </Form.Select>
                              <Form.Control.Feedback type="invalid">{errors.fitnessLevel}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group controlId="goal">
                              <Form.Label>Primary Goal *</Form.Label>
                              <Form.Select
                                name="goal"
                                value={values.goal}
                                onChange={handleChange}
                                isInvalid={touched.goal && errors.goal}
                                className="form-input"
                              >
                                <option value="">Select your goal</option>
                                <option value="Muscle Gain">💪 Muscle Gain</option>
                                <option value="Fat Loss">🔥 Fat Loss</option>
                                <option value="Endurance">🏃 Endurance</option>
                              </Form.Select>
                              <Form.Control.Feedback type="invalid">{errors.goal}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row className="mb-3">
                          <Col md={12}>
                            <Form.Group controlId="frequency">
                              <Form.Label>Workout Frequency *</Form.Label>
                              <Form.Select
                                name="frequency"
                                value={values.frequency}
                                onChange={handleChange}
                                isInvalid={touched.frequency && errors.frequency}
                                className="form-input"
                              >
                                <option value="">Select frequency</option>
                                <option value="1-2 times a week">📅 1-2 times a week</option>
                                <option value="3-4 times a week">📆 3-4 times a week</option>
                                <option value="5+ times a week">🗓️ 5+ times a week</option>
                              </Form.Select>
                              <Form.Control.Feedback type="invalid">{errors.frequency}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>
                    )}

                    {/* STEP 3: Lifestyle */}
                    {currentStep === 3 && (
                      <div className="step-content animate-step">
                        <h3 className="step-title">
                          <FaBed className="me-2" />
                          Your daily lifestyle
                        </h3>
                        <p className="step-description">These details help us optimize your recovery and nutrition</p>

                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Group controlId="activityLevel">
                              <Form.Label>Daily Activity Level *</Form.Label>
                              <Form.Select
                                name="activityLevel"
                                value={values.activityLevel}
                                onChange={handleChange}
                                isInvalid={touched.activityLevel && errors.activityLevel}
                                className="form-input"
                              >
                                <option value="">Select activity level</option>
                                <option value="Sedentary">🪑 Sedentary (Minimal movement)</option>
                                <option value="Lightly Active">🚶 Lightly Active (Some movement daily)</option>
                                <option value="Active">🏃 Active (Frequent physical activity)</option>
                                <option value="Very Active">⚡ Very Active (Intense training or labor)</option>
                              </Form.Select>
                              <Form.Control.Feedback type="invalid">{errors.activityLevel}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group controlId="sleepHours">
                              <Form.Label>Sleep Hours Per Night *</Form.Label>
                              <Form.Control
                                type="number"
                                name="sleepHours"
                                placeholder="7"
                                value={values.sleepHours}
                                onChange={handleChange}
                                isInvalid={touched.sleepHours && errors.sleepHours}
                                className="form-input"
                              />
                              <Form.Control.Feedback type="invalid">{errors.sleepHours}</Form.Control.Feedback>
                              <Form.Text className="text-muted">Recommended: 7-9 hours</Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row className="mb-3">
                          <Col md={12}>
                            <Form.Group controlId="bodyType">
                              <Form.Label>Body Type <span className="optional-badge">(Optional)</span></Form.Label>
                              <Form.Select
                                name="bodyType"
                                value={values.bodyType}
                                onChange={handleChange}
                                className="form-input"
                              >
                                <option value="">Select your body type</option>
                                <option value="Ectomorph">Ectomorph (Lean & Slim)</option>
                                <option value="Mesomorph">Mesomorph (Athletic & Muscular)</option>
                                <option value="Endomorph">Endomorph (Broad & Higher Fat Storage)</option>
                              </Form.Select>
                              <Form.Text className="text-muted">This helps personalize your nutrition plan</Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="step-navigation">
                      {currentStep > 1 && (
                        <Button
                          variant="outline-light"
                          onClick={() => setCurrentStep(currentStep - 1)}
                          className="nav-btn prev-btn"
                        >
                          <FaArrowLeft className="me-2" />
                          Previous
                        </Button>
                      )}
                      
                      {currentStep < totalSteps && (
                        <Button
                          variant="primary"
                          onClick={() => {
                            // Validate current step before proceeding
                            if (currentStep === 1) {
                              setTouched({ age: true, height: true, weight: true });
                              if (isStep1Valid(values, errors)) {
                                setCurrentStep(currentStep + 1);
                              }
                            } else if (currentStep === 2) {
                              setTouched({ fitnessLevel: true, goal: true, frequency: true });
                              if (isStep2Valid(values, errors)) {
                                setCurrentStep(currentStep + 1);
                              }
                            }
                          }}
                          className="nav-btn next-btn ms-auto"
                        >
                          Next Step
                          <FaArrowRight className="ms-2" />
                        </Button>
                      )}

                      {currentStep === totalSteps && (
                        <Button
                          type="submit"
                          className="nav-btn submit-btn ms-auto"
                        >
                          <FaCheckCircle className="me-2" />
                          Complete Profile
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Form>
            </div>
          )}
        </Formik>
      </Container>
    </section>
  );
};

export default OnboardingForm;