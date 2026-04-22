# Requirements Document

## Introduction

GlowAI is an intelligent web-based platform that uses AI and cloud computing to analyze a user's skin from facial images and recommend suitable cosmetic products. The system addresses the inaccessibility of professional skin diagnosis by providing automated, accurate, and personalized skin analysis without requiring clinic visits. Users upload or capture a facial image, the AI pipeline detects and classifies skin type and conditions, and the recommendation engine surfaces ranked cosmetic products tailored to the user's skin profile.

## Glossary

- **GlowAI**: The overall web-based skin analysis and recommendation platform
- **User**: A registered individual using the GlowAI platform
- **Skin_Analyzer**: The AI pipeline responsible for processing facial images and producing skin analysis results
- **Face_Detector**: The MTCNN/OpenCV-based component that detects and segments facial regions from an image
- **CNN_Classifier**: The convolutional neural network model that classifies skin type and detects skin conditions
- **Recommendation_Engine**: The component that maps skin analysis results to ranked cosmetic product suggestions
- **Auth_Service**: The component responsible for user registration, login, session management, and OAuth
- **Image_Preprocessor**: The component that resizes, normalizes, and augments images before model inference
- **Report_Generator**: The component that produces downloadable PDF reports of skin analysis results
- **Product_Database**: The MongoDB collection storing cosmetic product data, ingredients, and metadata
- **User_Profile**: The stored record of a user's personal info, skin profile, and analysis history
- **Dashboard**: The React.js UI view showing analysis history, current skin profile, and recommendations
- **Skin_Type**: One of five classifications: oily, dry, combination, normal, or sensitive
- **Skin_Condition**: A detected skin issue such as acne, dark spots, enlarged pores, or wrinkles
- **Skin_Region**: A segmented facial area: forehead, left cheek, right cheek, or chin
- **Confidence_Score**: A numeric value between 0.0 and 1.0 representing model prediction certainty
- **Compatibility_Score**: A numeric value between 0.0 and 1.0 representing how well a product matches a user's skin profile

---

## Requirements

### Requirement 1: User Registration and Skin Profile Setup

**User Story:** As a new user, I want to register with my personal details and skin profile in a guided multi-step flow, so that the system can personalize analysis and recommendations from the start.

#### Acceptance Criteria

1. THE Auth_Service SHALL collect first name, last name, email, phone number, date of birth, and gender during Step 1 of registration.
2. THE Auth_Service SHALL collect skin type selection, primary skin concern, skin tone, and known allergies during Step 2 of registration.
3. THE Auth_Service SHALL collect password and terms agreement during Step 3 of registration.
4. WHEN a user submits a registration step with missing required fields, THE Auth_Service SHALL display a field-level validation error and prevent progression to the next step.
5. WHEN a user completes all three registration steps, THE Auth_Service SHALL create a User_Profile and redirect the user to the Dashboard.
6. WHEN a user chooses Google OAuth sign-in, THE Auth_Service SHALL authenticate the user via Google OAuth 2.0 and create or retrieve the associated User_Profile.
7. IF a user submits an email address already associated with an existing account, THEN THE Auth_Service SHALL return an error message indicating the email is already registered.

---

### Requirement 2: User Authentication and Session Management

**User Story:** As a registered user, I want to securely log in and maintain an authenticated session, so that my data and history remain private and accessible only to me.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE Auth_Service SHALL issue a session token and grant access to protected routes.
2. WHEN a user submits invalid credentials, THE Auth_Service SHALL return an authentication error and SHALL NOT reveal whether the email or password was incorrect.
3. WHILE a user session token is valid, THE Auth_Service SHALL allow access to all authenticated endpoints without requiring re-login.
4. WHEN a session token expires, THE Auth_Service SHALL reject requests to authenticated endpoints and return an unauthorized response.
5. WHEN a user logs out, THE Auth_Service SHALL invalidate the session token immediately.

---

### Requirement 3: Facial Image Ingestion

**User Story:** As a user, I want to upload a photo or use my webcam to capture a facial image, so that the system can analyze my skin without requiring specialized equipment.

#### Acceptance Criteria

1. THE GlowAI SHALL accept facial image uploads in JPEG, PNG, and WebP formats.
2. THE GlowAI SHALL accept images with a minimum resolution of 224x224 pixels.
3. WHEN a user initiates webcam capture, THE GlowAI SHALL request camera permission and display a live preview before capture.
4. IF an uploaded image exceeds 10 MB in file size, THEN THE GlowAI SHALL reject the upload and display a file size error to the user.
5. IF an uploaded image fails quality control checks (blurred, low contrast, or no face detected), THEN THE Image_Preprocessor SHALL reject the image and return a descriptive error message specifying the reason for rejection.

