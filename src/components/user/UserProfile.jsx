import { useState, useEffect } from "react";
import { Container, Card, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { useForm } from "react-hook-form";

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",  // Changed from phoneNumber to phone to match backend
    address: "",
    city: "",
    state: "",
    department: ""
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm();

  // Load profile data when component mounts
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/api/user/get-logged-in-user-details", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const data = await response.json();
      console.log("Loaded user data:", data); // Debug log
      
      // Use phone instead of phoneNumber
      setValue("phone", data.phone || "");
      
      setProfileData(data);
      reset(data); // Reset form with loaded data
    } catch (error) {
      console.error("Error loading profile:", error);
      showMessage("danger", "Failed to load profile data");
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const { user } = useAuth(); // Use the auth context instead

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(
        "http://localhost:8080/api/user/updateUserDetails",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedData = await response.json();

      setProfileData(updatedData);

      //display messge to user 
      setIsEditing(false);
      showMessage("success", "Profile updated successfully");
      alert(updatedData.message);
    } catch (error) {
      showMessage("danger", "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this debug useEffect to check form values
  useEffect(() => {
    console.log("Current profile data:", profileData);
  }, [profileData]);

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg border-0 rounded-3">
            <Card.Header className="bg-gradient-primary text-white py-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="mb-1 fw-bold">Profile Details</h3>
                  <p className="mb-0 opacity-75 small">
                    <i className="bi bi-info-circle me-2"></i>
                    Manage your personal information
                  </p>
                </div>
                <Button
                  variant={isEditing ? "light" : "outline-light"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 rounded-pill"
                >
                  {isEditing ? (
                    <>
                      <i className="bi bi-x-lg me-2"></i>Cancel
                    </>
                  ) : (
                    <>
                      <i className="bi bi-pencil-square me-2"></i>Edit Profile
                    </>
                  )}
                </Button>
              </div>
            </Card.Header>

            <Card.Body className="p-4">
              {message.text && (
                <Alert
                  variant={message.type}
                  className="mb-4 d-flex align-items-center rounded-3 border-0 shadow-sm"
                >
                  <i className={`bi bi-${message.type === "success" ? "check-circle-fill" : "exclamation-circle-fill"} me-2`}></i>
                  {message.text}
                </Alert>
              )}

              <Form onSubmit={handleSubmit(onSubmit)} className="profile-form">
                <Row className="mb-4 g-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-primary">
                        <i className="bi bi-person-fill me-2"></i>First Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        {...register("firstName", {
                          required: "First name is required"
                        })}
                        disabled={!isEditing}
                        className="py-2 rounded-3 shadow-sm"
                        placeholder="Enter your first name"
                      />
                      {errors.firstName && (
                        <Form.Control.Feedback type="invalid">
                          {errors.firstName.message}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-primary">
                        <i className="bi bi-person-fill me-2"></i>Last Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        {...register("lastName", {
                          required: "Last name is required"
                        })}
                        disabled={!isEditing}
                        className="py-2 rounded-3 shadow-sm"
                        placeholder="Enter your last name"
                      />
                      {errors.lastName && (
                        <Form.Control.Feedback type="invalid">
                          {errors.lastName.message}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-primary">
                    <i className="bi bi-envelope-fill me-2"></i>Email Address
                  </Form.Label>
                  <Form.Control
                    type="email"
                    {...register("email")}
                    disabled={true}
                    className="py-2 bg-light rounded-3 shadow-sm"
                    placeholder="Your email address"
                  />
                  <Form.Text className="text-muted mt-2 d-block">
                    <i className="bi bi-shield-lock-fill me-1"></i>
                    Email cannot be changed for security reasons
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-primary">
                    <i className="bi bi-telephone-fill me-2"></i>Phone Number
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    {...register("phone", {  // Changed from phoneNumber to phone
                      required: "Phone number is required",
                      pattern: {
                        value: /^\d{10}$/,
                        message: "Please enter a valid 10-digit phone number"
                      }
                    })}
                    defaultValue={profileData.phone}  // Changed from phoneNumber to phone
                    disabled={!isEditing}
                    className={`py-2 rounded-3 shadow-sm ${errors.phone ? 'is-invalid' : ''}`}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && (  // Changed from phoneNumber to phone
                    <Form.Control.Feedback type="invalid" className="d-block">
                      {errors.phone.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-primary">
                    <i className="bi bi-geo-alt-fill me-2"></i>Address
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    {...register("address", {
                      required: "Address is required",
                      minLength: {
                        value: 10,
                        message: "Please enter a complete address"
                      }
                    })}
                    disabled={!isEditing}
                    className="py-2 rounded-3 shadow-sm"
                    placeholder="Enter your full address"
                  />
                  {errors.address && (
                    <Form.Control.Feedback type="invalid">
                      {errors.address.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                <Row className="mb-4 g-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-primary">
                        <i className="bi bi-building-fill me-2"></i>City
                      </Form.Label>
                      <Form.Control
                        type="text"
                        {...register("city", {
                          required: "City is required",
                          minLength: {
                            value: 2,
                            message: "City name must be at least 2 characters"
                          }
                        })}
                        disabled={!isEditing}
                        className="py-2 rounded-3 shadow-sm"
                        placeholder="Enter your city"
                      />
                      {errors.city && (
                        <Form.Control.Feedback type="invalid">
                          {errors.city.message}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold text-primary">
                        <i className="bi bi-geo-fill me-2"></i>State
                      </Form.Label>
                      <Form.Control
                        type="text"
                        {...register("state", {
                          required: "State is required",
                          minLength: {
                            value: 2,
                            message: "State name must be at least 2 characters"
                          }
                        })}
                        disabled={!isEditing}
                        className="py-2 rounded-3 shadow-sm"
                        placeholder="Enter your state"
                      />
                      {errors.state && (
                        <Form.Control.Feedback type="invalid">
                          {errors.state.message}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold text-primary">
                    <i className="bi bi-building-fill me-2"></i>Department
                  </Form.Label>
                  <Form.Select
                    disabled={!isEditing}
                    className="py-2 rounded-3 shadow-sm"
                    {...register("department")}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setValue("department", newValue);
                      setProfileData(prev => ({...prev, department: newValue}));
                    }}
                  >
                    <option value="">Select Department</option>
                    <option value="CS">Computer Science (CS)</option>
                    <option value="IT">Information Technology (IT)</option>
                    <option value="EE">Electrical Engineering (EE)</option>
                    <option value="EX">Electronics Engineering (EX)</option>
                    <option value="CIVIL">Civil Engineering</option>
                    <option value="MECHANICAL">Mechanical Engineering</option>
                    <option value="CDS">Computing & Data Science (CDS)</option>
                    <option value="ARENA">Arena Animation</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                  {errors.department && (
                    <Form.Control.Feedback type="invalid">
                      {errors.department.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                {isEditing && (
                  <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        reset(profileData);
                      }}
                      className="px-4 rounded-pill"
                    >
                      <i className="bi bi-x-circle-fill me-2"></i>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 rounded-pill"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2-circle-fill me-2"></i>
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfile;




