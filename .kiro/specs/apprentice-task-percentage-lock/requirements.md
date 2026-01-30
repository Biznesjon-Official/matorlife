# Requirements Document

## Introduction

This feature ensures that when masters create tasks for apprentices, the percentage field cannot be edited during task creation. The system will automatically use the apprentice's percentage value that was previously set by the master in the apprentice management interface. This prevents accidental or unauthorized changes to apprentice percentages during the task creation workflow and ensures consistency with the master's configured percentage values.

## Glossary

- **Master**: A user with the 'master' role who creates tasks and manages apprentices
- **Apprentice**: A user with the 'apprentice' role who is assigned tasks by the master
- **Task**: A work assignment created by a master and assigned to one or more apprentices
- **Apprentice_Percentage**: The percentage of task payment that an apprentice receives, stored in the User model
- **Task_Assignment**: A record linking an apprentice to a task with payment calculation details
- **CreateTaskModal**: The frontend component used by masters to create new tasks
- **EditApprenticeModal**: The frontend component used by masters to manage apprentice information including percentage
- **Task_Controller**: The backend controller that handles task creation logic
- **User_Model**: The database model storing user information including apprenticePercentage field

## Requirements

### Requirement 1: Lock Percentage Field in Task Creation

**User Story:** As a master, I want the apprentice percentage to be automatically set from the apprentice's profile during task creation, so that I cannot accidentally change it and maintain consistency across all tasks.

#### Acceptance Criteria

1. WHEN a master creates a task in the CreateTaskModal, THE System SHALL prevent manual editing of the percentage field for each apprentice assignment
2. WHEN an apprentice is selected in the task creation form, THE System SHALL automatically populate the percentage field with the apprentice's stored percentage value from the User model
3. WHEN the task creation form displays apprentice assignments, THE System SHALL show the percentage value in a read-only or disabled state
4. WHEN a master submits the task creation form, THE System SHALL use the apprentice's current percentage value from the User model, not any value from the form input

### Requirement 2: Retrieve Percentage from User Profile

**User Story:** As a system, I want to fetch the apprentice's percentage from their user profile during task creation, so that the correct percentage is always used for payment calculations.

#### Acceptance Criteria

1. WHEN an apprentice is selected in the CreateTaskModal, THE Task_Controller SHALL query the User_Model to retrieve the apprentice's percentage value
2. WHEN the apprentice's percentage is not set in the User_Model, THE System SHALL use a default value of 50%
3. WHEN calculating task payment allocations, THE System SHALL use the percentage value retrieved from the User_Model
4. WHEN creating Task_Assignment records, THE System SHALL store the percentage value that was retrieved from the User_Model at the time of task creation

### Requirement 3: Maintain Percentage Management in Apprentice Settings

**User Story:** As a master, I want to continue managing apprentice percentages through the EditApprenticeModal, so that I have a single authoritative place to set and update apprentice percentages.

#### Acceptance Criteria

1. WHEN a master opens the EditApprenticeModal, THE System SHALL display the current percentage value for the apprentice
2. WHEN a master updates the percentage in EditApprenticeModal, THE System SHALL save the new value to the User_Model
3. WHEN a master updates an apprentice's percentage, THE System SHALL apply the new percentage only to tasks created after the update
4. WHEN viewing existing tasks, THE System SHALL display the percentage that was set at the time of task creation, not the current percentage

### Requirement 4: Display Percentage Information in Task Creation

**User Story:** As a master, I want to see each apprentice's percentage during task creation, so that I can verify the payment calculations are correct even though I cannot edit the percentage.

#### Acceptance Criteria

1. WHEN displaying apprentice assignments in CreateTaskModal, THE System SHALL show the percentage value next to the apprentice's name
2. WHEN calculating payment breakdowns in CreateTaskModal, THE System SHALL use the displayed percentage for preview calculations
3. WHEN an apprentice is selected, THE System SHALL display the percentage in a visually distinct way to indicate it is not editable
4. WHEN showing the apprentice dropdown, THE System SHALL include the percentage value in the option text (e.g., "John Doe (60%)")

### Requirement 5: Backend Validation and Enforcement

**User Story:** As a system administrator, I want the backend to enforce percentage retrieval from user profiles, so that the system remains secure even if the frontend is bypassed.

#### Acceptance Criteria

1. WHEN the Task_Controller receives a task creation request, THE System SHALL ignore any percentage values provided in the request body for assignments
2. WHEN processing task assignments, THE Task_Controller SHALL query the User_Model to retrieve each apprentice's current percentage
3. WHEN an apprentice user record is not found, THE System SHALL return an error and prevent task creation
4. WHEN calculating payment allocations in the backend, THE System SHALL use only the percentage values retrieved from the User_Model

### Requirement 6: Preserve Existing Task Data

**User Story:** As a system, I want to preserve the percentage values of existing tasks, so that historical payment calculations remain accurate and unchanged.

#### Acceptance Criteria

1. WHEN displaying existing tasks, THE System SHALL show the percentage value that was stored at task creation time
2. WHEN an apprentice's percentage is updated in their profile, THE System SHALL not modify the percentage values of existing tasks
3. WHEN calculating earnings for approved tasks, THE System SHALL use the percentage value stored in the Task_Assignment record
4. WHEN viewing task history, THE System SHALL display the original percentage used for each task assignment

