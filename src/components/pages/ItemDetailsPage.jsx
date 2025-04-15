import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Badge, Button, Row, Col, Table } from 'react-bootstrap';

const ItemDetailsPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:8080/api/finder/get-item/${itemId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch item details');
        }

        const data = await response.json();
        setItem(data);
      } catch (error) {
        console.error('Error fetching item details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [itemId]);

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  if (!item) {
    return (
      <Container className="py-5">
        <div className="text-center">Item not found</div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Button 
        variant="outline-primary" 
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <i className="bi bi-arrow-left me-2"></i>
        Back
      </Button>

      <Row>
        <Col lg={8} className="mx-auto">
          <Card className="shadow-sm">
            <Card.Header className="bg-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="mb-0">{item.itemName || "Unnamed Item"}</h3>
                <Badge 
                  bg={item.reportType?.toLowerCase() === "lost" ? "danger" : "success"}
                  className="fs-6"
                >
                  {item.reportType}
                </Badge>
              </div>
            </Card.Header>

            <Card.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <img
                    src="https://placehold.co/600x400/e9ecef/495057?text=Item+Image"
                    alt={item.itemName}
                    className="img-fluid rounded"
                  />
                </Col>
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td className="fw-bold" width="40%">Status:</td>
                        <td>
                          <Badge bg={
                            item.status === "approved" ? "success" :
                            item.status === "pending" ? "warning" :
                            item.status === "claimed" ? "info" : "secondary"
                          }>
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Category:</td>
                        <td>{item.category || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Location:</td>
                        <td>{item.location || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Report Date:</td>
                        <td>{item.date ? new Date(item.date).toLocaleDateString() : "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Reported By:</td>
                        <td>{item.finderOrOwnerName || item.reportedBy || "Anonymous"}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>

              <div className="mb-4">
                <h5 className="mb-3">Description</h5>
                <p className="text-muted">
                  {item.itemDescription || "No description available"}
                </p>
              </div>

              {item.additionalDetails && (
                <div className="mb-4">
                  <h5 className="mb-3">Additional Details</h5>
                  <p className="text-muted">{item.additionalDetails}</p>
                </div>
              )}

              <div className="d-flex gap-2">
                {item.reportType?.toLowerCase() === "found" && (
                  <Button 
                    variant="success"
                    disabled={item.status === "claimed"}
                  >
                    {item.status === "claimed" ? "Already Claimed" : "Claim Item"}
                  </Button>
                )}
                {item.userId === localStorage.getItem('userId') && (
                  <Button variant="danger">
                    Delete Item
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ItemDetailsPage;