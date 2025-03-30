import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Badge, Nav, Modal, Form, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm, useFieldArray } from 'react-hook-form';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedClaimItem, setSelectedClaimItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      answers: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "answers"
  });

  // Watch all answers for debugging
  const watchAnswers = watch("answers");

  useEffect(() => {
    console.log("Current answers:", watchAnswers);
  }, [watchAnswers]);

  const handleLoadItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8080/api/user/all`,
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
      setItems(result);
      console.log("Backend Response:", result);
    } catch (error) {
      console.error("Error loading items:", error);
    }
  };

  useEffect(() => {
    handleLoadItems();
  }, []);

  const handleClaim = async (item) => {
    if (!user) {
      navigate('/login');
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
      
      // Reset form and set initial answers array based on questions
      reset({
        answers: questions.map(q => ({
          questionId: q.id,  // Changed from q._id to q.id
          question: q.question,
          answer: ''
        }))
      });
      
      setShowClaimModal(true);
    } catch (error) {
      console.error('Error:', error);
      // Fallback questions for testing
      const dummyQuestions = [
        { id: '1', question: "What color is the item?" },  // Changed from _id to id
        { id: '2', question: "Where did you last see it?" }  // Changed from _id to id
      ];
      
      reset({
        answers: dummyQuestions.map(q => ({
          questionId: q.id,  // Changed from q._id to q.id
          question: q.question,
          answer: ''
        }))
      });
      
      setSelectedClaimItem(item);
      setShowClaimModal(true);
    }
  };

  const onSubmitAnswers = async (data) => {
    const token = localStorage.getItem("token");
    try {
      console.log("Submit Answers Clicked!");
      console.log("Form Data:", data);
      console.log("Selected Item:", selectedClaimItem);
      console.log("Raw Answers Data:", data.answers);
      const formattedAnswers = data.answers.map(answer => ({
        id: answer.questionId,
        question: answer.question,
        answer: answer.answer,
        itemId: selectedClaimItem.itemId
      }));
      console.log("Formatted Answers:", formattedAnswers);

      const token = localStorage.getItem("token");
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
        throw new Error("Failed to submit answers");
      }

      const result = await response.json();
      console.log("Validation Result:", result);

      if (result.message == "All answers are correct")
      {
        alert("You have claimed the product and will get the finder details soon .")
      }
        // Reset and close modal
        reset();
      setShowClaimModal(false);
      setSelectedClaimItem(null);

    } catch (error) {
      console.error("Error submitting answers:", error);
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  // Filter items based on active tab
  const filteredItems = items.filter(item => {
    if (activeTab === 'all') return true;
    return item.reportType?.toLowerCase() === activeTab;
  });

  const renderItems = (items) => {
    if (items.length === 0) {
      return (
        <Col>
          <Card className="text-center p-4">
            <Card.Text>No items found in this category.</Card.Text>
          </Card>
        </Col>
      );
    }

    return items.map((item) => (
      <Col key={item.id} md={4} className="mb-4">
        <Card>
          <Card.Body>
            <Card.Title className="d-flex justify-content-between align-items-start">
              {item.itemName || "Unnamed Item"}
              <Badge bg={item.reportType?.toLowerCase() === "lost" ? "danger" : "success"}>
                {item.reportType || "Unknown"}
              </Badge>
            </Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              {item.category || "No Category"}
            </Card.Subtitle>
            <Card.Text>
              <strong>Location:</strong> {item.location || "No Location"}
              <br />
              <strong>Description:</strong>
              <br />
              {item.itemDescription || "No Description"}
            </Card.Text>
            <div className="mb-3">
              <Badge bg={item.status === "approved" ? "success" : "warning"}>
                {item.status || "pending"}
              </Badge>
              <small className="text-muted ms-2">
                Reported on: {item.date ? new Date(item.date).toLocaleDateString() : "Unknown date"}
              </small>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="primary" 
                onClick={() => handleViewDetails(item)}
              >
                View Details
              </Button>
              {item.reportType?.toLowerCase() === "found" && item.status !== "claimed" && (
                <Button 
                  variant="success"
                  onClick={() => handleClaim(item)}
                >
                  Claim Item
                </Button>
              )}
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
            <p className="lead">Your trusted platform for finding lost items and returning found ones</p>
          </Col>
        </Row>

        {/* Filter Tabs */}
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'all'} 
              onClick={() => setActiveTab('all')}
              style={{backgroundColor: 'black',color:"white"}}
            >
              All Items
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'lost'} 
              onClick={() => setActiveTab('lost')}
            >
              Lost Items
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={activeTab === 'found'} 
              onClick={() => setActiveTab('found')}
            >
              Found Items
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Items Grid */}
        <Row>
          {renderItems(filteredItems)}
        </Row>

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
                  <p className="mb-1"><strong>Name:</strong> {selectedClaimItem.itemName}</p>
                  <p className="mb-1"><strong>Category:</strong> {selectedClaimItem.category}</p>
                  <p className="mb-1"><strong>Location:</strong> {selectedClaimItem.location}</p>
                </div>
              )}

              {fields.map((field, index) => (
                <Form.Group key={field.id} className="mb-4">
                  <Form.Label>
                    <strong>{field.question}</strong>
                  </Form.Label>
                  <Form.Control
                    {...register(`answers.${index}.answer`, {
                      required: "This answer is required"
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
                  {/* Hidden fields to maintain question data */}
                  <input type="hidden" {...register(`answers.${index}.questionId`)} />
                  <input type="hidden" {...register(`answers.${index}.question`)} />
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
              <Button 
                variant="primary" 
                type="submit"
              >
                Submit Answers
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>

      {/* Details Modal */}
      <Modal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Item Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <div className="item-details">
              <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{selectedItem.itemName}</h5>
                  <Badge bg={selectedItem.reportType?.toLowerCase() === "lost" ? "danger" : "success"}>
                    {selectedItem.reportType}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td width="30%"><strong>Status:</strong></td>
                        <td>
                          <Badge bg={selectedItem.status === "approved" ? "success" : 
                                   selectedItem.status === "claimed" ? "info" : "warning"}>
                            {selectedItem.status}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Category:</strong></td>
                        <td>{selectedItem.category}</td>
                      </tr>
                      <tr>
                        <td><strong>Location:</strong></td>
                        <td>{selectedItem.location}</td>
                      </tr>
                      <tr>
                        <td><strong>Report Date:</strong></td>
                        <td>{selectedItem.date ? new Date(selectedItem.date).toLocaleDateString() : "N/A"}</td>
                      </tr>
                      <tr>
                        <td><strong>Description:</strong></td>
                        <td>{selectedItem.itemDescription}</td>
                      </tr>
                      {selectedItem.additionalDetails && (
                        <tr>
                          <td><strong>Additional Details:</strong></td>
                          <td>{selectedItem.additionalDetails}</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {selectedItem.reportType?.toLowerCase() === "found" && selectedItem.status !== "claimed" && (
                <div className="text-end">
                  <Button 
                    variant="success"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleClaim(selectedItem);
                    }}
                  >
                    Claim This Item
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default HomePage;










