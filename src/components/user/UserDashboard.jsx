import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  Alert,
  Form,
  Modal,
  Tab,
  Nav,
  Navbar,
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { useForm } from "react-hook-form";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: "",
      name: "",
      category: "",
      location: "",
      description: "",
    },
  });
  const [showSecurityQuestionModal, setShowSecurityQuestionModal] =
    useState(false);
  const [itemSecurityQuestion, setItemSecurityQuestion] = useState("");
  const [itemSecurityAnswer, setItemSecurityAnswer] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [securityQuestions, setSecurityQuestions] = useState([
    { id: Date.now(), question: "", answer: "" },
  ]);
  const [newSecurityQuestions, setNewSecurityQuestions] = useState([
    { id: Date.now(), question: "", answer: "" },
  ]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredItems, setFilteredItems] = useState([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedClaimItem, setSelectedClaimItem] = useState(null);
  const [claimQuestions, setClaimQuestions] = useState([]);
  const { register: claimRegister, handleSubmit: claimSubmit, formState: { errors: claimErrors }, reset: claimReset } = useForm();

  // Add this new function to handle filtering
  const handleFilter = (filterType) => {
    setActiveFilter(filterType);
    
    if (filterType === 'all') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => 
        item.reportType?.toLowerCase() === filterType.toLowerCase()
      );
      setFilteredItems(filtered);
    }
  };

  // Fetch both user's items and lost items
  useEffect(() => {
    try {
      const allItems = JSON.parse(localStorage.getItem("items") || "[]");

      // Set user's reported items - show ALL items reported by the user
      const userItems = allItems.filter(
        (item) => item.reportedBy === user.email
      );
      setItems(userItems);

      // Set lost items (show approved and expected items from others, including admin)
      const lostItemsList = allItems.filter(
        (item) =>
          item.type === "lost" &&
          (item.status === "approved" || item.status === "expected") &&
          item.reportedBy !== user.email // This includes admin items
      );
      setLostItems(lostItemsList);

      // Set found items (show approved and expected items from others, including admin)
      const foundItemsList = allItems.filter(
        (item) =>
          item.type === "found" &&
          (item.status === "approved" || item.status === "expected") &&
          item.reportedBy !== user.email // This includes admin items
      );
      setFoundItems(foundItemsList);
    } catch (error) {
      showMessage("danger", "Failed to fetch items");
    }
  }, [user.email]);

  // Add a function to check if an item is from admin
  const isAdminItem = (item) => {
    return item.adminProcessedBy && item.adminProcessedBy === item.reportedBy;
  };

  const handleShowModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      Object.keys(item).forEach((key) => setValue(key, item[key]));
      // Set existing security questions or initialize with empty one
      if (item.securityQuestions && item.securityQuestions.length > 0) {
        setSecurityQuestions(item.securityQuestions);
      } else {
        setSecurityQuestions([{ id: Date.now(), question: "", answer: "" }]);
      }
    } else {
      reset();
      setSecurityQuestions([{ id: Date.now(), question: "", answer: "" }]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    reset();
    setSecurityQuestions([{ id: Date.now(), question: "", answer: "" }]); // Reset security questions
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const onSubmit = async (data) => {
    try {
      const itemData = {
        itemName: data.name,
        itemDescription: data.description,
        status: data.type,
        category: data.category,
        reportType: data.type,
        location: data.location,
        date: "2025-03-28",
      };

      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/user/report-product`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(itemData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      const updatedItem = await response.json();

      // Close modal first
      handleCloseModal();
      
      // Show success message
      alert("Item added successfully.");
      
      // Trigger a re-fetch of all items
      setRender(prev => !prev);
      
      // Show success message in the UI
      showMessage("success", "Item added successfully");

    } catch (error) {
      showMessage(
        "danger",
        error.message || "Operation failed. Please try again."
      );
    }
  };

  const[render,setRender] = useState(true)

  const handleDelete = async (itemId) => {
    const token = localStorage.getItem("token")
    console.log("Delete clicked for item ID:", itemId);
    
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8080/api/user/delete-item/${itemId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete item");
        }

        alert("Item deleted successfully");

        setRender(false)

        console.log("Item deleted successfully:", itemId);
        // Update items to show remaining user items
        setItems((prev) => prev.filter((item) => item.itemId !== itemId));
        showMessage("success", "Item deleted successfully");
      } catch (error) {
        console.error("Error deleting item:", error);
        showMessage("danger", "Failed to delete item");
      }
    }
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
      expected: "info",
      resolved: "secondary",
    };
    return variants[status] || "secondary";
  };

  const handleAddSecurityQuestion = (item) => {
    setSelectedItem(item);
    setShowSecurityQuestionModal(true);
  };

  const handleSaveSecurityQuestion = () => {
    try {
      if (!itemSecurityQuestion.trim() || !itemSecurityAnswer.trim()) {
        setMessage({
          type: "danger",
          text: "Question and answer are required",
        });
        return;
      }

      const allItems = JSON.parse(localStorage.getItem("items") || "[]");
      const newQuestion = {
        id: Date.now(),
        question: itemSecurityQuestion,
        answer: itemSecurityAnswer,
      };

      const updatedItems = allItems.map((item) => {
        if (item.id === selectedItem.id) {
          const existingQuestions = item.securityQuestions || [];
          return {
            ...item,
            securityQuestions: [...existingQuestions, newQuestion],
          };
        }
        return item;
      });

      localStorage.setItem("items", JSON.stringify(updatedItems));

      // Update the items state
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === selectedItem.id) {
            const existingQuestions = item.securityQuestions || [];
            return {
              ...item,
              securityQuestions: [...existingQuestions, newQuestion],
            };
          }
          return item;
        })
      );

      setItemSecurityQuestion("");
      setItemSecurityAnswer("");
      setShowSecurityQuestionModal(false);
      setMessage({
        type: "success",
        text: "Security question added successfully",
      });
    } catch (err) {
      setMessage({ type: "danger", text: "Failed to add security question" });
    }
  };

  const handleSecurityQuestionChange = (id, field, value) => {
    setSecurityQuestions((questions) =>
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const addSecurityQuestion = () => {
    setSecurityQuestions([
      ...securityQuestions,
      { id: Date.now(), question: "", answer: "" },
    ]);
  };

  const removeSecurityQuestion = (id) => {
    setSecurityQuestions((questions) => questions.filter((q) => q.id !== id));
  };

  const handleAddNewQuestion = () => {
    setNewSecurityQuestions([
      ...newSecurityQuestions,
      { id: Date.now(), question: "", answer: "" },
    ]);
  };

  const handleNewQuestionChange = (id, field, value) => {
    setNewSecurityQuestions((questions) =>
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleRemoveNewQuestion = (id) => {
    setNewSecurityQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSaveSecurityQuestions = () => {
    try {
      // Validate questions
      const invalidQuestions = newSecurityQuestions.some(
        (q) => !q.question.trim() || !q.answer.trim()
      );

      if (invalidQuestions) {
        setMessage({
          type: "danger",
          text: "All questions and answers are required",
        });
        return;
      }

      const allItems = JSON.parse(localStorage.getItem("items") || "[]");

      const updatedItems = allItems.map((item) => {
        if (item.id === selectedItem.id) {
          const existingQuestions = item.securityQuestions || [];
          return {
            ...item,
            securityQuestions: [...existingQuestions, ...newSecurityQuestions],
          };
        }
        return item;
      });

      localStorage.setItem("items", JSON.stringify(updatedItems));

      // Update the items state
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === selectedItem.id) {
            const existingQuestions = item.securityQuestions || [];
            return {
              ...item,
              securityQuestions: [
                ...existingQuestions,
                ...newSecurityQuestions,
              ],
            };
          }
          return item;
        })
      );

      setNewSecurityQuestions([{ id: Date.now(), question: "", answer: "" }]);
      setShowSecurityQuestionModal(false);
      setMessage({
        type: "success",
        text: "Security questions added successfully",
      });
    } catch (err) {
      setMessage({ type: "danger", text: "Failed to add security questions" });
    }
  };

  const handleAllItemsDisplay = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/user/get-all-items`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }

      const result = await response.json();
      
      // Set all items first
      setItems(result);
      // Also set filtered items to show all items initially
      setFilteredItems(result);

      // Then set lost and found items
      const lostItemsList = result.filter(item => 
        item.reportType?.toLowerCase() === "lost" && 
        item.userId !== user.id
      );

      const foundItemsList = result.filter(item => 
        item.reportType?.toLowerCase() === "found" && 
        item.userId !== user.id
      );

      setLostItems(lostItemsList);
      setFoundItems(foundItemsList);

    } catch (error) {
      console.error('Error fetching items:', error);
      showMessage("danger", "Failed to fetch items");
    }
  };

  useEffect(() => {
    handleAllItemsDisplay();
  }, [render]);

  const handleClaimItem = async (item) => {
    try {
      console.log("Claiming item:", item);
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/user/get-all-questions/${item.itemId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const result = await response.json();
      console.log("Fetched questions:", result);
      setClaimQuestions(result);
      setSelectedClaimItem(item);
      setShowClaimModal(true);
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Fallback to dummy questions for testing
      const dummyQuestions = [
        { 
          _id: '1', 
          question: "What is the color of the item?",
          itemId: item.itemId 
        },
        { 
          _id: '2', 
          question: "Where did you last see the item?",
          itemId: item.itemId 
        }
      ];
      setClaimQuestions(dummyQuestions);
      setSelectedClaimItem(item);
      setShowClaimModal(true);
    }
  };

  const onSubmitAnswers = async (formData) => {
    try {
      console.log("Selected Item:", selectedClaimItem);
      console.log("Questions:", claimQuestions);
      
      // Format the answers
      const answers = claimQuestions.map(question => ({
        questionId: question.id,
        question: question.question,
        answer: formData[`answer_${question._id}`],
        itemId: selectedClaimItem.itemId
      }));

      console.log("Submitted Answers:", answers);

      // Here you can add your API call to submit the answers
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/user/security-questions/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit answers");
      }

      const result = await response.json();
      console.log("Server response:", result);

      // Close modal and reset form
      setShowClaimModal(false);
      claimReset();
    } catch (error) {
      console.error("Error submitting answers:", error);
      alert("Failed to submit answers");
    }
  };

  const renderItemCard = (item) => (
    <Col key={item.itemId}>
      <Card>
        <Card.Body>
          <Card.Title className="d-flex justify-content-between align-items-start">
            {item?.name || item?.itemName || "Unnamed Item"}
            <Badge bg={item?.reportType?.toLowerCase() === "lost" ? "danger" : "success"}>
              {item?.reportType || "Unknown"}
            </Badge>
          </Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            {item?.category || "No Category"}
          </Card.Subtitle>
          <Card.Text>
            <strong>Location:</strong> {item?.location || "No Location"}
            <br />
            <strong>Description:</strong>
            <br />
            {item?.description || item?.itemDescription || "No Description"}
          </Card.Text>
          <div className="mb-3">
            <Badge bg={getStatusBadgeVariant(item?.status)}>
              {item?.status || "Unknown"}
            </Badge>
            <small className="text-muted ms-2">
              ID: {item.itemId}
              <br />
              Reported on: {item?.date ? new Date(item.date).toLocaleDateString() : "Unknown date"}
            </small>
          </div>
          
          {/* Action Buttons */}
          <div className="d-flex gap-2 mt-3">
            {/* Show Add Security Question button only for Found items */}
            {item?.reportType?.toLowerCase() === "found" && (
              <Button 
                variant="info" 
                size="sm"
                onClick={() => {
                  setSelectedItem(item);
                  setShowSecurityQuestionModal(true);
                }}
              >
                <i className="bi bi-shield-lock me-1"></i>
                Add Security Question
              </Button>
            )}
            
            {/* Delete button - Always show this */}
            <Button 
              variant="outline-danger" 
              size="sm"
              onClick={() => handleDelete(item.itemId)}
            >
              <i className="bi bi-trash me-1"></i>
              Delete
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  const SecurityQuestionsModal = () => {
    const [questions, setQuestions] = useState([
      { id: Date.now(), question: '', answer: '' }
    ]);
    const [errors, setErrors] = useState({});  // Add this for error handling

    const addQuestion = () => {
      setQuestions([
        ...questions,
        { id: Date.now(), question: '', answer: '' }
      ]);
    };

    const removeQuestion = (id) => {
      if (questions.length > 1) {
        setQuestions(questions.filter(q => q.id !== id));
        // Clear errors for removed question
        const newErrors = { ...errors };
        delete newErrors[id];
        setErrors(newErrors);
      }
    };

    const handleQuestionChange = (id, field, value) => {
      setQuestions(questions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      ));
      // Clear error when user starts typing
      if (errors[id]) {
        const newErrors = { ...errors };
        delete newErrors[id];
        setErrors(newErrors);
      }
    };

    const handleSaveQuestions = async(itemId) => {
      const token = localStorage.getItem("token");
      
      // Validate all questions
      const newErrors = {};
      questions.forEach(q => {
        if (!q.question.trim() || !q.answer.trim()) {
          newErrors[q.id] = "Both question and answer are required";
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Filter out empty questions and remove the id field
      const validQuestions = questions
        .filter(q => q.question.trim() !== '' && q.answer.trim() !== '')
        .map(({ question, answer }) => ({ question, answer }));

      try {
        const response = await fetch(
          `http://localhost:8080/api/finder/security-questions/${itemId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(validQuestions),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to save questions');
        }

        // Close modal and reset
        setShowSecurityQuestionModal(false);
        setQuestions([{ id: Date.now(), question: '', answer: '' }]);
        setErrors({});
      } catch (error) {
        console.error('Error saving questions:', error);
        alert('Failed to save security questions');
      }
    };

    return (
      <Modal 
        show={showSecurityQuestionModal} 
        onHide={() => setShowSecurityQuestionModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Security Questions</Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          <div className="mb-3">
            {questions.map((q, index) => (
              <div key={q.id} className="border rounded p-3 mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <h6>Question {index + 1}</h6>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => removeQuestion(q.id)}
                    className="delete-btn" // Make sure delete button is always visible
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Question</Form.Label>
                  <Form.Control
                    type="text"
                    value={q.question}
                    onChange={(e) => handleQuestionChange(q.id, 'question', e.target.value)}
                    placeholder="Enter security question"
                    isInvalid={!!errors[q.id]}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Answer</Form.Label>
                  <Form.Control
                    type="text"
                    value={q.answer}
                    onChange={(e) => handleQuestionChange(q.id, 'answer', e.target.value)}
                    placeholder="Enter answer"
                    isInvalid={!!errors[q.id]}
                  />
                  {errors[q.id] && (
                    <Form.Control.Feedback type="invalid">
                      {errors[q.id]}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </div>
            ))}
          </div>

          <Button 
            variant="outline-primary" 
            onClick={addQuestion}
            className="w-100"
            style={{ backgroundColor: '#1a365d', borderColor: '#1a365d' ,color:"white"}}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add Another Question
          </Button>
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowSecurityQuestionModal(false);
              setQuestions([{ id: Date.now(), question: '', answer: '' }]);
              setErrors({});
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleSaveQuestions(selectedItem.itemId)}
          >
            Save Questions
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // const user = localStorage.getItem("user")

  return (
    <>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <h1>My Dashboard</h1>
            <p>
              Welcome back,
            </p>
          </Col>
          <Col xs="auto">
            <Button onClick={() => handleShowModal()}>Report New Item</Button>
          </Col>
        </Row>

        {message.text && (
          <Alert variant={message.type} className="mb-4">
            {message.text}
          </Alert>
        )}

        <Tab.Container defaultActiveKey="myItems">
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="myItems">My Reported Items</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="myItems">
              <Card>
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h4>My Reported Items</h4>
                    <div className="d-flex gap-2">
                      <Button
                        variant={
                          activeFilter === "all" ? "primary" : "outline-primary"
                        }
                        onClick={() => handleFilter("all")}
                      >
                        All Items
                      </Button>
                      <Button
                        variant={
                          activeFilter === "lost" ? "danger" : "outline-danger"
                        }
                        onClick={() => handleFilter("lost")}
                      >
                        Lost Items
                      </Button>
                      <Button
                        variant={
                          activeFilter === "found"
                            ? "success"
                            : "outline-success"
                        }
                        onClick={() => handleFilter("found")}
                      >
                        Found Items
                      </Button>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  {filteredItems.length === 0 ? (
                    <Alert variant="info">
                      {activeFilter === "all"
                        ? "You haven't reported any items yet."
                        : `No ${activeFilter} items reported.`}
                    </Alert>
                  ) : (
                    <>
                      <div className="mb-3">
                        <small className="text-muted">
                          Showing {filteredItems.length}{" "}
                          {activeFilter === "all" ? "total" : activeFilter}{" "}
                          items
                        </small>
                      </div>
                      <Row xs={1} md={2} lg={3} className="g-4">
                        {filteredItems.map((item) => renderItemCard(item))}
                      </Row>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            <Tab.Pane eventKey="lostItems">
              <Card>
                <Card.Header>
                  <h4>Lost Items</h4>
                </Card.Header>
                <Card.Body>
                  {lostItems.length === 0 ? (
                    <Alert variant="info">No lost items found.</Alert>
                  ) : (
                    <Row xs={1} md={2} lg={3} className="g-4">
                      {lostItems.map((item) => renderItemCard(item))}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>

            <Tab.Pane eventKey="foundItems">
              <Card>
                <Card.Header>
                  <h4>Found Items</h4>
                </Card.Header>
                <Card.Body>
                  {foundItems.length === 0 ? (
                    <Alert variant="info">No found items available.</Alert>
                  ) : (
                    <Row xs={1} md={2} lg={3} className="g-4">
                      {foundItems.map((item) => renderItemCard(item))}
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>

        {/* Report/Edit Item Modal */}
        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingItem ? "Edit Item Report" : "Report New Item"}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Report Type</Form.Label>
                <Form.Select
                  {...register("type", { required: "Please select a type" })}
                  isInvalid={!!errors.type}
                >
                  <option value="">Select Type</option>
                  <option value="lost">Lost Item</option>
                  <option value="found">Found Item</option>
                </Form.Select>
                {errors.type && (
                  <Form.Control.Feedback type="invalid">
                    {errors.type.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Item Name</Form.Label>
                <Form.Control
                  type="text"
                  {...register("name", { required: "Item name is required" })}
                  isInvalid={!!errors.name}
                  placeholder="Enter item name"
                />
                {errors.name && (
                  <Form.Control.Feedback type="invalid">
                    {errors.name.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  {...register("category", {
                    required: "Please select a category",
                  })}
                  isInvalid={!!errors.category}
                >
                  <option value="">Select Category</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="accessories">Accessories</option>
                  <option value="documents">Documents</option>
                  <option value="other">Other</option>
                </Form.Select>
                {errors.category && (
                  <Form.Control.Feedback type="invalid">
                    {errors.category.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  {...register("location", {
                    required: "Location is required",
                  })}
                  isInvalid={!!errors.location}
                  placeholder="Enter location"
                />
                {errors.location && (
                  <Form.Control.Feedback type="invalid">
                    {errors.location.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  {...register("description", {
                    required: "Description is required",
                  })}
                  isInvalid={!!errors.description}
                  placeholder="Enter detailed description"
                />
                {errors.description && (
                  <Form.Control.Feedback type="invalid">
                    {errors.description.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingItem ? "Update Report" : "Submit Report"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <SecurityQuestionsModal />

        {/* Claim Modal with React Hook Form */}
        <Modal
          show={showClaimModal}
          onHide={() => {
            setShowClaimModal(false);
            claimReset();
          }}
          size="lg"
        >
          <Form onSubmit={claimSubmit(onSubmitAnswers)}>
            <Modal.Header closeButton>
              <Modal.Title>Answer Security Questions</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {selectedClaimItem && (
                <div className="mb-4">
                  <h6>Item Details:</h6>
                  <p className="mb-1">
                    <strong>Name:</strong> {selectedClaimItem.name}
                  </p>
                  <p className="mb-1">
                    <strong>Category:</strong> {selectedClaimItem.category}
                  </p>
                  <p className="mb-1">
                    <strong>Location:</strong> {selectedClaimItem.location}
                  </p>
                </div>
              )}

              {claimQuestions.map((question) => (
                <Form.Group key={question._id} className="mb-4">
                  <Form.Label>
                    <strong>{question.question}</strong>
                  </Form.Label>
                  <Form.Control
                    {...claimRegister(`answer_${question._id}`, {
                      required: "This answer is required",
                    })}
                    type="text"
                    placeholder="Enter your answer"
                    isInvalid={!!claimErrors[`answer_${question._id}`]}
                  />
                  {claimErrors[`answer_${question._id}`] && (
                    <Form.Control.Feedback type="invalid">
                      {claimErrors[`answer_${question._id}`].message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              ))}

              {claimQuestions.length === 0 && (
                <Alert variant="info">
                  No security questions available for this item.
                </Alert>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowClaimModal(false);
                  claimReset();
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={claimQuestions.length === 0}
              >
                Submit Answers
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </>
  );
};

export default UserDashboard;