---

### Requirement 4: Image Preprocessing Pipeline

**User Story:** As a system operator, I want all input images to be normalized and augmented consistently, so that the AI model receives standardized inputs that maximize classification accuracy.

#### Acceptance Criteria

1. THE Image_Preprocessor SHALL resize all input images to 224x224 pixels before passing them to the CNN_Classifier.
2. THE Image_Preprocessor SHALL normalize pixel values to the range [0.0, 1.0].
3. WHEN processing training data, THE Image_Preprocessor SHALL apply data augmentation including random rotation (up to ±15 degrees), horizontal flipping, and brightness adjustment (±20%).
4. THE Image_Preprocessor SHALL filter out images with a blur score below the defined quality threshold before forwarding to the Face_Detector.
5. WHEN an image passes all quality checks, THE Image_Preprocessor SHALL output a normalized tensor of shape (224, 224, 3).

---

### Requirement 5: Face Detection and Region Segmentation

**User Story:** As a user, I want the system to automatically locate my face and isolate key facial regions, so that skin analysis is focused on relevant areas rather than the full image.

#### Acceptance Criteria

1. WHEN a preprocessed image is received, THE Face_Detector SHALL detect all human faces present in the image.
2. WHEN exactly one face is detected, THE Face_Detector SHALL segment the image into the following Skin_Regions: forehead, left cheek, right cheek, and chin.
3. IF no face is detected in the image, THEN THE Face_Detector SHALL return an error indicating no face was found and prompt the user to submit a new image.
4. IF more than one face is detected, THEN THE Face_Detector SHALL prompt the user to submit an image containing only one face.
5. THE Face_Detector SHALL return bounding box coordinates for each detected Skin_Region.

---

### Requirement 6: Skin Type Classification

**User Story:** As a user, I want the system to classify my skin type from my facial image, so that I receive recommendations appropriate for my specific skin category.

#### Acceptance Criteria

1. WHEN segmented Skin_Regions are received, THE CNN_Classifier SHALL classify the overall Skin_Type as one of: oily, dry, combination, normal, or sensitive.
2. THE CNN_Classifier SHALL return a Confidence_Score between 0.0 and 1.0 for each Skin_Type classification.
3. WHEN the highest Confidence_Score for Skin_Type classification is below 0.60, THE CNN_Classifier SHALL flag the result as low-confidence and include a warning in the analysis output.
4. THE CNN_Classifier SHALL achieve a minimum classification accuracy of 85% on the held-out test dataset for Skin_Type classification.

---

### Requirement 7: Skin Condition Detection

**User Story:** As a user, I want the system to detect specific skin conditions visible in my image, so that I understand my skin concerns and receive targeted product recommendations.

#### Acceptance Criteria

1. WHEN segmented Skin_Regions are received, THE CNN_Classifier SHALL detect the presence of the following Skin_Conditions: acne, dark spots, enlarged pores, and wrinkles.
2. THE CNN_Classifier SHALL return a Confidence_Score between 0.0 and 1.0 for each detected Skin_Condition.
3. THE CNN_Classifier SHALL return bounding box coordinates localizing each detected Skin_Condition within the corresponding Skin_Region.
4. WHEN no Skin_Conditions are detected above the confidence threshold of 0.50, THE CNN_Classifier SHALL return an empty condition list and indicate clear skin in the analysis result.
5. THE CNN_Classifier SHALL achieve a minimum detection precision of 80% on the held-out test dataset for each Skin_Condition class.

---

### Requirement 8: Skin Analysis Result Aggregation

**User Story:** As a user, I want to see a complete, structured summary of my skin analysis, so that I can understand my skin health at a glance.

#### Acceptance Criteria

1. WHEN the CNN_Classifier completes analysis, THE Skin_Analyzer SHALL aggregate Skin_Type, all detected Skin_Conditions, Confidence_Scores, and bounding box data into a single analysis result object.
2. THE Skin_Analyzer SHALL associate each analysis result with the authenticated User_Profile and persist it to the database.
3. WHEN an analysis result is saved, THE Skin_Analyzer SHALL return the result to the frontend within 10 seconds of image submission under normal load conditions.
4. THE GlowAI SHALL retain a minimum of 12 months of analysis history per User_Profile.

---

### Requirement 9: Cosmetic Product Recommendation

**User Story:** As a user, I want to receive a ranked list of cosmetic products suited to my skin analysis results, so that I can make informed purchasing decisions without guesswork.

#### Acceptance Criteria

