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

const lostImages = [
  "https://placehold.co/300x200/dc3545/ffffff?text=Lost+Item",
  "https://placehold.co/300x200/ff6b6b/ffffff?text=Lost+Object"
];

const foundImages = [
  "https://placehold.co/300x200/198754/ffffff?text=Found+Item",
  "https://placehold.co/300x200/40c057/ffffff?text=Found+Object"
];

const claimedImages = [
  "https://placehold.co/300x200/0dcaf0/ffffff?text=Claimed+Item",
  "https://placehold.co/300x200/20c997/ffffff?text=Claimed+Object"
];

const getRandomImage = (reportType, status) => {
  // First check if the item is claimed
  if (status?.toLowerCase() === "claimed") {
    const randomIndex = Math.floor(Math.random() * claimedImages.length);
    return claimedImages[randomIndex];
  }
  
  // If not claimed, use report type to determine image
  const images = reportType?.toLowerCase() === "lost" ? lostImages : foundImages;
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
};

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
  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredItems, setFilteredItems] = useState([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedClaimItem, setSelectedClaimItem] = useState(null);
  const [claimQuestions, setClaimQuestions] = useState([]);
  const {
    register: claimRegister,
    handleSubmit: claimSubmit,
    formState: { errors: claimErrors },
    reset: claimReset,
  } = useForm();
  const [claimedItems, setClaimedItems] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [itemSecurityQuestions, setItemSecurityQuestions] = useState([]);

  // Add this function to handle viewing details
  const handleViewDetails = async(item) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/finder/get-item-security-questions/${item.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch security questions");
      }

      const result = await response.json();
      console.log("Security Questions Response:", result); // Debug log
      setItemSecurityQuestions(result); // Store the security questions
      setSelectedDetailItem(item);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error fetching security questions:", error);
      setItemSecurityQuestions([]);
      setSelectedDetailItem(item);
      setShowDetailsModal(true);
    }
  };

  // Add this new function to handle filtering
  const handleFilter = (filterType) => {
    setActiveFilter(filterType);

    if (filterType === "all") {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(
        (item) => item.reportType?.toLowerCase() === filterType.toLowerCase()
      );
      setFilteredItems(filtered);
    }
  };

  // Add this new function
  const handleClaimedItemsClick = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/finder/get-all-claimed-items`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch claimed items");
      }

      const result = await response.json();
      console.log("Claimed Items Response:", result); // Debug log
      setClaimedItems(result);
    } catch (error) {
      console.error("Error fetching claimed items:", error);
      showMessage("danger", "Failed to fetch claimed items");
      setClaimedItems([]); // Reset to empty array on error
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
    const now = new Date();

    // Adjust for local timezone offset
    const localISOTime = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 23); // Keep milliseconds up to 3 decimal places
    try {
      const itemData = {
        itemName: data.name,
        itemDescription: data.description,
        status: "found",
        category: data.category,
        reportType: data.type,
        location: data.location,
        date: localISOTime, // Formats to 'YYYY-MM-DDTHH:MM:SS'
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
      setRender((prev) => !prev);

      // Show success message in the UI
      showMessage("success", "Item added successfully");
    } catch (error) {
      showMessage(
        "danger",
        error.message || "Operation failed. Please try again."
      );
    }
  };

  const [render, setRender] = useState(true);

  const handleDelete = async (itemId) => {
    const token = localStorage.getItem("token");
    console.log("Delete clicked for item ID:", itemId);

    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8080/api/finder/delete-item/${itemId}`,
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

        setRender(false);

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
        `http://localhost:8080/api/finder/get-all-items`,  // Use API_BASE_URL from config
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch items: ${response.status}`);
      }

      const result = await response.json();
      console.log("All items response:", result); // Debug log

      // Set all items first
      setItems(result);
      
      // Filter items based on type and user
      const lostItemsList = result.filter(
        (item) => 
          item.reportType?.toLowerCase() === "lost" && 
          item.userId !== user.id
      );

      const foundItemsList = result.filter(
        (item) => 
          item.reportType?.toLowerCase() === "found" && 
          item.userId !== user.id
      );

      // Set filtered items
      setLostItems(lostItemsList);
      setFoundItems(foundItemsList);
      setFilteredItems(result); // Set initial filtered items to show all

    } catch (error) {
      console.error("Error fetching items:", error);
      showMessage("danger", "Failed to fetch items");
      // Set empty arrays on error
      setItems([]);
      setLostItems([]);
      setFoundItems([]);
      setFilteredItems([]);
    }
  };

  useEffect(() => {
    handleAllItemsDisplay();
  }, [user.id]); // Add user.id as dependency

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
      console.error("Error fetching questions:", error);
      // Fallback to dummy questions for testing
      const dummyQuestions = [
        {
          _id: "1",
          question: "What is the color of the item?",
          itemId: item.itemId,
        },
        {
          _id: "2",
          question: "Where did you last see the item?",
          itemId: item.itemId,
        },
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
      const answers = claimQuestions.map((question) => ({
        questionId: question.id,
        question: question.question,
        answer: formData[`answer_${question._id}`],
        itemId: selectedClaimItem.itemId,
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

  const renderItemCard = (item) => {
    console.log("Rendering item:", item); // Debug log

    return (
      <Col key={item.itemId} xs={12} md={6} lg={4} className="mb-4">
        <Card className="h-100 shadow-sm">
          <Card.Img 
            variant="top" 
            src={getRandomImage(item.reportType, item.status)} 
            alt={item?.name || item?.itemName || "Item Image"}
            style={{ height: '200px', objectFit: 'cover' }}
          />
          <Card.Body className="d-flex flex-column">
            <Card.Title className="d-flex justify-content-between align-items-start mb-3">
              <span className="text-truncate me-2">
                {item?.name || item?.itemName || "Unnamed Item"}
              </span>
              <Badge
                bg={
                  item?.reportType?.toLowerCase() === "lost"
                    ? "danger"
                    : "success"
                }
              >
                {item?.reportType || "Unknown"}
              </Badge>
            </Card.Title>
            <Card.Subtitle className="mb-3 text-muted">
              {item?.category || "No Category"}
            </Card.Subtitle>
            <div className="mb-3">
              <p className="mb-2"><strong>Location:</strong> {item?.location || "No Location"}</p>
              <p className="mb-2"><strong>Description:</strong><br />
              {item?.description || item?.itemDescription || "No Description"}</p>
              <p className="mb-2"><strong>Reported By:</strong>{" "}
              {item?.finderOrOwnerName || item?.reportedBy || item?.email || "Anonymous"}</p>
              <p className="mb-2">
                <strong>Status:</strong>{" "}
                <Badge bg={getStatusBadgeVariant(item?.status)}>
                  {item?.status || "Unknown"}
                </Badge>
              </p>

              {/* Remove this entire section that shows claimed information */}
              {/* {item?.reportType?.toLowerCase() === "found" && (
                <>
                  <p className="mb-2">
                    <strong>Claimed By:</strong>{" "}
                    {item?.claimedUserName || item?.calimedUsername || "Not claimed"}
                  </p>
                  <p className="mb-2">
                    <strong>Claimed At:</strong>{" "}
                    {item?.claimedAt ? new Date(item.claimedAt).toLocaleString() : "Not claimed"}
                  </p>
                </>
              )} */}
            </div>
            <div className="text-muted mb-3 small">
              <div>Reported on:{" "}
                {item?.date
                  ? new Date(item.date).toLocaleDateString()
                  : "Unknown date"}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2 mt-auto">
              {/* View Details button - always visible */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleViewDetails(item)}
              >
                <i className="bi bi-eye-fill me-1"></i>
                View Details
              </Button>

              {/* Other buttons - only show if item is not claimed */}
              {item?.status?.toLowerCase() !== "claimed" && (
                <>
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

                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Delete
                  </Button>
                </>
              )}
            </div>
            
            {/* Show a message if item is claimed */}
            {item?.status?.toLowerCase() === "claimed" && (
              <div className="text-center text-muted mt-auto">
                <i className="bi bi-check-circle-fill text-success me-2"></i>
                This item has been claimed
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    );
  };

  const SecurityQuestionsModal = ({ selectedItem }) => {
    const [questions, setQuestions] = useState([
      { id: Date.now(), question: "", answer: "" },
    ]);
    const [errors, setErrors] = useState({}); // Add this for error handling

    const addQuestion = () => {
      setQuestions([
        ...questions,
        { id: Date.now(), question: "", answer: "" },
      ]);
    };

    const removeQuestion = (id) => {
      if (questions.length > 1) {
        setQuestions(questions.filter((q) => q.id !== id));
        // Clear errors for removed question
        const newErrors = { ...errors };
        delete newErrors[id];
        setErrors(newErrors);
      }
    };

    const handleQuestionChange = (id, field, value) => {
      setQuestions(
        questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
      );
      // Clear error when user starts typing
      if (errors[id]) {
        const newErrors = { ...errors };
        delete newErrors[id];
        setErrors(newErrors);
      }
    };

    const handleSaveQuestions = async () => {
      const token = localStorage.getItem("token");
      
      // Validate questions...
      const newErrors = {};
      questions.forEach((q) => {
        if (!q.question.trim() || !q.answer.trim()) {
          newErrors[q.id] = "Both question and answer are required";
        }
      });

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Filter and format questions
      const validQuestions = questions
        .filter((q) => q.question.trim() !== "" && q.answer.trim() !== "")
        .map(({ question, answer }) => ({ 
          question, 
          answer,
          itemId: selectedItem.itemId // Add itemId to each question
        }));

      try {
      console.log(selectedItem.id);
        const response = await fetch(
          `http://localhost:8080/api/finder/security-questions/${selectedItem.id}`, // Use selectedItem.itemId
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
          throw new Error("Failed to save questions");
        }

        alert("Security questions saved successfully");

        // Close modal and reset
        setShowSecurityQuestionModal(false);
        setQuestions([{ id: Date.now(), question: "", answer: "" }]);
        setErrors({});
      } catch (error) {
        console.error("Error saving questions:", error);
        alert("Failed to save security questions");
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
                    onChange={(e) =>
                      handleQuestionChange(q.id, "question", e.target.value)
                    }
                    placeholder="Enter security question"
                    isInvalid={!!errors[q.id]}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Answer</Form.Label>
                  <Form.Control
                    type="text"
                    value={q.answer}
                    onChange={(e) =>
                      handleQuestionChange(q.id, "answer", e.target.value)
                    }
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
              setQuestions([{ id: Date.now(), question: "", answer: "" }]);
              setErrors({});
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSaveQuestions()}
          >
            Save Questions
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const name = localStorage.getItem("name");

  const ItemDetailsModal = ({ show, onHide, item }) => {
    return (
      <Modal 
        show={show} 
        onHide={onHide}
        size="lg"
        dialogClassName="modal-90w"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="d-flex align-items-center">
            <span className="me-2">Item Details</span>
            <Badge bg={item?.reportType?.toLowerCase() === "lost" ? "danger" : "success"}>
              {item?.reportType}
            </Badge>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          <Card className="border-0">
            <Card.Body>
              {/* Item Name and Status Section */}
              <div className="mb-4">
                <h4 className="mb-3">{item?.itemName || "Unnamed Item"}</h4>
                <Badge bg={
                  item?.status?.toLowerCase() === "claimed" ? "info" :
                  item?.status?.toLowerCase() === "approved" ? "success" : "warning"
                } className="px-3 py-2">
                  {item?.status}
                </Badge>
              </div>

              <Row>
                {/* Image Column */}
                <Col md={6} className="mb-4 mb-md-0">
                  <img
                    src={getRandomImage(item?.reportType, item?.status)}
                    alt={item?.itemName}
                    className="img-fluid rounded shadow-sm"
                    style={{ 
                      width: "100%", 
                      height: "300px", 
                      objectFit: "cover",
                      border: "1px solid #dee2e6"
                    }}
                  />
                </Col>

                {/* Details Column */}
                <Col md={6}>
                  <div className="details-section">
                    {/* Basic Information */}
                    <h6 className="border-bottom pb-2 mb-3">Basic Information</h6>
                    <Table borderless className="details-table">
                      <tbody>
                        <tr>
                          <td width="35%"><strong>Category:</strong></td>
                          <td>{item?.category || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td><strong>Location:</strong></td>
                          <td>{item?.location || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td><strong>Report Date:</strong></td>
                          <td>{item?.date ? new Date(item.date).toLocaleString() : "Not specified"}</td>
                        </tr>
                        <tr>
                          <td><strong>Reported By:</strong></td>
                          <td>{item?.finderOrOwnerName || item?.reportedBy || "Anonymous"}</td>
                        </tr>
                      </tbody>
                    </Table>

                    {/* Claim Information - Only show if item is claimed */}
                    {item?.status?.toLowerCase() === "claimed" && (
                      <>
                        <h6 className="border-bottom pb-2 mb-3 mt-4">Claim Information</h6>
                        <Table borderless className="details-table">
                          <tbody>
                            <tr>
                              <td width="35%"><strong>Claimed By:</strong></td>
                              <td>{item?.claimedUserName || "Not specified"}</td>
                            </tr>
                            <tr>
                              <td><strong>Claimed At:</strong></td>
                              <td>{item?.claimedAt ? new Date(item.claimedAt).toLocaleString() : "Not specified"}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Description Section */}
              <div className="mt-4">
                <h6 className="border-bottom pb-2 mb-3">Description</h6>
                <p className="text-muted">
                  {item?.description || item?.itemDescription || "No description available"}
                </p>
              </div>

              {/* Security Questions Section - Only show if questions exist */}
              {itemSecurityQuestions && itemSecurityQuestions.length > 0 && (
                <div className="mt-4">
                  <h6 className="border-bottom pb-2 mb-3">Security Questions</h6>
                  {itemSecurityQuestions.map((qa, index) => (
                    <div 
                      key={qa.id || index} 
                      className="mb-3 p-3 bg-light rounded"
                    >
                      <p className="mb-2">
                        <strong>Question {index + 1}:</strong><br/>
                        {qa.question}
                      </p>
                      <p className="mb-0">
                        <strong>Answer:</strong><br/>
                        {qa.answer}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Modal.Body>

        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Add this function to render claimed items
  const renderClaimedItemCard = (item) => {
    return (
      <Col key={item.itemId} xs={12} md={6} lg={4} className="mb-4">
        <Card className="h-100 shadow-sm">
          <Card.Img 
            variant="top" 
            src={getRandomImage(item.reportType, item.status)} 
            alt={item?.name || item?.itemName || "Item Image"}
            style={{ height: '200px', objectFit: 'cover' }}
          />
          <Card.Body className="d-flex flex-column">
            <Card.Title className="d-flex justify-content-between align-items-start mb-3">
              <span className="text-truncate me-2">
                {item?.name || item?.itemName || "Unnamed Item"}
              </span>
              <Badge
                bg={item?.reportType?.toLowerCase() === "lost" ? "danger" : "success"}
              >
                {item?.reportType || "Unknown"}
              </Badge>
            </Card.Title>
            
            <Card.Subtitle className="mb-3 text-muted">
              {item?.category || "No Category"}
            </Card.Subtitle>
            
            <div className="mb-3">
              <p className="mb-2">
                <strong>Location:</strong> {item?.location || "No Location"}
              </p>
              <p className="mb-2">
                <strong>Description:</strong><br />
                {item?.description || item?.itemDescription || "No Description"}
              </p>
              <p className="mb-2">
                <strong>Reported By:</strong>{" "}
                {item?.finderOrOwnerName || item?.reportedBy || item?.email || "Anonymous"}
              </p>
              <p className="mb-2">
                <strong>Status:</strong>{" "}
                <Badge bg={getStatusBadgeVariant(item?.status)}>
                  {item?.status || "Unknown"}
                </Badge>
              </p>
            </div>

            <div className="text-muted mb-3 small">
              <div>
                Reported on:{" "}
                {item?.date
                  ? new Date(item.date).toLocaleDateString()
                  : "Unknown date"}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2 mt-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleViewDetails(item)}
              >
                <i className="bi bi-eye-fill me-1"></i>
                View Details
              </Button>

              {item?.status?.toLowerCase() !== "claimed" && (
                <>
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

                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Delete
                  </Button>
                </>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  // Update the claimed items section in your JSX
  const renderClaimedItemsSection = () => (
    <Tab.Pane eventKey="claimedItems">
      <Card>
        <Card.Header>
          <h4>Claimed Items</h4>
        </Card.Header>
        <Card.Body>
          {!claimedItems || claimedItems.length === 0 ? (
            <Alert variant="info">
              You haven't claimed any items yet.
            </Alert>
          ) : (
            <>
              <div className="mb-3">
                <small className="text-muted">
                  Showing {claimedItems.length} claimed items
                </small>
              </div>
              <Row xs={1} md={2} lg={3} className="g-4">
                {claimedItems.map((item) => renderClaimedItemCard(item))}
              </Row>
            </>
          )}
        </Card.Body>
      </Card>
    </Tab.Pane>
  );

  return (
    <>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <h1>My Dashboard</h1>
            <p>Welcome back, {name}!</p>
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
            <Nav.Item>
              <Nav.Link
                eventKey="claimedItems"
                onClick={handleClaimedItemsClick}
              >
                My Claimed Items
              </Nav.Link>
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

            {renderClaimedItemsSection()}
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

        <SecurityQuestionsModal 
          selectedItem={selectedItem}
        />

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
      <ItemDetailsModal
        show={showDetailsModal}
        onHide={() => {
          setShowDetailsModal(false);
          setSelectedDetailItem(null);
        }}
        item={selectedDetailItem}
      />
    </>
  );
};

export default UserDashboard;
