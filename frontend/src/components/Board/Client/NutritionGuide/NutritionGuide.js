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
  Alert,
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
  FaPlus,
  FaTrash,
  FaDownload,
  FaExclamationTriangle,
} from "react-icons/fa";
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
import jsPDF from "jspdf";

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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

  // Meal Plan State - NOW NUMBERED MEALS INSTEAD OF MEAL TYPES
  const [currentDay, setCurrentDay] = useState(0);
  const [mealPlan, setMealPlan] = useState({});

  // UI State
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedMealIndex, setSelectedMealIndex] = useState(0);
  const [showGroceryList, setShowGroceryList] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator");
  const [favorites, setFavorites] = useState([]);

  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetchWithAuth(
          `${API_URL}/user-detail/`
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

  // Helper functions
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

    let bmr =
      gender === "Male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    const activityMultipliers = {
      Sedentary: 1.2,
      Light: 1.375,
      Moderate: 1.55,
      Active: 1.725,
      "Very Active": 1.9,
    };

    let tdee = bmr * activityMultipliers[activityLevel];
    let calorieIntake = tdee;
    if (goal === "Lose Weight") calorieIntake -= 500;
    else if (goal === "Gain Muscle") calorieIntake += 500;

    setCaloricNeeds(Math.round(calorieIntake));
    setWaterIntake(Math.round(weight * 0.035 * 1000));
    calculateMacros(Math.round(calorieIntake));
    generateIntelligentMealPlan(Math.round(calorieIntake));
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

  // Get all available meals
  const getAllMeals = () => {
    const allMeals = [];
    Object.values(mealData).forEach(category => {
      if (dietType in category) {
        allMeals.push(...category[dietType]);
      }
    });
    return allMeals;
  };

  // DUPLICATE PREVENTION
  const isMealDuplicate = (mealId, dayMeals) => {
    return dayMeals.some(meal => meal.id === mealId);
  };

  // INTELLIGENT MEAL GENERATION
  const generateIntelligentMealPlan = (targetCalories) => {
    const plan = {};
    daysOfWeek.forEach((day) => {
      plan[day] = generateDayMeals(targetCalories);
    });
    setMealPlan(plan);
  };

  const generateDayMeals = (targetCalories) => {
    const dayMeals = [];
    const allMeals = getAllMeals();
    
    if (allMeals.length === 0) return dayMeals;

    const tolerance = 0.05;
    const minCalories = targetCalories * (1 - tolerance);
    const maxCalories = targetCalories * (1 + tolerance);

    // Base meals
    const baseMealSizes = [
      targetCalories * 0.25,
      targetCalories * 0.35,
      targetCalories * 0.35,
    ];

    baseMealSizes.forEach(targetSize => {
      const meal = selectMeal(allMeals, targetSize, dayMeals);
      if (meal) dayMeals.push(meal);
    });
    
    let currentTotals = calculateMealTotals(dayMeals);
    let attempts = 0;
    const maxAttempts = 20;
    
    while (currentTotals.calories < minCalories && attempts < maxAttempts) {
      attempts++;
      const deficit = targetCalories - currentTotals.calories;
      const newMeal = selectMeal(allMeals, deficit, dayMeals);
      
      if (newMeal) {
        dayMeals.push(newMeal);
        currentTotals = calculateMealTotals(dayMeals);
      } else {
        break;
      }
      
      if (currentTotals.calories > maxCalories && dayMeals.length > 3) {
        const lastMeal = dayMeals[dayMeals.length - 1];
        if (lastMeal.calories < 300) {
          dayMeals.pop();
          currentTotals = calculateMealTotals(dayMeals);
        }
      }
    }

    return dayMeals;
  };

  const calculateMealTotals = (meals) => {
    let totals = { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };
    meals.forEach(meal => {
      if (meal) {
        totals.calories += meal.calories || 0;
        totals.protein += meal.protein || 0;
        totals.carbs += meal.carbs || 0;
        totals.fats += meal.fats || 0;
        totals.fiber += meal.fiber || 0;
      }
    });
    return totals;
  };

  const selectMeal = (availableMeals, targetCalories, currentDayMeals) => {
    const nonDuplicateMeals = availableMeals.filter(
      meal => !isMealDuplicate(meal.id, currentDayMeals)
    );

    if (nonDuplicateMeals.length === 0) return null;

    const sorted = [...nonDuplicateMeals].sort((a, b) => {
      const diffA = Math.abs(a.calories - targetCalories);
      const diffB = Math.abs(b.calories - targetCalories);
      return diffA - diffB;
    });

    const topMatches = sorted.slice(0, Math.min(3, sorted.length));
    return topMatches[Math.floor(Math.random() * topMatches.length)];
  };

  const swapMeal = (mealIndex) => {
    const allMeals = getAllMeals();
    const currentDayMeals = mealPlan[daysOfWeek[currentDay]];
    const currentMeal = currentDayMeals[mealIndex];
    
    const newMeal = selectMeal(allMeals, currentMeal.calories, 
      currentDayMeals.filter((_, idx) => idx !== mealIndex)
    );

    if (!newMeal) {
      alert("No suitable replacement found!");
      return;
    }

    setMealPlan((prev) => {
      const updatedMeals = [...prev[daysOfWeek[currentDay]]];
      updatedMeals[mealIndex] = newMeal;
      return {
        ...prev,
        [daysOfWeek[currentDay]]: updatedMeals,
      };
    });
  };

  const addMeal = () => {
    const allMeals = getAllMeals();
    const currentDayMeals = mealPlan[daysOfWeek[currentDay]];
    
    const availableMeals = allMeals.filter(
      m => !isMealDuplicate(m.id, currentDayMeals)
    );

    if (availableMeals.length === 0) {
      alert("All available meals are already in your plan for today!");
      return;
    }

    const newMeal = availableMeals[Math.floor(Math.random() * availableMeals.length)];
    setMealPlan((prev) => ({
      ...prev,
      [daysOfWeek[currentDay]]: [...prev[daysOfWeek[currentDay]], newMeal],
    }));
  };

  const removeMeal = (mealIndex) => {
    setMealPlan((prev) => {
      const updatedMeals = prev[daysOfWeek[currentDay]].filter(
        (_, index) => index !== mealIndex
      );
      return {
        ...prev,
        [daysOfWeek[currentDay]]: updatedMeals,
      };
    });
  };

  const getTotalMacros = () => {
    const day = daysOfWeek[currentDay];
    const meals = mealPlan[day];
    if (!meals) return { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 };
    return calculateMealTotals(meals);
  };

  const totalMacros = getTotalMacros();

  // OVERFLOW DETECTION
  const isOverTarget = () => {
    if (!caloricNeeds) return false;
    return totalMacros.calories > caloricNeeds * 1.15;
  };

  const getCalorieStatus = () => {
    if (!caloricNeeds) return "normal";
    const percentage = (totalMacros.calories / caloricNeeds) * 100;
    if (percentage > 115) return "over";
    if (percentage < 85) return "under";
    return "normal";
  };

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

  const generateGroceryList = () => {
    const ingredients = new Set();
    Object.values(mealPlan).forEach((dayMeals) => {
      dayMeals.forEach(meal => {
        if (meal?.ingredients) {
          meal.ingredients.forEach((ingredient) => ingredients.add(ingredient));
        }
      });
    });
    return Array.from(ingredients).sort();
  };

  // PDF EXPORT
  const exportGroceryListPDF = () => {
    const groceryList = generateGroceryList();
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text("Weekly Grocery List", 20, 20);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Diet Type: ${dietType}`, 20, 35);
    
    doc.line(20, 40, 190, 40);
    
    doc.setFontSize(12);
    let yPosition = 50;
    const itemsPerColumn = 35;
    let itemCount = 0;
    
    groceryList.forEach((ingredient) => {
      if (itemCount >= itemsPerColumn) {
        doc.addPage();
        yPosition = 20;
        itemCount = 0;
      }
      
      doc.rect(20, yPosition - 3, 3, 3);
      doc.text(ingredient, 28, yPosition);
      
      yPosition += 7;
      itemCount++;
    });
    
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`Grocery-List-${dietType}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const MacroProgress = ({ label, current, target, color, icon }) => {
    const percentage = Math.min((current / target) * 100, 150);
    const isOver = percentage > 105;
    const isUnder = percentage < 95;
    
    return (
      <div className="macro-progress mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="macro-label">
            {icon} {label}
          </span>
          <span className={`macro-value ${isOver ? 'text-danger' : isUnder ? 'text-warning' : ''}`}>
            {Math.round(current)}g / {target}g
            {isOver && " ⚠️"}
          </span>
        </div>
        <ProgressBar
          now={percentage}
          variant={isOver ? "danger" : color}
          className="macro-bar"
          style={{ height: "12px" }}
        />
      </div>
    );
  };

  const MealCard = ({ meal, mealIndex }) => {
    if (!meal) {
      return (
        <Card className="meal-card empty-meal">
          <Card.Body>
            <p className="text-muted">No meal selected</p>
            <Button variant="outline-primary" size="sm" onClick={addMeal}>
              <FaPlus className="me-1" /> Add Meal
            </Button>
          </Card.Body>
        </Card>
      );
    }

    return (
      <Card className="meal-card">
        <div className="meal-image" style={{ backgroundImage: `url(${meal.image})` }}>
          <div className="meal-overlay">
            <div className="meal-badges">
              <Badge bg="dark" className="calorie-badge">
                <FaFire /> {meal.calories} kcal
              </Badge>
              <Badge bg="info" className="time-badge">
                <FaClock /> {meal.prep_time}
              </Badge>
            </div>
            <Button variant="light" size="sm" className="favorite-btn" onClick={() => toggleFavorite(meal)}>
              <FaStar className={isFavorite(meal) ? "text-warning" : "text-muted"} />
            </Button>
          </div>
        </div>
        <Card.Body>
          <h5 className="meal-name">{meal.name}</h5>
          <p className="meal-description">{meal.description}</p>

          <div className="meal-tags mb-2">
            {meal.tags?.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} bg="secondary" className="me-1 mb-1" style={{ fontSize: "0.7rem" }}>
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
            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => {
              setSelectedMeal(meal);
              setSelectedMealIndex(mealIndex);
              setShowMealModal(true);
            }}>
              <FaUtensils className="me-1" /> Details
            </Button>
            <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => swapMeal(mealIndex)}>
              <FaExchangeAlt className="me-1" /> Swap
            </Button>
            {mealPlan[daysOfWeek[currentDay]].length > 1 && (
              <Button variant="outline-danger" size="sm" onClick={() => removeMeal(mealIndex)}>
                <FaTrash />
              </Button>
            )}
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

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="nutrition-tabs mb-4">
          <Tab eventKey="calculator" title={<><FaChartLine className="me-2" />Calculator</>}>
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
                        <small>✅ Profile auto-loaded from your fitness data</small>
                      </div>
                    )}

                    <Form.Group className="mb-3">
                      <Form.Label>Gender</Form.Label>
                      <div>
                        <Form.Check inline type="radio" label="Male" checked={gender === "Male"} onChange={() => setGender("Male")} />
                        <Form.Check inline type="radio" label="Female" checked={gender === "Female"} onChange={() => setGender("Female")} />
                      </div>
                    </Form.Group>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Age</Form.Label>
                          <Form.Control type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Weight (kg)</Form.Label>
                          <Form.Control type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Height (cm)</Form.Label>
                          <Form.Control type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" />
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
                      <Form.Select value={goal} onChange={(e) => setGoal(e.target.value)}>
                        <option>Maintain Weight</option>
                        <option>Lose Weight</option>
                        <option>Gain Muscle</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Dietary Preference</Form.Label>
                      <Form.Select value={dietType} onChange={(e) => setDietType(e.target.value)}>
                        <option>Balanced</option>
                        <option>Vegan</option>
                        <option>Keto</option>
                        <option>High-Protein</option>
                        <option>Mediterranean</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Activity Level</Form.Label>
                      <Form.Select value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
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
                  <Button variant="primary" size="lg" onClick={calculateNeeds} className="calculate-btn">
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
                        {macroTargets.protein}/{macroTargets.carbs}/{macroTargets.fats}
                      </h3>
                      <p className="stat-label">P/C/F (grams)</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}
          </Tab>

          <Tab eventKey="mealPlan" title={<><FaCalendarAlt className="me-2" />Meal Plan</>}>
            {Object.keys(mealPlan).length === 0 ? (
              <Card className="empty-state-card">
                <Card.Body className="text-center py-5">
                  <FaUtensils className="empty-icon mb-3" />
                  <h4>No Meal Plan Yet</h4>
                  <p className="text-muted">
                    Go to the Calculator tab to generate your personalized meal plan
                  </p>
                  <Button variant="primary" onClick={() => setActiveTab("calculator")}>
                    Get Started
                  </Button>
                </Card.Body>
              </Card>
            ) : (
              <>
                <div className="day-selector mb-4">
                  <Row className="g-2">
                    {daysOfWeek.map((day, index) => (
                      <Col key={day}>
                        <Button
                          variant={currentDay === index ? "primary" : "outline-primary"}
                          className="w-100 day-btn"
                          onClick={() => setCurrentDay(index)}
                        >
                          {day.substring(0, 3)}
                        </Button>
                      </Col>
                    ))}
                  </Row>
                </div>

                <div className="current-day-header mb-4">
                  <h3 className="day-title">{daysOfWeek[currentDay]}</h3>
                  <div className="day-actions">
                    <Button variant="outline-success" size="sm" onClick={() => setShowGroceryList(true)}>
                      <FaShoppingCart className="me-1" /> Grocery List
                    </Button>
                  </div>
                </div>

                {isOverTarget() && (
                  <Alert variant="danger" className="mb-4">
                    <FaExclamationTriangle className="me-2" />
                    <strong>Warning:</strong> You've exceeded your calorie target by more than 5%! 
                    Consider removing a meal or swapping for lower-calorie options.
                  </Alert>
                )}

                <Card className="macro-summary-card mb-4">
                  <Card.Body>
                    <Row>
                      <Col md={8}>
                        <h5 className="mb-3">Daily Macro Targets</h5>
                        <MacroProgress label="Protein" current={totalMacros.protein} target={macroTargets.protein} color="danger" icon={<FaDumbbell />} />
                        <MacroProgress label="Carbs" current={totalMacros.carbs} target={macroTargets.carbs} color="warning" icon={<FaCarrot />} />
                        <MacroProgress label="Fats" current={totalMacros.fats} target={macroTargets.fats} color="info" icon={<FaCheese />} />
                      </Col>
                      <Col md={4} className="text-center">
                        <div className={`total-calories-circle ${getCalorieStatus()}`}>
                          <FaFire className="fire-icon" />
                          <h2 className="calories-number">{totalMacros.calories}</h2>
                          <p className="calories-label">/ {caloricNeeds} kcal</p>
                          <small className="text-muted">{totalMacros.fiber}g fiber</small>
                          {getCalorieStatus() === "over" && (
                            <small className="text-danger d-block mt-1">
                              <FaExclamationTriangle /> Over target!
                            </small>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <div className="meals-section mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">
                      Today's Meals ({mealPlan[daysOfWeek[currentDay]]?.length || 0} meals)
                    </h5>
                    <Button variant="outline-light" size="sm" onClick={addMeal}>
                      <FaPlus className="me-1" /> Add Meal
                    </Button>
                  </div>
                  
                  <Row>
                    {mealPlan[daysOfWeek[currentDay]]?.map((meal, index) => (
                      <React.Fragment key={index}>
                        <Col md={6} lg={4} className="meal-card-wrapper">
                          <div className="meal-number-badge">Meal {index + 1}</div>
                          <MealCard meal={meal} mealIndex={index} />
                        </Col>
                        {/* Add separator after every 3 meals */}
                        {(index + 1) % 3 === 0 && index !== mealPlan[daysOfWeek[currentDay]].length - 1 && (
                          <Col xs={12} key={`separator-${index}`}>
                            <div className="meals-row-separator"></div>
                          </Col>
                        )}
                      </React.Fragment>
                    ))}
                  </Row>
                </div>
              </>
            )}
          </Tab>

          <Tab eventKey="favorites" title={<><FaStar className="me-2" />Favorites ({favorites.length})</>}>
            {favorites.length === 0 ? (
              <Card className="empty-state-card">
                <Card.Body className="text-center py-5">
                  <FaStar className="empty-icon mb-3" />
                  <h4>No Favorites Yet</h4>
                  <p className="text-muted">Click the star icon on any meal to add it to your favorites</p>
                </Card.Body>
              </Card>
            ) : (
              <Row>
                {favorites.map((meal) => (
                  <Col md={6} lg={4} key={meal.id} className="mb-4">
                    <Card className="meal-card">
                      <div className="meal-image" style={{ backgroundImage: `url(${meal.image})` }}>
                        <div className="meal-overlay">
                          <Badge bg="dark" className="calorie-badge">
                            <FaFire /> {meal.calories} kcal
                          </Badge>
                          <Button variant="light" size="sm" className="favorite-btn" onClick={() => toggleFavorite(meal)}>
                            <FaStar className="text-warning" />
                          </Button>
                        </div>
                      </div>
                      <Card.Body>
                        <h5 className="meal-name">{meal.name}</h5>
                        <p className="meal-description small">{meal.description}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Tab>
        </Tabs>

        <Modal show={showMealModal} onHide={() => setShowMealModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>{selectedMeal?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedMeal && (
              <>
                <div className="modal-meal-image mb-3" style={{
                  backgroundImage: `url(${selectedMeal.image})`,
                  height: "250px",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  borderRadius: "8px",
                }}></div>

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
                  <h5><FaUtensils className="me-2" />Ingredients</h5>
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
                    <Badge key={idx} bg="secondary" className="me-1 mb-1">{tag}</Badge>
                  ))}
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowMealModal(false)}>Close</Button>
            <Button variant="primary" onClick={() => {
              swapMeal(selectedMealIndex);
              setShowMealModal(false);
            }}>
              <FaExchangeAlt className="me-1" /> Swap This Meal
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showGroceryList} onHide={() => setShowGroceryList(false)} size="lg">
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
            <Button variant="secondary" onClick={() => setShowGroceryList(false)}>Close</Button>
            <Button variant="primary" onClick={exportGroceryListPDF}>
              <FaDownload className="me-1" /> Export PDF
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </section>
  );
};

export default NutritionGuide;