import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Nav,
  Modal,
  Form,
  Table,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useForm, useFieldArray } from "react-hook-form";

// Helper function to format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return "Unknown date/time";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Constants for random images
const lostImages = [
  "https://placehold.co/300x200/dc3545/ffffff?text=Lost+Item",
  "https://placehold.co/300x200/ff6b6b/ffffff?text=Lost+Object",
];

const foundImages = [
  "https://placehold.co/300x200/198754/ffffff?text=Found+Item",
  "https://placehold.co/300x200/40c057/ffffff?text=Found+Object",
];

const claimedImages = [
  "https://placehold.co/300x200/0dcaf0/ffffff?text=Claimed+Item",
  "https://placehold.co/300x200/20c997/ffffff?text=Claimed+Object",
];

const getRandomImage = (reportType, status) => {
  if (status?.toLowerCase() === "claimed") {
    const randomIndex = Math.floor(Math.random() * claimedImages.length);
    return claimedImages[randomIndex];
  }

  const images =
    reportType?.toLowerCase() === "lost" ? lostImages : foundImages;
  const randomIndex = Math.floor(Math.random() * images.length);
  return images[randomIndex];
};

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedClaimItem, setSelectedClaimItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemSecurityQuestions, setItemSecurityQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");

  // Categories for filtering
  const categories = [
    "all",
    "Electronics",
    "Clothing",
    "Documents",
    "Accessories",
    "Others",
  ];

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      answers: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers",
  });

  // Filter items based on search, category, and active tab
  const getFilteredItems = () => {
    return items.filter((item) => {
      const matchesSearch =
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemDescription
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        searchCategory === "all" ||
        item.category?.toLowerCase() === searchCategory.toLowerCase();

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "claimed"
          ? item.status?.toLowerCase() === "claimed"
          : item.reportType?.toLowerCase() === activeTab);

      return matchesSearch && matchesCategory && matchesTab;
    });
  };

  // Load items from API
  const handleLoadItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/user/all`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }

      const result = await response.json();
      console.log("Loaded items:", result); // Debug log to see the fetched items
      setItems(result);

      // Additional debugging information
      console.log("Number of items loaded:", result.length);
      console.log("Sample item structure:", result[0]); // Show structure of first item
      
      // Log filtered items
      const filteredItems = getFilteredItems();
      console.log("Filtered items:", filteredItems);
      console.log("Number of filtered items:", filteredItems.length);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  useEffect(() => {
    handleLoadItems();
  }, []);

  // Handle claiming an item
  const handleClaim = async (item) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/user/get-all-questions/${item.itemId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const questions = await response.json();
      setSelectedClaimItem(item);

      reset({
        answers: questions.map((q) => ({
          questionId: q.id,
          question: q.question,
          answer: "",
        })),
      });

      setShowClaimModal(true);
    } catch (error) {
      console.error("Error:", error);
      const dummyQuestions = [
        { id: "1", question: "What color is the item?" },
        { id: "2", question: "Where did you last see it?" },
      ];

      reset({
        answers: dummyQuestions.map((q) => ({
          questionId: q.id,
          question: q.question,
          answer: "",
        })),
      });

      setSelectedClaimItem(item);
      setShowClaimModal(true);
    }
  };

  // Submit security question answers
  const onSubmitAnswers = async (data) => {
    const token = localStorage.getItem("token");
    try {
      const formattedAnswers = data.answers.map((answer) => ({
        id: answer.questionId,
        question: answer.question,
        answer: answer.answer,
        itemId: selectedClaimItem.itemId,
      }));

      const response = await fetch(
        `http://localhost:8080/api/user/security-questions/validate/${selectedClaimItem.itemId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formattedAnswers),
        }
      );

      if (!response.ok) {
        alert("Wrong answers");
        setShowClaimModal(false);
        setSelectedClaimItem(null);
        reset();
        return;
      }

      const result = await response.json();
      if (result.message === "All answers are correct") {
        alert(
          "You have claimed the product and will get the finder details soon."
        );
      } else {
        alert(result.message);
      }

      reset();
      setShowClaimModal(false);
      setSelectedClaimItem(null);
    } catch (error) {
      setShowClaimModal(false);
      setSelectedClaimItem(null);
      reset();
      navigate("/home");
      console.error("Error submitting answers:", error);
    }
  };

  // View item details
  const handleViewDetails = async (item) => {
    setSelectedItem(item);

    if (item.reportType?.toLowerCase() === "found") {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:8080/api/finder/get-item-security-questions/${item.itemId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const questions = await response.json();
          setItemSecurityQuestions(questions);
        } else {
          setItemSecurityQuestions([]);
        }
      } catch (error) {
        console.error("Error fetching security questions:", error);
        setItemSecurityQuestions([]);
      }
    } else {
      setItemSecurityQuestions([]);
    }

    setShowDetailsModal(true);
  };

  // Render individual items
  const renderItems = (items) => {
    if (items.length === 0) {
      return (
        <Col>
          <Card className="text-center p-4">
            <Card.Text>
              {activeTab === "claimed"
                ? "No claimed items found."
                : searchTerm || searchCategory !== "all"
                ? "No items match your search criteria."
                : "No items found in this category."}
            </Card.Text>
          </Card>
        </Col>
      );
    }

    return items.map((item) => (
      <Col key={item.id} md={4} className="mb-4">
        <Card className="h-100 shadow hover-card">
          <div className="position-relative">
            <Card.Img
              variant="top"
              src={getRandomImage(item.reportType, item.status)}
              alt={item.itemName || "Item Image"}
              style={{ height: "200px", objectFit: "cover" }}
              className="card-img-transition"
            />
            <Badge
              bg={
                item.reportType?.toLowerCase() === "lost" ? "danger" : "success"
              }
              className="position-absolute top-0 end-0 m-2 px-3 py-2"
            >
              {item.reportType || "Unknown"}
            </Badge>
          </div>

          <Card.Body className="d-flex flex-column">
            <div className="mb-3">
              <Card.Title className="h5 text-primary mb-1">
                {item.itemName || "Unnamed Item"}
              </Card.Title>
              <Card.Subtitle className="text-muted small">
                <i className="bi bi-tag-fill me-1"></i>
                {item.category || "No Category"}
              </Card.Subtitle>
            </div>

            <div className="item-details mb-3">
              <p className="mb-2">
                <strong>
                  <i className="bi bi-geo-alt-fill me-1"></i>Location:
                </strong>
                <br />
                <span className="text-secondary">
                  {item.location || "No Location"}
                </span>
              </p>
              <p className="mb-2">
                <strong>
                  <i className="bi bi-info-circle-fill me-1"></i>Description:
                </strong>
                <br />
                <span className="text-secondary description-text">
                  {item.itemDescription || "No Description"}
                </span>
              </p>
              <p className="mb-2">
                <strong>
                  <i className="bi bi-person-fill me-1"></i>Reported By:
                </strong>
                <br />
                <span className="text-secondary">
                  {item.finderOrOwnerName ||
                    item.finderOrWonerName ||
                    "Anonymous"}
                </span>
              </p>
              <p className="mb-2">
                <strong>
                  <i className="bi bi-check-circle-fill me-1"></i>Status:
                </strong>{" "}
                <Badge
                  bg={
                    item.status === "approved"
                      ? "success"
                      : item.status === "pending"
                      ? "warning"
                      : item.status === "claimed"
                      ? "info"
                      : item.status === "rejected"
                      ? "danger"
                      : "secondary"
                  }
                  className="px-2 py-1"
                >
                  {item.status || "Unknown"}
                </Badge>
              </p>
            </div>

            <div className="mt-auto">
              <medium className="text-muted d-block mb-3 bold">
                <i className="bi bi-calendar-event me-1"></i>
                Reported on: {formatDateTime(item.date)}
              </medium>

              <div className="d-grid gap-2 d-md-flex justify-content-between">
                <Button
                  variant="outline-primary"
                  className="flex-grow-1 me-md-2"
                  onClick={() => handleViewDetails(item)}
                >
                  <i className="bi bi-eye-fill me-1"></i>View Details
                </Button>
                {item.reportType?.toLowerCase() === "found" &&
                  item.status !== "claimed" && (
                    <Button
                      variant="outline-success"
                      className="flex-grow-1"
                      onClick={() => handleClaim(item)}
                    >
                      <i className="bi bi-hand-index-thumb-fill me-1"></i>
                      Claim Item
                    </Button>
                  )}
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    ));
  };

  return (
    <>
      <Container className="py-5">
        {/* Welcome section */}
        <Row className="text-center mb-5">
          <Col>
            <h1 className="display-4">Welcome to Lost & Found</h1>
            <p className="lead">
              Your trusted platform for finding lost items and returning found
              ones
            </p>
          </Col>
        </Row>

        {/* Hero Search Section */}
        <div className="hero-search-section mb-5">
          <div className="search-overlay">
            <h2 className="search-title text-center mb-4">
              Find What You're Looking For
              <div className="search-subtitle">Search through thousands of lost and found items</div>
            </h2>
            
            <Card className="mega-search-card">
              <Card.Body className="p-4">
                <Row className="g-4">
                  <Col lg={6}>
                    <div className="search-input-wrapper">
                      <div className="position-relative">
                        <i className="bi bi-search search-icon"></i>
                        <Form.Control
                          type="text"
                          placeholder="What are you looking for?"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="search-input ps-5"
                        />
                        {searchTerm && (
                          <Button
                            variant="link"
                            className="clear-search-btn"
                            onClick={() => setSearchTerm("")}
                            title="Clear search"
                          >
                            <i className="bi bi-x-lg"></i>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col lg={4}>
                    <div className="category-select-wrapper">
                      <i className="bi bi-grid-3x3-gap category-icon"></i>
                      <Form.Select
                        value={searchCategory}
                        onChange={(e) => setSearchCategory(e.target.value)}
                        className="category-select ps-5"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  </Col>
                  <Col lg={2}>
                    <Button 
                      variant="primary" 
                      className="search-button w-100"
                    >
                      <i className="bi bi-search me-2"></i>
                      Search
                    </Button>
                  </Col>
                </Row>
                
                <div className="popular-searches mt-4">
                  <span className="text-muted me-2">Popular:</span>
                  <Button variant="outline-secondary" size="sm" className="popular-tag me-2">Electronics</Button>
                  <Button variant="outline-secondary" size="sm" className="popular-tag me-2">Wallets</Button>
                  <Button variant="outline-secondary" size="sm" className="popular-tag me-2">Keys</Button>
                  <Button variant="outline-secondary" size="sm" className="popular-tag">Documents</Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>

        {/* Filter Tabs */}
        <Nav variant="tabs">
          <Nav.Item>
            <Nav.Link
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
            >
              All Items
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === "lost"}
              onClick={() => setActiveTab("lost")}
            >
              Lost Items
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === "found"}
              onClick={() => setActiveTab("found")}
            >
              Found Items
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === "claimed"}
              onClick={() => setActiveTab("claimed")}
            >
              Claimed Items
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Items Grid */}
        <Row>{renderItems(getFilteredItems())}</Row>

        {/* Claim Modal */}
        <Modal
          show={showClaimModal}
          onHide={() => {
            setShowClaimModal(false);
            reset();
          }}
          size="lg"
        >
          <Form onSubmit={handleSubmit(onSubmitAnswers)}>
            <Modal.Header closeButton>
              <Modal.Title>Answer Security Questions</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {selectedClaimItem && (
                <div className="mb-4">
                  <h6>Item Details:</h6>
                  <p className="mb-1">
                    <strong>Name:</strong> {selectedClaimItem.itemName}
                  </p>
                  <p className="mb-1">
                    <strong>Category:</strong> {selectedClaimItem.category}
                  </p>
                  <p className="mb-1">
                    <strong>Location:</strong> {selectedClaimItem.location}
                  </p>
                </div>
              )}

              {fields.map((field, index) => (
                <Form.Group key={field.id} className="mb-4">
                  <Form.Label>
                    <strong>{field.question}</strong>
                  </Form.Label>
                  <Form.Control
                    {...register(`answers.${index}.answer`, {
                      required: "This answer is required",
                    })}
                    type="text"
                    placeholder="Enter your answer"
                    isInvalid={errors.answers?.[index]?.answer}
                  />
                  {errors.answers?.[index]?.answer && (
                    <Form.Control.Feedback type="invalid">
                      {errors.answers[index].answer.message}
                    </Form.Control.Feedback>
                  )}
                  <input
                    type="hidden"
                    {...register(`answers.${index}.questionId`)}
                  />
                  <input
                    type="hidden"
                    {...register(`answers.${index}.question`)}
                  />
                </Form.Group>
              ))}
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowClaimModal(false);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Submit Answers
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {/* Details Modal */}
        <Modal
          show={showDetailsModal}
          onHide={() => {
            setShowDetailsModal(false);
            setSelectedItem(null);
            setItemSecurityQuestions([]);
          }}
          size="lg"
          dialogClassName="modal-90w"
        >
          <Modal.Header closeButton className="bg-light">
            <Modal.Title className="d-flex align-items-center">
              <span className="me-2">Item Details</span>
              <Badge
                bg={
                  selectedItem?.reportType?.toLowerCase() === "lost"
                    ? "danger"
                    : "success"
                }
              >
                {selectedItem?.reportType}
              </Badge>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            {selectedItem && (
              <Card className="border-0">
                <Card.Body>
                  <div className="mb-4">
                    <h4 className="mb-3">{selectedItem.itemName}</h4>
                    <Badge
                      bg={
                        selectedItem.status === "approved"
                          ? "success"
                          : selectedItem.status === "claimed"
                          ? "info"
                          : selectedItem.status === "pending"
                          ? "warning"
                          : "secondary"
                      }
                      className="px-3 py-2"
                    >
                      {selectedItem.status}
                    </Badge>
                  </div>

                  <Row>
                    <Col md={6} className="mb-4 mb-md-0">
                      <img
                        src={getRandomImage(
                          selectedItem.reportType,
                          selectedItem.status
                        )}
                        alt={selectedItem.itemName}
                        className="img-fluid rounded shadow-sm"
                        style={{
                          width: "100%",
                          height: "300px",
                          objectFit: "cover",
                          border: "1px solid #dee2e6",
                        }}
                      />
                    </Col>

                    <Col md={6}>
                      <div className="details-section">
                        <h6 className="border-bottom pb-2 mb-3">
                          Basic Information
                        </h6>
                        <Table borderless className="details-table">
                          <tbody>
                            <tr>
                              <td width="35%">
                                <strong>Category:</strong>
                              </td>
                              <td>
                                {selectedItem.category || "Not specified"}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Location:</strong>
                              </td>
                              <td>
                                {selectedItem.location || "Not specified"}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Reported On:</strong>
                              </td>
                              <td>{formatDateTime(selectedItem.date)}</td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Reported By:</strong>
                              </td>
                              <td>
                                {selectedItem.finderOrOwnerName ||
                                  selectedItem.finderOrWonerName ||
                                  "Anonymous"}
                              </td>
                            </tr>
                          </tbody>
                        </Table>

                        {selectedItem.status?.toLowerCase() === "claimed" && (
                          <>
                            <h6 className="border-bottom pb-2 mb-3 mt-4">
                              Claim Information
                            </h6>
                            <Table borderless className="details-table">
                              <tbody>
                                <tr>
                                  <td width="35%">
                                    <strong>Claimed By:</strong>
                                  </td>
                                  <td>
                                    {selectedItem.claimedUserName ||
                                      "Not specified"}
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <strong>Claimed At:</strong>
                                  </td>
                                  <td>
                                    {formatDateTime(selectedItem.claimedAt)}
                                  </td>
                                </tr>
                              </tbody>
                            </Table>
                          </>
                        )}
                      </div>
                    </Col>
                  </Row>

                  <div className="mt-4">
                    <h6 className="border-bottom pb-2 mb-3">Description</h6>
                    <p className="text-muted">
                      {selectedItem.itemDescription ||
                        "No description available"}
                    </p>
                  </div>

                  {selectedItem.additionalDetails && (
                    <div className="mt-4">
                      <h6 className="border-bottom pb-2 mb-3">
                        Additional Details
                      </h6>
                      <p className="text-muted">
                        {selectedItem.additionalDetails}
                      </p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </Modal.Body>

          <Modal.Footer className="bg-light">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedItem(null);
                setItemSecurityQuestions([]);
              }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

export default HomePage;