1. WHEN a skin analysis result is produced, THE Recommendation_Engine SHALL query the Product_Database and return a ranked list of cosmetic products.
2. THE Recommendation_Engine SHALL apply content-based filtering using ingredient-to-skin-condition compatibility mappings to score each product.
3. THE Recommendation_Engine SHALL apply collaborative filtering using skin profiles of users with similar Skin_Type and Skin_Condition combinations to augment product scores.
4. THE Recommendation_Engine SHALL assign a Compatibility_Score between 0.0 and 1.0 to each recommended product.
5. THE Recommendation_Engine SHALL return the top 10 products ranked by Compatibility_Score in descending order.
6. IF a user has declared known allergies in their User_Profile, THEN THE Recommendation_Engine SHALL exclude products containing any of the declared allergen ingredients.
7. WHEN a user's skin profile is updated, THE Recommendation_Engine SHALL regenerate recommendations based on the updated profile.

---

### Requirement 10: User Dashboard

**User Story:** As a user, I want a central dashboard showing my skin profile, analysis history, and current recommendations, so that I can track my skin health over time.

#### Acceptance Criteria

1. WHILE a user is authenticated, THE Dashboard SHALL display the user's current Skin_Type, detected Skin_Conditions, and the date of the most recent analysis.
2. THE Dashboard SHALL display the user's full analysis history in reverse chronological order.
3. WHEN a user selects a historical analysis entry, THE Dashboard SHALL display the full analysis result including Skin_Type, Skin_Conditions, Confidence_Scores, and associated product recommendations for that entry.
4. THE Dashboard SHALL display the current ranked product recommendations with product name, category, Compatibility_Score, and key ingredients.
5. WHEN a user updates their skin profile (skin type, concerns, allergies), THE Dashboard SHALL reflect the updated profile immediately after saving.

---

### Requirement 11: PDF Report Generation

**User Story:** As a user, I want to download a PDF report of my skin analysis, so that I can share results with a dermatologist or keep a personal record.

#### Acceptance Criteria

1. WHEN a user requests a report for a completed analysis, THE Report_Generator SHALL produce a downloadable PDF containing the Skin_Type classification, detected Skin_Conditions with Confidence_Scores, annotated facial image with bounding boxes, and top 10 product recommendations.
2. THE Report_Generator SHALL generate the PDF within 15 seconds of the user's download request.
3. THE Report_Generator SHALL include the analysis date, user name, and a GlowAI branding header in the PDF.
4. IF report generation fails, THEN THE Report_Generator SHALL notify the user with an error message and provide a retry option.

---

### Requirement 12: Product Database Management

**User Story:** As a system administrator, I want a structured product database with ingredient and compatibility metadata, so that the recommendation engine can perform accurate filtering and scoring.

#### Acceptance Criteria

1. THE Product_Database SHALL store for each product: product name, brand, category, full ingredient list, target skin types, target skin conditions, and a product image URL.
2. THE Product_Database SHALL support querying products by Skin_Type, Skin_Condition, and ingredient exclusion lists.
3. WHEN a product record is added or updated, THE Product_Database SHALL validate that all required fields are present before persisting the record.
4. IF a required product field is missing during insertion, THEN THE Product_Database SHALL reject the record and return a validation error.

---

### Requirement 13: API Layer

**User Story:** As a frontend developer, I want a well-defined REST API, so that the React frontend can communicate with all backend services reliably.

#### Acceptance Criteria

1. THE GlowAI SHALL expose REST API endpoints for: user registration, user login, image submission, analysis result retrieval, recommendation retrieval, user profile update, analysis history retrieval, and PDF report download.
2. WHEN an authenticated request is received, THE GlowAI SHALL validate the session token before processing the request.
3. IF an API request contains malformed or missing required parameters, THEN THE GlowAI SHALL return an HTTP 400 response with a descriptive error message.
4. IF an unauthenticated request is made to a protected endpoint, THEN THE GlowAI SHALL return an HTTP 401 response.
5. THE GlowAI SHALL return all API responses in JSON format, except for the PDF download endpoint which SHALL return a binary PDF stream.

---

### Requirement 14: Security and Data Privacy

**User Story:** As a user, I want my facial images and personal data to be handled securely, so that my sensitive information is not exposed or misused.

#### Acceptance Criteria

1. THE Auth_Service SHALL store user passwords using a cryptographic hashing algorithm with per-user salt.
2. THE GlowAI SHALL transmit all data between client and server over HTTPS.
3. THE GlowAI SHALL store facial images in an access-controlled cloud storage bucket that is not publicly accessible.
4. WHEN a user requests account deletion, THE GlowAI SHALL permanently delete all associated User_Profile data, analysis history, and stored facial images within 30 days.
5. THE GlowAI SHALL restrict access to user data such that one authenticated user cannot access another user's analysis results or profile.
