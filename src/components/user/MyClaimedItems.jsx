import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Alert,
  Modal,
  Table,
} from "react-bootstrap";

const claimedImages = [
  "https://placehold.co/300x200/0dcaf0/ffffff?text=Claimed+Item",
  "https://placehold.co/300x200/20c997/ffffff?text=Claimed+Object"
];

const getRandomImage = (reportType, status) => {
  const randomIndex = Math.floor(Math.random() * claimedImages.length);
  return claimedImages[randomIndex];
};

const MyClaimedItems = () => {
  const [claimedItems, setClaimedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [itemSecurityQuestions, setItemSecurityQuestions] = useState([]);
  const [showFinderModal, setShowFinderModal] = useState(false);
  const [finderDetails, setFinderDetails] = useState(null);

  const fetchClaimedItems = async () => {
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
      setClaimedItems(result);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching claimed items:", error);
      setError("Failed to fetch claimed items");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaimedItems();
  }, []);

  const handleViewDetails = async (item) => {
    try {
      const token = localStorage.getItem("token");

      // Debug log to check the item object
      console.log("Item being processed:", item);

      // Check if we have a valid finder/reporter userId
      if (!item.userId && !item.finderId) {
        console.error("No user ID found in item:", item);
        throw new Error("User ID not found");
      }

      // Use the appropriate ID (either userId or finderId)
      const userIdToFetch = 1;
      console.log(item.userId)

      console.log("Fetching details for user ID:", userIdToFetch);

      // Fetch finder/reporter details first
      const itemResponse = await fetch(
        `http://localhost:8080/api/user/get-user-details/${userIdToFetch}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Log the response status and headers
      console.log("Response status:", itemResponse.status);
      console.log("Response headers:", Object.fromEntries(itemResponse.headers));

      if (!itemResponse.ok) {
        throw new Error(`Failed to fetch finder details: ${itemResponse.status}`);
      }

      // Get the response text first to check if it's empty
      const responseText = await itemResponse.text();
      console.log("Raw response:", responseText);

      if (!responseText) {
        throw new Error("Empty response from server");
      }

      // Try to parse the JSON
      let finderDetails;
      try {
        finderDetails = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid JSON response from server");
      }

      console.log("Finder details:", finderDetails);
      setFinderDetails(finderDetails);

      // If the item is claimed, also fetch claimer details
      let claimerDetails = null;
      if (item.claimedUserId) {
        const claimerResponse = await fetch(
          `http://localhost:8080/api/user/get-user-details/${item.claimedUserId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (claimerResponse.ok) {
          const claimerText = await claimerResponse.text();
          if (claimerText) {
            try {
              claimerDetails = JSON.parse(claimerText);
              console.log("Claimer details:", claimerDetails);
            } catch (parseError) {
              console.error("Error parsing claimer details:", parseError);
            }
          }
        }
      }

      // Create complete item details
      const completeItemDetails = {
        ...item,
        finderDetails: finderDetails || {},  // Provide default empty object if null
        claimerDetails: claimerDetails || {} // Provide default empty object if null
      };

      // Set the complete details in state
      setSelectedDetailItem(completeItemDetails);
      setShowDetailsModal(true);

    } catch (error) {
      console.error("Error fetching details:", error);
      // Show a more user-friendly error in the UI
      setError(`Failed to fetch details: ${error.message}`);
      // Still show the modal with available item details
      setSelectedDetailItem({
        ...item,
        finderDetails: {},
        claimerDetails: {}
      });
      setShowDetailsModal(true);
    }
  };

  const ItemDetailsModal = ({ show, onHide, item }) => {
    return (
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {item?.itemName || "Item Details"}
            <Badge
              bg={
                item?.reportType?.toLowerCase() === "lost"
                  ? "danger"
                  : "success"
              }
              className="ms-2"
            >
              {item?.reportType}
            </Badge>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Col md={6}>
              <img
                src={getRandomImage(item?.reportType, item?.status)}
                alt={item?.itemName}
                className="img-fluid rounded mb-3"
                style={{ width: "100%", height: "300px", objectFit: "cover" }}
              />
            </Col>

            <Col md={6}>
              <Table borderless>
                <tbody>
                  <tr>
                    <td>
                      <strong>Status:</strong>
                    </td>
                    <td>
                      <Badge
                        bg={
                          item?.status === "claimed"
                            ? "info"
                            : item?.status === "approved"
                            ? "success"
                            : "warning"
                        }
                      >
                        {item?.status}
                      </Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Category:</strong>
                    </td>
                    <td>{item?.category || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Location:</strong>
                    </td>
                    <td>{item?.location || "Not specified"}</td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Date:</strong>
                    </td>
                    <td>
                      {item?.date
                        ? new Date(item.date).toLocaleDateString()
                        : "Not specified"}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Description:</strong>
                    </td>
                    <td>
                      {item?.itemDescription || "No description available"}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          <hr />

          <Row className="mt-3">
            {item?.status === "claimed" && (
              <Col md={12}>
                <h6>Claimer Details</h6>
                <Table borderless size="sm">
                  <tbody>
                    <tr>
                      <td>
                        <strong>First Name:</strong>
                      </td>
                      <td>{item?.claimerDetails?.firstName || "Not available"}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>last Name:</strong>
                      </td>
                      <td>{item?.claimerDetails?.lastName || "Not available"}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Claimed At:</strong>
                      </td>
                      <td>
                        {item?.claimedAt
                          ? new Date(item.claimedAt).toLocaleDateString()
                          : "Not available"}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            )}
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const finderDetailsButtonClicked = async(item) => {
    try {
      const token = localStorage.getItem("token");
      const itemResponse = await fetch(
        `http://localhost:8080/api/user/get-user-details/1`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!itemResponse.ok) {
        throw new Error(`Failed to fetch finder details: ${itemResponse.status}`);
      }

      const responseText = await itemResponse.text();
      if (!responseText) {
        throw new Error("Empty response from server");
      }

      const finderDetails = JSON.parse(responseText);
      setFinderDetails(finderDetails);
      setShowFinderModal(true); // Show the modal after setting the details
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to fetch finder details");
    }
  };

  const FinderDetailsModal = ({ show, onHide, finderDetails }) => {
    return (
      <Modal show={show} onHide={onHide} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-badge me-2"></i>
            Finder Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table borderless>
            <tbody>
              <tr>
                <td><strong>First Name:</strong></td>
                <td>{finderDetails?.firstName || "Not available"}</td>
              </tr>
              <tr>
                <td><strong>Last Name:</strong></td>
                <td>{finderDetails?.lastName || "Not available"}</td>
              </tr>
              <tr>
                <td><strong>Email:</strong></td>
                <td>{finderDetails?.email || "Not available"}</td>
              </tr>
              <tr>
                <td><strong>Phone:</strong></td>
                <td>{finderDetails?.phone || "Not available"}</td>
              </tr>
              <tr>
                <td><strong>Address:</strong></td>
                <td>{finderDetails?.address || "Not available"}</td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const renderClaimedItemCard = (item) => {
    return (
      <Col key={item.itemId} md={4} className="mb-4">
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
              bg={item.reportType?.toLowerCase() === "lost" ? "danger" : "success"}
              className="position-absolute top-0 end-0 m-2 px-3 py-2"
            >
              {item.reportType || "Unknown"}
            </Badge>
          </div>

          <Card.Body>
            <Card.Title className="h5 mb-1">
              {item.itemName || "Unnamed Item"}
            </Card.Title>
            <Card.Subtitle className="text-muted small mb-3">
              <i className="bi bi-tag-fill me-1"></i>
              {item.category || "No Category"}
            </Card.Subtitle>

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
                  {item.finderName || "Anonymous"}
                </span>
              </p>
              {/* <p className="mb-2">
                <strong>
                  <i className="bi bi-person-check-fill me-1"></i>Claimed By:
                </strong>
                <br />
                <span className="text-secondary">
                  {item.claimedUserName || "Not specified"}
                </span>
              </p> */}
              <p className="mb-2">
                <strong>
                  <i className="bi bi-check-circle-fill me-1"></i>Status:
                </strong>{" "}
                <Badge
                  bg={
                    item.status === "approved" ? "success" :
                    item.status === "claimed" ? "info" : "warning"
                  }
                >
                  {item.status}
                </Badge>
              </p>
            </div>

            <div className="mt-auto">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  <i className="bi bi-calendar-event me-1"></i>
                  Reported: {new Date(item.date).toLocaleDateString()}
                </small>
                <small className="text-muted">
                  <i className="bi bi-clock-fill me-1"></i>
                  Claimed: {new Date(item.claimedAt).toLocaleDateString()}
                </small>
              </div>

              <div className="d-flex flex-column gap-2">
                <Button
                  variant="outline-primary"
                  onClick={() => handleViewDetails(item)}
                >
                  <i className="bi bi-eye-fill me-1"></i>View Details
                </Button>
                
                <Button
                  variant="outline-info"
                  onClick={() => finderDetailsButtonClicked(item)}
                  className="d-flex align-items-center justify-content-center"
                >
                  <i className="bi bi-person-badge me-2"></i>
                  See Finder Details
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  return (
    <Container className="py-4">
      
      <Row className="mb-4">
        <Col>
          <h1>My Claimed Items</h1>
          <p className="text-muted">View and manage your claimed items</p>
        </Col>
      </Row>

      {loading ? (
        <Alert variant="info">Loading claimed items...</Alert>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : claimedItems.length === 0 ? (
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          You haven't claimed any items yet.
        </Alert>
      ) : (
        <Row>
          {claimedItems.map(item => renderClaimedItemCard(item))}
        </Row>
      )}

      <ItemDetailsModal
        show={showDetailsModal}
        onHide={() => {
          setShowDetailsModal(false);
          setSelectedDetailItem(null);
          setItemSecurityQuestions([]);
        }}
        item={selectedDetailItem}
        securityQuestions={itemSecurityQuestions}
      />

      <FinderDetailsModal
        show={showFinderModal}
        onHide={() => setShowFinderModal(false)}
        finderDetails={finderDetails}
      />
    </Container>
  );
};

export default MyClaimedItems;








