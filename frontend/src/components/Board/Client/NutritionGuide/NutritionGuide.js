import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Carousel } from "react-bootstrap";
import mealData from "./NutritionGuide.json";
import "./NutritionGuide.css";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const NutritionGuide = () => {
  const [goal, setGoal] = useState("Maintain Weight");
  const [dietType, setDietType] = useState("Balanced");
  const [activityLevel, setActivityLevel] = useState("Moderate");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [caloricNeeds, setCaloricNeeds] = useState(null);
  const [waterIntake, setWaterIntake] = useState(null);
  const [currentDay, setCurrentDay] = useState(0);
  const [mealPlan, setMealPlan] = useState({});

  // Calculate caloric needs
  const calculateNeeds = () => {
    if (!weight || !height || !age) return;

    let bmr = gender === "Male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

    let activityMultiplier = {
      Sedentary: 1.2,
      Light: 1.375,
      Moderate: 1.55,
      Active: 1.725,
      "Very Active": 1.9,
    }[activityLevel];

    let calorieIntake = bmr * activityMultiplier;
    if (goal === "Lose Weight") calorieIntake -= 500;
    else if (goal === "Gain Muscle") calorieIntake += 500;

    setCaloricNeeds(Math.round(calorieIntake));
    setWaterIntake(Math.round(weight * 0.035 * 1000));

    generateMealPlan(Math.round(calorieIntake));
  };

  // Generate weekly meal plan
  const generateMealPlan = (calories) => {
    const plan = {};
    daysOfWeek.forEach((day) => {
      plan[day] = {
        breakfast: getMeal("breakfast", calories),
        lunch: getMeal("lunch", calories),
        dinner: getMeal("dinner", calories),
        snacks: getMeal("snacks", calories),
      };
    });
    setMealPlan(plan);
  };

  // Get a meal based on caloric needs
  const getMeal = (mealType, calories) => {
    const meals = mealData[mealType][dietType] || [];
    return meals.find((meal) => Math.abs(meal.calories - calories / 4) < 100) || meals[0];
  };

  // Swap meal functionality (Updates state properly)
  const swapMeal = (mealType) => {
    const meals = mealData[mealType][dietType] || [];
    const newMeal = meals[Math.floor(Math.random() * meals.length)];
    setMealPlan((prev) => ({
      ...prev,
      [daysOfWeek[currentDay]]: {
        ...prev[daysOfWeek[currentDay]],
        [mealType]: newMeal,
      },
    }));
  };

  // Get total macros per day
  const getTotalMacros = () => {
    const day = daysOfWeek[currentDay];
    const meals = mealPlan[day];
    return meals
      ? {
          calories: Object.values(meals).reduce((acc, meal) => acc + meal.calories, 0),
          protein: Object.values(meals).reduce((acc, meal) => acc + meal.protein, 0),
          carbs: Object.values(meals).reduce((acc, meal) => acc + meal.carbs, 0),
          fats: Object.values(meals).reduce((acc, meal) => acc + meal.fats, 0),
        }
      : { calories: 0, protein: 0, carbs: 0, fats: 0 };
  };

  const totalMacros = getTotalMacros();

  return (
    <section className="nutrition-guide-section">
      <Container>
        <h2 className="nutrition-title">Advanced Nutrition Guide</h2>
        <p className="nutrition-description">Customize your meal plan based on your fitness goals.</p>

        {/* Inputs Section */}
        <Row className="nutrition-inputs">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Goal</Form.Label>
              <Form.Select value={goal} onChange={(e) => setGoal(e.target.value)}>
                <option>Maintain Weight</option>
                <option>Lose Weight</option>
                <option>Gain Muscle</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>Dietary Preference</Form.Label>
              <Form.Select value={dietType} onChange={(e) => setDietType(e.target.value)}>
                <option>Balanced</option>
                <option>Vegan</option>
                <option>Keto</option>
                <option>High-Protein</option>
                <option>Mediterranean</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label>Weight (kg)</Form.Label>
              <Form.Control type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label>Height (cm)</Form.Label>
              <Form.Control type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
            </Form.Group>
          </Col>

          <Col md={4}>
            <Form.Group>
              <Form.Label>Age</Form.Label>
              <Form.Control type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            </Form.Group>
          </Col>
        </Row>

        <Button variant="primary" className="calculate-btn" onClick={calculateNeeds}>Calculate Needs</Button>

        {/* Results Section */}
        {caloricNeeds && (
          <>
            <Row className="results-section">
              <Col md={4}>
                <Card className="result-card">
                  <Card.Body>
                    <h5>Daily Caloric Needs</h5>
                    <p>{caloricNeeds} kcal</p>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card className="result-card">
                  <Card.Body>
                    <h5>Recommended Daily Water Intake</h5>
                    <p>{waterIntake} ml</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Meal Plan Carousel */}
            <Carousel className="meal-plan-carousel" interval={null}>
              {daysOfWeek.map((day, index) => (
                <Carousel.Item key={index}>
                  <h4>{day}'s Meal Plan</h4>
                  {["breakfast", "lunch", "dinner", "snacks"].map((mealType) => (
                    <Card key={mealType} className="meal-card">
                      <Card.Body>
                        <h5>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</h5>
                        <p>{mealPlan[day]?.[mealType]?.name || "No meal found"}</p>
                        <p className="meal-info">
                          Calories: {mealPlan[day]?.[mealType]?.calories} kcal | Protein: {mealPlan[day]?.[mealType]?.protein}g | Carbs: {mealPlan[day]?.[mealType]?.carbs}g | Fats: {mealPlan[day]?.[mealType]?.fats}g
                        </p>
                        <Button variant="info" onClick={() => swapMeal(mealType)}>Swap Meal</Button>
                      </Card.Body>
                    </Card>
                  ))}
                </Carousel.Item>
              ))}
            </Carousel>
                        {/* Total Daily Macros */}
                        <div className="total-summary">
              <h4>Total Daily Macros:</h4>
              <p>{totalMacros.calories} kcal | {totalMacros.protein}g Protein | {totalMacros.carbs}g Carbs | {totalMacros.fats}g Fats</p>
            </div>
          </>
        )}
      </Container>
    </section>
  );
};

export default NutritionGuide;
