import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  ProgressBar,
  Modal,
  Tabs,
  Tab,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  FaAppleAlt,
  FaFire,
  FaDumbbell,
  FaCarrot,
  FaCheese,
  FaTint,
  FaClock,
  FaHeart,
  FaStar,
  FaExchangeAlt,
  FaChartLine,
  FaUtensils,
  FaLeaf,
  FaShoppingCart,
  FaCalendarAlt,
} from "react-icons/fa";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import mealData from "./NutritionGuide.json";
import "./NutritionGuide.css";
import { useAuth } from "../../../../context/AuthContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const NutritionGuide = () => {
  const { fetchWithAuth } = useAuth();

  // User Profile Data
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [goal, setGoal] = useState("Maintain Weight");
  const [dietType, setDietType] = useState("Balanced");
  const [activityLevel, setActivityLevel] = useState("Moderate");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");

  // Calculated Values
  const [caloricNeeds, setCaloricNeeds] = useState(null);
  const [waterIntake, setWaterIntake] = useState(null);
  const [macroTargets, setMacroTargets] = useState({
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  // Meal Plan State
  const [currentDay, setCurrentDay] = useState(0);
  const [mealPlan, setMealPlan] = useState({});
  const [savedMealPlans, setSavedMealPlans] = useState([]);

  // UI State
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState("");
  const [showGroceryList, setShowGroceryList] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator");
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetchWithAuth(
          "http://localhost:8000/user-detail/"
        );
        if (response.profile) {
          const profile = response.profile;
          setAge(profile.age || "");
          setHeight(profile.height_cm || "");
          setWeight(profile.weight_kg || "");
          setGender(profile.gender || "Male");
          setActivityLevel(mapActivityLevel(profile.daily_activity_level));
          setGoal(mapGoal(profile.primary_goal));
          setProfileLoaded(true);
        }
      } catch (error) {
        console.log("No profile found, using manual entry");
      }
    };
    loadUserProfile();
  }, [fetchWithAuth]);

  // Helper functions to map backend data to frontend
  const mapActivityLevel = (level) => {
    const mapping = {
      sedentary: "Sedentary",
      lightly_active: "Light",
      active: "Moderate",
      very_active: "Very Active",
    };
    return mapping[level] || "Moderate";
  };

  const mapGoal = (primaryGoal) => {
    const mapping = {
      muscle_gain: "Gain Muscle",
      fat_loss: "Lose Weight",
      endurance: "Maintain Weight",
    };
    return mapping[primaryGoal] || "Maintain Weight";
  };

  // Calculate nutritional needs
  const calculateNeeds = () => {
    if (!weight || !height || !age) {
      alert("Please fill in all fields");
      return;
    }

    // BMR Calculation (Mifflin-St Jeor Equation)
    let bmr =
      gender === "Male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    // Activity multiplier
    const activityMultipliers = {
      Sedentary: 1.2,
      Light: 1.375,
      Moderate: 1.55,
      Active: 1.725,
      "Very Active": 1.9,
    };

    let tdee = bmr * activityMultipliers[activityLevel];

    // Adjust for goal
    let calorieIntake = tdee;
    if (goal === "Lose Weight") calorieIntake -= 500;
    else if (goal === "Gain Muscle") calorieIntake += 500;

    setCaloricNeeds(Math.round(calorieIntake));
    setWaterIntake(Math.round(weight * 0.035 * 1000));

    // Calculate macro targets based on diet type
    calculateMacros(Math.round(calorieIntake));

    // Generate meal plan
    generateMealPlan(Math.round(calorieIntake));

    // Switch to meal plan tab
    setActiveTab("mealPlan");
  };

  const calculateMacros = (calories) => {
    let proteinRatio, carbRatio, fatRatio;

    switch (dietType) {
      case "High-Protein":
        proteinRatio = 0.35;
        carbRatio = 0.4;
        fatRatio = 0.25;
        break;
      case "Keto":
        proteinRatio = 0.25;
        carbRatio = 0.05;
        fatRatio = 0.7;
        break;
      case "Vegan":
      case "Mediterranean":
      case "Balanced":
      default:
        proteinRatio = 0.3;
        carbRatio = 0.4;
        fatRatio = 0.3;
    }

    setMacroTargets({
      protein: Math.round((calories * proteinRatio) / 4),
      carbs: Math.round((calories * carbRatio) / 4),
      fats: Math.round((calories * fatRatio) / 9),
    });
  };

  // Generate weekly meal plan
  const generateMealPlan = (calories) => {
    const plan = {};
    const targetCaloriesPerMeal = calories / 4; // Breakfast, Lunch, Dinner, Snacks

    daysOfWeek.forEach((day) => {
      plan[day] = {
        breakfast: selectMeal("breakfast", targetCaloriesPerMeal),
        lunch: selectMeal("lunch", targetCaloriesPerMeal),
        dinner: selectMeal("dinner", targetCaloriesPerMeal),
        snacks: selectMeal("snacks", targetCaloriesPerMeal * 0.5),
      };
    });

    setMealPlan(plan);
  };

  // Smart meal selection
  const selectMeal = (mealType, targetCalories) => {
    const meals = mealData[mealType][dietType] || [];
    if (meals.length === 0) return null;

    // Find meal closest to target calories
    const sorted = [...meals].sort((a, b) => {
      const diffA = Math.abs(a.calories - targetCalories);
      const diffB = Math.abs(b.calories - targetCalories);
      return diffA - diffB;
    });

    // Return a random meal from top 3 closest matches for variety
    const topMatches = sorted.slice(0, Math.min(3, sorted.length));
    return topMatches[Math.floor(Math.random() * topMatches.length)];
  };

  // Swap meal functionality
  const swapMeal = (mealType) => {
    const meals = mealData[mealType][dietType] || [];
    if (meals.length === 0) return;

    const currentMeal = mealPlan[daysOfWeek[currentDay]][mealType];
    const availableMeals = meals.filter((m) => m.id !== currentMeal?.id);

    if (availableMeals.length === 0) return;

    const newMeal =
      availableMeals[Math.floor(Math.random() * availableMeals.length)];

    setMealPlan((prev) => ({
      ...prev,
      [daysOfWeek[currentDay]]: {
        ...prev[daysOfWeek[currentDay]],
        [mealType]: newMeal,
      },
    }));
  };

  // Get total macros for current day
  const getTotalMacros = () => {
    const day = daysOfWeek[currentDay];
    const meals = mealPlan[day];
    if (!meals) return { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };

    return {
      calories: Object.values(meals).reduce(
        (acc, meal) => acc + (meal?.calories || 0),
        0
      ),
      protein: Object.values(meals).reduce(
        (acc, meal) => acc + (meal?.protein || 0),
        0
      ),
      carbs: Object.values(meals).reduce(
        (acc, meal) => acc + (meal?.carbs || 0),
        0
      ),
      fats: Object.values(meals).reduce(
        (acc, meal) => acc + (meal?.fats || 0),
        0
      ),
      fiber: Object.values(meals).reduce(
        (acc, meal) => acc + (meal?.fiber || 0),
        0
      ),
    };
  };

  const totalMacros = getTotalMacros();

  // Toggle favorite meal
  const toggleFavorite = (meal) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.id === meal.id);
      if (exists) {
        return prev.filter((f) => f.id !== meal.id);
      } else {
        return [...prev, meal];
      }
    });
  };

  const isFavorite = (meal) => {
    return favorites.some((f) => f.id === meal?.id);
  };

  // Generate grocery list
  const generateGroceryList = () => {
    const ingredients = new Set();
    Object.values(mealPlan).forEach((day) => {
      Object.values(day).forEach((meal) => {
        if (meal?.ingredients) {
          meal.ingredients.forEach((ingredient) => ingredients.add(ingredient));
        }
      });
    });
    return Array.from(ingredients).sort();
  };

  // Macro progress bars
  const MacroProgress = ({ label, current, target, color, icon }) => {
    const percentage = Math.min((current / target) * 100, 100);
    return (
      <div className="macro-progress mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="macro-label">
            {icon} {label}
          </span>
          <span className="macro-value">
            {Math.round(current)}g / {target}g
          </span>
        </div>
        <ProgressBar
          now={percentage}
          variant={color}
          className="macro-bar"
          style={{ height: "12px" }}
        />
      </div>
    );
  };

  // Meal card component
  const MealCard = ({ meal, mealType }) => {
    if (!meal) {
      return (
        <Card className="meal-card empty-meal">
          <Card.Body>
            <p className="text-muted">No meal selected</p>
            <Button variant="outline-primary" size="sm">
              Add Meal
            </Button>
          </Card.Body>
        </Card>
      );
    }

    return (
      <Card className="meal-card">
        <div
          className="meal-image"
          style={{ backgroundImage: `url(${meal.image})` }}
        >
          <div className="meal-overlay">
            <div className="meal-badges">
              <Badge bg="dark" className="calorie-badge">
                <FaFire /> {meal.calories} kcal
              </Badge>
              <Badge bg="info" className="time-badge">
                <FaClock /> {meal.prep_time}
              </Badge>
            </div>
            <Button
              variant="light"
              size="sm"
              className="favorite-btn"
              onClick={() => toggleFavorite(meal)}
            >
              <FaStar
                className={isFavorite(meal) ? "text-warning" : "text-muted"}
              />
            </Button>
          </div>
        </div>
        <Card.Body>
          <h5 className="meal-name">{meal.name}</h5>
          <p className="meal-description">{meal.description}</p>

          <div className="meal-tags mb-2">
            {meal.tags?.slice(0, 3).map((tag, idx) => (
              <Badge
                key={idx}
                bg="secondary"
                className="me-1 mb-1"
                style={{ fontSize: "0.7rem" }}
              >
                {tag}
              </Badge>
            ))}
          </div>

          <Row className="meal-macros text-center mb-2">
            <Col>
              <div className="macro-item">
                <FaDumbbell className="text-danger" />
                <small className="d-block">{meal.protein}g</small>
                <small className="text-muted">Protein</small>
              </div>
            </Col>
            <Col>
              <div className="macro-item">
                <FaCarrot className="text-warning" />
                <small className="d-block">{meal.carbs}g</small>
                <small className="text-muted">Carbs</small>
              </div>
            </Col>
            <Col>
              <div className="macro-item">
                <FaCheese className="text-info" />
                <small className="d-block">{meal.fats}g</small>
                <small className="text-muted">Fats</small>
              </div>
            </Col>
          </Row>

          <div className="meal-actions">
            <Button
              variant="outline-primary"
              size="sm"
              className="me-2"
              onClick={() => {
                setSelectedMeal(meal);
                setSelectedMealType(mealType);
                setShowMealModal(true);
              }}
            >
              <FaUtensils className="me-1" /> Details
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => swapMeal(mealType)}
            >
              <FaExchangeAlt className="me-1" /> Swap
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <section className="ng nutrition-guide-section">
      <Container>
        <div className="section-header text-center mb-4">
          <h2 className="section-titles">
            <FaAppleAlt className="me-2" />
            Advanced Nutrition Guide
          </h2>
          <p className="section-subtitle">
            Personalized meal planning powered by your fitness goals
          </p>
        </div>

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="nutrition-tabs mb-4"
        >
          {/* Calculator Tab */}
          <Tab
            eventKey="calculator"
            title={
              <>
                <FaChartLine className="me-2" />
                Calculator
              </>
            }
          >
            <Card className="calculator-card">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h4 className="mb-3">
                      <FaHeart className="me-2 text-danger" />
                      Your Profile
                    </h4>
                    {profileLoaded && (
                      <div className="alert alert-info mb-3">
                        <small>
                          ✅ Profile auto-loaded from your fitness data
                        </small>
                      </div>
                    )}

                    <Form.Group className="mb-3">
                      <Form.Label>Gender</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          type="radio"
                          label="Male"
                          checked={gender === "Male"}
                          onChange={() => setGender("Male")}
                        />
                        <Form.Check
                          inline
                          type="radio"
                          label="Female"
                          checked={gender === "Female"}
                          onChange={() => setGender("Female")}
                        />
                      </div>
                    </Form.Group>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Age</Form.Label>
                          <Form.Control
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="25"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Weight (kg)</Form.Label>
                          <Form.Control
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            placeholder="70"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Height (cm)</Form.Label>
                          <Form.Control
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            placeholder="175"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>

                  <Col md={6}>
                    <h4 className="mb-3">
                      <FaDumbbell className="me-2 text-primary" />
                      Goals & Activity
                    </h4>

                    <Form.Group className="mb-3">
                      <Form.Label>Primary Goal</Form.Label>
                      <Form.Select
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                      >
                        <option>Maintain Weight</option>
                        <option>Lose Weight</option>
                        <option>Gain Muscle</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Dietary Preference</Form.Label>
                      <Form.Select
                        value={dietType}
                        onChange={(e) => setDietType(e.target.value)}
                      >
                        <option>Balanced</option>
                        <option>Vegan</option>
                        <option>Keto</option>
                        <option>High-Protein</option>
                        <option>Mediterranean</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Activity Level</Form.Label>
                      <Form.Select
                        value={activityLevel}
                        onChange={(e) => setActivityLevel(e.target.value)}
                      >
                        <option>Sedentary</option>
                        <option>Light</option>
                        <option>Moderate</option>
                        <option>Active</option>
                        <option>Very Active</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="text-center mt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={calculateNeeds}
                    className="calculate-btn"
                  >
                    <FaChartLine className="me-2" />
                    Generate My Meal Plan
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {caloricNeeds && (
              <Row className="mt-4">
                <Col md={4}>
                  <Card className="stat-card calories-card">
                    <Card.Body className="text-center">
                      <FaFire className="stat-icon" />
                      <h3 className="stat-value">{caloricNeeds}</h3>
                      <p className="stat-label">Daily Calories</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="stat-card water-card">
                    <Card.Body className="text-center">
                      <FaTint className="stat-icon" />
                      <h3 className="stat-value">{waterIntake}</h3>
                      <p className="stat-label">Water Intake (ml)</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="stat-card macro-card">
                    <Card.Body className="text-center">
                      <FaDumbbell className="stat-icon" />
                      <h3 className="stat-value">
                        {macroTargets.protein}/{macroTargets.carbs}/
                        {macroTargets.fats}
                      </h3>
                      <p className="stat-label">P/C/F (grams)</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Tab>

          {/* Meal Plan Tab */}
          <Tab
            eventKey="mealPlan"
            title={
              <>
                <FaCalendarAlt className="me-2" />
                Meal Plan
              </>
            }
          >
            {Object.keys(mealPlan).length === 0 ? (
              <Card className="empty-state-card">
                <Card.Body className="text-center py-5">
                  <FaUtensils className="empty-icon mb-3" />
                  <h4>No Meal Plan Yet</h4>
                  <p className="text-muted">
                    Go to the Calculator tab to generate your personalized meal
                    plan
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setActiveTab("calculator")}
                  >
                    Get Started
                  </Button>
                </Card.Body>
              </Card>
            ) : (
              <>
                {/* Day Selector */}
                <div className="day-selector mb-4">
                  <Row className="g-2">
                    {daysOfWeek.map((day, index) => (
                      <Col key={day}>
                        <Button
                          variant={
                            currentDay === index ? "primary" : "outline-primary"
                          }
                          className="w-100 day-btn"
                          onClick={() => setCurrentDay(index)}
                        >
                          {day.substring(0, 3)}
                        </Button>
                      </Col>
                    ))}
                  </Row>
                </div>

                {/* Current Day Header */}
                <div className="current-day-header mb-4">
                  <h3 className="day-title">{daysOfWeek[currentDay]}</h3>
                  <div className="day-actions">
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => setShowGroceryList(true)}
                    >
                      <FaShoppingCart className="me-1" /> Grocery List
                    </Button>
                  </div>
                </div>

                {/* Macro Summary */}
                <Card className="macro-summary-card mb-4">
                  <Card.Body>
                    <Row>
                      <Col md={8}>
                        <h5 className="mb-3">Daily Macro Targets</h5>
                        <MacroProgress
                          label="Protein"
                          current={totalMacros.protein}
                          target={macroTargets.protein}
                          color="danger"
                          icon={<FaDumbbell />}
                        />
                        <MacroProgress
                          label="Carbs"
                          current={totalMacros.carbs}
                          target={macroTargets.carbs}
                          color="warning"
                          icon={<FaCarrot />}
                        />
                        <MacroProgress
                          label="Fats"
                          current={totalMacros.fats}
                          target={macroTargets.fats}
                          color="info"
                          icon={<FaCheese />}
                        />
                      </Col>
                      <Col md={4} className="text-center">
                        <div className="total-calories-circle">
                          <FaFire className="fire-icon" />
                          <h2 className="calories-number">
                            {totalMacros.calories}
                          </h2>
                          <p className="calories-label">
                            / {caloricNeeds} kcal
                          </p>
                          <small className="text-muted">
                            {totalMacros.fiber}g fiber
                          </small>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Meals Grid */}
                <Row className="meals-grid">
                  <Col md={6} className="mb-4">
                    <div className="meal-section">
                      <div className="meal-type-header">
                        <h5>🌅 Breakfast</h5>
                      </div>
                      <MealCard
                        meal={mealPlan[daysOfWeek[currentDay]]?.breakfast}
                        mealType="breakfast"
                      />
                    </div>
                  </Col>

                  <Col md={6} className="mb-4">
                    <div className="meal-section">
                      <div className="meal-type-header">
                        <h5>☀️ Lunch</h5>
                      </div>
                      <MealCard
                        meal={mealPlan[daysOfWeek[currentDay]]?.lunch}
                        mealType="lunch"
                      />
                    </div>
                  </Col>

                  <Col md={6} className="mb-4">
                    <div className="meal-section">
                      <div className="meal-type-header">
                        <h5>🌙 Dinner</h5>
                      </div>
                      <MealCard
                        meal={mealPlan[daysOfWeek[currentDay]]?.dinner}
                        mealType="dinner"
                      />
                    </div>
                  </Col>

                  <Col md={6} className="mb-4">
                    <div className="meal-section">
                      <div className="meal-type-header">
                        <h5>🍎 Snacks</h5>
                      </div>
                      <MealCard
                        meal={mealPlan[daysOfWeek[currentDay]]?.snacks}
                        mealType="snacks"
                      />
                    </div>
                  </Col>
                </Row>
              </>
            )}
          </Tab>

          {/* Favorites Tab */}
          <Tab
            eventKey="favorites"
            title={
              <>
                <FaStar className="me-2" />
                Favorites ({favorites.length})
              </>
            }
          >
            {favorites.length === 0 ? (
              <Card className="empty-state-card">
                <Card.Body className="text-center py-5">
                  <FaStar className="empty-icon mb-3" />
                  <h4>No Favorites Yet</h4>
                  <p className="text-muted">
                    Click the star icon on any meal to add it to your favorites
                  </p>
                </Card.Body>
              </Card>
            ) : (
              <Row>
                {favorites.map((meal) => (
                  <Col md={6} lg={4} key={meal.id} className="mb-4">
                    <Card className="meal-card">
                      <div
                        className="meal-image"
                        style={{ backgroundImage: `url(${meal.image})` }}
                      >
                        <div className="meal-overlay">
                          <Badge bg="dark" className="calorie-badge">
                            <FaFire /> {meal.calories} kcal
                          </Badge>
                          <Button
                            variant="light"
                            size="sm"
                            className="favorite-btn"
                            onClick={() => toggleFavorite(meal)}
                          >
                            <FaStar className="text-warning" />
                          </Button>
                        </div>
                      </div>
                      <Card.Body>
                        <h5 className="meal-name">{meal.name}</h5>
                        <p className="meal-description small">
                          {meal.description}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Tab>
        </Tabs>

        {/* Meal Details Modal */}
        <Modal
          show={showMealModal}
          onHide={() => setShowMealModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{selectedMeal?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedMeal && (
              <>
                <div
                  className="modal-meal-image mb-3"
                  style={{
                    backgroundImage: `url(${selectedMeal.image})`,
                    height: "250px",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "8px",
                  }}
                ></div>

                <p className="lead">{selectedMeal.description}</p>

                <Row className="mb-3">
                  <Col md={3} className="text-center">
                    <div className="modal-macro">
                      <FaFire className="text-danger" />
                      <h4>{selectedMeal.calories}</h4>
                      <small>Calories</small>
                    </div>
                  </Col>
                  <Col md={3} className="text-center">
                    <div className="modal-macro">
                      <FaDumbbell className="text-danger" />
                      <h4>{selectedMeal.protein}g</h4>
                      <small>Protein</small>
                    </div>
                  </Col>
                  <Col md={3} className="text-center">
                    <div className="modal-macro">
                      <FaCarrot className="text-warning" />
                      <h4>{selectedMeal.carbs}g</h4>
                      <small>Carbs</small>
                    </div>
                  </Col>
                  <Col md={3} className="text-center">
                    <div className="modal-macro">
                      <FaCheese className="text-info" />
                      <h4>{selectedMeal.fats}g</h4>
                      <small>Fats</small>
                    </div>
                  </Col>
                </Row>

                <div className="mb-3">
                  <h5>
                    <FaUtensils className="me-2" />
                    Ingredients
                  </h5>
                  <ul className="ingredients-list">
                    {selectedMeal.ingredients?.map((ingredient, idx) => (
                      <li key={idx}>{ingredient}</li>
                    ))}
                  </ul>
                </div>

                <Row>
                  <Col md={6}>
                    <div className="meal-detail-item">
                      <FaClock className="me-2 text-primary" />
                      <strong>Prep Time:</strong> {selectedMeal.prep_time}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="meal-detail-item">
                      <FaLeaf className="me-2 text-success" />
                      <strong>Difficulty:</strong> {selectedMeal.difficulty}
                    </div>
                  </Col>
                </Row>

                <div className="mt-3">
                  <strong>Tags:</strong>{" "}
                  {selectedMeal.tags?.map((tag, idx) => (
                    <Badge key={idx} bg="secondary" className="me-1 mb-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="outline-secondary"
              onClick={() => setShowMealModal(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                swapMeal(selectedMealType);
                setShowMealModal(false);
              }}
            >
              <FaExchangeAlt className="me-1" /> Swap This Meal
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Grocery List Modal */}
        <Modal
          show={showGroceryList}
          onHide={() => setShowGroceryList(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <FaShoppingCart className="me-2" />
              Weekly Grocery List
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted mb-3">
              All ingredients needed for your {daysOfWeek.length}-day meal plan
            </p>
            <Row>
              {generateGroceryList().map((ingredient, idx) => (
                <Col md={6} key={idx}>
                  <div className="grocery-item">
                    <Form.Check type="checkbox" label={ingredient} />
                  </div>
                </Col>
              ))}
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowGroceryList(false)}
            >
              Close
            </Button>
            <Button variant="primary">
              <FaShoppingCart className="me-1" /> Export List
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </section>
  );
};

export default NutritionGuide;